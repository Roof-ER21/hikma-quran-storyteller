/**
 * Adult Tutor Service - Alaya AI Companion
 * A knowledgeable, warm Islamic learning companion for adults
 */

import { generateText, textToSpeech, setCostPreference } from './ai';
import type { AITextRequest, AITTSRequest } from './ai/types';

// Context for Alaya's responses
export interface AlayaTutorContext {
  activity: 'prophet-stories' | 'quran' | 'tafsir' | 'live-mode' | 'general';
  currentProphet?: string;
  currentSurah?: number;
  currentAyah?: number;
  reciter?: string;
  language: 'en' | 'ar';
}

export interface AlayaTutorResponse {
  text: string;
  provider: string;
  latencyMs: number;
  suggestions?: string[];
  shouldSpeak?: boolean;
}

// Alaya's system prompt - scholarly but accessible
const ALAYA_SYSTEM_PROMPT = `You are Alaya (علية in Arabic), a knowledgeable and warm Islamic learning companion.

PERSONALITY:
- Scholarly yet accessible - explain complex concepts clearly
- Warm and encouraging - create a supportive learning environment
- Patient and thorough - take time to explain nuances
- Respectful of different schools of thought
- Use phrases like "SubhanAllah", "MashaAllah" naturally

EXPERTISE:
- Deep knowledge of Quranic stories and tafsir (interpretation)
- Prophet stories with historical context and lessons
- Arabic language insights related to Quran
- Islamic scholarship and multiple tafsir perspectives
- Practical application of Quranic wisdom

STYLE:
- Provide thoughtful, well-structured responses
- Include relevant Quranic references when appropriate
- Explain Arabic terms with their deeper meanings
- Share multiple scholarly perspectives when relevant
- Keep responses focused but comprehensive (3-5 paragraphs max)

GUIDELINES:
- Always cite surah and ayah numbers when referencing Quran
- Respect the sanctity of Quranic interpretation
- Acknowledge when scholars have different views
- Connect teachings to contemporary relevance
- Never claim absolute certainty on matters of scholarly debate`;

// Context-specific prompts
const CONTEXT_PROMPTS: Record<string, string> = {
  'prophet-stories': `The user is exploring prophet stories. Provide rich historical context, lessons, and Quranic references. Connect the stories to relevant ayat.`,
  'quran': `The user is reading/listening to Quran. Help with understanding verses, their context, and deeper meanings. Reference relevant tafsir when helpful.`,
  'tafsir': `The user is seeking deeper understanding. Provide scholarly interpretations from multiple schools of thought. Explain linguistic nuances.`,
  'live-mode': `The user is in live conversation mode. Be conversational and responsive. Guide their learning journey.`,
  'general': `Help the user explore Islamic knowledge. Be comprehensive but accessible.`
};

// Scholarly suggestions based on context
const CONTEXT_SUGGESTIONS: Record<string, { en: string[]; ar: string[] }> = {
  'prophet-stories': {
    en: [
      'What lessons can we learn from this story?',
      'How does this connect to other prophets?',
      'What Quranic verses mention this?'
    ],
    ar: [
      'ما الدروس المستفادة من هذه القصة؟',
      'كيف ترتبط بقصص الأنبياء الآخرين؟',
      'ما الآيات القرآنية التي تذكر هذا؟'
    ]
  },
  'quran': {
    en: [
      'What is the context of this verse?',
      'Explain the Arabic meaning deeply',
      'How do scholars interpret this?'
    ],
    ar: [
      'ما سياق هذه الآية؟',
      'اشرح المعنى العربي بعمق',
      'كيف يفسر العلماء هذا؟'
    ]
  },
  'tafsir': {
    en: [
      'What do different scholars say?',
      'Explain the Arabic linguistics',
      'What are the historical contexts?'
    ],
    ar: [
      'ماذا يقول العلماء المختلفون؟',
      'اشرح اللغويات العربية',
      'ما السياقات التاريخية؟'
    ]
  },
  'general': {
    en: [
      'Tell me about a prophet',
      'Explain a Quranic concept',
      'What does this Arabic word mean?'
    ],
    ar: [
      'أخبرني عن نبي',
      'اشرح مفهوم قرآني',
      'ما معنى هذه الكلمة العربية؟'
    ]
  }
};

/**
 * Generate a response from Alaya the tutor
 */
export async function askAlaya(
  question: string,
  context: AlayaTutorContext
): Promise<AlayaTutorResponse> {
  // Use balanced mode for adults (quality but cost-conscious)
  setCostPreference('balanced');

  // Build the full prompt with context
  let contextPrompt = CONTEXT_PROMPTS[context.activity] || CONTEXT_PROMPTS.general;

  // Add specific context details
  if (context.currentProphet) {
    contextPrompt += `\n\nThe user is currently learning about Prophet: ${context.currentProphet}. Focus on this prophet's story and related Quranic references.`;
  }
  if (context.currentSurah) {
    contextPrompt += `\n\nThe user is currently reading Surah ${context.currentSurah}${context.currentAyah ? `, Ayah ${context.currentAyah}` : ''}.`;
  }

  // Language instruction
  const languageInstruction = context.language === 'ar'
    ? '\n\nRespond in Modern Standard Arabic with appropriate Islamic terminology. Be eloquent but clear.'
    : '\n\nRespond in English. Use transliteration for key Arabic terms and provide translations.';

  const fullSystemPrompt = ALAYA_SYSTEM_PROMPT + '\n\n' + contextPrompt + languageInstruction;

  const request: AITextRequest = {
    prompt: question,
    systemPrompt: fullSystemPrompt,
    maxTokens: 800, // More comprehensive responses for adults
    temperature: 0.7,
    language: context.language
  };

  try {
    const response = await generateText(request, 'balanced');

    // Get suggestions for follow-up
    const suggestions = CONTEXT_SUGGESTIONS[context.activity] || CONTEXT_SUGGESTIONS.general;

    return {
      ...response,
      suggestions: context.language === 'ar' ? suggestions.ar : suggestions.en,
      shouldSpeak: true
    };
  } catch (error) {
    console.error('Alaya tutor error:', error);

    // Graceful fallback message
    const fallbackMessage = context.language === 'ar'
      ? 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى. 🤲'
      : 'I apologize, an error occurred. Please try again. 🤲';

    return {
      text: fallbackMessage,
      provider: 'gemini',
      latencyMs: 0,
      shouldSpeak: true
    };
  }
}

/**
 * Have Alaya speak the response
 */
export async function speakAsAlaya(
  text: string,
  language: 'en' | 'ar' = 'en'
): Promise<ArrayBuffer | Blob> {
  const request: AITTSRequest = {
    text,
    language,
    // Use more mature, scholarly voices
    voice: language === 'ar' ? 'ar-XA-Wavenet-B' : 'en-US-Wavenet-F',
    speed: 1.0
  };

  try {
    const response = await textToSpeech(request, 'balanced');
    return response.audioData;
  } catch (error) {
    console.error('Alaya TTS error:', error);
    throw error;
  }
}

/**
 * Get a welcome message from Alaya
 */
export function getAlayaWelcome(language: 'en' | 'ar'): string {
  if (language === 'ar') {
    return 'السلام عليكم ورحمة الله وبركاته! أنا علية، رفيقتك في رحلة التعلم. كيف أستطيع مساعدتك اليوم؟ 📚';
  }
  return "Assalamu Alaikum! I'm Alaya, your companion on this learning journey. How may I assist you today? 📚";
}

/**
 * Get context-aware greeting
 */
export function getAlayaGreeting(context: AlayaTutorContext): string {
  const greetings: Record<string, { en: string; ar: string }> = {
    'prophet-stories': {
      en: "Welcome! Let's explore the profound stories of the prophets together. Which story would you like to discuss? 📖",
      ar: 'أهلاً بك! لنستكشف معاً قصص الأنبياء العظيمة. أي قصة تود أن نتناقش فيها؟ 📖'
    },
    'quran': {
      en: "SubhanAllah! The Quran holds infinite wisdom. What would you like to understand more deeply? 🕌",
      ar: 'سبحان الله! القرآن يحمل حكمة لا نهائية. ماذا تود أن تفهم بشكل أعمق؟ 🕌'
    },
    'tafsir': {
      en: "Welcome to deeper study. Scholars have illuminated the Quran with beautiful insights. What verse or concept interests you? 📚",
      ar: 'أهلاً بك في الدراسة المعمقة. أضاء العلماء القرآن برؤى جميلة. أي آية أو مفهوم يثير اهتمامك؟ 📚'
    },
    'live-mode': {
      en: "I'm here to learn with you. Feel free to ask anything about Quran, prophets, or Islamic knowledge. 🌙",
      ar: 'أنا هنا لأتعلم معك. لا تتردد في السؤال عن أي شيء يتعلق بالقرآن أو الأنبياء أو المعرفة الإسلامية. 🌙'
    },
    'general': {
      en: "How may I help you on your learning journey today? 🤲",
      ar: 'كيف يمكنني مساعدتك في رحلة تعلمك اليوم؟ 🤲'
    }
  };

  const greeting = greetings[context.activity] || greetings.general;
  return context.language === 'ar' ? greeting.ar : greeting.en;
}

/**
 * Get scholarly encouragement
 */
export function getAlayaEncouragement(language: 'en' | 'ar'): string {
  const encouragements = {
    en: [
      'MashaAllah, that\'s a thoughtful question! 📚',
      'Your curiosity for knowledge is beautiful. SubhanAllah! 🌟',
      'Seeking knowledge is a noble pursuit. Keep exploring! 💫',
      'What a profound area of study! Let\'s dive deeper. 🕌',
      'May Allah bless your quest for understanding. 🤲'
    ],
    ar: [
      'ما شاء الله، سؤال عميق! 📚',
      'فضولك للمعرفة جميل. سبحان الله! 🌟',
      'طلب العلم سعي نبيل. استمر في الاستكشاف! 💫',
      'يا له من مجال دراسة عميق! لنغوص أعمق. 🕌',
      'بارك الله في سعيك للفهم. 🤲'
    ]
  };

  const list = language === 'ar' ? encouragements.ar : encouragements.en;
  return list[Math.floor(Math.random() * list.length)];
}
