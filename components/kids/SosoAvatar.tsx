/**
 * Soso Avatar Component
 * Animated character avatar for the kids tutor
 */

import React from 'react';

interface SosoAvatarProps {
  size?: 'small' | 'medium' | 'large';
  isListening?: boolean;
  isSpeaking?: boolean;
  isThinking?: boolean;
  onClick?: () => void;
  className?: string;
}

export const SosoAvatar: React.FC<SosoAvatarProps> = ({
  size = 'medium',
  isListening = false,
  isSpeaking = false,
  isThinking = false,
  onClick,
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-20 h-20',
    large: 'w-32 h-32'
  };

  const pulseClass = isListening ? 'animate-pulse' : '';
  const bounceClass = isSpeaking ? 'animate-bounce' : '';
  const spinClass = isThinking ? 'animate-spin-slow' : '';

  // Determine which animation to apply
  const animationClass = isThinking ? spinClass : (isSpeaking ? bounceClass : (isListening ? pulseClass : ''));

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${animationClass}
        ${className}
        relative cursor-pointer transition-transform hover:scale-110
      `}
      onClick={onClick}
      role="button"
      aria-label="Soso the learning companion"
    >
      {/* Main avatar circle */}
      <div className={`
        w-full h-full rounded-full
        bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400
        flex items-center justify-center
        shadow-lg
        ${isListening ? 'ring-4 ring-pink-300 ring-opacity-75 animate-pulse' : ''}
        ${isSpeaking ? 'ring-4 ring-purple-300 ring-opacity-75' : ''}
      `}>
        {/* Face */}
        <div className="relative w-3/4 h-3/4 flex flex-col items-center justify-center">
          {/* Eyes */}
          <div className="flex gap-2 mb-1">
            <div className={`
              w-2 h-2 bg-white rounded-full
              ${isSpeaking ? 'animate-blink' : ''}
            `}>
              <div className="w-1 h-1 bg-gray-800 rounded-full mt-0.5 ml-0.5"></div>
            </div>
            <div className={`
              w-2 h-2 bg-white rounded-full
              ${isSpeaking ? 'animate-blink' : ''}
            `}>
              <div className="w-1 h-1 bg-gray-800 rounded-full mt-0.5 ml-0.5"></div>
            </div>
          </div>

          {/* Mouth - changes based on state */}
          {isThinking ? (
            // Thinking mouth - small circle
            <div className="w-2 h-2 bg-white rounded-full mt-1"></div>
          ) : isSpeaking ? (
            // Speaking mouth - animated open
            <div className="w-3 h-2 bg-white rounded-full mt-1 animate-pulse"></div>
          ) : isListening ? (
            // Listening mouth - small smile
            <div className="w-3 h-1.5 bg-white rounded-full mt-1"></div>
          ) : (
            // Default smile
            <div className="w-4 h-2 bg-white rounded-b-full mt-1"></div>
          )}
        </div>
      </div>

      {/* Sparkles around avatar when active */}
      {(isListening || isSpeaking) && (
        <>
          <span className="absolute -top-1 -right-1 text-yellow-300 text-xs animate-ping">✨</span>
          <span className="absolute -bottom-1 -left-1 text-yellow-300 text-xs animate-ping" style={{ animationDelay: '0.5s' }}>✨</span>
        </>
      )}

      {/* Thinking indicator */}
      {isThinking && (
        <div className="absolute -top-2 right-0 flex gap-1">
          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
        </div>
      )}

      {/* Listening indicator - sound waves */}
      {isListening && (
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
          <div className="w-1 h-2 bg-pink-400 rounded animate-pulse"></div>
          <div className="w-1 h-3 bg-pink-400 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-1 h-2 bg-pink-400 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        </div>
      )}
    </div>
  );
};

// Floating button version for overlay
interface SosoFloatingButtonProps {
  onClick: () => void;
  label?: string;
  isActive?: boolean;
}

export const SosoFloatingButton: React.FC<SosoFloatingButtonProps> = ({
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
      aria-label="Ask Soso"
    >
      {/* Glow effect when active */}
      {isActive && (
        <div className="absolute inset-0 w-16 h-16 bg-pink-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
      )}

      {/* Avatar */}
      <div className={`
        w-16 h-16 rounded-full
        bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400
        flex items-center justify-center
        shadow-lg
        ${isActive ? 'ring-4 ring-white ring-opacity-50' : ''}
      `}>
        <span className="text-2xl">🤖</span>
      </div>

      {/* Label */}
      {label && (
        <span className="text-xs font-medium text-white bg-purple-600 px-2 py-0.5 rounded-full shadow">
          {label}
        </span>
      )}
    </button>
  );
};

export default SosoAvatar;
