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
  isCelebrating?: boolean;
  onClick?: () => void;
  className?: string;
}

export const SosoAvatar: React.FC<SosoAvatarProps> = ({
  size = 'medium',
  isListening = false,
  isSpeaking = false,
  isThinking = false,
  isCelebrating = false,
  onClick,
  className = ''
}) => {
  const sizeMap = {
    small: 48,
    medium: 80,
    large: 128
  };

  const pixelSize = sizeMap[size];

  // Determine current state for animations
  const currentState = isCelebrating ? 'celebrating' :
                       isThinking ? 'thinking' :
                       isSpeaking ? 'speaking' :
                       isListening ? 'listening' : 'idle';

  return (
    <>
      <style>{`
        @keyframes sosoFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        @keyframes sosoBlink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }

        @keyframes sosoSpeak {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }

        @keyframes sosoEarSway {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }

        @keyframes sosoThinkLook {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(2px, -2px); }
          75% { transform: translate(-2px, -2px); }
        }

        @keyframes sosoCelebrate {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-15px) rotate(-5deg); }
          75% { transform: translateY(-15px) rotate(5deg); }
        }

        @keyframes sosoGlow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }

        @keyframes sosoSparkle {
          0% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
          100% { opacity: 0; transform: scale(0) rotate(360deg); }
        }

        @keyframes sosoWave {
          0% { r: 45; opacity: 0.6; }
          100% { r: 55; opacity: 0; }
        }

        @keyframes sosoPulseRing {
          0%, 100% { r: 48; opacity: 0.4; }
          50% { r: 52; opacity: 0.7; }
        }

        @keyframes sosoThinkDot {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-5px); }
        }

        @keyframes sosoSpeechBubble {
          0% { opacity: 0; transform: translate(0, 0) scale(0); }
          20% { opacity: 1; transform: translate(-5px, -10px) scale(1); }
          80% { opacity: 1; transform: translate(-10px, -15px) scale(1); }
          100% { opacity: 0; transform: translate(-15px, -20px) scale(0); }
        }

        .soso-float { animation: sosoFloat 3s ease-in-out infinite; }
        .soso-celebrate { animation: sosoCelebrate 0.6s ease-in-out infinite; }
        .soso-ear-sway { animation: sosoEarSway 2s ease-in-out infinite; }
        .soso-blink { animation: sosoBlink 4s ease-in-out infinite; }
        .soso-speak { animation: sosoSpeak 0.4s ease-in-out infinite; }
        .soso-think-look { animation: sosoThinkLook 2s ease-in-out infinite; }
        .soso-glow { animation: sosoGlow 2s ease-in-out infinite; }
        .soso-wave { animation: sosoWave 1.5s ease-out infinite; }
        .soso-pulse-ring { animation: sosoPulseRing 1.5s ease-in-out infinite; }
        .soso-think-dot-1 { animation: sosoThinkDot 1.5s ease-in-out infinite; }
        .soso-think-dot-2 { animation: sosoThinkDot 1.5s ease-in-out infinite 0.2s; }
        .soso-think-dot-3 { animation: sosoThinkDot 1.5s ease-in-out infinite 0.4s; }
        .soso-sparkle { animation: sosoSparkle 1s ease-in-out infinite; }
        .soso-speech-bubble { animation: sosoSpeechBubble 2s ease-out infinite; }
      `}</style>

      <div
        className={`relative cursor-pointer transition-transform hover:scale-110 ${className}`}
        style={{ width: pixelSize, height: pixelSize }}
        onClick={onClick}
        role="button"
        aria-label="Soso the learning companion"
      >
        <svg
          viewBox="0 0 100 100"
          width={pixelSize}
          height={pixelSize}
          className={currentState === 'celebrating' ? 'soso-celebrate' : currentState === 'idle' ? 'soso-float' : ''}
        >
          {/* Background glow */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="url(#sosoGlow)"
            opacity="0.3"
            className={currentState === 'celebrating' ? 'soso-glow' : ''}
          />

          {/* Gradient definitions */}
          <defs>
            <radialGradient id="sosoGlow" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#FFE66D" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FFE66D" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="sosoBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF6B6B" />
              <stop offset="50%" stopColor="#A29BFE" />
              <stop offset="100%" stopColor="#6C5CE7" />
            </linearGradient>
            <radialGradient id="sosoEye" cx="40%" cy="40%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f0f0f0" />
            </radialGradient>
          </defs>

          {/* Sound wave rings for listening */}
          {isListening && (
            <>
              <circle cx="50" cy="50" r="45" fill="none" stroke="#FF6B6B" strokeWidth="2" className="soso-wave" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="#4ECDC4" strokeWidth="2" className="soso-wave" style={{ animationDelay: '0.5s' }} />
              <circle cx="50" cy="50" r="45" fill="none" stroke="#FFE66D" strokeWidth="2" className="soso-wave" style={{ animationDelay: '1s' }} />
            </>
          )}

          {/* Pulsing ring for listening */}
          {isListening && (
            <circle cx="50" cy="50" r="48" fill="none" stroke="#FF6B6B" strokeWidth="3" opacity="0.4" className="soso-pulse-ring" />
          )}

          {/* Main body circle */}
          <circle cx="50" cy="50" r="40" fill="url(#sosoBody)" />

          {/* Ear tufts */}
          <ellipse
            cx="30"
            cy="20"
            rx="6"
            ry="12"
            fill="#A29BFE"
            className={currentState === 'idle' || currentState === 'speaking' ? 'soso-ear-sway' : ''}
            style={{ transformOrigin: '30px 32px' }}
          />
          <ellipse
            cx="70"
            cy="20"
            rx="6"
            ry="12"
            fill="#A29BFE"
            className={currentState === 'idle' || currentState === 'speaking' ? 'soso-ear-sway' : ''}
            style={{ transformOrigin: '70px 32px', animationDelay: '0.5s' }}
          />

          {/* Eyes container */}
          <g className={currentState === 'thinking' ? 'soso-think-look' : ''} style={{ transformOrigin: '50px 45px' }}>
            {/* Left eye */}
            {currentState === 'celebrating' ? (
              /* Star eye for celebrating */
              <g>
                <path d="M 32 45 L 35 42 L 38 45 L 35 48 Z M 35 40 L 38 43 L 35 46 L 32 43 Z" fill="#FFE66D" />
                <circle cx="35" cy="45" r="3" fill="#FFE66D" />
              </g>
            ) : (
              <g>
                <ellipse
                  cx="35"
                  cy="45"
                  rx={currentState === 'listening' ? '10' : '8'}
                  ry={currentState === 'listening' ? '12' : '10'}
                  fill="url(#sosoEye)"
                  className={currentState === 'idle' ? 'soso-blink' : ''}
                  style={{ transformOrigin: '35px 45px' }}
                />
                <circle
                  cx={currentState === 'thinking' ? '37' : '35'}
                  cy={currentState === 'thinking' ? '43' : currentState === 'speaking' ? '46' : '45'}
                  r={currentState === 'speaking' ? '3' : '4'}
                  fill="#2C3E50"
                />
                <circle
                  cx={currentState === 'thinking' ? '38' : '36'}
                  cy={currentState === 'thinking' ? '42' : currentState === 'speaking' ? '45' : '44'}
                  r="2"
                  fill="#ffffff"
                  opacity="0.8"
                />
              </g>
            )}

            {/* Right eye */}
            {currentState === 'celebrating' ? (
              /* Star eye for celebrating */
              <g>
                <path d="M 62 45 L 65 42 L 68 45 L 65 48 Z M 65 40 L 68 43 L 65 46 L 62 43 Z" fill="#FFE66D" />
                <circle cx="65" cy="45" r="3" fill="#FFE66D" />
              </g>
            ) : (
              <g>
                <ellipse
                  cx="65"
                  cy="45"
                  rx={currentState === 'listening' ? '10' : '8'}
                  ry={currentState === 'listening' ? '12' : '10'}
                  fill="url(#sosoEye)"
                  className={currentState === 'idle' ? 'soso-blink' : ''}
                  style={{ transformOrigin: '65px 45px' }}
                />
                <circle
                  cx={currentState === 'thinking' ? '67' : '65'}
                  cy={currentState === 'thinking' ? '43' : currentState === 'speaking' ? '46' : '45'}
                  r={currentState === 'speaking' ? '3' : '4'}
                  fill="#2C3E50"
                />
                <circle
                  cx={currentState === 'thinking' ? '68' : '66'}
                  cy={currentState === 'thinking' ? '42' : currentState === 'speaking' ? '45' : '44'}
                  r="2"
                  fill="#ffffff"
                  opacity="0.8"
                />
              </g>
            )}
          </g>

          {/* Beak/Mouth */}
          <g>
            {currentState === 'speaking' ? (
              <ellipse
                cx="50"
                cy="60"
                rx="8"
                ry="6"
                fill="#FFE66D"
                className="soso-speak"
                style={{ transformOrigin: '50px 60px' }}
              />
            ) : (
              <path
                d="M 45 58 Q 50 62 55 58"
                fill="none"
                stroke="#FFE66D"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}
          </g>

          {/* Thinking dots */}
          {currentState === 'thinking' && (
            <g>
              <circle cx="65" cy="25" r="2.5" fill="#A29BFE" className="soso-think-dot-1" />
              <circle cx="72" cy="20" r="2.5" fill="#A29BFE" className="soso-think-dot-2" />
              <circle cx="78" cy="15" r="2.5" fill="#A29BFE" className="soso-think-dot-3" />
            </g>
          )}

          {/* Speech bubbles */}
          {currentState === 'speaking' && (
            <>
              <circle cx="75" cy="35" r="3" fill="#4ECDC4" opacity="0.7" className="soso-speech-bubble" />
              <circle cx="80" cy="30" r="2" fill="#4ECDC4" opacity="0.7" className="soso-speech-bubble" style={{ animationDelay: '0.5s' }} />
              <circle cx="72" cy="28" r="2.5" fill="#4ECDC4" opacity="0.7" className="soso-speech-bubble" style={{ animationDelay: '1s' }} />
            </>
          )}

          {/* Celebration sparkles */}
          {currentState === 'celebrating' && (
            <>
              <g className="soso-sparkle" style={{ transformOrigin: '25px 25px' }}>
                <path d="M 25 20 L 26 25 L 25 30 L 24 25 Z M 20 25 L 25 26 L 30 25 L 25 24 Z" fill="#FFE66D" />
              </g>
              <g className="soso-sparkle" style={{ transformOrigin: '75px 25px', animationDelay: '0.3s' }}>
                <path d="M 75 20 L 76 25 L 75 30 L 74 25 Z M 70 25 L 75 26 L 80 25 L 75 24 Z" fill="#FF6B6B" />
              </g>
              <g className="soso-sparkle" style={{ transformOrigin: '25px 75px', animationDelay: '0.6s' }}>
                <path d="M 25 70 L 26 75 L 25 80 L 24 75 Z M 20 75 L 25 76 L 30 75 L 25 74 Z" fill="#4ECDC4" />
              </g>
              <g className="soso-sparkle" style={{ transformOrigin: '75px 75px', animationDelay: '0.9s' }}>
                <path d="M 75 70 L 76 75 L 75 80 L 74 75 Z M 70 75 L 75 76 L 80 75 L 75 74 Z" fill="#A29BFE" />
              </g>
            </>
          )}

          {/* Rainbow glow ring for celebrating */}
          {currentState === 'celebrating' && (
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#rainbowGlow)"
              strokeWidth="3"
              className="soso-glow"
            />
          )}

          <defs>
            <linearGradient id="rainbowGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF6B6B" />
              <stop offset="33%" stopColor="#4ECDC4" />
              <stop offset="66%" stopColor="#FFE66D" />
              <stop offset="100%" stopColor="#A29BFE" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </>
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

      {/* Avatar - using mini SVG version */}
      <div className={`
        relative w-16 h-16 rounded-full
        flex items-center justify-center
        shadow-lg
      `}>
        <SosoAvatar
          size="medium"
          isListening={isActive}
          className={isActive ? 'ring-4 ring-white ring-opacity-50 rounded-full' : ''}
        />
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
