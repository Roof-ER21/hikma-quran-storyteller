import React, { useEffect, useState } from 'react';

interface OmniaLovePageProps {
  onContinue: () => void;
}

// Floating heart component
const FloatingHeart: React.FC<{ delay: number; left: number; size: number }> = ({ delay, left, size }) => (
  <div
    className="absolute text-rose-300 opacity-60 animate-float pointer-events-none"
    style={{
      left: `${left}%`,
      bottom: '-20px',
      animationDelay: `${delay}s`,
      fontSize: `${size}px`,
    }}
  >
    ❤️
  </div>
);

const OmniaLovePage: React.FC<OmniaLovePageProps> = ({ onContinue }) => {
  const [hearts] = useState(() =>
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      delay: Math.random() * 10,
      left: Math.random() * 100,
      size: 16 + Math.random() * 24,
    }))
  );

  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Inject animation styles */}
      <style>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.6;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-float {
          animation: float-up 12s ease-in infinite;
        }
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 30px rgba(244, 63, 94, 0.4);
          }
          50% {
            box-shadow: 0 0 60px rgba(244, 63, 94, 0.6);
          }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
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
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>

      {/* Beautiful gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-100 via-pink-50 to-amber-50" />

      {/* Islamic geometric pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="islamic-pattern" patternUnits="userSpaceOnUse" width="20" height="20">
              {/* Eight-pointed star pattern */}
              <path
                d="M10,0 L12,8 L20,10 L12,12 L10,20 L8,12 L0,10 L8,8 Z"
                fill="currentColor"
                className="text-rose-900"
              />
              <circle cx="10" cy="10" r="2" fill="currentColor" className="text-rose-900" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#islamic-pattern)" />
        </svg>
      </div>

      {/* Floating hearts */}
      {hearts.map((heart) => (
        <FloatingHeart key={heart.id} delay={heart.delay} left={heart.left} size={heart.size} />
      ))}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 md:p-8 overflow-y-auto">
        <div
          className={`max-w-lg w-full transition-all duration-1000 ${
            showContent ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Bismillah */}
          <p
            className="text-xl md:text-2xl font-arabic text-rose-800 text-center mb-6 animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            بسم الله الرحمن الرحيم
          </p>

          {/* Heart icon with glow */}
          <div
            className="flex justify-center mb-6 animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center animate-pulse-glow">
              <i className="fas fa-heart text-3xl md:text-4xl text-white" />
            </div>
          </div>

          {/* Main message */}
          <div
            className="text-center mb-6 animate-fade-in-up"
            style={{ animationDelay: '0.6s' }}
          >
            <h1 className="text-2xl md:text-4xl font-serif text-rose-900 mb-4">
              To our beloved Omnia
            </h1>
            <p className="text-lg md:text-xl text-rose-700 leading-relaxed">
              You are our light, our strength, our everything.
            </p>
          </div>

          {/* Appreciation message */}
          <div
            className="text-center mb-6 animate-fade-in-up bg-white/40 backdrop-blur-sm rounded-2xl p-4 md:p-6"
            style={{ animationDelay: '0.8s' }}
          >
            <p className="text-rose-800 leading-relaxed text-sm md:text-base">
              We appreciate you and all the work you do. You are the most wonderful, beautiful wife and mother.
              Our family is blessed because of you.
            </p>
          </div>

          {/* Quranic verse */}
          <blockquote
            className="text-center mb-6 px-4 md:px-6 py-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-rose-200 animate-fade-in-up"
            style={{ animationDelay: '1s' }}
          >
            <p className="text-rose-800 font-arabic text-base md:text-lg mb-3 leading-relaxed">
              وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً
            </p>
            <p className="text-stone-600 text-sm italic">
              "And of His signs is that He created for you from yourselves mates that you may find tranquility in them;
              and He placed between you affection and mercy."
            </p>
            <p className="text-rose-600 text-xs mt-2 font-medium">— Surah Ar-Rum 30:21</p>
          </blockquote>

          {/* Family signature */}
          <div
            className="text-center mb-8 animate-fade-in-up"
            style={{ animationDelay: '1.2s' }}
          >
            <p className="text-lg text-rose-800 mb-2">With all our love,</p>
            <p className="text-xl md:text-2xl font-serif text-rose-900 font-bold mb-2">
              Ahmed, Jasmine & Malik
            </p>
            <p className="text-xl md:text-2xl font-arabic text-rose-700">
              نحبك يا حبيبتنا ❤️
            </p>
          </div>

          {/* Continue button */}
          <div
            className="flex justify-center animate-fade-in-up"
            style={{ animationDelay: '1.4s' }}
          >
            <button
              onClick={onContinue}
              className="px-8 py-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Continue to App →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OmniaLovePage;
