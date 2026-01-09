import React, { useState, useEffect, useCallback } from 'react';

// Kids-friendly color palette (matching KidsHome.tsx)
const KIDS_COLORS = {
  coral: '#FF6B6B',
  teal: '#4ECDC4',
  yellow: '#FFE66D',
  green: '#7ED321',
  purple: '#A29BFE',
};

const CONFETTI_COLORS = [
  KIDS_COLORS.coral,
  KIDS_COLORS.teal,
  KIDS_COLORS.yellow,
  KIDS_COLORS.green,
  KIDS_COLORS.purple,
];

interface CelebrationOverlayProps {
  isVisible: boolean;
  onComplete: () => void;
  message?: string;
  type?: 'star' | 'badge' | 'complete';
  onSoundTrigger?: () => void; // Optional callback for sound effects
}

interface ConfettiParticle {
  id: number;
  color: string;
  left: number;
  size: number;
  rotation: number;
  animationDuration: number;
  animationDelay: number;
  shape: 'circle' | 'square' | 'star';
}

const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  isVisible,
  onComplete,
  message,
  type = 'complete',
  onSoundTrigger,
}) => {
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Get emoji and intensity based on celebration type
  const getEmojiAndIntensity = useCallback(() => {
    switch (type) {
      case 'star':
        return { emoji: '⭐', particles: 30, duration: 2000 };
      case 'badge':
        return { emoji: '🏆', particles: 40, duration: 2500 };
      case 'complete':
        return { emoji: '🎉', particles: 50, duration: 3000 };
      default:
        return { emoji: '🎉', particles: 40, duration: 2500 };
    }
  }, [type]);

  // Get default message based on type
  const getDefaultMessage = useCallback(() => {
    switch (type) {
      case 'star':
        return 'Star Earned!';
      case 'badge':
        return 'Badge Unlocked!';
      case 'complete':
        return 'Great Job!';
      default:
        return 'Awesome!';
    }
  }, [type]);

  // Generate confetti particles
  const generateConfetti = useCallback(() => {
    const { particles } = getEmojiAndIntensity();
    const newConfetti: ConfettiParticle[] = [];

    for (let i = 0; i < particles; i++) {
      newConfetti.push({
        id: i,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        left: Math.random() * 100, // 0-100%
        size: Math.random() * 15 + 10, // 10-25px
        rotation: Math.random() * 360, // 0-360deg
        animationDuration: Math.random() * 1 + 2, // 2-3s
        animationDelay: Math.random() * 0.5, // 0-0.5s
        shape: ['circle', 'square', 'star'][Math.floor(Math.random() * 3)] as 'circle' | 'square' | 'star',
      });
    }

    setConfetti(newConfetti);
  }, [getEmojiAndIntensity]);

  // Handle visibility and animation lifecycle
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      generateConfetti();

      // Trigger sound effect callback
      if (onSoundTrigger) {
        onSoundTrigger();
      }

      const { duration } = getEmojiAndIntensity();
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => {
          onComplete();
        }, 300); // Allow fade out animation
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setConfetti([]);
      setIsAnimating(false);
    }
  }, [isVisible, generateConfetti, onComplete, onSoundTrigger, getEmojiAndIntensity]);

  if (!isVisible) return null;

  const { emoji } = getEmojiAndIntensity();
  const displayMessage = message || getDefaultMessage();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: isAnimating ? 'fadeIn 0.3s ease-out' : 'fadeOut 0.3s ease-out',
      }}
    >
      {/* Confetti particles */}
      {confetti.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            top: '-20px',
            left: `${particle.left}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.shape === 'star' ? 'transparent' : particle.color,
            opacity: 0.9,
            borderRadius: particle.shape === 'circle' ? '50%' : '0',
            transform: `rotate(${particle.rotation}deg)`,
            animation: `confettiFall ${particle.animationDuration}s linear ${particle.animationDelay}s forwards`,
            pointerEvents: 'none',
          }}
        >
          {particle.shape === 'star' && (
            <div
              style={{
                fontSize: `${particle.size}px`,
                color: particle.color,
                lineHeight: 1,
              }}
            >
              ✨
            </div>
          )}
        </div>
      ))}

      {/* Central celebration message */}
      <div
        style={{
          textAlign: 'center',
          animation: 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        }}
      >
        {/* Large emoji */}
        <div
          style={{
            fontSize: '120px',
            marginBottom: '20px',
            animation: 'spin 0.8s ease-out, pulse 0.6s ease-out',
          }}
        >
          {emoji}
        </div>

        {/* Message text */}
        <div
          style={{
            backgroundColor: 'white',
            padding: '30px 50px',
            borderRadius: '30px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '48px',
              fontWeight: 'bold',
              background: `linear-gradient(135deg, ${KIDS_COLORS.coral} 0%, ${KIDS_COLORS.purple} 50%, ${KIDS_COLORS.teal} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: 'none',
            }}
          >
            {displayMessage}
          </h2>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0.3;
          }
        }

        @keyframes bounceIn {
          0% {
            transform: scale(0) translateY(-50px);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) translateY(10px);
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg) scale(0);
          }
          50% {
            transform: rotate(180deg) scale(1.2);
          }
          100% {
            transform: rotate(360deg) scale(1);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
};

export default CelebrationOverlay;
