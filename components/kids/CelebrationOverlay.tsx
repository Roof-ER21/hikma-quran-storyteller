import React, { useState, useEffect, useCallback } from 'react';
import Lottie from 'lottie-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

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

// Inline Lottie confetti animation data
const confettiAnimationData = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 120,
  w: 500,
  h: 500,
  nm: "Confetti",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "confetti1",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: [{ t: 0, s: [0], e: [360] }, { t: 120 }] },
        p: { a: 1, k: [{ t: 0, s: [250, 0, 0], e: [100, 500, 0] }, { t: 120 }] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [
        {
          ty: "rc",
          d: 1,
          s: { a: 0, k: [20, 20] },
          p: { a: 0, k: [0, 0] },
          r: { a: 0, k: 0 },
          nm: "Rectangle"
        },
        {
          ty: "fl",
          c: { a: 0, k: [1, 0.42, 0.42, 1] },
          o: { a: 0, k: 100 },
          r: 1,
          nm: "Fill"
        }
      ],
      ip: 0,
      op: 120,
      st: 0
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "confetti2",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: [{ t: 0, s: [0], e: [-360] }, { t: 120 }] },
        p: { a: 1, k: [{ t: 0, s: [150, 0, 0], e: [400, 500, 0] }, { t: 120 }] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [
        {
          ty: "el",
          d: 1,
          s: { a: 0, k: [15, 15] },
          p: { a: 0, k: [0, 0] },
          nm: "Circle"
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.31, 0.8, 0.77, 1] },
          o: { a: 0, k: 100 },
          r: 1,
          nm: "Fill"
        }
      ],
      ip: 0,
      op: 120,
      st: 0
    },
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: "confetti3",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: [{ t: 0, s: [0], e: [360] }, { t: 120 }] },
        p: { a: 1, k: [{ t: 0, s: [350, 0, 0], e: [200, 500, 0] }, { t: 120 }] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [
        {
          ty: "rc",
          d: 1,
          s: { a: 0, k: [18, 18] },
          p: { a: 0, k: [0, 0] },
          r: { a: 0, k: 0 },
          nm: "Rectangle"
        },
        {
          ty: "fl",
          c: { a: 0, k: [1, 0.9, 0.43, 1] },
          o: { a: 0, k: 100 },
          r: 1,
          nm: "Fill"
        }
      ],
      ip: 0,
      op: 120,
      st: 0
    },
    {
      ddd: 0,
      ind: 4,
      ty: 4,
      nm: "confetti4",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: [{ t: 0, s: [0], e: [-360] }, { t: 120 }] },
        p: { a: 1, k: [{ t: 0, s: [50, 0, 0], e: [300, 500, 0] }, { t: 120 }] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [
        {
          ty: "el",
          d: 1,
          s: { a: 0, k: [12, 12] },
          p: { a: 0, k: [0, 0] },
          nm: "Circle"
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.49, 0.82, 0.13, 1] },
          o: { a: 0, k: 100 },
          r: 1,
          nm: "Fill"
        }
      ],
      ip: 0,
      op: 120,
      st: 0
    },
    {
      ddd: 0,
      ind: 5,
      ty: 4,
      nm: "confetti5",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: [{ t: 0, s: [0], e: [360] }, { t: 120 }] },
        p: { a: 1, k: [{ t: 0, s: [450, 0, 0], e: [150, 500, 0] }, { t: 120 }] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [
        {
          ty: "rc",
          d: 1,
          s: { a: 0, k: [16, 16] },
          p: { a: 0, k: [0, 0] },
          r: { a: 0, k: 0 },
          nm: "Rectangle"
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.64, 0.61, 1, 1] },
          o: { a: 0, k: 100 },
          r: 1,
          nm: "Fill"
        }
      ],
      ip: 0,
      op: 120,
      st: 0
    }
  ]
};

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

      // Trigger haptic feedback
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});

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
      {/* Lottie Confetti Animation */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        <Lottie
          animationData={confettiAnimationData}
          loop={true}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Central celebration message */}
      <div
        style={{
          textAlign: 'center',
          animation: 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          zIndex: 2,
          position: 'relative',
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
