import React from 'react';
import { useTranslation } from 'react-i18next';
import { markLanguageSelected, setLanguage } from './index';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({ isOpen, onComplete }) => {
  const { i18n } = useTranslation();

  if (!isOpen) return null;

  const handleLanguageSelect = (lang: 'en' | 'ar-EG') => {
    setLanguage(lang);
    markLanguageSelected();
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-rose-900 via-amber-900 to-stone-900 flex items-center justify-center z-50 p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Bismillah */}
        <p className="text-2xl font-arabic text-amber-300">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>

        {/* App Logo/Title */}
        <div className="space-y-2">
          <div className="w-20 h-20 bg-rose-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <i className="fas fa-heart text-white text-3xl"></i>
          </div>
          <h1 className="text-3xl font-serif text-white">
            Alaya & Soad's Gift
          </h1>
          <h2 className="text-2xl font-arabic text-amber-200">
            هدية عليا و سعاد
          </h2>
          <p className="text-white/60 text-sm">
            Stories from Jannah | قصص من الجنة
          </p>
        </div>

        {/* Language Selection */}
        <div className="space-y-4 pt-4">
          <p className="text-white/80 text-sm">
            Choose your language / اختر لغتك
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* English Option */}
            <button
              onClick={() => handleLanguageSelect('en')}
              className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border-2 border-white/20 hover:border-amber-400 hover:bg-white/20 transition-all group"
            >
              <div className="text-4xl mb-3">🇺🇸</div>
              <p className="text-white font-semibold text-lg">English</p>
              <p className="text-white/60 text-sm mt-1">Stories in English</p>
            </button>

            {/* Egyptian Arabic Option */}
            <button
              onClick={() => handleLanguageSelect('ar-EG')}
              className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border-2 border-white/20 hover:border-amber-400 hover:bg-white/20 transition-all group"
            >
              <div className="text-4xl mb-3">🇪🇬</div>
              <p className="text-white font-semibold text-lg font-arabic">العربية المصرية</p>
              <p className="text-white/60 text-sm mt-1 font-arabic">قصص بالمصري</p>
            </button>
          </div>
        </div>

        {/* Note */}
        <p className="text-white/50 text-xs">
          You can change this later in settings
          <br />
          <span className="font-arabic">تقدر تغيرها بعدين من الإعدادات</span>
        </p>

        {/* Decorative element */}
        <div className="flex justify-center pt-4">
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelectorModal;
