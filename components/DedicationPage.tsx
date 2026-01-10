import React from 'react';
import { useTranslation } from 'react-i18next';

interface DedicationPageProps {
  onClose: () => void;
}

const DedicationPage: React.FC<DedicationPageProps> = ({ onClose }) => {
  const { t, i18n } = useTranslation('dedication');
  const isArabic = i18n.language === 'ar-EG';

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-amber-50 to-rose-100 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-lg w-full my-auto py-4">
        {/* Decorative top border */}
        <div className="flex justify-center mb-4 sm:mb-8">
          <div className="w-24 sm:w-32 h-1 bg-gradient-to-r from-transparent via-rose-400 to-transparent rounded-full"></div>
        </div>

        {/* Main memorial card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-5 sm:p-8 text-center border border-rose-100">
          {/* Arabic bismillah */}
          <p className="text-xl sm:text-2xl font-arabic text-rose-800 mb-4 sm:mb-6">
            {t('bismillah')}
          </p>

          {/* In Loving Memory header */}
          <p className="text-xs sm:text-sm uppercase tracking-widest text-rose-600 mb-2">
            {t('inLovingMemory')}
          </p>

          {/* Arabic names */}
          <h1 className="text-3xl sm:text-4xl font-arabic text-rose-900 mb-2">
            {t('names.arabic')}
          </h1>

          {/* English names */}
          <h2 className="text-xl sm:text-2xl font-serif text-stone-700 mb-4 sm:mb-6">
            {t('names.english')}
          </h2>

          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
            <div className="w-12 h-px bg-rose-300"></div>
            <i className="fas fa-star text-amber-500 text-xs"></i>
            <div className="w-12 h-px bg-rose-300"></div>
          </div>

          {/* Memorial message */}
          <p className={`text-sm sm:text-base text-stone-600 leading-relaxed mb-4 sm:mb-6 ${isArabic ? 'font-arabic text-right' : 'font-serif italic'}`}>
            {t('message')}
          </p>

          {/* Dua */}
          <p className="text-rose-700 font-arabic text-base sm:text-lg mb-2">
            {t('dua.arabic')}
          </p>
          <p className={`text-xs sm:text-sm text-stone-500 mb-6 sm:mb-8 ${isArabic ? 'font-arabic' : 'italic'}`}>
            {t('dua.translation')}
          </p>

          {/* Inna lillahi verse */}
          <div className="bg-rose-50 rounded-xl p-3 sm:p-4 mb-6 sm:mb-8">
            <p className="text-rose-800 font-arabic text-lg sm:text-xl mb-2">
              {t('verse.arabic')}
            </p>
            <p className={`text-xs sm:text-sm text-stone-600 ${isArabic ? 'font-arabic' : ''}`}>
              {t('verse.translation')}
            </p>
            <p className="text-xs text-stone-400 mt-1">{t('verse.reference')}</p>
          </div>

          {/* Continue button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-rose-600 to-amber-600 text-white rounded-xl font-medium hover:from-rose-700 hover:to-amber-700 transition-all shadow-lg"
          >
            {t('continueButton')}
          </button>
        </div>

        {/* Decorative bottom border */}
        <div className="flex justify-center mt-4 sm:mt-8">
          <div className="w-24 sm:w-32 h-1 bg-gradient-to-r from-transparent via-rose-400 to-transparent rounded-full"></div>
        </div>

        {/* App name */}
        <p className={`text-center text-rose-400 text-xs sm:text-sm mt-4 sm:mt-6 ${isArabic ? 'font-arabic' : ''}`}>
          {t('appName')}
        </p>
      </div>
    </div>
  );
};

export default DedicationPage;
