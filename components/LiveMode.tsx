import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { createPcmBlob, decodeAudioData } from '../services/audioUtils';
import { getGeminiApiKey } from '../services/geminiService';

// Tutoring Mode Types
type TutoringMode = 'conversation' | 'tajweed' | 'memorization' | 'tafsir';

interface TutoringModeConfig {
    id: TutoringMode;
    name: string;
    icon: string;
    description: string;
    color: string;
    systemPrompt: string;
}

const TUTORING_MODES: TutoringModeConfig[] = [
    {
        id: 'conversation',
        name: 'General',
        icon: 'fa-comments',
        description: 'Ask about prophets, Islamic history, and stories',
        color: 'amber',
        systemPrompt: `You are Hikma, a wise and warm Islamic scholar and storyteller. Your voice is calm, measured, and deeply knowledgeable.

PERSONALITY:
- Speak with wisdom and patience, like a beloved teacher
- Use beautiful analogies and examples from Islamic tradition
- Be encouraging and supportive

EXPERTISE:
- Stories of all 25 prophets mentioned in the Quran
- Islamic history from Prophet Adam to Prophet Muhammad (PBUH)
- Historical events, battles, and significant moments
- Companions of the Prophet and their stories

STYLE:
- Keep responses conversational and engaging (30-60 seconds when spoken)
- Use phrases like "SubhanAllah", "MashaAllah" naturally
- Reference Quran and Hadith when appropriate
- Make complex topics accessible to all ages`
    },
    {
        id: 'tajweed',
        name: 'Tajweed',
        icon: 'fa-book-quran',
        description: 'Learn Quran recitation rules and pronunciation',
        color: 'emerald',
        systemPrompt: `You are a Tajweed master and Quran recitation coach. Your role is to teach the rules of proper Quran recitation.

EXPERTISE:
- All Tajweed rules: Noon Sakinah, Meem Sakinah, Madd, Qalqalah, etc.
- Arabic letter pronunciation (Makharij al-Huruf)
- Common recitation mistakes and how to fix them
- Different Qira'at (recitation styles)

TEACHING APPROACH:
- Explain rules clearly with examples
- When the user recites, listen and provide gentle corrections
- Use terms like "Try elongating the madd here" or "Remember the ghunnah"
- Celebrate progress: "MashaAllah, your pronunciation of ع is improving!"

INTERACTION:
- If user mentions a specific verse, focus on its Tajweed rules
- Demonstrate proper pronunciation when explaining
- Be patient with beginners, challenging with advanced students
- Keep explanations concise but thorough`
    },
    {
        id: 'memorization',
        name: 'Hifz Coach',
        icon: 'fa-brain',
        description: 'Memorization techniques and practice',
        color: 'purple',
        systemPrompt: `You are an experienced Hifz (Quran memorization) coach. You help students memorize the Quran effectively.

EXPERTISE:
- Memorization techniques (chunking, repetition, connection)
- Review strategies (Sabaq, Sabqi, Manzil system)
- Memory palace and visualization for Quran
- Common memorization challenges and solutions

COACHING STYLE:
- Motivational and encouraging
- "You've got this! Let's break it down together"
- Celebrate small wins: "SubhanAllah, you remembered that perfectly!"
- Provide structure: "Let's do 3 repetitions, then test"

INTERACTION:
- Quiz the student on verses they're memorizing
- Help them connect verses through meaning
- Suggest daily routines and schedules
- If they struggle, offer easier chunks
- Use spaced repetition principles

TESTING:
- "Can you recite the next verse?"
- "What comes after [verse]?"
- "Let's see if you can do the whole passage"
- Provide hints when stuck, but encourage recall first`
    },
    {
        id: 'tafsir',
        name: 'Tafsir',
        icon: 'fa-lightbulb',
        description: 'Deep meanings and context of verses',
        color: 'blue',
        systemPrompt: `You are a Tafsir (Quran exegesis) scholar. You explain the deep meanings, context, and wisdom of Quranic verses.

EXPERTISE:
- Classical Tafsir sources (Ibn Kathir, Al-Tabari, Al-Qurtubi)
- Asbab al-Nuzul (reasons for revelation)
- Linguistic analysis of Arabic words
- Contemporary relevance and application
- Connections between verses and themes

TEACHING STYLE:
- Layer meanings: literal, contextual, spiritual
- "This verse was revealed when..." (historical context)
- "The Arabic word here comes from..." (linguistic insight)
- "Scholars have different views..." (scholarly discourse)
- "In our daily lives, this means..." (practical application)

INTERACTION:
- If user asks about a specific verse, provide comprehensive tafsir
- Connect verses to broader Quranic themes
- Reference relevant Hadith that explain the verse
- Make profound concepts accessible
- Be respectful of different scholarly opinions`
    }
];

// Voice options for different modes
const VOICE_OPTIONS: Record<TutoringMode, string> = {
    conversation: 'Fenrir',  // Deep, wise voice for storytelling
    tajweed: 'Kore',         // Clear, precise voice for recitation teaching
    memorization: 'Charon',  // Encouraging, energetic voice for coaching
    tafsir: 'Fenrir'         // Thoughtful, scholarly voice for deep explanation
};

const LiveMode: React.FC = () => {
    // Connection state
    const [connected, setConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [aiSpeaking, setAiSpeaking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    // Tutoring state
    const [selectedMode, setSelectedMode] = useState<TutoringMode>('conversation');
    const [verseContext, setVerseContext] = useState({ surah: '', verse: '' });
    const [showModeSelector, setShowModeSelector] = useState(true);

    // Audio refs
    const inputAudioCtxRef = useRef<AudioContext | null>(null);
    const outputAudioCtxRef = useRef<AudioContext | null>(null);
    const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const outputNodeRef = useRef<GainNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Live API Session
    const sessionPromiseRef = useRef<Promise<any> | null>(null);

    // Playback timing
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const addLog = (msg: string) => setLogs(prev => [...prev.slice(-4), msg]);

    const getModeConfig = () => TUTORING_MODES.find(m => m.id === selectedMode)!;

    const buildSystemPrompt = () => {
        const modeConfig = getModeConfig();
        let prompt = modeConfig.systemPrompt;

        // Add verse context if provided
        if (verseContext.surah && verseContext.verse) {
            prompt += `\n\nCURRENT FOCUS: The student wants to discuss Surah ${verseContext.surah}, Verse ${verseContext.verse}.
Start by acknowledging this verse and relate your responses to it when relevant.`;
        } else if (verseContext.surah) {
            prompt += `\n\nCURRENT FOCUS: The student wants to discuss Surah ${verseContext.surah}.
Be ready to discuss any verse from this Surah and its themes.`;
        }

        return prompt;
    };

    const startSession = async () => {
        try {
            setError(null);
            setShowModeSelector(false);
            addLog("Initializing Audio...");

            // Setup Audio Contexts
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
            inputAudioCtxRef.current = inputCtx;
            outputAudioCtxRef.current = outputCtx;

            outputNodeRef.current = outputCtx.createGain();
            outputNodeRef.current.connect(outputCtx.destination);

            // Get Mic Access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            addLog("Connecting to Gemini...");

            const connectToGemini = async () => {
                const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
                const systemPrompt = buildSystemPrompt();
                const voiceName = VOICE_OPTIONS[selectedMode];

                return ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                    callbacks: {
                        onopen: () => {
                            addLog("Connected!");
                            setConnected(true);

                            // Start Processing Mic Input
                            const source = inputCtx.createMediaStreamSource(stream);
                            inputSourceRef.current = source;

                            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                            processorRef.current = processor;

                            processor.onaudioprocess = (e) => {
                                const inputData = e.inputBuffer.getChannelData(0);
                                let sum = 0;
                                for(let i=0; i<inputData.length; i++) sum += inputData[i]*inputData[i];
                                const rms = Math.sqrt(sum/inputData.length);
                                setIsSpeaking(rms > 0.05);

                                const pcmBlob = createPcmBlob(inputData);
                                sessionPromiseRef.current?.then(session => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            };

                            source.connect(processor);
                            processor.connect(inputCtx.destination);
                        },
                        onmessage: async (msg: LiveServerMessage) => {
                            const { serverContent } = msg;

                            const audioData = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                            if (audioData && outputAudioCtxRef.current && outputNodeRef.current) {
                                setAiSpeaking(true);
                                const ctx = outputAudioCtxRef.current;

                                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

                                const audioBuffer = await decodeAudioData(
                                    (await import('../services/audioUtils')).base64ToUint8Array(audioData),
                                    ctx,
                                    24000,
                                    1
                                );

                                const source = ctx.createBufferSource();
                                source.buffer = audioBuffer;
                                source.connect(outputNodeRef.current);
                                source.onended = () => {
                                    sourcesRef.current.delete(source);
                                    if (sourcesRef.current.size === 0) setAiSpeaking(false);
                                };

                                source.start(nextStartTimeRef.current);
                                nextStartTimeRef.current += audioBuffer.duration;
                                sourcesRef.current.add(source);
                            }

                            if (serverContent?.interrupted) {
                                addLog("Interrupted");
                                sourcesRef.current.forEach(s => s.stop());
                                sourcesRef.current.clear();
                                nextStartTimeRef.current = 0;
                                setAiSpeaking(false);
                            }
                        },
                        onclose: () => {
                            addLog("Session Closed");
                            setConnected(false);
                        },
                        onerror: (e) => {
                            console.error(e);
                            setError("Connection error");
                            setConnected(false);
                        }
                    },
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: {
                            voiceConfig: { prebuiltVoiceConfig: { voiceName } }
                        },
                        systemInstruction: systemPrompt,
                    }
                });
            };

            try {
                const session = await connectToGemini();
                sessionPromiseRef.current = Promise.resolve(session);
            } catch (e: any) {
                const msg = e.toString().toLowerCase();
                if (window.aistudio && (msg.includes("404") || msg.includes("not found") || msg.includes("403") || msg.includes("permission denied"))) {
                    addLog("Auth failed. Prompting for key...");
                    await window.aistudio.openSelectKey();
                    const session = await connectToGemini();
                    sessionPromiseRef.current = Promise.resolve(session);
                } else {
                    throw e;
                }
            }

        } catch (err) {
            console.error("Failed to start session", err);
            setError("Connection failed. Please check permissions.");
            setConnected(false);
            setShowModeSelector(true);
        }
    };

    const stopSession = () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        inputAudioCtxRef.current?.close();
        outputAudioCtxRef.current?.close();
        processorRef.current?.disconnect();
        inputSourceRef.current?.disconnect();
        sessionPromiseRef.current?.then(session => session.close());

        setConnected(false);
        setIsSpeaking(false);
        setAiSpeaking(false);
        setLogs([]);
        setShowModeSelector(true);
    };

    useEffect(() => {
        return () => {
            stopSession();
        };
    }, []);

    const modeConfig = getModeConfig();
    const colorClasses: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
        amber: { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-500', gradient: 'from-amber-900 to-amber-800' },
        emerald: { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-500', gradient: 'from-emerald-900 to-emerald-800' },
        purple: { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-500', gradient: 'from-purple-900 to-purple-800' },
        blue: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-500', gradient: 'from-blue-900 to-blue-800' },
    };
    const colors = colorClasses[modeConfig.color];

    // Mode Selector View
    if (showModeSelector && !connected) {
        return (
            <div className="h-full flex flex-col p-6 bg-gradient-to-b from-slate-900 to-slate-800 text-white rounded-lg overflow-y-auto">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-serif mb-2">Learn with Soso</h2>
                    <p className="text-slate-400">Choose your learning mode</p>
                </div>

                {/* Mode Cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {TUTORING_MODES.map((mode) => {
                        const modeColors = colorClasses[mode.color];
                        const isSelected = selectedMode === mode.id;

                        return (
                            <button
                                key={mode.id}
                                onClick={() => setSelectedMode(mode.id)}
                                className={`
                                    p-4 rounded-xl border-2 transition-all text-left
                                    ${isSelected
                                        ? `${modeColors.border} bg-white/10`
                                        : 'border-slate-700 hover:border-slate-500'
                                    }
                                `}
                            >
                                <div className={`w-10 h-10 rounded-lg ${modeColors.bg} flex items-center justify-center mb-3`}>
                                    <i className={`fas ${mode.icon} text-white`}></i>
                                </div>
                                <h3 className={`font-semibold mb-1 ${isSelected ? modeColors.text : 'text-white'}`}>
                                    {mode.name}
                                </h3>
                                <p className="text-xs text-slate-400 line-clamp-2">
                                    {mode.description}
                                </p>
                            </button>
                        );
                    })}
                </div>

                {/* Verse Context (Optional) */}
                <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                    <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                        <i className="fas fa-book-open text-slate-400"></i>
                        Focus on specific verse (optional)
                    </h4>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-xs text-slate-500 mb-1 block">Surah Name/Number</label>
                            <input
                                type="text"
                                placeholder="e.g., Al-Baqarah or 2"
                                value={verseContext.surah}
                                onChange={(e) => setVerseContext(prev => ({ ...prev, surah: e.target.value }))}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-400"
                            />
                        </div>
                        <div className="w-24">
                            <label className="text-xs text-slate-500 mb-1 block">Verse</label>
                            <input
                                type="text"
                                placeholder="e.g., 255"
                                value={verseContext.verse}
                                onChange={(e) => setVerseContext(prev => ({ ...prev, verse: e.target.value }))}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Start Button */}
                <button
                    onClick={startSession}
                    className={`
                        w-full py-4 rounded-xl font-semibold text-lg
                        ${colors.bg} hover:opacity-90 transition-all
                        flex items-center justify-center gap-3 shadow-lg
                    `}
                >
                    <i className="fas fa-microphone"></i>
                    Start {modeConfig.name} Session
                </button>

                {/* Mode Info */}
                <div className="mt-4 p-4 bg-slate-800/30 rounded-xl">
                    <h4 className={`font-medium ${colors.text} mb-2 flex items-center gap-2`}>
                        <i className={`fas ${modeConfig.icon}`}></i>
                        {modeConfig.name} Mode
                    </h4>
                    <p className="text-sm text-slate-400">
                        {modeConfig.description}
                    </p>
                    {selectedMode === 'tajweed' && (
                        <p className="text-xs text-slate-500 mt-2">
                            Tip: Recite verses and ask about specific Tajweed rules like Ikhfa, Idgham, or Madd.
                        </p>
                    )}
                    {selectedMode === 'memorization' && (
                        <p className="text-xs text-slate-500 mt-2">
                            Tip: Specify a Surah to memorize and the AI will quiz you and provide memory techniques.
                        </p>
                    )}
                    {selectedMode === 'tafsir' && (
                        <p className="text-xs text-slate-500 mt-2">
                            Tip: Ask about the meaning, context, or application of any verse.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // Active Session View
    return (
        <div className={`h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b ${colors.gradient} text-white rounded-lg relative overflow-hidden`}>
            {/* Visualizer Background Effect */}
            <div className={`absolute inset-0 opacity-20 pointer-events-none transition-all duration-500 ${aiSpeaking ? `${colors.bg} blur-3xl` : 'bg-transparent'}`}></div>

            <div className="z-10 text-center space-y-6 max-w-md w-full">
                {/* Mode Badge */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${colors.bg}/20 ${colors.text} text-sm`}>
                    <i className={`fas ${modeConfig.icon}`}></i>
                    {modeConfig.name} Mode
                    {verseContext.surah && (
                        <span className="text-white/60">
                            | {verseContext.surah}{verseContext.verse ? `:${verseContext.verse}` : ''}
                        </span>
                    )}
                </div>

                <div>
                    <h2 className="text-3xl font-serif mb-2">
                        {selectedMode === 'tajweed' && 'Tajweed Tutor'}
                        {selectedMode === 'memorization' && 'Hifz Coach'}
                        {selectedMode === 'tafsir' && 'Tafsir Scholar'}
                        {selectedMode === 'conversation' && 'Voice Conversation'}
                    </h2>
                    <p className="text-slate-300 text-sm">
                        {selectedMode === 'tajweed' && 'Recite or ask about pronunciation rules'}
                        {selectedMode === 'memorization' && "Let's practice and strengthen your memory"}
                        {selectedMode === 'tafsir' && 'Ask about meanings and wisdom'}
                        {selectedMode === 'conversation' && 'Ask about any Prophet or historical event'}
                    </p>
                </div>

                {/* Status Indicator */}
                <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                    {/* Ripple rings */}
                    {connected && (
                        <>
                            <div className={`absolute inset-0 rounded-full border-4 ${colors.border}/30 transition-all duration-300 ${isSpeaking ? 'scale-125' : 'scale-100'}`}></div>
                            <div className={`absolute inset-0 rounded-full border-4 ${colors.border}/20 transition-all duration-500 delay-75 ${isSpeaking ? 'scale-150' : 'scale-100'}`}></div>
                        </>
                    )}

                    <button
                        onClick={connected ? stopSession : startSession}
                        className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl shadow-2xl transition-all duration-300 transform hover:scale-105 ${connected ? 'bg-red-500 hover:bg-red-600' : `${colors.bg} hover:opacity-90`}`}
                    >
                        <i className={`fas ${connected ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
                    </button>
                </div>

                <div className="h-12 flex items-center justify-center">
                    {error ? (
                        <span className="text-red-400 bg-red-900/30 px-4 py-1 rounded-full text-sm">{error}</span>
                    ) : (
                        <span className={`text-sm px-4 py-1 rounded-full transition-all ${connected ? 'bg-slate-900/50' : 'text-slate-500'} ${colors.text}`}>
                            {connected
                                ? (aiSpeaking
                                    ? (selectedMode === 'tajweed' ? "Teaching..." : selectedMode === 'memorization' ? "Coaching..." : "Explaining...")
                                    : isSpeaking ? "Listening..." : "Listening for you...")
                                : "Tap microphone to start"}
                        </span>
                    )}
                </div>

                {logs.length > 0 && (
                    <div className="text-xs text-slate-400 font-mono">
                        {logs[logs.length-1]}
                    </div>
                )}

                {/* Quick Actions */}
                {connected && (
                    <div className="flex justify-center gap-3 pt-4">
                        <button
                            onClick={stopSession}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm flex items-center gap-2 transition-colors"
                        >
                            <i className="fas fa-stop"></i>
                            End Session
                        </button>
                        <button
                            onClick={() => {
                                stopSession();
                                setShowModeSelector(true);
                            }}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm flex items-center gap-2 transition-colors"
                        >
                            <i className="fas fa-exchange-alt"></i>
                            Change Mode
                        </button>
                    </div>
                )}
            </div>

            {/* Suggestion Prompts */}
            {connected && !aiSpeaking && !isSpeaking && (
                <div className="absolute bottom-6 left-6 right-6">
                    <p className="text-xs text-slate-500 text-center mb-2">Try asking:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {selectedMode === 'conversation' && (
                            <>
                                <span className="text-xs bg-slate-800/50 px-3 py-1 rounded-full text-slate-400">"Tell me about Prophet Yusuf"</span>
                                <span className="text-xs bg-slate-800/50 px-3 py-1 rounded-full text-slate-400">"What happened at Badr?"</span>
                            </>
                        )}
                        {selectedMode === 'tajweed' && (
                            <>
                                <span className="text-xs bg-slate-800/50 px-3 py-1 rounded-full text-slate-400">"Explain Ikhfa rules"</span>
                                <span className="text-xs bg-slate-800/50 px-3 py-1 rounded-full text-slate-400">"How do I pronounce ض?"</span>
                            </>
                        )}
                        {selectedMode === 'memorization' && (
                            <>
                                <span className="text-xs bg-slate-800/50 px-3 py-1 rounded-full text-slate-400">"Quiz me on Al-Fatiha"</span>
                                <span className="text-xs bg-slate-800/50 px-3 py-1 rounded-full text-slate-400">"Give me memory tips"</span>
                            </>
                        )}
                        {selectedMode === 'tafsir' && (
                            <>
                                <span className="text-xs bg-slate-800/50 px-3 py-1 rounded-full text-slate-400">"Explain Ayatul Kursi"</span>
                                <span className="text-xs bg-slate-800/50 px-3 py-1 rounded-full text-slate-400">"What does Surah Al-Asr mean?"</span>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveMode;
