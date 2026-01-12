import React, { useState } from 'react';
import { OMNIA_SECRET_QUESTION, verifyOmniaSecret } from '../services/omniaSecretService';

interface OmniaSecretModalProps {
  onCorrect: () => void;
  onWrong: () => void;
}

const OmniaSecretModal: React.FC<OmniaSecretModalProps> = ({ onCorrect, onWrong }) => {
  const [answer, setAnswer] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (verifyOmniaSecret(answer)) {
      onCorrect();
    } else {
      // Subtle shake animation then proceed to normal app
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        onWrong();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-100/90 via-pink-50/90 to-amber-50/90 backdrop-blur-sm" />

      {/* Inject shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out 2;
        }
      `}</style>

      {/* Modal */}
      <div
        className={`relative z-10 bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-sm w-full text-center transition-all duration-300 ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Dog emoji */}
        <div className="text-6xl mb-4">🐕</div>

        {/* Question */}
        <h2 className="text-2xl font-serif text-rose-900 mb-6">
          {OMNIA_SECRET_QUESTION}
        </h2>

        {/* Answer form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Enter your answer..."
            className="w-full px-4 py-3 rounded-xl border-2 border-rose-200 focus:border-rose-400 focus:outline-none text-center text-lg transition-colors"
            autoFocus
            autoComplete="off"
          />
          <button
            type="submit"
            className="w-full px-6 py-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Submit 💕
          </button>
        </form>

        {/* Skip hint (subtle) */}
        <button
          onClick={onWrong}
          className="mt-4 text-sm text-stone-400 hover:text-stone-500 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
};

export default OmniaSecretModal;
