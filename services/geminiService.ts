import { GoogleGenAI, Modality, Type } from "@google/genai";
import { VisualConfig, VoiceSearchResult, RecitationResult, RecitationWord } from "../types";
import { base64ToUint8Array, decodeAudioData, uint8ArrayToBase64 } from "./audioUtils";

// Resolve Gemini API key from Vite env (preferred) or fallback to build-time process.env
export const getGeminiApiKey = () => {
  const key =
    import.meta.env?.VITE_GEMINI_API_KEY ||
    import.meta.env?.GEMINI_API_KEY ||
    (typeof window !== 'undefined' && (window as any).__ENV?.VITE_GEMINI_API_KEY) ||
    process.env.GEMINI_API_KEY ||
    process.env.API_KEY;

  if (!key) {
    throw new Error('Missing Gemini API key. Set VITE_GEMINI_API_KEY in your environment.');
  }

  return key;
};

// Initialize AI instance helper
const getAI = () => new GoogleGenAI({ apiKey: getGeminiApiKey() });

// Helper for API calls that require paid keys or might 404/403 due to key issues
const callWithRetry = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (e: any) {
    const msg = e.toString().toLowerCase();
    const isAuthError = msg.includes("404") || msg.includes("not found") || msg.includes("403") || msg.includes("permission denied");
    
    if (window.aistudio && isAuthError) {
      console.log("API Error detected, prompting for key selection...");
      await window.aistudio.openSelectKey();
      // Retry the function - it will re-instantiate GoogleGenAI with the new process.env.API_KEY
      return await fn();
    }
    throw e;
  }
};

// --- PRELOADED CONTENT FOR INSTANT LOADING ---
const PRELOADED_CONTENT: Record<string, { text: string; image: string }> = {
  "Adam": {
    image: "https://images.unsplash.com/photo-1542662565-7e4b66b5adaa?q=80&w=2940&auto=format&fit=crop",
    text: `## The First Creation

In the beginning, before the first dawn rose over the earth, Allah (SWT) announced to the angels: "I am placing a successor on earth." The angels, beings of pure light and obedience, asked in wonder, "Will You place therein one who will spread corruption and shed blood, while we glorify You with praise and sanctify You?" Allah replied with the wisdom of the Infinite: "Indeed, I know that which you do not know."

And so, from clay—molded from the earth's diverse soils, red, white, and black, soft and hard—Allah created Adam. He breathed His spirit into him, and the clay became flesh, bone, and soul.

## The Test of Knowledge

Allah taught Adam the names of all things—names the angels did not know. He presented these things to the angels and said, "Inform Me of the names of these, if you are truthful." But they could not. "Exalted are You," they replied, "we have no knowledge except what You have taught us."

Then Adam, by Allah's command, spoke the names clearly and beautifully. It was the first gift to humanity: the gift of knowledge, language, and intellect. The angels bowed in respect to this new creation—all except Iblis, whose heart was filled with pride.

## Reflections

*   **Knowledge is Sacred:** The first distinction given to humanity was the ability to learn and name.
*   **Humility vs. Pride:** The angels asked questions but submitted; Iblis refused out of arrogance.
*   **Diversity:** Just as Adam was created from different soils, humanity is diverse in color and nature, yet one family.`
  },
  "Nuh (Noah)": {
    image: "https://images.unsplash.com/photo-1559666126-84f38979656s?q=80&w=2000&auto=format&fit=crop", // Ocean/Storm vibe
    text: `## The Call to Patience

For 950 years, Nuh (AS) called his people to the worship of the One God. He spoke to them in public and in private, day and night. "O my people," he would say with a heart full of concern, "worship Allah; you have no deity other than Him." But his people put their fingers in their ears and covered themselves with their garments, arrogant and defiant.

Only a few, mostly the poor and the weak, believed. The wealthy elites mocked him: "We see you only as a human being like us, and followed by the lowest of us."

## The Ark

Allah commanded Nuh to build a ship—an Ark—far from the sea. As he built it, the chiefs of his people passed by and mocked him. "O Nuh! You have become a carpenter after being a prophet?" But Nuh replied with unwavering faith, "If you ridicule us, then we will ridicule you just as you ridicule."

Then the command came. The ovens of the earth gushed forth water, and the skies opened with torrential rain. Nuh gathered the believers and a pair of every creature onto the Ark. "Embark therein; in the name of Allah is its course and its anchorage."

## Reflections

*   **Patience (Sabr):** Nuh's perseverance for nearly a millennium teaches us that results are in Allah's hands; our duty is effort.
*   **Faith in the Unseen:** Building a ship on dry land was an act of pure trust in Allah's command.
*   **Salvation:** True status is not wealth or power, but faith and righteousness.`
  },
  "Ibrahim (Abraham)": {
    image: "https://images.unsplash.com/photo-1548266652-99cf277df8c3?q=80&w=2000&auto=format&fit=crop", // Desert/Stars
    text: `## The Search for Truth

As a young man, Ibrahim (AS) looked up at the night sky. He saw a shining star and thought, "Could this be my Lord?" But when it set, he said, "I do not love those that set." He saw the moon rising and thought, "This is my Lord." But when it set, he said, "If my Lord does not guide me, I will be among the astray." Finally, he saw the sun, blazing and grand. "This is my Lord; this is greater." But when it set, he declared to his people: "O my people, I am free from what you associate with Allah. I have turned my face toward He who created the heavens and the earth."

## The Friend of Allah

Ibrahim stood alone against a society of idol worshippers, including his own father. When they threw him into a colossal fire for destroying their idols, the fire did not burn him. Allah commanded, "O Fire, be coolness and safety upon Ibrahim."

Later, in the barren desert of Mecca, he left his wife Hajar and infant son Ismail, trusting fully in Allah's plan. It was there that the Zamzam water gushed forth, and it was there that he and Ismail would later raise the foundations of the Kaaba—the house of God.

## Reflections

*   **Rational Faith:** Ibrahim used logic and observation to find the Creator, teaching us that faith and reason go hand in hand.
*   **Total Submission:** He was willing to sacrifice everything for Allah, earning the title *Khalilullah* (Friend of Allah).
*   **Legacy:** The prayers we say today are the legacy of Ibrahim's supplications for future generations.`
  },
  "Yusuf (Joseph)": {
    image: "https://images.unsplash.com/photo-1533552084534-7c2273d5a574?q=80&w=2000&auto=format&fit=crop", // Well/Desert/Palace
    text: `## The Dream

"O my father, indeed I saw eleven stars and the sun and the moon; I saw them prostrating to me." So began the story of Yusuf (AS), the best of stories. It is a tale of betrayal, as his jealous brothers threw him into a dark well. It is a tale of patience, as he was sold into slavery in Egypt for a cheap price.

## The Prison and the Palace

In the house of the Minister, Yusuf faced the trial of temptation. He sought refuge in Allah rather than disobey Him, choosing prison over sin. Years passed in darkness, but Yusuf never lost hope, interpreting dreams and spreading goodness even behind bars.

When the King of Egypt had a dream of seven fat cows being eaten by seven lean ones, only Yusuf could interpret it. His wisdom saved the nation from famine, and he was raised from the depths of the prison to the heights of power. When his brothers finally stood before him, trembling, he said: "No blame will there be upon you today. Allah will forgive you; and He is the most merciful of the merciful."

## Reflections

*   **Trust in Destiny:** What seemed like a tragedy (the well, slavery, prison) was Allah's plan to place Yusuf in a position to save lives.
*   **Integrity:** Yusuf maintained his character in private and public, in hardship and ease.
*   **Forgiveness:** He forgave those who ruined his childhood, teaching us the power of mercy.`
  },
  "Al-Fatihah": {
    image: "https://images.unsplash.com/photo-1564121211835-e88c852648ab?q=80&w=2000&auto=format&fit=crop", // Islamic geometric pattern
    text: `## The Opening

Surah Al-Fatihah, known as "The Opening," is the gateway to the Quran. Revealed in Mecca, it is the seven oft-repeated verses that every Muslim recites at least seventeen times a day in their prayers. It is a dialogue between the Creator and the created, a conversation of pure love and guidance.

## The Essence of Praise

It begins with *Alhamdulillah*—all praise belongs to Allah, the Lord of all worlds. It acknowledges His infinite mercy as *Ar-Rahman* (The Entirely Merciful) and *Ar-Rahim* (The Especially Merciful). It reminds us of the Day of Judgment, establishing that while He is Merciful, He is also the Master of the ultimate accountability.

## The Path of Guidance

The heart of the Surah is a plea: "Guide us to the straight path." It is not a path of one's own making, but the path of those upon whom Allah has bestowed favor—prophets, truth-seekers, and martyrs. It is a protection against anger and misguidance.

## Reflections

*   **Connection:** It establishes the primary relationship between human and God: one of worship and reliance ("You alone we worship, and You alone we ask for help").
*   **Balance:** It perfectly balances hope (Mercy) and accountability (Day of Judgment).
*   **Universal Prayer:** It encapsulates the core needs of the human soul: acknowledgment of the Divine and the desperate need for guidance.`
  }
};

// Language type definition for story generation
export type StoryLanguage = 'english' | 'arabic' | 'arabic_egyptian';

// Language display labels
export const LANGUAGE_LABELS: Record<StoryLanguage, string> = {
  english: 'EN',
  arabic: 'فصحى',
  arabic_egyptian: 'مصري'
};

/**
 * Generate a high-quality story using Gemini 3 Pro
 * Now supports Egyptian Arabic and includes scene markers for image generation
 */
export const generateStory = async (prophet: string, topic: string, language: StoryLanguage = 'english') => {
  // Check for preloaded content first to simulate instant loading
  const key = Object.keys(PRELOADED_CONTENT).find(k => prophet.includes(k));
  if (key && language === 'english' && topic === 'General Life') {
      return PRELOADED_CONTENT[key].text;
  }

  return callWithRetry(async () => {
    const ai = getAI();

    // Language-specific instructions
    let langInstruction = '';
    let systemInstruction = '';

    switch (language) {
      case 'arabic':
        langInstruction = "Write the entire response in high-quality, eloquent Arabic (Fusha) suitable for storytelling.";
        systemInstruction = "You are a wise, deep-voiced storyteller of ancient history. You speak with gravity and emotion.";
        break;
      case 'arabic_egyptian':
        langInstruction = `Write the entire response in Egyptian Arabic (العامية المصرية).
Use warm, conversational Egyptian dialect with common expressions like:
- Use "إيه" instead of "ما/ماذا"
- Use "ده/دي" instead of "هذا/هذه"
- Use "عايز" instead of "يريد"
- Use "كده" instead of "هكذا"
- Use "بس" instead of "لكن"
- Include Egyptian expressions like "يا سلام" and "الله"
Make it feel like a tale told in a Cairo café by a beloved حكواتي.`;
        systemInstruction = `You are a حكواتي مصري (Egyptian storyteller) - warm, engaging, and theatrical.
You tell ancient stories with the charm and expressiveness of Egyptian tradition.
Your voice is like a grandfather telling tales in a old Cairo coffee shop.
Use colorful Egyptian expressions and make the audience feel the story.`;
        break;
      default: // english
        langInstruction = "Write in English.";
        systemInstruction = "You are a wise, deep-voiced storyteller of ancient history. You speak with gravity and emotion.";
    }

    const prompt = `Tell the story of Prophet ${prophet}, focusing on ${topic}.

    Structure the response exactly as follows:
    1. A "Prologue" setting the scene.
    2. Three distinct "Chapters" with titles (e.g., ## Chapter 1: The Call).
    3. A "Reflections" section at the end with 3 distinct bullet points on moral lessons.

    IMPORTANT: Include exactly 4 scene markers throughout the story for image generation.
    Place them at the START of each major section (Prologue and each Chapter).
    Format: [SCENE: <brief visual description for an artist>]

    Example scene markers:
    [SCENE: Prophet standing alone on a mountain at dawn, golden light breaking through clouds]
    [SCENE: Angels gathered in a celestial court with flowing robes of light]
    [SCENE: A ship being built in a desert with curious onlookers]
    [SCENE: Divine light descending upon a humble servant in prayer]

    Make the scene descriptions cinematic, specific, and visually evocative.

    Tone: Cinematic, solemn, and immersive. Use vivid imagery.
    Format: Markdown.
    ${langInstruction}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });
    return response.text;
  });
};

/**
 * Extract scene descriptions from story text
 * Returns array of scene prompts for image generation
 */
export const extractScenes = (storyText: string): string[] => {
  const sceneRegex = /\[SCENE:\s*([^\]]+)\]/g;
  const scenes: string[] = [];
  let match;

  while ((match = sceneRegex.exec(storyText)) !== null) {
    scenes.push(match[1].trim());
  }

  return scenes;
};

/**
 * Remove scene markers from story text for display
 */
export const cleanStoryText = (storyText: string): string => {
  return storyText.replace(/\[SCENE:\s*[^\]]+\]\n*/g, '');
};

/**
 * Generate a narrative based on a specific Surah
 */
export const generateSurahStory = async (surah: string, language: StoryLanguage = 'english') => {
  // Check Preloaded
  if (PRELOADED_CONTENT[surah] && language === 'english') {
      return PRELOADED_CONTENT[surah].text;
  }

  return callWithRetry(async () => {
    const ai = getAI();

    // Language-specific instructions
    let langInstruction = '';
    let systemInstruction = '';

    switch (language) {
      case 'arabic':
        langInstruction = "Write strictly in modern standard Arabic (Fusha) suitable for storytelling.";
        systemInstruction = "You are a master storyteller of the Quran. Your words should paint pictures in the mind.";
        break;
      case 'arabic_egyptian':
        langInstruction = `Write in Egyptian Arabic (العامية المصرية).
Use warm, conversational Egyptian dialect. Make it feel like wisdom shared at a Cairo gathering.
Use Egyptian expressions naturally throughout.`;
        systemInstruction = `You are a حكواتي مصري (Egyptian storyteller) sharing Quranic wisdom.
Your style is warm, engaging, and accessible like a beloved teacher in Egypt.`;
        break;
      default:
        langInstruction = "Write in English.";
        systemInstruction = "You are a master storyteller of the Quran. Your words should paint pictures in the mind.";
    }

    const prompt = `Transform Surah ${surah} into a powerful narrative journey.

    Structure:
    1. **The Revelation**: Context of when/where it was revealed.
    2. **The Core Narrative**: The stories or parables within (e.g., The Companions of the Cave, The Garden).
    3. **The Divine Message**: The core spiritual commands.

    Include 3 scene markers for image generation:
    [SCENE: <visual description>]

    Style: Epic, emotional, and rhythmic.
    ${langInstruction}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });
    return response.text;
  });
};

/**
 * Generate specific historical context using Search Grounding
 */
export const getContextWithSearch = async (query: string) => {
  // Flash usually works with standard keys, but safe to wrap
  return callWithRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const sources = chunks
      .map((chunk: any) => chunk.web ? { title: chunk.web.title, url: chunk.web.uri } : null)
      .filter(Boolean);

    return { text, sources };
  });
};

/**
 * Get map locations using Maps Grounding
 */
export const getLocations = async (storyContext: string, userLat?: number, userLon?: number) => {
  return callWithRetry(async () => {
    const ai = getAI();
    const prompt = `Identify the key geographical locations mentioned in this story context: "${storyContext.slice(0, 500)}...". 
    Provide a brief description of where they are located today.`;

    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    if (userLat && userLon) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: userLat,
            longitude: userLon
          }
        }
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: config
    });

    const text = response.text;
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const locations = chunks
      .map((chunk: any) => chunk.maps ? { title: chunk.maps.title, uri: chunk.maps.uri } : null)
      .filter(Boolean);

    return { text, locations };
  });
};

/**
 * Generate an image for the story
 */
export const generateStoryImage = async (prompt: string, config: VisualConfig) => {
  // Check Preloaded
  const key = Object.keys(PRELOADED_CONTENT).find(k => prompt.includes(k));
  // Very basic check to see if the prompt contains a preloaded prophet name
  if (key && prompt.includes("specific scene from the story")) {
     // If it's the initial load image logic from StoryView
     return PRELOADED_CONTENT[key].image;
  }
  if (key && prompt.includes("Cinematic landscape")) {
     return PRELOADED_CONTENT[key].image;
  }
  if (key && prompt.includes("themes of Surah")) {
     return PRELOADED_CONTENT[key].image;
  }

  // Proactively check for key if high res, though retry loop handles it too
  if (config.resolution !== "1K" && window.aistudio) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
    }
  }

  return callWithRetry(async () => {
    const ai = getAI();
    const fullPrompt = `Cinematic concept art, masterpiece, ${prompt}. Golden hour lighting, ancient middle eastern architecture, desert landscapes, ethereal atmosphere. Highly detailed, 8k resolution.`;

    const model = (config.resolution === "1K") 
      ? 'gemini-2.5-flash-image' 
      : 'gemini-3-pro-image-preview';

    const response = await ai.models.generateContent({
      model: model,
      contents: {
          parts: [{ text: fullPrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: config.aspectRatio,
          imageSize: config.resolution === "1K" ? undefined : config.resolution
        }
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  });
};

/**
 * TTS Generation
 */
export const speakText = async (text: string): Promise<AudioBuffer | null> => {
  return callWithRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text.slice(0, 500) }] }], // Limit length for demo responsiveness
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            // Fenrir: Deep, resonant, authoritative narrator voice.
            prebuiltVoiceConfig: { voiceName: 'Fenrir' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const audioBuffer = await decodeAudioData(
      base64ToUint8Array(base64Audio),
      audioCtx,
      24000,
      1
    );
    return audioBuffer;
  });
};

/**
 * Fast Text Response (Lite)
 */
export const quickAnalyze = async (text: string) => {
  return callWithRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite-latest',
      contents: `Summarize this text in one sentence: ${text.slice(0, 1000)}`,
    });
    return response.text;
  });
};

/**
 * Audio Transcription
 */
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    return callWithRetry(async () => {
      const ai = getAI();
      // Convert blob to base64
      const buffer = await audioBlob.arrayBuffer();
      const base64 = uint8ArrayToBase64(new Uint8Array(buffer));

      const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
              parts: [
                  { inlineData: { mimeType: audioBlob.type, data: base64 } },
                  { text: "Transcribe this audio exactly." }
              ]
          }
      });
      return response.text || "";
    });
}

/**
 * Voice Search for Quran - "Shazam for Quran"
 * Transcribes audio and identifies the verse
 */
export const voiceSearchQuran = async (audioBlob: Blob): Promise<{
  transcription: string;
  matches: VoiceSearchResult[];
}> => {
  return callWithRetry(async () => {
    const ai = getAI();
    // Convert blob to base64
    const buffer = await audioBlob.arrayBuffer();
    const base64 = uint8ArrayToBase64(new Uint8Array(buffer));

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: audioBlob.type, data: base64 } },
          {
            text: `Listen to this Quran recitation and identify the verse(s) being recited.

            Respond ONLY with a JSON object in this exact format (no markdown, no code blocks):
            {
              "transcription": "the Arabic text you heard (in Arabic script)",
              "matches": [
                {
                  "surahNumber": <number>,
                  "surahName": "<English name>",
                  "verseNumber": <number>,
                  "arabic": "<full Arabic text of the verse>",
                  "translation": "<English translation>",
                  "confidence": <0-100 percentage>
                }
              ]
            }

            If you're not certain, still provide your best guess with an appropriate confidence level.
            If no Quran recitation is detected, return an empty matches array.`
          }
        ]
      }
    });

    const text = response.text || "{}";
    // Clean up potential markdown code blocks
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const result = JSON.parse(cleanText);
      return {
        transcription: result.transcription || "",
        matches: result.matches || []
      };
    } catch (e) {
      console.error("Failed to parse voice search response:", cleanText);
      return {
        transcription: text,
        matches: []
      };
    }
  });
}

/**
 * Check Quran Recitation Accuracy
 * Analyzes user's audio recitation against the correct Arabic verse
 */
export const checkRecitation = async (
  audioBlob: Blob,
  correctArabicText: string,
  surahNumber: number,
  verseNumber: number
): Promise<RecitationResult & { transcription: string }> => {
  return callWithRetry(async () => {
    const ai = getAI();
    const buffer = await audioBlob.arrayBuffer();
    const base64 = uint8ArrayToBase64(new Uint8Array(buffer));

    const prompt = `You are an expert Quran recitation teacher analyzing a student's recitation.

CORRECT VERSE (Surah ${surahNumber}, Verse ${verseNumber}):
"${correctArabicText}"

TASK:
1. Transcribe the audio recitation in Arabic
2. Compare it word-by-word with the correct verse
3. Identify: correct words, incorrect/mispronounced words, missing words, extra words

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "transcription": "the full Arabic transcription",
  "accuracy": 85,
  "words": [
    {"word": "بِسْمِ", "status": "correct"},
    {"word": "اللَّهِ", "status": "incorrect", "feedback": "pronunciation issue"},
    {"word": "الرَّحْمَٰنِ", "status": "missing"}
  ],
  "overallFeedback": "Good effort! Focus on tajweed rules for...",
  "suggestions": [
    "Practice the letter 'ح' with more emphasis",
    "Review the rule of Ikhfa for clearer pronunciation"
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: audioBlob.type, data: base64 } },
          { text: prompt }
        ]
      }
    });

    const text = response.text || "{}";
    // Clean up any markdown formatting
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      return JSON.parse(cleanedText);
    } catch (e) {
      console.error('Failed to parse recitation result:', cleanedText);
      return {
        transcription: "",
        accuracy: 0,
        words: [],
        overallFeedback: "Unable to analyze recitation. Please try again.",
        suggestions: []
      };
    }
  });
}

/**
 * Get Recitation Feedback - Provide detailed improvement suggestions
 * Takes a recitation result and provides actionable feedback with Tajweed tips
 */
export const getRecitationFeedback = async (recitationResult: RecitationResult): Promise<string> => {
  return callWithRetry(async () => {
    const ai = getAI();

    const incorrectWords = recitationResult.words.filter(w => w.status === 'incorrect');
    const missingWords = recitationResult.words.filter(w => w.status === 'missing');
    const extraWords = recitationResult.words.filter(w => w.status === 'extra');

    const prompt = `You are a compassionate and knowledgeable Quran recitation teacher (Mu'allim). A student has completed a recitation practice with the following results:

**Accuracy Score**: ${recitationResult.accuracy}%
**Overall Feedback**: ${recitationResult.overallFeedback}

**Incorrect/Mispronounced Words** (${incorrectWords.length}):
${incorrectWords.length > 0 ? incorrectWords.map(w => `- ${w.word}: ${w.feedback || 'pronunciation issue'}`).join('\n') : '- None'}

**Missing Words** (${missingWords.length}):
${missingWords.length > 0 ? missingWords.map(w => `- ${w.word}`).join('\n') : '- None'}

**Extra Words Added** (${extraWords.length}):
${extraWords.length > 0 ? extraWords.map(w => `- ${w.word}`).join('\n') : '- None'}

Please provide detailed, encouraging feedback in the following structure:

## 1. Strengths
What the student did well in this recitation (be specific and encouraging)

## 2. Areas for Improvement
Specific words, sounds, or patterns that need practice (be constructive)

## 3. Tajweed Tips
Relevant Tajweed rules for the mistakes made:
- If pronunciation errors: explain the correct articulation points (Makharij)
- If timing/length issues: explain rules of elongation (Madd)
- If merging issues: explain rules like Idgham, Ikhfa, Iqlab
(Only include if applicable)

## 4. Practice Recommendations
Concrete steps the student can take to improve:
- Specific exercises
- Which letters/sounds to focus on
- Suggested practice verses or surahs

## 5. Encouragement
A motivational message that emphasizes:
- The value of their effort
- That improvement comes with practice
- The spiritual reward of Quran recitation

Write in a warm, supportive tone. Use clear markdown formatting.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a patient and encouraging Quran teacher (Mu'allim). Your role is to build confidence while providing actionable guidance. Focus on growth, not criticism. Be specific, practical, and kind."
      }
    });

    return response.text || "Keep practicing! Every recitation is a step toward mastery. May Allah bless your efforts.";
  });
};
