const fs = require('fs');
const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');
const JWT_SECRET = process.env.SESSION_SECRET || 'change-me';
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const app = express();
app.use(express.json());

// Runtime env injection for client
app.get('/env.js', (_req, res) => {
  const key = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  const body = `window.__ENV = { VITE_GEMINI_API_KEY: ${JSON.stringify(key)} };`;
  res.type('application/javascript').send(body);
});

let pool = null;
if (DATABASE_URL) {
  pool = new Pool({ connectionString: DATABASE_URL, ssl: DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : undefined });
}

async function initDb() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS parents (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      pin_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
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

// Auth routes
app.post('/api/parent/signup', async (req, res) => {
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

app.post('/api/parent/login', async (req, res) => {
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

// Static assets
app.use(express.static(DIST_DIR));
app.get('/*', (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
