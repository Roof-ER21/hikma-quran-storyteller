import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AdultProphetStory, StorySection, NarrationState } from '../types';
import { loadProphetStories, searchProphetStories } from '../services/prophetService';
import { prophetNarrationService, RECITERS, DEFAULT_RECITER } from '../services/prophetNarrationService';
import SectionNarrationButton from './SectionNarrationButton';
import ProphetAudioPlayer from './ProphetAudioPlayer';
import { AlayaTutorWrapper } from './AlayaTutor';

const ProphetStoriesLibrary: React.FC = () => {
  const { t, i18n } = useTranslation('library');
  const isArabic = i18n.language.startsWith('ar');
  const [stories, setStories] = useState<AdultProphetStory[]>([]);
  const [filteredStories, setFilteredStories] = useState<AdultProphetStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<AdultProphetStory | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'location' | 'era'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Narration state
  const [narrationState, setNarrationState] = useState<NarrationState | null>(null);
  const [currentReciter, setCurrentReciter] = useState(DEFAULT_RECITER);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // Load stories on mount
  useEffect(() => {
    const loadStories = async () => {
      setLoading(true);
      const data = await loadProphetStories();
      setStories(data);
      setFilteredStories(data);
      setLoading(false);
    };
    loadStories();
  }, []);

  // Handle search
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setFilteredStories(stories);
        return;
      }

      const results = await searchProphetStories(searchQuery);
      setFilteredStories(results);
    };

    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, stories]);

  // Subscribe to narration state changes
  useEffect(() => {
    const unsubscribe = prophetNarrationService.subscribe((state) => {
      setNarrationState(state);
    });
    return unsubscribe;
  }, []);

  // Narration handlers
  const handlePlayFullStory = async () => {
    if (!selectedStory) return;
    if (narrationState?.isPlaying) {
      prophetNarrationService.pause();
    } else if (narrationState?.isPaused && narrationState.currentStoryId === selectedStory.id) {
      await prophetNarrationService.resume();
    } else {
      await prophetNarrationService.narrateFullStory(selectedStory);
    }
  };

  const handlePlaySection = async (section: StorySection) => {
    if (!selectedStory) return;
    await prophetNarrationService.narrateSection(section, selectedStory);
  };

  const handlePauseNarration = () => {
    prophetNarrationService.pause();
  };

  const handleResumeNarration = async () => {
    await prophetNarrationService.resume();
  };

  const handleStopNarration = () => {
    prophetNarrationService.stop();
  };

  const handleSkipForward = async () => {
    await prophetNarrationService.skipToNext();
  };

  const handleSkipBack = async () => {
    await prophetNarrationService.skipToPrevious();
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    prophetNarrationService.setSpeed(speed);
  };

  const handleReciterChange = (reciterId: string) => {
    setCurrentReciter(reciterId);
    prophetNarrationService.setReciter(reciterId);
  };

  // Estimate story duration
  const getEstimatedDuration = (story: AdultProphetStory): string => {
    const minutes = prophetNarrationService.estimateStoryDuration(story);
    return prophetNarrationService.formatDuration(minutes);
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Expand all sections
  const expandAll = () => {
    if (!selectedStory) return;
    const allSectionIds = selectedStory.sections.map(s => s.id);
    setExpandedSections(new Set(allSectionIds));
  };

  // Collapse all sections
  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  // Get unique locations for filtering
  const uniqueLocations = Array.from(new Set(stories.map(s => s.location)));
  const uniqueEras = Array.from(new Set(stories.map(s => s.era)));
  const getLocalizedSummary = (story: AdultProphetStory) =>
    isArabic && story.summaryArabic ? story.summaryArabic : story.summary;
  const getLocalizedKeyLessons = (story: AdultProphetStory) =>
    isArabic && story.keyLessonsArabic?.length ? story.keyLessonsArabic : story.keyLessons;
  const getLocalizedLocation = (story: AdultProphetStory) =>
    isArabic && story.locationArabic ? story.locationArabic : story.location;
  const getLocalizedEra = (story: AdultProphetStory) =>
    isArabic && story.eraArabic ? story.eraArabic : story.era;
  const getLocalizedPeriod = (story: AdultProphetStory) =>
    isArabic && story.periodArabic ? story.periodArabic : story.period;
  const getLocalizedHistoricalNotes = (story: AdultProphetStory) =>
    isArabic && story.historicalNotesArabic ? story.historicalNotesArabic : story.historicalNotes;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-900 mx-auto"></div>
          <p className={`text-stone-500 font-medium ${isArabic ? 'font-arabic' : ''}`}>{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen-safe bg-gradient-to-br from-stone-50 via-rose-50/30 to-amber-50/20 mobile-scroll pb-safe" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-amber-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className={`flex items-center gap-4 mb-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <i className="fas fa-book-open text-3xl"></i>
            </div>
            <div className={isArabic ? 'text-right' : ''}>
              <h1 className={`text-4xl font-serif font-bold ${isArabic ? 'font-arabic' : ''}`}>{t('title')}</h1>
              <p className={`text-rose-100 text-lg mt-1 ${isArabic ? 'font-arabic' : ''}`}>
                {t('subtitle')}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-8 max-w-2xl">
            <div className="relative">
              <i className={`fas fa-search absolute ${isArabic ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 text-stone-400`}></i>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search.placeholder')}
                className={`w-full ${isArabic ? 'pr-12 pl-12 text-right' : 'pl-12 pr-12'} py-4 rounded-xl bg-white/95 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-lg ${isArabic ? 'font-arabic' : ''}`}
                dir={isArabic ? 'rtl' : 'ltr'}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className={`absolute ${isArabic ? 'left-4' : 'right-4'} top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors`}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className={`mt-6 flex items-center gap-6 text-sm text-rose-100 ${isArabic ? 'font-arabic flex-row-reverse' : ''}`}>
            <span className="flex items-center gap-2">
              <i className="fas fa-users"></i>
              {t('stats.count', { count: filteredStories.length })}
            </span>
            {searchQuery && (
              <span className="flex items-center gap-2">
                <i className="fas fa-filter"></i>
                {t('stats.filtered', { total: stories.length })}
              </span>
            )}
          </div>
        </div>
      </div>

          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* No Results */}
            {filteredStories.length === 0 && searchQuery && (
              <div className="text-center py-16">
                <i className="fas fa-search text-6xl text-stone-300 mb-4"></i>
                <h3 className={`text-2xl font-serif text-stone-700 mb-2 ${isArabic ? 'font-arabic' : ''}`}>{t('search.noResultsHeader', 'No stories found')}</h3>
                <p className={`text-stone-500 mb-4 ${isArabic ? 'font-arabic' : ''}`}>
                  {t('search.noResultsBody', 'Try adjusting your search terms or browse all prophets')}
                </p>
                <button
                  onClick={clearSearch}
                  className="px-6 py-3 bg-rose-900 text-white rounded-xl font-medium hover:bg-rose-800 transition-colors"
                >
                  {t('search.clear', 'Clear Search')}
                </button>
              </div>
            )}

        {/* Prophet Cards Grid */}
        {!selectedStory && filteredStories.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <div
                key={story.id}
                onClick={() => {
                  setSelectedStory(story);
                  setExpandedSections(new Set([story.sections[0]?.id])); // Expand first section by default
                }}
                className="group cursor-pointer bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-stone-100 hover:border-rose-200"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-br from-rose-50 to-amber-50 p-6 border-b border-stone-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-2xl font-serif font-bold text-rose-900 mb-1 group-hover:text-rose-700 transition-colors">
                        {isArabic ? story.arabicName : story.prophetName}
                      </h3>
                      {!isArabic && (
                        <p className="text-xl font-arabic text-amber-700 mb-2" dir="rtl">
                          {story.arabicName}
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                      <i className="fas fa-scroll"></i>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-3 py-1 rounded-full bg-white text-stone-600 border border-stone-200">
                      <i className={`fas fa-map-marker-alt ${isArabic ? 'ml-1' : 'mr-1'}`}></i>
                      {getLocalizedLocation(story)}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white text-stone-600 border border-stone-200">
                      <i className={`fas fa-clock ${isArabic ? 'ml-1' : 'mr-1'}`}></i>
                      {getLocalizedEra(story)}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <p className={`text-stone-600 leading-relaxed line-clamp-3 mb-4 ${isArabic ? 'font-arabic text-right' : ''}`}>
                    {getLocalizedSummary(story)}
                  </p>

                  {/* Key Lessons Preview */}
                  {getLocalizedKeyLessons(story).length > 0 && (
                    <div className="space-y-2">
                      <p className={`text-xs uppercase tracking-wider text-stone-500 font-semibold ${isArabic ? 'font-arabic text-right' : ''}`}>
                        {t('story.keyLessons')}
                      </p>
                      <ul className="space-y-1">
                        {getLocalizedKeyLessons(story).slice(0, 2).map((lesson, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-stone-600">
                            <i className="fas fa-check-circle text-amber-600 mt-1 flex-shrink-0"></i>
                            <span className="line-clamp-1">{lesson}</span>
                          </li>
                        ))}
                        {getLocalizedKeyLessons(story).length > 2 && (
                          <li className="text-sm text-rose-700 font-medium">
                            +{getLocalizedKeyLessons(story).length - 2} {t('story.moreLessons', 'more lessons')}
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Read More Button */}
                  <button className="mt-4 w-full py-3 bg-rose-900 text-white rounded-xl font-medium hover:bg-rose-800 transition-colors flex items-center justify-center gap-2 group-hover:shadow-lg">
                    <span className={isArabic ? 'font-arabic' : ''}>{t('story.readFullStory')}</span>
                    <i className={`fas fa-arrow-${isArabic ? 'left' : 'right'} transform group-hover:translate-x-1 transition-transform`}></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full Story View */}
        {selectedStory && (
          <div className="animate-in fade-in duration-300">
            {narrationState?.isLoading && (
              <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-start gap-3">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping mt-1"></span>
                <div className="leading-tight">
                  <p className="font-semibold">{t('narration.preparing')}</p>
                  <p className="text-sm text-amber-800/80">
                    {t('narration.preparingHint')}
                  </p>
                </div>
              </div>
            )}
            {/* Story Header */}
            <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
              <div className="bg-gradient-to-br from-rose-900 via-rose-800 to-amber-900 text-white p-8">
                <button
                  onClick={() => {
                    setSelectedStory(null);
                    setExpandedSections(new Set());
                  }}
                  className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2"
                >
                  <i className={`fas fa-arrow-${isArabic ? 'right' : 'left'}`}></i>
                  <span className={isArabic ? 'font-arabic' : ''}>{t('story.backToLibrary')}</span>
                </button>

                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <h2 className="text-4xl font-serif font-bold mb-2">
                      {isArabic ? selectedStory.arabicName : selectedStory.prophetName}
                    </h2>
                    {!isArabic && (
                      <p className="text-3xl font-arabic mb-4" dir="rtl">
                        {selectedStory.arabicName}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3 mb-4">
                      <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                        <i className={`fas fa-map-marker-alt ${isArabic ? 'ml-2' : 'mr-2'}`}></i>
                        {getLocalizedLocation(selectedStory)}
                      </span>
                      <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                        <i className={`fas fa-clock ${isArabic ? 'ml-2' : 'mr-2'}`}></i>
                        {getLocalizedEra(selectedStory)}
                      </span>
                      <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                        <i className={`fas fa-calendar-alt ${isArabic ? 'ml-2' : 'mr-2'}`}></i>
                        {getLocalizedPeriod(selectedStory)}
                      </span>
                    </div>

                    <p className={`text-xl leading-relaxed text-rose-50 ${isArabic ? 'font-arabic text-right' : ''}`}>
                      {getLocalizedSummary(selectedStory)}
                    </p>

                    {/* Listen to Full Story Button */}
                    <div className={`mt-6 flex items-center gap-4 ${isArabic ? 'flex-row-reverse justify-end' : ''}`}>
                      <button
                        onClick={handlePlayFullStory}
                        className={`px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-3 transition-colors border border-white/20 ${isArabic ? 'flex-row-reverse' : ''}`}
                      >
                        <i className={`fas ${narrationState?.isPlaying && narrationState?.currentStoryId === selectedStory.id ? 'fa-pause' : 'fa-headphones'}`}></i>
                        <span className={isArabic ? 'font-arabic' : ''}>
                          {narrationState?.isPlaying && narrationState?.currentStoryId === selectedStory.id
                            ? t('narration.pause')
                            : narrationState?.isPaused && narrationState?.currentStoryId === selectedStory.id
                              ? t('narration.resume')
                              : t('narration.playFullStory')}
                        </span>
                        <span className="text-sm text-rose-200">
                          ({getEstimatedDuration(selectedStory)})
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="hidden md:block w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <i className="fas fa-book-open text-5xl"></i>
                  </div>
                </div>
              </div>

              {/* Key Lessons */}
              {getLocalizedKeyLessons(selectedStory).length > 0 && (
                <div className="p-8 bg-amber-50/50 border-b border-stone-200">
                  <h3 className={`text-lg font-serif font-bold text-rose-900 mb-4 flex items-center gap-2 ${isArabic ? 'flex-row-reverse justify-start font-arabic' : ''}`}>
                    <i className="fas fa-lightbulb text-amber-600"></i>
                    {t('story.keyLessons')}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {getLocalizedKeyLessons(selectedStory).map((lesson, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 p-4 bg-white rounded-xl border border-amber-100 ${isArabic ? 'flex-row-reverse text-right' : ''}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 font-bold">
                          {idx + 1}
                        </div>
                        <p className={`text-stone-700 leading-relaxed ${isArabic ? 'font-arabic text-right' : ''}`}>{lesson}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section Controls */}
              <div className={`p-6 bg-stone-50 border-b border-stone-200 flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                <div className={`text-sm text-stone-600 ${isArabic ? 'font-arabic' : ''}`}>
                  <i className={`fas fa-book ${isArabic ? 'ml-2' : 'mr-2'}`}></i>
                  {selectedStory.sections.length} {t('story.sections')}
                </div>
                <div className={`flex gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <button
                    onClick={expandAll}
                    className={`px-4 py-2 text-sm bg-white border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors ${isArabic ? 'font-arabic' : ''}`}
                  >
                    <i className={`fas fa-expand-alt ${isArabic ? 'ml-2' : 'mr-2'}`}></i>
                    {t('story.expandAll', 'Expand All')}
                  </button>
                  <button
                    onClick={collapseAll}
                    className={`px-4 py-2 text-sm bg-white border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors ${isArabic ? 'font-arabic' : ''}`}
                  >
                    <i className={`fas fa-compress-alt ${isArabic ? 'ml-2' : 'mr-2'}`}></i>
                    {t('story.collapseAll', 'Collapse All')}
                  </button>
                </div>
              </div>
            </div>

            {/* Story Sections */}
            <div className="space-y-4">
              {selectedStory.sections.map((section, idx) => (
                <StorySectionComponent
                  key={section.id}
                  section={section}
                  index={idx}
                  isExpanded={expandedSections.has(section.id)}
                  onToggle={() => toggleSection(section.id)}
                  narrationState={narrationState}
                  onPlaySection={() => handlePlaySection(section)}
                  onPauseSection={handlePauseNarration}
                  onResumeSection={handleResumeNarration}
                  isArabic={isArabic}
                />
              ))}
            </div>

            {/* Historical Notes */}
            {getLocalizedHistoricalNotes(selectedStory) && (
              <div className="mt-6 bg-white rounded-2xl shadow-lg p-8">
                <h3 className={`text-2xl font-serif font-bold text-rose-900 mb-4 flex items-center gap-2 ${isArabic ? 'flex-row-reverse justify-start font-arabic' : ''}`}>
                  <i className="fas fa-landmark text-amber-600"></i>
                  {t('story.historicalContext', 'Historical Context & Scholarly Notes')}
                </h3>
                <div className="prose prose-lg max-w-none text-stone-700 leading-relaxed">
                  {getLocalizedHistoricalNotes(selectedStory)?.split('\n').map((para, idx) => (
                    <p key={idx} className={`mb-4 ${isArabic ? 'font-arabic text-right' : ''}`}>
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Related Prophets */}
            {selectedStory.relatedProphets && selectedStory.relatedProphets.length > 0 && (
              <div className="mt-6 bg-white rounded-2xl shadow-lg p-8">
                <h3 className={`text-2xl font-serif font-bold text-rose-900 mb-4 flex items-center gap-2 ${isArabic ? 'flex-row-reverse justify-start font-arabic' : ''}`}>
                  <i className="fas fa-link text-amber-600"></i>
                  {t('story.relatedProphets')}
                </h3>
                <div className={`flex flex-wrap gap-3 ${isArabic ? 'justify-end' : ''}`}>
                  {selectedStory.relatedProphets.map((relatedId) => {
                    const related = stories.find(s => s.id === relatedId);
                    if (!related) return null;
                    return (
                      <button
                        key={relatedId}
                        onClick={() => {
                          setSelectedStory(related);
                          setExpandedSections(new Set([related.sections[0]?.id]));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`px-6 py-3 bg-rose-50 hover:bg-rose-100 text-rose-900 rounded-xl border border-rose-200 transition-colors flex items-center gap-2 ${isArabic ? 'flex-row-reverse font-arabic' : ''}`}
                      >
                        <i className="fas fa-user"></i>
                        <span className="font-medium">{isArabic ? related.arabicName : related.prophetName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Audio Player */}
      {narrationState && (narrationState.isPlaying || narrationState.isPaused || narrationState.isLoading) && (
        <ProphetAudioPlayer
          narrationState={narrationState}
          onPlay={handleResumeNarration}
          onPause={handlePauseNarration}
          onStop={handleStopNarration}
          onSkipForward={handleSkipForward}
          onSkipBack={handleSkipBack}
          onSpeedChange={handleSpeedChange}
          onReciterChange={handleReciterChange}
          currentSpeed={playbackSpeed}
          currentReciter={currentReciter}
        />
      )}

      {/* Bottom padding when player is visible */}
      {narrationState && (narrationState.isPlaying || narrationState.isPaused) && (
        <div className="h-[calc(7rem+env(safe-area-inset-bottom,0px))]"></div>
      )}

      {/* Alaya AI Tutor - Always available for prophet stories */}
      <AlayaTutorWrapper
        context={{
          activity: 'prophet-stories',
          currentProphet: selectedStory ? selectedStory.prophetName : undefined,
          language: isArabic ? 'ar' : 'en'
        }}
      />
    </div>
  );
};

// Story Section Component
interface StorySectionProps {
  section: StorySection;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  narrationState: NarrationState | null;
  onPlaySection: () => void;
  onPauseSection: () => void;
  onResumeSection: () => void;
  isArabic: boolean;
}

const StorySectionComponent: React.FC<StorySectionProps> = ({
  section,
  index,
  isExpanded,
  onToggle,
  narrationState,
  onPlaySection,
  onPauseSection,
  onResumeSection,
  isArabic,
}) => {
  const { t } = useTranslation('library');
  const sectionTitle = isArabic && section.titleArabic ? section.titleArabic : section.title;
  const sectionContent = isArabic && section.contentArabic ? section.contentArabic : section.content;

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-stone-200 transition-all duration-300" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Section Header */}
      <div className={`p-6 flex items-center justify-between hover:bg-stone-50 transition-colors ${isArabic ? 'flex-row-reverse' : ''}`}>
        <button
          onClick={onToggle}
          className={`flex items-center gap-4 flex-1 ${isArabic ? 'text-right flex-row-reverse' : 'text-left'}`}
        >
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-lg">
            {index + 1}
          </div>
          <h4 className={`text-xl font-serif font-bold text-rose-900 ${isArabic ? 'font-arabic' : ''}`}>
            {sectionTitle}
          </h4>
        </button>
        <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <SectionNarrationButton
            sectionId={section.id}
            narrationState={narrationState}
            onPlay={onPlaySection}
            onPause={onPauseSection}
            onResume={onResumeSection}
          />
          <button onClick={onToggle} className="w-8 h-8 flex items-center justify-center">
            <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-stone-400 transition-transform`}></i>
          </button>
        </div>
      </div>

      {/* Section Content */}
      {isExpanded && (
        <div className="px-6 pb-6 animate-in fade-in duration-300">
          <div className="border-t border-stone-200 pt-6">
            {/* Main Content */}
            <div className="prose prose-lg max-w-none mb-6">
              {sectionContent.split('\n').map((para, idx) => (
                <p key={idx} className={`mb-4 text-stone-700 leading-relaxed ${isArabic ? 'font-arabic text-right' : ''}`}>
                  {para}
                </p>
              ))}
            </div>

            {/* Quranic Verses */}
            {section.verses && section.verses.length > 0 && (
              <div className="mb-6">
                <h5 className={`text-lg font-serif font-bold text-rose-900 mb-4 flex items-center gap-2 ${isArabic ? 'flex-row-reverse justify-start font-arabic' : ''}`}>
                  <i className="fas fa-quran text-amber-600"></i>
                  {t('story.quranReferences', 'Quranic References')}
                </h5>
                <div className="space-y-4">
                  {section.verses.map((verse, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-xl p-6 border border-rose-100"
                    >
                      {/* Arabic Text */}
                      <p className="text-2xl font-arabic text-rose-900 mb-4 leading-loose text-right" dir="rtl">
                        {verse.arabic}
                      </p>

                      {!isArabic && (
                        <>
                          {/* Transliteration */}
                          <p className="text-sm italic text-stone-600 mb-3 bg-white/50 rounded-lg p-3">
                            {verse.transliteration}
                          </p>

                          {/* Translation */}
                          <p className="text-base text-stone-700 leading-relaxed mb-3">
                            {verse.translation}
                          </p>
                        </>
                      )}

                      {/* Reference */}
                      <div className={`flex items-center gap-2 text-sm text-amber-700 font-medium ${isArabic ? 'flex-row-reverse justify-end font-arabic' : ''}`}>
                        <i className="fas fa-bookmark"></i>
                        <span>{t('verses.surah')} {verse.surah}, {t('verses.verse')} {verse.verse}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hadith References */}
            {section.hadiths && section.hadiths.length > 0 && (
              <div>
                <h5 className={`text-lg font-serif font-bold text-rose-900 mb-4 flex items-center gap-2 ${isArabic ? 'flex-row-reverse justify-start font-arabic' : ''}`}>
                  <i className="fas fa-book text-amber-600"></i>
                  {t('story.hadithReferences', 'Hadith References')}
                </h5>
                <div className="space-y-4">
                  {section.hadiths.map((hadith, idx) => (
                    <div
                      key={idx}
                      className="bg-stone-50 rounded-xl p-6 border border-stone-200"
                    >
                      {/* Hadith Text */}
                      <p className={`text-base text-stone-700 leading-relaxed mb-4 italic ${isArabic ? 'font-arabic text-right' : ''}`}>
                        "{isArabic && hadith.textArabic ? hadith.textArabic : hadith.text}"
                      </p>

                      {/* Source Information */}
                      <div className={`flex flex-wrap items-center gap-3 text-sm ${isArabic ? 'justify-end' : ''}`}>
                        <span className={`px-3 py-1 bg-white rounded-full text-stone-700 border border-stone-200 ${isArabic ? 'font-arabic' : ''}`}>
                          <i className={`fas fa-book-open ${isArabic ? 'ml-1' : 'mr-1'}`}></i>
                          {hadith.source}
                        </span>
                        <span className={`px-3 py-1 bg-white rounded-full text-stone-700 border border-stone-200 ${isArabic ? 'font-arabic' : ''}`}>
                          {hadith.book} {hadith.number}
                        </span>
                        {hadith.grade && (
                          <span className={`px-3 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-200 font-medium ${isArabic ? 'font-arabic' : ''}`}>
                            <i className={`fas fa-check-circle ${isArabic ? 'ml-1' : 'mr-1'}`}></i>
                            {hadith.grade}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProphetStoriesLibrary;
