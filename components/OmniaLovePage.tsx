import React, { useEffect, useState } from 'react';

interface OmniaLovePageProps {
  onContinue: () => void;
}

// SVG Rose Component - Elegant red/purple rose
const Rose: React.FC<{ className?: string; color?: 'red' | 'purple' }> = ({ className = '', color = 'red' }) => {
  const petalColor = color === 'red' ? '#DC143C' : '#8B008B';
  const petalDark = color === 'red' ? '#8B0000' : '#4B0082';
  const centerColor = color === 'red' ? '#FFD700' : '#DDA0DD';

  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Outer petals */}
      <ellipse cx="50" cy="35" rx="25" ry="20" fill={petalColor} opacity="0.9" transform="rotate(-30 50 50)" />
      <ellipse cx="50" cy="35" rx="25" ry="20" fill={petalColor} opacity="0.9" transform="rotate(30 50 50)" />
      <ellipse cx="50" cy="35" rx="25" ry="20" fill={petalColor} opacity="0.9" transform="rotate(90 50 50)" />
      <ellipse cx="50" cy="35" rx="25" ry="20" fill={petalColor} opacity="0.9" transform="rotate(-90 50 50)" />
      <ellipse cx="50" cy="35" rx="25" ry="20" fill={petalColor} opacity="0.9" transform="rotate(150 50 50)" />
      <ellipse cx="50" cy="35" rx="25" ry="20" fill={petalColor} opacity="0.9" transform="rotate(-150 50 50)" />
      {/* Inner petals */}
      <ellipse cx="50" cy="42" rx="18" ry="14" fill={petalDark} opacity="0.95" transform="rotate(15 50 50)" />
      <ellipse cx="50" cy="42" rx="18" ry="14" fill={petalDark} opacity="0.95" transform="rotate(-45 50 50)" />
      <ellipse cx="50" cy="42" rx="18" ry="14" fill={petalDark} opacity="0.95" transform="rotate(75 50 50)" />
      <ellipse cx="50" cy="42" rx="18" ry="14" fill={petalDark} opacity="0.95" transform="rotate(-105 50 50)" />
      {/* Center spiral */}
      <circle cx="50" cy="50" r="10" fill={petalDark} />
      <circle cx="50" cy="50" r="6" fill={centerColor} opacity="0.8" />
      <circle cx="48" cy="48" r="2" fill="#FFF" opacity="0.5" />
    </svg>
  );
};

// Rose Corner Decoration
const RoseCorner: React.FC<{ position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }> = ({ position }) => {
  const positionClasses = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0 scale-x-[-1]',
    'bottom-left': 'bottom-0 left-0 scale-y-[-1]',
    'bottom-right': 'bottom-0 right-0 scale-[-1]',
  };

  return (
    <div className={`absolute ${positionClasses[position]} w-32 h-32 md:w-48 md:h-48 pointer-events-none opacity-80`}>
      <Rose className="absolute w-16 h-16 md:w-20 md:h-20 top-2 left-2" color="red" />
      <Rose className="absolute w-12 h-12 md:w-16 md:h-16 top-12 left-10 md:top-16 md:left-14" color="purple" />
      <Rose className="absolute w-10 h-10 md:w-14 md:h-14 top-4 left-16 md:top-6 md:left-24" color="red" />
      {/* Leaves */}
      <svg className="absolute w-full h-full" viewBox="0 0 100 100">
        <path d="M20,60 Q30,40 50,50 Q30,55 20,60" fill="#228B22" opacity="0.7" />
        <path d="M60,20 Q70,30 65,50 Q55,35 60,20" fill="#228B22" opacity="0.7" />
        <path d="M75,45 Q85,55 80,70 Q70,60 75,45" fill="#2E8B57" opacity="0.6" />
      </svg>
    </div>
  );
};

// Heart with Roses SVG
const HeartWithRoses: React.FC = () => (
  <div className="relative w-40 h-40 md:w-56 md:h-56">
    {/* Glowing background */}
    <div className="absolute inset-0 animate-pulse-glow rounded-full" />

    {/* Main heart */}
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
      <defs>
        <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DC143C" />
          <stop offset="50%" stopColor="#8B0000" />
          <stop offset="100%" stopColor="#4B0082" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M50,88 C20,65 5,45 5,30 C5,15 17,5 30,5 C40,5 48,12 50,20 C52,12 60,5 70,5 C83,5 95,15 95,30 C95,45 80,65 50,88 Z"
        fill="url(#heartGradient)"
        filter="url(#glow)"
      />
      {/* Inner highlight */}
      <path
        d="M50,78 C25,60 15,45 15,32 C15,22 23,14 32,14 C40,14 46,19 50,26"
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="2"
      />
    </svg>

    {/* Small roses on heart */}
    <Rose className="absolute w-10 h-10 md:w-12 md:h-12 top-0 left-1/2 -translate-x-1/2 -translate-y-2" color="red" />
    <Rose className="absolute w-8 h-8 md:w-10 md:h-10 bottom-4 left-2 md:left-4" color="purple" />
    <Rose className="absolute w-8 h-8 md:w-10 md:h-10 bottom-4 right-2 md:right-4" color="red" />
  </div>
);

// Falling Petal Component
const FallingPetal: React.FC<{ delay: number; left: number; duration: number; size: number }> = ({
  delay, left, duration, size
}) => (
  <div
    className="absolute pointer-events-none animate-fall"
    style={{
      left: `${left}%`,
      top: '-50px',
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    }}
  >
    <svg
      viewBox="0 0 30 40"
      style={{ width: `${size}px`, height: `${size * 1.3}px` }}
      className="animate-sway"
    >
      <defs>
        <linearGradient id={`petalGrad-${delay}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DC143C" />
          <stop offset="100%" stopColor="#8B0000" />
        </linearGradient>
      </defs>
      <path
        d="M15,0 Q25,10 25,25 Q20,38 15,40 Q10,38 5,25 Q5,10 15,0"
        fill={`url(#petalGrad-${delay})`}
        opacity="0.8"
      />
      <path
        d="M15,5 Q18,15 17,30"
        fill="none"
        stroke="rgba(139,0,0,0.5)"
        strokeWidth="0.5"
      />
    </svg>
  </div>
);

// Islamic Arabesque Pattern
const IslamicPattern: React.FC = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.04]" preserveAspectRatio="xMidYMid slice">
    <defs>
      <pattern id="arabesque" patternUnits="userSpaceOnUse" width="60" height="60">
        {/* Eight-pointed star */}
        <path
          d="M30,5 L35,25 L55,30 L35,35 L30,55 L25,35 L5,30 L25,25 Z"
          fill="none"
          stroke="#8B0000"
          strokeWidth="1"
        />
        {/* Inner star */}
        <path
          d="M30,15 L33,27 L45,30 L33,33 L30,45 L27,33 L15,30 L27,27 Z"
          fill="none"
          stroke="#4B0082"
          strokeWidth="0.5"
        />
        {/* Center ornament */}
        <circle cx="30" cy="30" r="4" fill="none" stroke="#DAA520" strokeWidth="0.5" />
        <circle cx="30" cy="30" r="2" fill="#DAA520" opacity="0.5" />
        {/* Corner flourishes */}
        <circle cx="0" cy="0" r="3" fill="#8B0000" opacity="0.3" />
        <circle cx="60" cy="0" r="3" fill="#8B0000" opacity="0.3" />
        <circle cx="0" cy="60" r="3" fill="#8B0000" opacity="0.3" />
        <circle cx="60" cy="60" r="3" fill="#8B0000" opacity="0.3" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#arabesque)" />
  </svg>
);

const OmniaLovePage: React.FC<OmniaLovePageProps> = ({ onContinue }) => {
  // Generate falling petals
  const [petals] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      delay: Math.random() * 15,
      left: Math.random() * 100,
      duration: 8 + Math.random() * 6,
      size: 15 + Math.random() * 15,
    }))
  );

  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto overflow-x-hidden">
      {/* Inject animation styles */}
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-50px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
        @keyframes sway {
          0%, 100% {
            transform: translateX(0) rotate(-15deg);
          }
          50% {
            transform: translateX(20px) rotate(15deg);
          }
        }
        .animate-sway {
          animation: sway 3s ease-in-out infinite;
        }
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 40px rgba(220, 20, 60, 0.4), 0 0 80px rgba(139, 0, 139, 0.2);
          }
          50% {
            box-shadow: 0 0 60px rgba(220, 20, 60, 0.6), 0 0 120px rgba(139, 0, 139, 0.4);
          }
        }
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
          opacity: 0;
        }
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      {/* Rich gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-purple-950 to-red-900" />

      {/* Radial glow overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(220,20,60,0.3)_0%,_transparent_70%)]" />

      {/* Islamic pattern overlay */}
      <IslamicPattern />

      {/* Shimmer effect */}
      <div className="absolute inset-0 animate-shimmer pointer-events-none" />

      {/* Rose corner decorations */}
      <RoseCorner position="top-left" />
      <RoseCorner position="top-right" />
      <RoseCorner position="bottom-left" />
      <RoseCorner position="bottom-right" />

      {/* Falling petals */}
      {petals.map((petal) => (
        <FallingPetal
          key={petal.id}
          delay={petal.delay}
          left={petal.left}
          duration={petal.duration}
          size={petal.size}
        />
      ))}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center min-h-full p-4 md:p-8 py-12 md:py-16 pb-20 md:pb-24">
        <div
          className={`max-w-xl w-full transition-all duration-1000 ${
            showContent ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Bismillah */}
          <p
            className="text-2xl md:text-3xl font-arabic text-amber-200 text-center mb-8 animate-fade-in-up tracking-wide"
            style={{ animationDelay: '0.2s', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
          >
            بسم الله الرحمن الرحيم
          </p>

          {/* Heart with roses */}
          <div
            className="flex justify-center mb-8 animate-fade-in-up"
            style={{ animationDelay: '0.5s' }}
          >
            <HeartWithRoses />
          </div>

          {/* Main message */}
          <div
            className="text-center mb-8 animate-fade-in-up"
            style={{ animationDelay: '0.8s' }}
          >
            <h1
              className="text-3xl md:text-5xl font-serif text-white mb-4 tracking-wide"
              style={{ textShadow: '0 2px 20px rgba(220,20,60,0.5)' }}
            >
              To our beloved Omnia
            </h1>
            <p
              className="text-xl md:text-2xl text-red-200 leading-relaxed"
              style={{ textShadow: '0 1px 10px rgba(0,0,0,0.3)' }}
            >
              You are our light, our strength, our everything.
            </p>
          </div>

          {/* Appreciation message */}
          <div
            className="text-center mb-8 animate-fade-in-up bg-black/20 backdrop-blur-sm rounded-2xl p-5 md:p-8 border border-red-800/30"
            style={{ animationDelay: '1.1s' }}
          >
            <p className="text-red-100 leading-relaxed text-base md:text-lg">
              We appreciate you and all the work you do. You are the most wonderful, beautiful wife and mother.
              Our family is blessed because of you.
            </p>
          </div>

          {/* Quranic verse */}
          <blockquote
            className="text-center mb-8 px-4 md:px-8 py-6 bg-gradient-to-br from-amber-900/30 to-purple-900/30 backdrop-blur-sm rounded-2xl border border-amber-600/30 animate-fade-in-up"
            style={{ animationDelay: '1.4s' }}
          >
            <p
              className="text-amber-100 font-arabic text-lg md:text-xl mb-4 leading-loose"
              style={{ textShadow: '0 1px 5px rgba(0,0,0,0.3)' }}
            >
              وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً
            </p>
            <p className="text-red-200/90 text-sm md:text-base italic leading-relaxed">
              "And of His signs is that He created for you from yourselves mates that you may find tranquility in them;
              and He placed between you affection and mercy."
            </p>
            <p className="text-amber-400 text-xs md:text-sm mt-3 font-medium tracking-wide">
              — Surah Ar-Rum 30:21
            </p>
          </blockquote>

          {/* Family signature */}
          <div
            className="text-center mb-10 animate-fade-in-up"
            style={{ animationDelay: '1.7s' }}
          >
            <p className="text-lg md:text-xl text-red-200 mb-3">With all our love,</p>
            <p
              className="text-2xl md:text-3xl font-serif text-white font-bold mb-3 tracking-wide"
              style={{ textShadow: '0 2px 15px rgba(220,20,60,0.4)' }}
            >
              Ahmed, Jasmine & Malik
            </p>
            <p
              className="text-2xl md:text-3xl font-arabic text-amber-200"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}
            >
              نحبك يا حبيبتنا
            </p>
          </div>

          {/* Continue button */}
          <div
            className="flex justify-center animate-fade-in-up"
            style={{ animationDelay: '2s' }}
          >
            <button
              onClick={onContinue}
              className="px-10 py-4 bg-gradient-to-r from-red-700 via-red-600 to-purple-700 hover:from-red-600 hover:via-red-500 hover:to-purple-600 text-white rounded-full font-medium text-lg shadow-2xl hover:shadow-red-500/30 transition-all duration-500 hover:scale-105 border border-red-500/30"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
            >
              Continue to App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OmniaLovePage;
