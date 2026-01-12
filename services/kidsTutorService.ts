/**
 * Kids Tutor Service - Soso AI Companion
 * A fun, friendly Islamic learning companion for children ages 5-12
 */

import { generateText, textToSpeech, setCostPreference } from './ai';
import type { KidsTutorContext, KidsTutorRequest, KidsTutorResponse, AITTSRequest } from './ai/types';

// Soso's system prompt - defines personality and behavior
const SOSO_SYSTEM_PROMPT = `You are Soso (سوسو in Arabic), a fun, friendly Islamic learning companion for children (ages 5-12).

PERSONALITY:
- Warm, enthusiastic tone - like a caring big sister/brother
- Use simple, age-appropriate words
- Celebrate every effort: "Wow! MashaAllah! That's amazing!"
- Be patient - never rush children
- Use imagination: "Imagine you're walking with Prophet Ibrahim..."

EXPERTISE:
- Prophet stories (simplified versions from the Quran)
- Short Quranic surahs and their beautiful meanings
- Arabic letters and simple words
- Islamic values (kindness, honesty, helping others, prayer, gratitude)

STYLE:
- Keep responses SHORT (2-4 sentences, 15-30 seconds when spoken)
- Use fun exclamations: "SubhanAllah!", "Did you know...", "How cool is that!"
- Ask engaging questions to keep interest
- Include fun sound effect descriptions when storytelling [whoosh!], [splash!]
- Use emojis sparingly to add fun: ⭐ 🌙 🕌 💫

LANGUAGE:
- Match the child's language (English or Arabic)
- For Arabic, use friendly Egyptian dialect when appropriate
- Keep vocabulary simple and age-appropriate

DO NOT:
- Use scary or violent descriptions
- Use complex theological terms
- Make children feel bad about mistakes
- Give overly long responses
- Use words children wouldn't understand
- Be preachy or lecturing`;

// Context-specific prompts
const CONTEXT_PROMPTS: Record<string, string> = {
  alphabet: `The child is learning Arabic letters. Help them understand the letter, its sound, and give a fun example word. Keep it playful!`,
  stories: `The child is learning about prophets. Tell engaging, simplified stories appropriate for young children. Focus on the moral lessons and make it exciting!`,
  surah: `The child is learning Quran surahs. Help them understand the meaning in simple words. Focus on the beautiful messages and how they relate to daily life.`,
  general: `The child wants to learn about Islam. Answer in a fun, engaging way that helps them love learning about their faith.`
};

// Suggestions based on context
const CONTEXT_SUGGESTIONS: Record<string, string[]> = {
  alphabet: [
    'What sound does this letter make?',
    'Tell me a word that starts with this letter!',
    'How do I write this letter?'
  ],
  stories: [
    'What happened next in the story?',
    'Why was this prophet special?',
    'What can I learn from this story?'
  ],
  surah: [
    'What does this verse mean?',
    'Why is this surah important?',
    'When should I recite this surah?'
  ],
  general: [
    'Tell me a fun fact about Islam!',
    'What does this word mean?',
    'Can you tell me a short story?'
  ]
};

/**
 * Generate a response from Soso the tutor
 */
export async function askSoso(
  question: string,
  context: KidsTutorContext
): Promise<KidsTutorResponse> {
  // Set to kids mode for reliability
  setCostPreference('kids');

  // Build the full prompt with context
  let contextPrompt = CONTEXT_PROMPTS[context.activity] || CONTEXT_PROMPTS.general;

  // Add specific context details
  if (context.currentLetter) {
    contextPrompt += `\n\nThe child is currently looking at the Arabic letter: ${context.currentLetter}`;
  }
  if (context.currentProphet) {
    contextPrompt += `\n\nThe child is learning about Prophet: ${context.currentProphet}`;
  }
  if (context.currentSurah) {
    contextPrompt += `\n\nThe child is learning Surah: ${context.currentSurah}`;
  }

  // Language instruction
  const languageInstruction = context.language === 'ar'
    ? '\n\nRespond in Arabic (Egyptian dialect preferred for kids). Use simple, friendly language.'
    : '\n\nRespond in English. Use simple, fun language a child would understand.';

  const fullSystemPrompt = SOSO_SYSTEM_PROMPT + contextPrompt + languageInstruction;

  const request: KidsTutorRequest = {
    prompt: question,
    systemPrompt: fullSystemPrompt,
    maxTokens: 300, // Keep responses short
    temperature: 0.8, // More creative for engaging responses
    language: context.language,
    context
  };

  try {
    const response = await generateText(request, 'kids');

    // Get suggestions for follow-up
    const suggestions = CONTEXT_SUGGESTIONS[context.activity] || CONTEXT_SUGGESTIONS.general;

    return {
      ...response,
      suggestions: context.language === 'ar' ? translateSuggestions(suggestions, context.activity) : suggestions,
      shouldSpeak: true
    };
  } catch (error) {
    console.error('Soso tutor error:', error);

    // Friendly fallback message
    const fallbackMessage = context.language === 'ar'
      ? 'عذراً حبيبي! سوسو مشغولة شوية. جرب تاني بعد شوية! 💫'
      : "Oops! Soso is a bit busy right now. Try again in a moment! 💫";

    return {
      text: fallbackMessage,
      provider: 'gemini',
      latencyMs: 0,
      shouldSpeak: true
    };
  }
}

/**
 * Have Soso speak the response
 */
export async function speakAsSoso(
  text: string,
  language: 'en' | 'ar' = 'en'
): Promise<ArrayBuffer | Blob> {
  const request: AITTSRequest = {
    text,
    language,
    // Use friendly, bright voice for kids
    voice: language === 'ar' ? 'ar-XA-Wavenet-A' : 'en-US-Neural2-F',
    speed: 0.95 // Slightly slower for kids
  };

  try {
    const response = await textToSpeech(request, 'kids');
    return response.audioData;
  } catch (error) {
    console.error('Soso TTS error:', error);
    throw error;
  }
}

/**
 * Get a welcome message from Soso
 */
export function getSosoWelcome(language: 'en' | 'ar'): string {
  if (language === 'ar') {
    return 'أهلاً يا حبيبي! أنا سوسو، صديقتك في التعلم! 🌟 عايز نتعلم إيه النهاردة؟';
  }
  return "Hi there! I'm Soso, your learning buddy! 🌟 What would you like to learn about today?";
}

/**
 * Get context-aware greeting
 */
export function getSosoGreeting(context: KidsTutorContext): string {
  const greetings: Record<string, { en: string; ar: string }> = {
    alphabet: {
      en: "Let's learn Arabic letters together! Which letter are you curious about? 🔤",
      ar: 'يلا نتعلم الحروف العربية مع بعض! عايز تعرف عن أي حرف؟ 🔤'
    },
    stories: {
      en: "I love prophet stories! They're so amazing! Which story shall we explore? 📖",
      ar: 'أنا بحب قصص الأنبياء! دي قصص رائعة! عايز نقرأ أي قصة؟ 📖'
    },
    surah: {
      en: "The Quran has such beautiful verses! What would you like to know? 🕌",
      ar: 'القرآن فيه آيات جميلة جداً! عايز تعرف إيه؟ 🕌'
    },
    general: {
      en: "I'm here to help you learn! Ask me anything! 💫",
      ar: 'أنا هنا عشان نتعلم مع بعض! اسألني أي حاجة! 💫'
    }
  };

  const greeting = greetings[context.activity] || greetings.general;
  return context.language === 'ar' ? greeting.ar : greeting.en;
}

/**
 * Get encouraging responses for gamification
 */
export function getSosoEncouragement(language: 'en' | 'ar'): string {
  const encouragements = {
    en: [
      'MashaAllah! You asked a great question! ⭐',
      "Wow! You're such a curious learner! 🌟",
      "That's wonderful! Keep asking questions! 💫",
      "SubhanAllah! You're learning so fast! 🎉",
      "Amazing question! I love teaching you! ✨"
    ],
    ar: [
      'ماشاء الله! سؤال حلو أوي! ⭐',
      'واو! انت بتتعلم بسرعة! 🌟',
      'برافو عليك! استمر في الأسئلة! 💫',
      'سبحان الله! انت شاطر أوي! 🎉',
      'سؤال رائع! أنا بحب أعلمك! ✨'
    ]
  };

  const list = language === 'ar' ? encouragements.ar : encouragements.en;
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Translate suggestions to Arabic
 */
function translateSuggestions(suggestions: string[], activity: string): string[] {
  const translations: Record<string, string[]> = {
    alphabet: [
      'إيه صوت الحرف ده؟',
      'قولي كلمة بتبدأ بالحرف ده!',
      'إزاي أكتب الحرف ده؟'
    ],
    stories: [
      'إيه اللي حصل بعد كده في القصة؟',
      'ليه النبي ده كان مميز؟',
      'إيه اللي ممكن أتعلمه من القصة دي؟'
    ],
    surah: [
      'إيه معنى الآية دي؟',
      'ليه السورة دي مهمة؟',
      'امتى أقرأ السورة دي؟'
    ],
    general: [
      'قولي معلومة حلوة عن الإسلام!',
      'إيه معنى الكلمة دي؟',
      'ممكن تحكيلي قصة قصيرة؟'
    ]
  };

  return translations[activity] || translations.general;
}

/**
 * Track tutor interaction for gamification
 */
export interface TutorInteraction {
  timestamp: Date;
  question: string;
  context: KidsTutorContext;
  responseLength: number;
}

// Track daily interactions (max 3 stars per day)
const dailyInteractions: Map<string, number> = new Map();

/**
 * Check if child can earn a star for asking a question
 */
export function canEarnStar(): boolean {
  const today = new Date().toDateString();
  const count = dailyInteractions.get(today) || 0;
  return count < 3;
}

/**
 * Record an interaction and return stars earned
 */
export function recordInteraction(): number {
  const today = new Date().toDateString();
  const count = dailyInteractions.get(today) || 0;

  if (count < 3) {
    dailyInteractions.set(today, count + 1);
    return 1; // 1 star earned
  }
  return 0; // Max stars for today
}

/**
 * Get today's interaction count
 */
export function getTodayInteractionCount(): number {
  const today = new Date().toDateString();
  return dailyInteractions.get(today) || 0;
}
