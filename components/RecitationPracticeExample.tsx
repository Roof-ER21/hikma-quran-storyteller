/**
 * Example Integration for Recitation Practice Components
 *
 * This file demonstrates how to integrate RecitationChecker and MemorizationMode
 * into your application.
 */

import React, { useState } from 'react';
import RecitationChecker from './RecitationChecker';
import MemorizationMode from './MemorizationMode';
import { Verse } from '../types';

// Example verses for demonstration
const exampleVerses: Verse[] = [
  {
    number: 1,
    numberInSurah: 1,
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    translation: "In the name of Allah, the Most Gracious, the Most Merciful",
    juz: 1,
    page: 1
  },
  {
    number: 2,
    numberInSurah: 2,
    arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    translation: "All praise is due to Allah, Lord of all the worlds",
    juz: 1,
    page: 1
  },
  {
    number: 3,
    numberInSurah: 3,
    arabic: "الرَّحْمَٰنِ الرَّحِيمِ",
    translation: "The Most Gracious, the Most Merciful",
    juz: 1,
    page: 1
  }
];

type PracticeMode = 'single' | 'memorization' | 'menu';

export const RecitationPracticeExample: React.FC = () => {
  const [mode, setMode] = useState<PracticeMode>('menu');
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [memorizedCount, setMemorizedCount] = useState(0);

  const handleVerseComplete = (accuracy: number) => {
    console.log('Verse completed with accuracy:', accuracy);
  };

  const handleNextVerse = () => {
    if (currentVerseIndex < exampleVerses.length - 1) {
      setCurrentVerseIndex(currentVerseIndex + 1);
    } else {
      setMode('menu');
    }
  };

  const handleMemorizationProgress = (completed: number, total: number) => {
    setMemorizedCount(completed);
    console.log(`Memorization progress: ${completed}/${total}`);
  };

  if (mode === 'menu') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gradient-to-r from-rose-900 to-rose-700 text-white rounded-2xl p-8 mb-8 text-center">
          <i className="fas fa-quran text-6xl mb-4"></i>
          <h1 className="text-3xl font-serif font-bold mb-2">Recitation Practice</h1>
          <p className="text-rose-200">Choose your practice mode</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Single Verse Practice */}
          <button
            onClick={() => setMode('single')}
            className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all text-left group border-2 border-transparent hover:border-rose-500"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <i className="fas fa-microphone text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-stone-800 mb-2">Single Verse Checker</h3>
            <p className="text-stone-600 mb-4">
              Practice individual verses with instant AI feedback on your pronunciation and accuracy
            </p>
            <div className="flex items-center gap-2 text-rose-600 font-medium">
              Start Practice
              <i className="fas fa-arrow-right"></i>
            </div>
          </button>

          {/* Memorization Mode */}
          <button
            onClick={() => setMode('memorization')}
            className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all text-left group border-2 border-transparent hover:border-rose-500"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <i className="fas fa-brain text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-stone-800 mb-2">Memorization Mode</h3>
            <p className="text-stone-600 mb-4">
              Progressive verse hiding with streak tracking to help you memorize effectively
            </p>
            <div className="flex items-center gap-2 text-rose-600 font-medium">
              Start Memorizing
              <i className="fas fa-arrow-right"></i>
            </div>
          </button>
        </div>

        {/* Features Overview */}
        <div className="mt-8 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-200">
          <h4 className="font-semibold text-amber-900 mb-4 flex items-center gap-2">
            <i className="fas fa-star"></i>
            Features
          </h4>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <i className="fas fa-check-circle text-green-600 mt-1"></i>
              <span className="text-amber-800">AI-powered pronunciation analysis</span>
            </div>
            <div className="flex items-start gap-2">
              <i className="fas fa-check-circle text-green-600 mt-1"></i>
              <span className="text-amber-800">Word-by-word feedback</span>
            </div>
            <div className="flex items-start gap-2">
              <i className="fas fa-check-circle text-green-600 mt-1"></i>
              <span className="text-amber-800">Accuracy tracking</span>
            </div>
            <div className="flex items-start gap-2">
              <i className="fas fa-check-circle text-green-600 mt-1"></i>
              <span className="text-amber-800">Progressive memorization stages</span>
            </div>
            <div className="flex items-start gap-2">
              <i className="fas fa-check-circle text-green-600 mt-1"></i>
              <span className="text-amber-800">Streak counter</span>
            </div>
            <div className="flex items-start gap-2">
              <i className="fas fa-check-circle text-green-600 mt-1"></i>
              <span className="text-amber-800">Tajweed suggestions</span>
            </div>
          </div>
        </div>

        {memorizedCount > 0 && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-green-800">
              <i className="fas fa-trophy text-yellow-500 mr-2"></i>
              You've memorized <strong>{memorizedCount}</strong> verses!
            </p>
          </div>
        )}
      </div>
    );
  }

  if (mode === 'single') {
    return (
      <div>
        <div className="max-w-3xl mx-auto mb-6">
          <button
            onClick={() => setMode('menu')}
            className="flex items-center gap-2 text-stone-600 hover:text-rose-600 transition-colors mb-4"
          >
            <i className="fas fa-arrow-left"></i>
            Back to Menu
          </button>
        </div>
        <RecitationChecker
          verse={exampleVerses[currentVerseIndex]}
          surahNumber={1}
          onComplete={handleVerseComplete}
          onNext={handleNextVerse}
        />
      </div>
    );
  }

  if (mode === 'memorization') {
    return (
      <div>
        <div className="max-w-4xl mx-auto mb-6">
          <button
            onClick={() => setMode('menu')}
            className="flex items-center gap-2 text-stone-600 hover:text-rose-600 transition-colors"
          >
            <i className="fas fa-arrow-left"></i>
            Back to Menu
          </button>
        </div>
        <MemorizationMode
          verses={exampleVerses}
          surahNumber={1}
          surahName="Al-Fatihah"
          onProgress={handleMemorizationProgress}
        />
      </div>
    );
  }

  return null;
};

export default RecitationPracticeExample;
