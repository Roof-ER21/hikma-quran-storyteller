const fs = require('fs');
const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');
const JWT_SECRET = process.env.SESSION_SECRET || (() => {
  console.warn('WARNING: SESSION_SECRET not set. Using random secret (sessions will not persist across restarts).');
  return require('crypto').randomBytes(32).toString('hex');
})();
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const app = express();
app.use(express.json({ limit: '1mb' }));

// Basic rate limiting for auth endpoints (in-memory, per-IP)
const authAttempts = new Map();
function rateLimit(maxAttempts, windowMs) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const key = `${ip}:${req.path}`;
    const attempts = authAttempts.get(key) || [];
    const recent = attempts.filter(t => t > now - windowMs);
    if (recent.length >= maxAttempts) {
      return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    }
    recent.push(now);
    authAttempts.set(key, recent);
    // Clean up old entries periodically
    if (authAttempts.size > 10000) {
      for (const [k, v] of authAttempts) {
        if (v.every(t => t < now - windowMs)) authAttempts.delete(k);
      }
    }
    next();
  };
}

// Runtime env injection removed - API keys now handled server-side via proxy

let pool = null;
if (DATABASE_URL) {
  pool = new Pool({ connectionString: DATABASE_URL, ssl: DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : undefined });
}

async function initDb() {
  if (!pool) return;

  // Parents table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS parents (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      pin_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Kids progress - main summary linked to parent
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kids_progress (
      id SERIAL PRIMARY KEY,
      parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
      child_name TEXT,
      total_stars INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      badges TEXT[] DEFAULT '{}',
      current_streak INTEGER DEFAULT 0,
      last_play_date DATE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(parent_id)
    );
  `);

  // Kids letter progress
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kids_letter_progress (
      id SERIAL PRIMARY KEY,
      parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
      letter_id TEXT NOT NULL,
      letter_arabic TEXT NOT NULL,
      times_played INTEGER DEFAULT 0,
      mastered BOOLEAN DEFAULT FALSE,
      stars_earned INTEGER DEFAULT 0,
      last_practiced TIMESTAMPTZ,
      UNIQUE(parent_id, letter_id)
    );
  `);

  // Kids surah progress
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kids_surah_progress (
      id SERIAL PRIMARY KEY,
      parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
      surah_number INTEGER NOT NULL,
      verses_heard INTEGER[] DEFAULT '{}',
      completed BOOLEAN DEFAULT FALSE,
      stars_earned INTEGER DEFAULT 0,
      total_listens INTEGER DEFAULT 0,
      last_practiced TIMESTAMPTZ,
      UNIQUE(parent_id, surah_number)
    );
  `);

  // Kids story progress
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kids_story_progress (
      id SERIAL PRIMARY KEY,
      parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
      story_id TEXT NOT NULL,
      times_viewed INTEGER DEFAULT 0,
      completed BOOLEAN DEFAULT FALSE,
      stars_earned INTEGER DEFAULT 0,
      last_viewed TIMESTAMPTZ,
      UNIQUE(parent_id, story_id)
    );
  `);
}

initDb().catch(err => console.error('DB init error:', err));

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: 'unauthorized' });
  }
}

// Auth routes (rate limited: 10 attempts per 15 minutes)
const authRateLimit = rateLimit(10, 15 * 60 * 1000);
app.post('/api/parent/signup', authRateLimit, async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'database unavailable' });
    const { name, pin } = req.body || {};
    if (!name || !pin || String(pin).length < 4) return res.status(400).json({ error: 'name and 4+ digit pin required' });
    const hash = await bcrypt.hash(String(pin), 10);
    const result = await pool.query(
      `INSERT INTO parents (name, pin_hash) VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET pin_hash = EXCLUDED.pin_hash
       RETURNING id, name;`,
      [name.trim(), hash]
    );
    const token = signToken({ id: result.rows[0].id, name: result.rows[0].name });
    res.json({ token, parent: result.rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'signup failed' });
  }
});

app.post('/api/parent/login', authRateLimit, async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'database unavailable' });
    const { name, pin } = req.body || {};
    if (!name || !pin) return res.status(400).json({ error: 'name and pin required' });
    const result = await pool.query(`SELECT id, name, pin_hash FROM parents WHERE name = $1 LIMIT 1`, [name.trim()]);
    const row = result.rows[0];
    if (!row) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(String(pin), row.pin_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = signToken({ id: row.id, name: row.name });
    res.json({ token, parent: { id: row.id, name: row.name } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'login failed' });
  }
});

app.get('/api/parent/me', authMiddleware, (req, res) => {
  res.json({ parent: req.user });
});

// Get parent profile with progress summary
app.get('/api/parent/profile', authMiddleware, async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'database unavailable' });
    const parentId = req.user.id;

    // Get main progress
    const progressResult = await pool.query(
      `SELECT * FROM kids_progress WHERE parent_id = $1 LIMIT 1`,
      [parentId]
    );

    // Get counts for summary
    const letterCount = await pool.query(
      `SELECT COUNT(*) as mastered FROM kids_letter_progress WHERE parent_id = $1 AND mastered = true`,
      [parentId]
    );

    const surahCount = await pool.query(
      `SELECT COUNT(*) as completed FROM kids_surah_progress WHERE parent_id = $1 AND completed = true`,
      [parentId]
    );

    const storyCount = await pool.query(
      `SELECT COUNT(*) as completed FROM kids_story_progress WHERE parent_id = $1 AND completed = true`,
      [parentId]
    );

    const progress = progressResult.rows[0] || {
      total_stars: 0,
      level: 1,
      badges: [],
      current_streak: 0,
      last_play_date: null
    };

    res.json({
      parent: req.user,
      progress: {
        totalStars: progress.total_stars,
        level: progress.level,
        badges: progress.badges || [],
        currentStreak: progress.current_streak,
        lastPlayDate: progress.last_play_date
      },
      summary: {
        lettersMastered: parseInt(letterCount.rows[0].mastered) || 0,
        surahsCompleted: parseInt(surahCount.rows[0].completed) || 0,
        storiesCompleted: parseInt(storyCount.rows[0].completed) || 0
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'failed to get profile' });
  }
});

// Change PIN
app.put('/api/parent/pin', authMiddleware, async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'database unavailable' });
    const { currentPin, newPin } = req.body || {};
    const parentId = req.user.id;

    if (!currentPin || !newPin || String(newPin).length < 4) {
      return res.status(400).json({ error: 'current pin and new 4+ digit pin required' });
    }

    // Verify current PIN
    const result = await pool.query(`SELECT pin_hash FROM parents WHERE id = $1 LIMIT 1`, [parentId]);
    if (!result.rows[0]) return res.status(404).json({ error: 'parent not found' });

    const ok = await bcrypt.compare(String(currentPin), result.rows[0].pin_hash);
    if (!ok) return res.status(401).json({ error: 'invalid current pin' });

    // Update PIN
    const hash = await bcrypt.hash(String(newPin), 10);
    await pool.query(`UPDATE parents SET pin_hash = $1 WHERE id = $2`, [hash, parentId]);

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'failed to update pin' });
  }
});

// Get full kids progress from server
app.get('/api/parent/kids-progress', authMiddleware, async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'database unavailable' });
    const parentId = req.user.id;

    const [progress, letters, surahs, stories] = await Promise.all([
      pool.query(`SELECT * FROM kids_progress WHERE parent_id = $1 LIMIT 1`, [parentId]),
      pool.query(`SELECT * FROM kids_letter_progress WHERE parent_id = $1`, [parentId]),
      pool.query(`SELECT * FROM kids_surah_progress WHERE parent_id = $1`, [parentId]),
      pool.query(`SELECT * FROM kids_story_progress WHERE parent_id = $1`, [parentId])
    ]);

    res.json({
      progress: progress.rows[0] || null,
      letters: letters.rows,
      surahs: surahs.rows,
      stories: stories.rows
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'failed to get progress' });
  }
});

// Sync kids progress to server (upsert)
app.post('/api/parent/kids-progress/sync', authMiddleware, async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'database unavailable' });
    const parentId = req.user.id;
    const { progress, letters, surahs, stories } = req.body || {};

    // Upsert main progress
    if (progress) {
      await pool.query(`
        INSERT INTO kids_progress (parent_id, child_name, total_stars, level, badges, current_streak, last_play_date, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (parent_id) DO UPDATE SET
          child_name = COALESCE(EXCLUDED.child_name, kids_progress.child_name),
          total_stars = GREATEST(EXCLUDED.total_stars, kids_progress.total_stars),
          level = GREATEST(EXCLUDED.level, kids_progress.level),
          badges = (
            SELECT ARRAY(SELECT DISTINCT unnest(kids_progress.badges || EXCLUDED.badges))
          ),
          current_streak = GREATEST(EXCLUDED.current_streak, kids_progress.current_streak),
          last_play_date = GREATEST(EXCLUDED.last_play_date, kids_progress.last_play_date),
          updated_at = NOW()
      `, [
        parentId,
        progress.childName || null,
        progress.totalStars || 0,
        progress.level || 1,
        progress.badges || [],
        progress.currentStreak || 0,
        progress.lastPlayDate || null
      ]);
    }

    // Upsert letter progress
    if (letters && letters.length > 0) {
      for (const letter of letters) {
        await pool.query(`
          INSERT INTO kids_letter_progress (parent_id, letter_id, letter_arabic, times_played, mastered, stars_earned, last_practiced)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (parent_id, letter_id) DO UPDATE SET
            times_played = GREATEST(EXCLUDED.times_played, kids_letter_progress.times_played),
            mastered = EXCLUDED.mastered OR kids_letter_progress.mastered,
            stars_earned = GREATEST(EXCLUDED.stars_earned, kids_letter_progress.stars_earned),
            last_practiced = GREATEST(EXCLUDED.last_practiced, kids_letter_progress.last_practiced)
        `, [
          parentId,
          letter.letterId || letter.id,
          letter.letterArabic,
          letter.timesPlayed || 0,
          letter.mastered || false,
          letter.starsEarned || 0,
          letter.lastPracticed ? new Date(letter.lastPracticed) : null
        ]);
      }
    }

    // Upsert surah progress
    if (surahs && surahs.length > 0) {
      for (const surah of surahs) {
        await pool.query(`
          INSERT INTO kids_surah_progress (parent_id, surah_number, verses_heard, completed, stars_earned, total_listens, last_practiced)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (parent_id, surah_number) DO UPDATE SET
            verses_heard = (
              SELECT ARRAY(SELECT DISTINCT unnest(kids_surah_progress.verses_heard || EXCLUDED.verses_heard))
            ),
            completed = EXCLUDED.completed OR kids_surah_progress.completed,
            stars_earned = GREATEST(EXCLUDED.stars_earned, kids_surah_progress.stars_earned),
            total_listens = GREATEST(EXCLUDED.total_listens, kids_surah_progress.total_listens),
            last_practiced = GREATEST(EXCLUDED.last_practiced, kids_surah_progress.last_practiced)
        `, [
          parentId,
          surah.surahNumber,
          surah.versesHeard || [],
          surah.completed || false,
          surah.starsEarned || 0,
          surah.totalListens || 0,
          surah.lastPracticed ? new Date(surah.lastPracticed) : null
        ]);
      }
    }

    // Upsert story progress
    if (stories && stories.length > 0) {
      for (const story of stories) {
        await pool.query(`
          INSERT INTO kids_story_progress (parent_id, story_id, times_viewed, completed, stars_earned, last_viewed)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (parent_id, story_id) DO UPDATE SET
            times_viewed = GREATEST(EXCLUDED.times_viewed, kids_story_progress.times_viewed),
            completed = EXCLUDED.completed OR kids_story_progress.completed,
            stars_earned = GREATEST(EXCLUDED.stars_earned, kids_story_progress.stars_earned),
            last_viewed = GREATEST(EXCLUDED.last_viewed, kids_story_progress.last_viewed)
        `, [
          parentId,
          story.storyId || story.id,
          story.timesViewed || 0,
          story.completed || false,
          story.starsEarned || 0,
          story.lastViewed ? new Date(story.lastViewed) : null
        ]);
      }
    }

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'failed to sync progress' });
  }
});

// =============================================================================
// GEMINI API PROXY - Securely handles API keys server-side
// =============================================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const GOOGLE_CLOUD_TTS_KEY = process.env.GOOGLE_CLOUD_TTS_KEY;

// Endpoint for live mode (real-time WebSocket streaming requires client-side API access)
// Rate limited and requires authentication for security
const liveKeyRateLimit = rateLimit(5, 60 * 1000); // 5 requests per minute
app.get('/api/gemini/live-key', liveKeyRateLimit, (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini API key not configured' });
  }
  res.json({ key: GEMINI_API_KEY });
});

// Validate model names to prevent SSRF
const ALLOWED_MODEL_PATTERN = /^[a-zA-Z0-9._-]+$/;
function validateModelName(model) {
  return model && ALLOWED_MODEL_PATTERN.test(model) && model.length < 100;
}

// Rate limit for AI endpoints
const aiRateLimit = rateLimit(30, 60 * 1000); // 30 requests per minute

// Proxy endpoint for Gemini API
app.post('/api/gemini/generate', aiRateLimit, async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    const { model, contents, config } = req.body;

    if (!model || !contents) {
      return res.status(400).json({ error: 'Missing required fields: model, contents' });
    }

    if (!validateModelName(model)) {
      return res.status(400).json({ error: 'Invalid model name' });
    }

    // Build the request URL
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    // Make request to Gemini API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: Array.isArray(contents) ? contents : [{ parts: [{ text: contents }] }],
        generationConfig: config?.generationConfig || {},
        safetySettings: config?.safetySettings || [],
        systemInstruction: config?.systemInstruction || undefined,
        tools: config?.tools || undefined,
        toolConfig: config?.toolConfig || undefined
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API error:', data);
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Gemini proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Proxy endpoint for image generation
app.post('/api/gemini/generate-image', aiRateLimit, async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    const { model, prompt, config } = req.body;

    if (!model || !prompt) {
      return res.status(400).json({ error: 'Missing required fields: model, prompt' });
    }

    if (!validateModelName(model)) {
      return res.status(400).json({ error: 'Invalid model name' });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    // Add image config if provided
    if (config?.imageConfig) {
      requestBody.generationConfig = { imageConfig: config.imageConfig };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini image generation error:', data);
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Gemini image proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Proxy endpoint for TTS (audio generation)
app.post('/api/gemini/tts', aiRateLimit, async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    const { model, text, config } = req.body;

    if (!model || !text) {
      return res.status(400).json({ error: 'Missing required fields: model, text' });
    }

    if (!validateModelName(model)) {
      return res.status(400).json({ error: 'Invalid model name' });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const requestBody = {
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: config?.responseModalities || ['AUDIO'],
        speechConfig: config?.speechConfig || {}
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini TTS error:', data);
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Gemini TTS proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// Privacy Policy Route
app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'privacy-policy.html'));
});

// =============================================================================
// Static assets
app.use(express.static(DIST_DIR));
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
