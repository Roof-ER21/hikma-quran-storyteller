import React from 'react';

interface DedicationPageProps {
  onClose: () => void;
}

const DedicationPage: React.FC<DedicationPageProps> = ({ onClose }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-amber-50 to-rose-100 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Decorative top border */}
        <div className="flex justify-center mb-8">
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-rose-400 to-transparent rounded-full"></div>
        </div>

        {/* Main memorial card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center border border-rose-100">
          {/* Arabic bismillah */}
          <p className="text-2xl font-arabic text-rose-800 mb-6">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>

          {/* In Loving Memory header */}
          <p className="text-sm uppercase tracking-widest text-rose-600 mb-2">
            In Loving Memory
          </p>

          {/* Arabic names */}
          <h1 className="text-4xl font-arabic text-rose-900 mb-2">
            عالية و سعاد
          </h1>

          {/* English names */}
          <h2 className="text-2xl font-serif text-stone-700 mb-6">
            Alaya & Soad
          </h2>

          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-px bg-rose-300"></div>
            <i className="fas fa-star text-amber-500 text-xs"></i>
            <div className="w-12 h-px bg-rose-300"></div>
          </div>

          {/* Memorial message */}
          <p className="text-stone-600 leading-relaxed mb-6 font-serif italic">
            This app is dedicated to their beautiful souls. Though they have returned to Allah,
            their love for knowledge and the Quran lives on through these stories,
            as a gift to all who seek guidance and wisdom.
          </p>

          {/* Dua */}
          <p className="text-rose-700 font-arabic text-lg mb-2">
            اللَّهُمَّ اغْفِرْ لَهُمَا وَارْحَمْهُمَا
          </p>
          <p className="text-sm text-stone-500 italic mb-8">
            O Allah, forgive them and have mercy upon them
          </p>

          {/* Inna lillahi verse */}
          <div className="bg-rose-50 rounded-xl p-4 mb-8">
            <p className="text-rose-800 font-arabic text-xl mb-2">
              إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ
            </p>
            <p className="text-sm text-stone-600">
              Indeed, to Allah we belong and to Him we shall return
            </p>
            <p className="text-xs text-stone-400 mt-1">Surah Al-Baqarah 2:156</p>
          </div>

          {/* Continue button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-rose-600 to-amber-600 text-white rounded-xl font-medium hover:from-rose-700 hover:to-amber-700 transition-all shadow-lg"
          >
            Continue to Stories
          </button>
        </div>

        {/* Decorative bottom border */}
        <div className="flex justify-center mt-8">
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-rose-400 to-transparent rounded-full"></div>
        </div>

        {/* App name */}
        <p className="text-center text-rose-400 text-sm mt-6">
          Alaya & Soad's Gift: Stories from Jannah
        </p>
      </div>
    </div>
  );
};

export default DedicationPage;
