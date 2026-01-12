import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface DedicationPageProps {
  onClose: () => void;
}

// Floating Light Particle Component
const FloatingLight: React.FC<{ delay: number; left: number; duration: number; size: number }> = ({
  delay, left, duration, size
}) => (
  <div
    className="absolute pointer-events-none animate-float-up"
    style={{
      left: `${left}%`,
      bottom: '-20px',
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    }}
  >
    <div
      className="rounded-full bg-gradient-to-t from-amber-200 to-white animate-twinkle"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        boxShadow: `0 0 ${size * 2}px rgba(255, 215, 0, 0.6), 0 0 ${size * 4}px rgba(255, 255, 255, 0.3)`,
      }}
    />
  </div>
);

// Gentle Star Component
const Star: React.FC<{ top: number; left: number; delay: number; size: number }> = ({
  top, left, delay, size
}) => (
  <div
    className="absolute pointer-events-none animate-gentle-pulse"
    style={{
      top: `${top}%`,
      left: `${left}%`,
      animationDelay: `${delay}s`,
    }}
  >
    <svg viewBox="0 0 24 24" style={{ width: `${size}px`, height: `${size}px` }}>
      <path
        d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z"
        fill="rgba(255, 215, 0, 0.4)"
        stroke="rgba(255, 215, 0, 0.6)"
        strokeWidth="0.5"
      />
    </svg>
  </div>
);

// Islamic Geometric Pattern
const IslamicPattern: React.FC = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.03]" preserveAspectRatio="xMidYMid slice">
    <defs>
      <pattern id="memorial-pattern" patternUnits="userSpaceOnUse" width="80" height="80">
        {/* Eight-pointed star */}
        <path
          d="M40,8 L44,36 L72,40 L44,44 L40,72 L36,44 L8,40 L36,36 Z"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="0.5"
        />
        {/* Inner details */}
        <circle cx="40" cy="40" r="8" fill="none" stroke="#D4AF37" strokeWidth="0.3" />
        <circle cx="40" cy="40" r="4" fill="none" stroke="#D4AF37" strokeWidth="0.3" />
        {/* Corner ornaments */}
        <circle cx="0" cy="0" r="4" fill="none" stroke="#D4AF37" strokeWidth="0.3" />
        <circle cx="80" cy="0" r="4" fill="none" stroke="#D4AF37" strokeWidth="0.3" />
        <circle cx="0" cy="80" r="4" fill="none" stroke="#D4AF37" strokeWidth="0.3" />
        <circle cx="80" cy="80" r="4" fill="none" stroke="#D4AF37" strokeWidth="0.3" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#memorial-pattern)" />
  </svg>
);

// Decorative Corner Ornament
const CornerOrnament: React.FC<{ position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }> = ({ position }) => {
  const transforms = {
    'top-left': '',
    'top-right': 'scale-x-[-1]',
    'bottom-left': 'scale-y-[-1]',
    'bottom-right': 'scale-[-1]',
  };

  const positions = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-right': 'bottom-0 right-0',
  };

  return (
    <div className={`absolute ${positions[position]} w-20 h-20 md:w-28 md:h-28 pointer-events-none opacity-60 ${transforms[position]}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path
          d="M0,0 Q50,10 50,50 Q10,50 0,0"
          fill="none"
          stroke="url(#cornerGradient)"
          strokeWidth="1"
        />
        <path
          d="M0,0 Q40,5 40,40 Q5,40 0,0"
          fill="none"
          stroke="url(#cornerGradient)"
          strokeWidth="0.5"
        />
        <circle cx="25" cy="25" r="3" fill="rgba(212, 175, 55, 0.5)" />
        <defs>
          <linearGradient id="cornerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

const DedicationPage: React.FC<DedicationPageProps> = ({ onClose }) => {
  const { t, i18n } = useTranslation('dedication');
  const isArabic = i18n.language === 'ar-EG';
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);

  // Generate floating lights
  const [lights] = useState(() =>
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      delay: Math.random() * 20,
      left: Math.random() * 100,
      duration: 12 + Math.random() * 8,
      size: 4 + Math.random() * 6,
    }))
  );

  // Generate stars
  const [stars] = useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      size: 10 + Math.random() * 15,
    }))
  );

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Audio control
  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto overflow-x-hidden">
      {/* Animation styles */}
      <style>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-100vh) translateX(20px);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: float-up linear infinite;
        }
        @keyframes twinkle {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
        @keyframes gentle-pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }
        .animate-gentle-pulse {
          animation: gentle-pulse 4s ease-in-out infinite;
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        @keyframes soft-glow {
          0%, 100% {
            box-shadow: 0 0 30px rgba(212, 175, 55, 0.2), 0 0 60px rgba(255, 255, 255, 0.1);
          }
          50% {
            box-shadow: 0 0 50px rgba(212, 175, 55, 0.3), 0 0 100px rgba(255, 255, 255, 0.15);
          }
        }
        .animate-soft-glow {
          animation: soft-glow 4s ease-in-out infinite;
        }
        @keyframes candle-flicker {
          0%, 100% {
            opacity: 0.8;
            transform: scaleY(1);
          }
          25% {
            opacity: 1;
            transform: scaleY(1.05);
          }
          75% {
            opacity: 0.9;
            transform: scaleY(0.98);
          }
        }
        .animate-candle {
          animation: candle-flicker 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* Hidden audio element - Surah Al-Fatiha */}
      <audio
        ref={audioRef}
        src="https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3"
        loop
        onCanPlayThrough={() => setAudioLoaded(true)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Deep blue to purple gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-950 to-indigo-950" />

      {/* Radial light from center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.15)_0%,_transparent_60%)]" />

      {/* Top light source */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.1)_0%,_transparent_50%)]" />

      {/* Islamic pattern overlay */}
      <IslamicPattern />

      {/* Corner ornaments */}
      <CornerOrnament position="top-left" />
      <CornerOrnament position="top-right" />
      <CornerOrnament position="bottom-left" />
      <CornerOrnament position="bottom-right" />

      {/* Floating lights */}
      {lights.map((light) => (
        <FloatingLight
          key={light.id}
          delay={light.delay}
          left={light.left}
          duration={light.duration}
          size={light.size}
        />
      ))}

      {/* Stars */}
      {stars.map((star) => (
        <Star
          key={star.id}
          top={star.top}
          left={star.left}
          delay={star.delay}
          size={star.size}
        />
      ))}

      {/* Audio control button */}
      <button
        onClick={toggleAudio}
        className="fixed top-4 right-4 z-50 p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 hover:bg-white/20 transition-all"
        aria-label={isPlaying ? 'Pause recitation' : 'Play recitation'}
      >
        {isPlaying ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center min-h-full p-4 md:p-8 py-12 md:py-16 pb-20 md:pb-24">
        <div
          className={`max-w-lg w-full transition-all duration-1000 ${
            showContent ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Bismillah */}
          <p
            className="text-xl md:text-2xl font-arabic text-amber-200/90 text-center mb-6 md:mb-8 animate-fade-in-up tracking-wide"
            style={{ animationDelay: '0.2s', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>

          {/* Decorative light beam */}
          <div
            className="flex justify-center mb-6 md:mb-8 animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="relative">
              <div className="w-40 md:w-56 h-1 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent rounded-full" />
              <div className="absolute inset-0 blur-sm bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
            </div>
          </div>

          {/* Memorial Card */}
          <div
            className="bg-white/5 backdrop-blur-md rounded-3xl p-6 md:p-10 text-center border border-white/10 animate-soft-glow animate-fade-in-up mb-6 md:mb-8"
            style={{ animationDelay: '0.6s' }}
          >
            {/* In Loving Memory */}
            <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-amber-300/80 mb-4">
              {t('inLovingMemory')}
            </p>

            {/* Candle-like glow icon */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-t from-amber-500/30 to-white/20 animate-candle" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-200" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2 15H10v-1h4v1zm1.42-3.06l-.42.31V15h-6v-.75l-.42-.31A4.991 4.991 0 017 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.77-.93 3.41-2.58 4.31z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Arabic names */}
            <h1
              className="text-4xl md:text-5xl font-arabic text-white mb-3 tracking-wide"
              style={{ textShadow: '0 2px 20px rgba(212, 175, 55, 0.3)' }}
            >
              {t('names.arabic')}
            </h1>

            {/* English names */}
            <h2 className="text-xl md:text-2xl font-serif text-amber-100/90 mb-2 tracking-wide">
              {t('names.english')}
            </h2>

            {/* Subtitle */}
            <p className="text-sm md:text-base text-amber-300/70 mb-6 tracking-wide">
              {t('subtitle')}
            </p>

            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-amber-400/50" />
              <svg className="w-4 h-4 text-amber-400/60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z" />
              </svg>
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-amber-400/50" />
            </div>

            {/* Memorial message */}
            <p className={`text-blue-100/80 leading-relaxed text-base md:text-lg mb-4 ${isArabic ? 'font-arabic text-right' : 'font-serif'}`}>
              {t('message')}
            </p>

            {/* Their qualities */}
            <p className={`text-blue-100/70 leading-relaxed text-sm md:text-base mb-6 ${isArabic ? 'font-arabic text-right' : 'font-serif'}`}>
              {t('qualities')}
            </p>

            {/* Dua */}
            <div className="mb-6">
              <p
                className="text-amber-200 font-arabic text-lg md:text-xl mb-2"
                style={{ textShadow: '0 1px 10px rgba(0,0,0,0.3)' }}
              >
                {t('dua.arabic')}
              </p>
              <p className={`text-sm text-blue-200/70 ${isArabic ? 'font-arabic' : 'italic'}`}>
                {t('dua.translation')}
              </p>
            </div>
          </div>

          {/* Inna lillahi verse - separate card */}
          <div
            className="bg-gradient-to-br from-amber-900/20 to-blue-900/20 backdrop-blur-sm rounded-2xl p-5 md:p-6 text-center border border-amber-500/20 mb-8 animate-fade-in-up"
            style={{ animationDelay: '0.9s' }}
          >
            <p
              className="text-amber-100 font-arabic text-xl md:text-2xl mb-3 leading-relaxed"
              style={{ textShadow: '0 1px 10px rgba(0,0,0,0.3)' }}
            >
              {t('verse.arabic')}
            </p>
            <p className={`text-sm md:text-base text-blue-100/70 mb-2 ${isArabic ? 'font-arabic' : 'italic'}`}>
              {t('verse.translation')}
            </p>
            <p className="text-xs text-amber-400/60 tracking-wide">
              {t('verse.reference')}
            </p>
          </div>

          {/* Continue button */}
          <div
            className="flex justify-center animate-fade-in-up"
            style={{ animationDelay: '1.2s' }}
          >
            <button
              onClick={onClose}
              className="px-10 py-4 bg-gradient-to-r from-amber-600/80 via-amber-500/80 to-amber-600/80 hover:from-amber-500 hover:via-amber-400 hover:to-amber-500 text-white rounded-full font-medium text-lg shadow-2xl hover:shadow-amber-500/30 transition-all duration-500 hover:scale-105 border border-amber-400/30 backdrop-blur-sm"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
            >
              {t('continueButton')}
            </button>
          </div>

          {/* App name */}
          <p
            className="text-center text-amber-300/50 text-sm mt-8 tracking-wide animate-fade-in-up font-serif"
            style={{ animationDelay: '1.4s' }}
          >
            {t('appName')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DedicationPage;
