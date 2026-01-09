import React, { useState } from 'react';
import { TRANSLATIONS } from '../services/quranDataService';
import { RECITERS, DEFAULT_RECITER } from '../services/quranAudioService';

interface TranslationSelectorProps {
  selectedTranslation: string;
  onTranslationChange: (translationId: string) => void;
  compact?: boolean;
}

export const TranslationSelector: React.FC<TranslationSelectorProps> = ({
  selectedTranslation,
  onTranslationChange,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentTranslation = TRANSLATIONS[selectedTranslation] || TRANSLATIONS['en.sahih'];

  // Group translations by language
  const groupedTranslations = Object.entries(TRANSLATIONS).reduce((acc, [id, info]) => {
    if (!acc[info.language]) {
      acc[info.language] = [];
    }
    acc[info.language].push({ id, ...info });
    return acc;
  }, {} as Record<string, Array<{ id: string; name: string; language: string }>>);

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-white/80 hover:bg-white rounded-lg px-3 py-2 text-sm text-stone-700 transition-colors shadow-sm"
        >
          <i className="fas fa-language text-rose-600"></i>
          <span className="hidden sm:inline">{currentTranslation.name}</span>
          <i className="fas fa-chevron-down text-xs text-stone-400"></i>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto border border-stone-200">
              {Object.entries(groupedTranslations).map(([language, translations]) => (
                <div key={language}>
                  <div className="px-4 py-2 bg-stone-50 text-xs font-semibold text-stone-500 uppercase sticky top-0">
                    {language}
                  </div>
                  {translations.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onTranslationChange(t.id);
                        setIsOpen(false);
                      }}
                      className={`
                        w-full text-left px-4 py-3 hover:bg-rose-50 transition-colors
                        ${t.id === selectedTranslation ? 'bg-rose-100 text-rose-700' : 'text-stone-700'}
                      `}
                    >
                      <p className="font-medium">{t.name}</p>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Full selector (for settings page)
  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
      <div className="p-4 border-b border-stone-100">
        <h3 className="font-semibold text-stone-800 flex items-center gap-2">
          <i className="fas fa-language text-rose-600"></i>
          Translation
        </h3>
        <p className="text-sm text-stone-500 mt-1">
          Select your preferred Quran translation
        </p>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {Object.entries(groupedTranslations).map(([language, translations]) => (
          <div key={language}>
            <div className="px-4 py-2 bg-stone-50 text-xs font-semibold text-stone-500 uppercase sticky top-0">
              {language}
            </div>
            {translations.map((t) => (
              <button
                key={t.id}
                onClick={() => onTranslationChange(t.id)}
                className={`
                  w-full text-left px-4 py-3 hover:bg-rose-50 transition-colors flex items-center justify-between
                  ${t.id === selectedTranslation ? 'bg-rose-100' : ''}
                `}
              >
                <span className={t.id === selectedTranslation ? 'text-rose-700 font-medium' : 'text-stone-700'}>
                  {t.name}
                </span>
                {t.id === selectedTranslation && (
                  <i className="fas fa-check text-rose-600"></i>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Reciter Selector Component
interface ReciterSelectorProps {
  selectedReciter: string;
  onReciterChange: (reciterId: string) => void;
  compact?: boolean;
}

export const ReciterSelector: React.FC<ReciterSelectorProps> = ({
  selectedReciter,
  onReciterChange,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentReciter = RECITERS.find(r => r.identifier === selectedReciter) || RECITERS[0];

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-white/80 hover:bg-white rounded-lg px-3 py-2 text-sm text-stone-700 transition-colors shadow-sm"
        >
          <i className="fas fa-microphone text-rose-600"></i>
          <span className="hidden sm:inline">{currentReciter.englishName}</span>
          <i className="fas fa-chevron-down text-xs text-stone-400"></i>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto border border-stone-200">
              {RECITERS.map((reciter) => (
                <button
                  key={reciter.identifier}
                  onClick={() => {
                    onReciterChange(reciter.identifier);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full text-left px-4 py-3 hover:bg-rose-50 transition-colors
                    ${reciter.identifier === selectedReciter ? 'bg-rose-100' : ''}
                  `}
                >
                  <p className={`font-medium ${reciter.identifier === selectedReciter ? 'text-rose-700' : 'text-stone-700'}`}>
                    {reciter.englishName}
                  </p>
                  <p className="text-sm text-stone-500">{reciter.name}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Full selector
  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
      <div className="p-4 border-b border-stone-100">
        <h3 className="font-semibold text-stone-800 flex items-center gap-2">
          <i className="fas fa-microphone text-rose-600"></i>
          Reciter
        </h3>
        <p className="text-sm text-stone-500 mt-1">
          Choose your preferred Quran reciter
        </p>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {RECITERS.map((reciter) => (
          <button
            key={reciter.identifier}
            onClick={() => onReciterChange(reciter.identifier)}
            className={`
              w-full text-left px-4 py-3 hover:bg-rose-50 transition-colors flex items-center justify-between
              ${reciter.identifier === selectedReciter ? 'bg-rose-100' : ''}
            `}
          >
            <div>
              <p className={reciter.identifier === selectedReciter ? 'text-rose-700 font-medium' : 'text-stone-700'}>
                {reciter.englishName}
              </p>
              <p className="text-sm text-stone-500">{reciter.name}</p>
            </div>
            {reciter.identifier === selectedReciter && (
              <i className="fas fa-check text-rose-600"></i>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// Font Size Selector
interface FontSizeSelectorProps {
  selectedSize: 'small' | 'medium' | 'large' | 'xlarge';
  onSizeChange: (size: 'small' | 'medium' | 'large' | 'xlarge') => void;
}

export const FontSizeSelector: React.FC<FontSizeSelectorProps> = ({
  selectedSize,
  onSizeChange,
}) => {
  const sizes: Array<{ id: 'small' | 'medium' | 'large' | 'xlarge'; label: string; icon: string }> = [
    { id: 'small', label: 'Small', icon: 'text-sm' },
    { id: 'medium', label: 'Medium', icon: 'text-base' },
    { id: 'large', label: 'Large', icon: 'text-lg' },
    { id: 'xlarge', label: 'Extra Large', icon: 'text-xl' },
  ];

  return (
    <div className="flex items-center gap-2 bg-white/80 rounded-lg p-1">
      {sizes.map((size) => (
        <button
          key={size.id}
          onClick={() => onSizeChange(size.id)}
          className={`
            px-3 py-2 rounded-md transition-colors font-amiri
            ${selectedSize === size.id
              ? 'bg-rose-600 text-white'
              : 'text-stone-600 hover:bg-stone-100'
            }
          `}
          title={size.label}
        >
          <span className={size.icon}>ا</span>
        </button>
      ))}
    </div>
  );
};

// Combined Settings Panel
interface ReadingSettingsProps {
  translation: string;
  reciter: string;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  showTranslation: boolean;
  onTranslationChange: (id: string) => void;
  onReciterChange: (id: string) => void;
  onFontSizeChange: (size: 'small' | 'medium' | 'large' | 'xlarge') => void;
  onShowTranslationChange: (show: boolean) => void;
}

export const ReadingSettings: React.FC<ReadingSettingsProps> = ({
  translation,
  reciter,
  fontSize,
  showTranslation,
  onTranslationChange,
  onReciterChange,
  onFontSizeChange,
  onShowTranslationChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/80 hover:bg-white rounded-lg px-3 py-2 text-sm text-stone-700 transition-colors shadow-sm"
      >
        <i className="fas fa-cog"></i>
        <span className="hidden sm:inline">Settings</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl z-50 border border-stone-200 p-4 space-y-4">
            <h3 className="font-semibold text-stone-800 flex items-center gap-2">
              <i className="fas fa-sliders-h text-rose-600"></i>
              Reading Settings
            </h3>

            {/* Font Size */}
            <div>
              <label className="text-sm text-stone-600 mb-2 block">Font Size</label>
              <FontSizeSelector selectedSize={fontSize} onSizeChange={onFontSizeChange} />
            </div>

            {/* Show Translation Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-stone-600">Show Translation</label>
              <button
                onClick={() => onShowTranslationChange(!showTranslation)}
                className={`
                  w-12 h-6 rounded-full transition-colors relative
                  ${showTranslation ? 'bg-rose-600' : 'bg-stone-300'}
                `}
              >
                <span
                  className={`
                    absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform shadow-sm
                    ${showTranslation ? 'translate-x-6' : 'translate-x-0.5'}
                  `}
                />
              </button>
            </div>

            {/* Translation Selector */}
            <TranslationSelector
              selectedTranslation={translation}
              onTranslationChange={onTranslationChange}
            />

            {/* Reciter Selector */}
            <ReciterSelector
              selectedReciter={reciter}
              onReciterChange={onReciterChange}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default TranslationSelector;
