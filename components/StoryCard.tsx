import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getStoryReadingPosition,
  getCachedStory,
  StoryReadingPosition,
  StoryLanguage
} from '../services/offlineDatabase';

interface StoryCardProps {
  prophet: string;
  arabicName?: string;
  topic: string;
  language?: StoryLanguage;
  onSelect: (prophet: string, topic: string) => void;
  isSelected?: boolean;
}

// Prophet-specific icons and colors for all 24 prophets
const PROPHET_THEMES: Record<string, { icon: string; color: string; gradient: string }> = {
  "Adam": { icon: "fa-seedling", color: "emerald", gradient: "from-emerald-500 to-teal-600" },
  "Idris": { icon: "fa-pen-fancy", color: "violet", gradient: "from-violet-500 to-purple-600" },
  "Nuh (Noah)": { icon: "fa-ship", color: "blue", gradient: "from-blue-500 to-cyan-600" },
  "Hud": { icon: "fa-wind", color: "slate", gradient: "from-slate-500 to-gray-600" },
  "Saleh": { icon: "fa-mountain", color: "amber", gradient: "from-amber-500 to-yellow-600" },
  "Ibrahim (Abraham)": { icon: "fa-fire", color: "orange", gradient: "from-orange-500 to-amber-600" },
  "Lut (Lot)": { icon: "fa-city", color: "stone", gradient: "from-stone-500 to-gray-600" },
  "Ishmael": { icon: "fa-kaaba", color: "stone", gradient: "from-stone-600 to-neutral-700" },
  "Ishaq (Isaac)": { icon: "fa-sun", color: "yellow", gradient: "from-yellow-500 to-amber-600" },
  "Yaqub (Jacob)": { icon: "fa-users", color: "teal", gradient: "from-teal-500 to-cyan-600" },
  "Yusuf (Joseph)": { icon: "fa-star", color: "purple", gradient: "from-purple-500 to-violet-600" },
  "Ayyub (Job)": { icon: "fa-praying-hands", color: "rose", gradient: "from-rose-400 to-pink-500" },
  "Shu'aib": { icon: "fa-balance-scale", color: "emerald", gradient: "from-emerald-600 to-green-700" },
  "Musa (Moses)": { icon: "fa-water", color: "sky", gradient: "from-sky-500 to-blue-600" },
  "Harun (Aaron)": { icon: "fa-hands-helping", color: "cyan", gradient: "from-cyan-500 to-teal-600" },
  "Dhul-Kifl": { icon: "fa-leaf", color: "green", gradient: "from-green-500 to-emerald-600" },
  "Dawud (David)": { icon: "fa-crown", color: "amber", gradient: "from-amber-600 to-orange-700" },
  "Sulaiman (Solomon)": { icon: "fa-gem", color: "indigo", gradient: "from-indigo-500 to-purple-600" },
  "Ilyas (Elijah)": { icon: "fa-bolt", color: "yellow", gradient: "from-yellow-400 to-orange-500" },
  "Al-Yasa (Elisha)": { icon: "fa-heart", color: "pink", gradient: "from-pink-500 to-rose-600" },
  "Yunus (Jonah)": { icon: "fa-fish", color: "blue", gradient: "from-blue-600 to-indigo-700" },
  "Zakariyah": { icon: "fa-child", color: "sky", gradient: "from-sky-400 to-blue-500" },
  "Yahya (John)": { icon: "fa-droplet", color: "cyan", gradient: "from-cyan-400 to-sky-500" },
  "Isa (Jesus)": { icon: "fa-dove", color: "indigo", gradient: "from-indigo-500 to-blue-600" },
  "Muhammad": { icon: "fa-moon", color: "rose", gradient: "from-rose-500 to-pink-600" }
};

// Topic icons
const TOPIC_ICONS: Record<string, string> = {
  "General Life": "fa-book-open",
  "Patience": "fa-hourglass-half",
  "Trust in God": "fa-hands-praying",
  "Leadership": "fa-crown",
  "Family": "fa-home",
  "Miracles": "fa-wand-magic-sparkles",
  "Justice": "fa-balance-scale"
};

const StoryCard: React.FC<StoryCardProps> = ({
  prophet,
  arabicName,
  topic,
  language = 'english' as StoryLanguage,
  onSelect,
  isSelected = false
}) => {
  const { t, i18n } = useTranslation('common');
  const isArabic = i18n.language === 'ar-EG';
  const [readingPosition, setReadingPosition] = useState<StoryReadingPosition | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [loading, setLoading] = useState(true);

  const theme = PROPHET_THEMES[prophet] || { icon: "fa-user", color: "stone", gradient: "from-stone-500 to-gray-600" };
  const topicIcon = TOPIC_ICONS[topic] || "fa-book";

  // Check for saved reading position and cached status
  useEffect(() => {
    const checkStatus = async () => {
      setLoading(true);
      try {
        const [position, cached] = await Promise.all([
          getStoryReadingPosition(prophet, topic, language),
          getCachedStory(prophet, topic, language)
        ]);
        setReadingPosition(position && position.scrollPercent > 5 ? position : null);
        setIsCached(!!cached);
      } catch (e) {
        console.error('Error checking story status:', e);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [prophet, topic, language]);

  // Estimated read time (mock - could be calculated from actual story length)
  const estimatedReadTime = Math.floor(Math.random() * 5) + 5; // 5-10 min

  return (
    <div
      onClick={() => onSelect(prophet, topic)}
      className={`relative group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
        isSelected
          ? 'ring-2 ring-rose-500 shadow-lg'
          : 'shadow-md hover:ring-1 hover:ring-rose-300'
      }`}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-90`}></div>

      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          <pattern id={`pattern-${prophet.replace(/\s/g, '')}`} patternUnits="userSpaceOnUse" width="20" height="20">
            <path d="M0,10 L10,0 L20,10 L10,20 Z" fill="currentColor" className="text-white" />
          </pattern>
          <rect width="100%" height="100%" fill={`url(#pattern-${prophet.replace(/\s/g, '')})`} />
        </svg>
      </div>

      {/* Content */}
      <div className="relative p-5 text-white">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <i className={`fas ${theme.icon} text-xl`}></i>
          </div>
          <div className="flex gap-2">
            {/* Cached indicator */}
            {isCached && (
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm" title={t('storyCard.availableOffline')}>
                <i className="fas fa-download text-xs"></i>
              </div>
            )}
            {/* Continue reading badge */}
            {readingPosition && (
              <div className="bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                <i className="fas fa-bookmark text-[10px]"></i>
                <span>{Math.round(readingPosition.scrollPercent)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Prophet Name */}
        <h3 className="text-lg font-serif font-bold mb-0.5 drop-shadow-sm leading-tight">
          {prophet}
        </h3>
        {arabicName && (
          <p className="text-sm font-arabic text-white/80 mb-1">{arabicName}</p>
        )}

        {/* Topic Badge */}
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
            <i className={`fas ${topicIcon} text-[10px]`}></i>
            <span>{topic}</span>
          </div>
        </div>

        {/* Footer - Read time & Language */}
        <div className={`flex items-center justify-between text-white/70 text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-1 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <i className="fas fa-clock"></i>
            <span>{t('storyCard.readTime', { minutes: estimatedReadTime })}</span>
          </div>
          <div className={`flex items-center gap-1 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <i className="fas fa-language"></i>
            <span>{language === 'english' ? t('storyCard.languages.english') : language === 'arabic' ? t('storyCard.languages.arabic') : t('storyCard.languages.egyptian')}</span>
          </div>
        </div>

        {/* Hover effect */}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none"></div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default StoryCard;
