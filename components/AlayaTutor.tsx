/**
 * Alaya Tutor Component
 * Adult AI companion for Islamic learning
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  askAlaya,
  speakAsAlaya,
  getAlayaWelcome,
  getAlayaGreeting,
  getAlayaEncouragement,
  type AlayaTutorContext
} from '../services/adultTutorService';

// Web Speech API type declarations
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

interface Message {
  id: string;
  role: 'user' | 'alaya';
  text: string;
  timestamp: Date;
}

interface AlayaTutorProps {
  isOpen: boolean;
  onClose: () => void;
  context: AlayaTutorContext;
}

export const AlayaTutor: React.FC<AlayaTutorProps> = ({
  isOpen,
  onClose,
  context
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ar-EG';
  const language = isRTL ? 'ar' : 'en';

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome: Message = {
        id: 'welcome',
        role: 'alaya',
        text: getAlayaGreeting({ ...context, language }),
        timestamp: new Date()
      };
      setMessages([welcome]);

      // Speak welcome if audio enabled
      if (audioEnabled) {
        speakMessage(welcome.text);
      }
    }
  }, [isOpen, context, language, audioEnabled]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language === 'ar' ? 'ar-SA' : 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language]);

  // Speak a message using TTS
  const speakMessage = async (text: string) => {
    if (!audioEnabled) return;

    try {
      setIsSpeaking(true);
      const audioData = await speakAsAlaya(text, language);

      // Create audio blob and play
      const blob = audioData instanceof Blob ? audioData : new Blob([audioData], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
        };
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
    }
  };

  // Handle sending a message
  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isThinking) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsThinking(true);

    try {
      // Get Alaya's response
      const response = await askAlaya(userMessage.text, { ...context, language });

      const alayaMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'alaya',
        text: response.text,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, alayaMessage]);

      // Speak response
      if (audioEnabled && response.shouldSpeak) {
        await speakMessage(response.text);
      }
    } catch (error) {
      console.error('Alaya error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'alaya',
        text: language === 'ar'
          ? 'عذراً! حدث خطأ. يرجى المحاولة مرة أخرى.'
          : 'I apologize! Something went wrong. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  }, [inputText, isThinking, context, language, audioEnabled]);

  // Handle voice input
  const handleVoiceInput = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`
          relative w-full max-w-lg max-h-[85vh]
          bg-gradient-to-b from-emerald-50 to-teal-50
          rounded-2xl shadow-2xl
          flex flex-col overflow-hidden
          ${isRTL ? 'rtl' : 'ltr'}
        `}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
          <div className="flex items-center gap-3">
            {/* Alaya Avatar */}
            <div className={`
              w-12 h-12 rounded-full
              bg-gradient-to-br from-emerald-300 via-teal-300 to-cyan-300
              flex items-center justify-center shadow-lg
              ${isSpeaking ? 'animate-pulse ring-2 ring-white' : ''}
              ${isThinking ? 'animate-spin-slow' : ''}
            `}>
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">
                {language === 'ar' ? 'علية' : 'Alaya'}
              </h2>
              <p className="text-white/80 text-xs">
                {language === 'ar' ? 'رفيقتك في التعلم' : 'Your Learning Companion'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio toggle */}
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              aria-label={audioEnabled ? 'Disable audio' : 'Enable audio'}
            >
              {audioEnabled ? (
                <i className="fas fa-volume-up text-white text-lg"></i>
              ) : (
                <i className="fas fa-volume-mute text-white text-lg"></i>
              )}
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              aria-label="Close"
            >
              <i className="fas fa-times text-white text-lg"></i>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[85%] p-4 rounded-2xl
                  ${message.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 rounded-bl-sm shadow-md'
                  }
                `}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-white p-4 rounded-2xl rounded-bl-sm shadow-md">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 text-sm">
                    {language === 'ar' ? 'علية تفكر...' : 'Alaya is thinking...'}
                  </span>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 bg-white border-t border-emerald-100">
          <div className="flex items-center gap-2">
            {/* Voice input button */}
            <button
              onClick={handleVoiceInput}
              className={`
                p-3 rounded-full transition-all
                ${isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                }
              `}
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? (
                <i className="fas fa-microphone-slash text-lg"></i>
              ) : (
                <i className="fas fa-microphone text-lg"></i>
              )}
            </button>

            {/* Text input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={language === 'ar' ? 'اسأل علية...' : 'Ask Alaya...'}
              className={`
                flex-1 p-3 rounded-full
                bg-emerald-50 border border-emerald-200
                focus:outline-none focus:ring-2 focus:ring-emerald-400
                text-gray-800 placeholder-gray-400
                ${isRTL ? 'text-right' : 'text-left'}
              `}
              disabled={isThinking}
            />

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isThinking}
              className={`
                p-3 rounded-full transition-all
                ${inputText.trim() && !isThinking
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
              aria-label="Send message"
            >
              <i className="fas fa-paper-plane text-lg"></i>
            </button>
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-2 mt-3">
            {(language === 'ar' ? [
              'اشرح الآية',
              'أخبرني عن النبي',
              'ما معنى هذا؟'
            ] : [
              'Explain this verse',
              'Tell me about the prophet',
              'What does this mean?'
            ]).map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => setInputText(suggestion)}
                className="px-3 py-1.5 text-sm bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Hidden audio element */}
        <audio ref={audioRef} className="hidden" />
      </div>
    </div>
  );
};

// Floating button for Alaya
interface AlayaFloatingButtonProps {
  onClick: () => void;
  label?: string;
  isActive?: boolean;
}

export const AlayaFloatingButton: React.FC<AlayaFloatingButtonProps> = ({
  onClick,
  label,
  isActive = false
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-24 right-4 z-50
        flex flex-col items-center gap-1
        transition-all duration-300
        ${isActive ? 'scale-110' : 'hover:scale-110'}
      `}
      aria-label="Ask Alaya"
    >
      {/* Glow effect when active */}
      {isActive && (
        <div className="absolute inset-0 w-16 h-16 bg-emerald-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
      )}

      {/* Avatar */}
      <div className={`
        w-16 h-16 rounded-full
        bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500
        flex items-center justify-center
        shadow-lg
        ${isActive ? 'ring-4 ring-white ring-opacity-50' : ''}
      `}>
        <span className="text-2xl">📚</span>
      </div>

      {/* Label */}
      {label && (
        <span className="text-xs font-medium text-white bg-emerald-600 px-2 py-0.5 rounded-full shadow">
          {label}
        </span>
      )}
    </button>
  );
};

// Wrapper component with floating button
interface AlayaTutorWrapperProps {
  context: AlayaTutorContext;
}

export const AlayaTutorWrapper: React.FC<AlayaTutorWrapperProps> = ({
  context
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const isRTL = i18n.language === 'ar' || i18n.language === 'ar-EG';

  return (
    <>
      <AlayaFloatingButton
        onClick={() => setIsOpen(true)}
        label={isRTL ? 'اسأل علية' : 'Ask Alaya'}
        isActive={isOpen}
      />

      <AlayaTutor
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        context={context}
      />
    </>
  );
};

export default AlayaTutor;
