/**
 * Soso Tutor Component
 * Main tutor modal/overlay for kids learning companion
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SosoAvatar, SosoFloatingButton } from './SosoAvatar';
import {
  askSoso,
  speakAsSoso,
  getSosoWelcome,
  getSosoGreeting,
  getSosoEncouragement,
  canEarnStar,
  recordInteraction,
  getTodayInteractionCount
} from '../../services/kidsTutorService';
import type { KidsTutorContext } from '../../services/ai/types';
import { logTutorQuestion } from '../../services/progressSyncService';

interface Message {
  id: string;
  role: 'user' | 'soso';
  text: string;
  timestamp: Date;
}

interface SosoTutorProps {
  isOpen: boolean;
  onClose: () => void;
  context: KidsTutorContext;
  onStarEarned?: (stars: number) => void;
}

export const SosoTutor: React.FC<SosoTutorProps> = ({
  isOpen,
  onClose,
  context,
  onStarEarned
}) => {
  const { t, i18n } = useTranslation('kids');
  const isRTL = i18n.language === 'ar' || i18n.language === 'ar-EG';
  const language = isRTL ? 'ar' : 'en';

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [starsToday, setStarsToday] = useState(0);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome: Message = {
        id: 'welcome',
        role: 'soso',
        text: getSosoGreeting({ ...context, language }),
        timestamp: new Date()
      };
      setMessages([welcome]);
      setStarsToday(getTodayInteractionCount());

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
      const audioData = await speakAsSoso(text, language);

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
      // Log question for parental review (COPPA audit trail)
      logTutorQuestion(userMessage.text);

      // Get Soso's response
      const response = await askSoso(userMessage.text, { ...context, language });

      const sosoMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'soso',
        text: response.text,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, sosoMessage]);

      // Check for star reward
      if (canEarnStar()) {
        const starsEarned = recordInteraction();
        if (starsEarned > 0) {
          setStarsToday(prev => prev + starsEarned);
          onStarEarned?.(starsEarned);

          // Add encouragement message
          const encouragement: Message = {
            id: (Date.now() + 2).toString(),
            role: 'soso',
            text: getSosoEncouragement(language),
            timestamp: new Date()
          };
          setMessages(prev => [...prev, encouragement]);
        }
      }

      // Speak response
      if (audioEnabled && response.shouldSpeak) {
        await speakMessage(response.text);
      }
    } catch (error) {
      console.error('Soso error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'soso',
        text: language === 'ar'
          ? 'عذراً! حصلت مشكلة. جرب تاني!'
          : 'Oops! Something went wrong. Try again!',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  }, [inputText, isThinking, context, language, audioEnabled, onStarEarned]);

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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`
          relative w-full max-w-md max-h-[80vh]
          bg-gradient-to-b from-purple-50 to-pink-50
          rounded-3xl shadow-2xl
          flex flex-col overflow-hidden
          ${isRTL ? 'rtl' : 'ltr'}
        `}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400">
          <div className="flex items-center gap-3">
            <SosoAvatar
              size="small"
              isListening={isListening}
              isSpeaking={isSpeaking}
              isThinking={isThinking}
            />
            <div>
              <h2 className="text-white font-bold text-lg">
                {t('tutor.name', 'Soso')} {language === 'ar' ? 'سوسو' : ''}
              </h2>
              <p className="text-white/80 text-xs">
                {t('tutor.subtitle', 'Your Learning Buddy')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Stars earned today */}
            <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-1">
              <i className="fas fa-star text-yellow-300 text-sm"></i>
              <span className="text-white text-sm font-medium">{starsToday}/3</span>
            </div>

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
                  max-w-[80%] p-3 rounded-2xl
                  ${message.role === 'user'
                    ? 'bg-purple-500 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 rounded-bl-sm shadow-md'
                  }
                `}
              >
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-white p-3 rounded-2xl rounded-bl-sm shadow-md">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 bg-white border-t border-purple-100">
          <div className="flex items-center gap-2">
            {/* Voice input button */}
            <button
              onClick={handleVoiceInput}
              className={`
                p-3 rounded-full transition-all
                ${isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
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
              placeholder={language === 'ar' ? 'اسأل سوسو...' : 'Ask Soso...'}
              className={`
                flex-1 p-3 rounded-full
                bg-purple-50 border border-purple-200
                focus:outline-none focus:ring-2 focus:ring-purple-400
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
                  ? 'bg-purple-500 text-white hover:bg-purple-600'
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
              'قولي قصة!',
              'علمني حرف جديد',
              'إيه معنى الآية؟'
            ] : [
              'Tell me a story!',
              'Teach me a letter',
              'What does this mean?'
            ]).map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => setInputText(suggestion)}
                className="px-3 py-1 text-xs bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors"
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

// Wrapper component that includes the floating button
interface SosoTutorWrapperProps {
  context: KidsTutorContext;
  onStarEarned?: (stars: number) => void;
}

export const SosoTutorWrapper: React.FC<SosoTutorWrapperProps> = ({
  context,
  onStarEarned
}) => {
  const { t, i18n } = useTranslation('kids');
  const [isOpen, setIsOpen] = useState(false);
  const isRTL = i18n.language === 'ar' || i18n.language === 'ar-EG';

  return (
    <>
      <SosoFloatingButton
        onClick={() => setIsOpen(true)}
        label={t('tutor.askButton', isRTL ? 'اسأل سوسو' : 'Ask Soso')}
        isActive={isOpen}
      />

      <SosoTutor
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        context={context}
        onStarEarned={onStarEarned}
      />
    </>
  );
};

export default SosoTutor;
