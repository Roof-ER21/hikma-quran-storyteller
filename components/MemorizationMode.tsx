import React, { useState, useEffect } from 'react';
import { Verse, RecitationResult } from '../types';
import { checkRecitation } from '../services/geminiService';

interface MemorizationModeProps {
  verses: Verse[];
  surahNumber: number;
  surahName: string;
  onProgress: (completed: number, total: number) => void;
}

type HidingStage = 'show-all' | 'hide-translation' | 'hide-partial' | 'hide-all';

interface VerseProgress {
  verseNumber: number;
  accuracyHistory: number[];
  currentStreak: number;
  bestAccuracy: number;
  attempts: number;
}

export const MemorizationMode: React.FC<MemorizationModeProps> = ({
  verses,
  surahNumber,
  surahName,
  onProgress
}) => {
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [hidingStage, setHidingStage] = useState<HidingStage>('show-all');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<RecitationResult | null>(null);
  const [progress, setProgress] = useState<Record<number, VerseProgress>>({});
  const [showResult, setShowResult] = useState(false);

  const currentVerse = verses[currentVerseIndex];
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<BlobPart[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const completed = Object.values(progress).filter(
      (p: VerseProgress) => p.currentStreak >= 3 && p.bestAccuracy >= 90
    ).length;
    onProgress(completed, verses.length);
  }, [progress, verses.length, onProgress]);

  const getStageDescription = (stage: HidingStage): string => {
    switch (stage) {
      case 'show-all':
        return 'Read the verse with translation';
      case 'hide-translation':
        return 'Recite with Arabic visible';
      case 'hide-partial':
        return 'Partial Arabic hidden';
      case 'hide-all':
        return 'Complete from memory';
      default:
        return '';
    }
  };

  const getStageProgress = (stage: HidingStage): number => {
    switch (stage) {
      case 'show-all': return 25;
      case 'hide-translation': return 50;
      case 'hide-partial': return 75;
      case 'hide-all': return 100;
      default: return 0;
    }
  };

  const hidePartialArabic = (arabic: string): string => {
    const words = arabic.split(' ');
    return words.map((word, index) => {
      // Hide every other word
      return index % 2 === 0 ? word : '____';
    }).join(' ');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsProcessing(true);

        try {
          const recitationResult = await checkRecitation(
            blob,
            currentVerse.arabic,
            surahNumber,
            currentVerse.numberInSurah
          );

          setResult(recitationResult);
          setShowResult(true);
          updateProgress(currentVerse.numberInSurah, recitationResult.accuracy);

          // Auto-advance stage if accuracy is good
          if (recitationResult.accuracy >= 85) {
            setTimeout(() => {
              advanceStage();
            }, 3000);
          }
        } catch (error) {
          console.error('Failed to check recitation:', error);
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Please allow microphone access to practice recitation.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const updateProgress = (verseNumber: number, accuracy: number) => {
    setProgress(prev => {
      const existing = prev[verseNumber] || {
        verseNumber,
        accuracyHistory: [],
        currentStreak: 0,
        bestAccuracy: 0,
        attempts: 0
      };

      const newHistory = [...existing.accuracyHistory, accuracy].slice(-10);
      const newStreak = accuracy >= 85 ? existing.currentStreak + 1 : 0;

      return {
        ...prev,
        [verseNumber]: {
          verseNumber,
          accuracyHistory: newHistory,
          currentStreak: newStreak,
          bestAccuracy: Math.max(existing.bestAccuracy, accuracy),
          attempts: existing.attempts + 1
        }
      };
    });
  };

  const advanceStage = () => {
    setShowResult(false);
    setResult(null);

    const stages: HidingStage[] = ['show-all', 'hide-translation', 'hide-partial', 'hide-all'];
    const currentIndex = stages.indexOf(hidingStage);

    if (currentIndex < stages.length - 1) {
      setHidingStage(stages[currentIndex + 1]);
    } else {
      // Move to next verse
      if (currentVerseIndex < verses.length - 1) {
        setCurrentVerseIndex(currentVerseIndex + 1);
        setHidingStage('show-all');
      }
    }
  };

  const previousStage = () => {
    setShowResult(false);
    setResult(null);

    const stages: HidingStage[] = ['show-all', 'hide-translation', 'hide-partial', 'hide-all'];
    const currentIndex = stages.indexOf(hidingStage);

    if (currentIndex > 0) {
      setHidingStage(stages[currentIndex - 1]);
    }
  };

  const goToNextVerse = () => {
    if (currentVerseIndex < verses.length - 1) {
      setCurrentVerseIndex(currentVerseIndex + 1);
      setHidingStage('show-all');
      setShowResult(false);
      setResult(null);
    }
  };

  const goToPreviousVerse = () => {
    if (currentVerseIndex > 0) {
      setCurrentVerseIndex(currentVerseIndex - 1);
      setHidingStage('show-all');
      setShowResult(false);
      setResult(null);
    }
  };

  const verseProgress = progress[currentVerse.numberInSurah];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-900 to-rose-700 text-white rounded-2xl p-6 mb-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-serif font-bold">{surahName}</h2>
            <p className="text-rose-200 text-sm">
              Verse {currentVerse.numberInSurah} of {verses.length}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{getStageProgress(hidingStage)}%</div>
            <p className="text-rose-200 text-xs">Stage Progress</p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="w-full bg-rose-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-amber-400 h-full transition-all duration-500"
            style={{ width: `${((currentVerseIndex + getStageProgress(hidingStage) / 100) / verses.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Stage Indicator */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {(['show-all', 'hide-translation', 'hide-partial', 'hide-all'] as HidingStage[]).map((stage, index) => (
          <div
            key={stage}
            className={`p-3 rounded-lg text-center transition-all ${
              hidingStage === stage
                ? 'bg-rose-600 text-white shadow-lg scale-105'
                : stages.indexOf(stage) < stages.indexOf(hidingStage)
                ? 'bg-green-100 text-green-700'
                : 'bg-stone-100 text-stone-400'
            }`}
          >
            <div className="text-2xl mb-1">
              {stages.indexOf(stage) < stages.indexOf(hidingStage) ? '✓' : index + 1}
            </div>
            <div className="text-xs font-medium">
              {getStageDescription(stage)}
            </div>
          </div>
        ))}
      </div>

      {/* Verse Display Card */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 min-h-[300px] flex flex-col justify-center">
        <div className="text-center mb-6">
          {/* Arabic Text */}
          {(hidingStage === 'show-all' || hidingStage === 'hide-translation') && (
            <p className="text-4xl font-amiri leading-loose text-rose-900 mb-6" dir="rtl">
              {currentVerse.arabic}
            </p>
          )}

          {hidingStage === 'hide-partial' && (
            <p className="text-4xl font-amiri leading-loose text-rose-900 mb-6" dir="rtl">
              {hidePartialArabic(currentVerse.arabic)}
            </p>
          )}

          {hidingStage === 'hide-all' && (
            <div className="py-12">
              <i className="fas fa-brain text-6xl text-stone-300 mb-4"></i>
              <p className="text-xl text-stone-500 italic">Recite from memory</p>
            </div>
          )}

          {/* Translation */}
          {hidingStage === 'show-all' && currentVerse.translation && (
            <div className="bg-gradient-to-r from-stone-50 to-stone-100 rounded-lg p-4">
              <p className="text-stone-700 text-lg italic">
                {currentVerse.translation}
              </p>
            </div>
          )}
        </div>

        {/* Verse Progress Stats */}
        {verseProgress && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-stone-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {verseProgress.currentStreak}
              </div>
              <div className="text-xs text-stone-500">Current Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {verseProgress.bestAccuracy}%
              </div>
              <div className="text-xs text-stone-500">Best Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {verseProgress.attempts}
              </div>
              <div className="text-xs text-stone-500">Attempts</div>
            </div>
          </div>
        )}
      </div>

      {/* Recording Controls */}
      {!showResult && !isProcessing && (
        <div className="flex flex-col items-center gap-4 mb-6">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl shadow-xl transition-all ${
              isRecording
                ? 'bg-red-500 animate-pulse'
                : 'bg-gradient-to-br from-rose-600 to-rose-700 hover:shadow-2xl hover:scale-110'
            }`}
          >
            <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
          </button>
          <p className="text-stone-600 font-medium">
            {isRecording ? 'Tap to stop recording' : getStageDescription(hidingStage)}
          </p>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="text-center py-12">
          <i className="fas fa-spinner fa-spin text-5xl text-rose-600 mb-4"></i>
          <p className="text-xl text-stone-600">Analyzing your recitation...</p>
        </div>
      )}

      {/* Result Display */}
      {showResult && result && (
        <div className="bg-gradient-to-br from-white to-stone-50 rounded-2xl p-6 shadow-xl mb-6 animate-in fade-in duration-500">
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
              result.accuracy >= 85 ? 'bg-green-100' : result.accuracy >= 70 ? 'bg-blue-100' : 'bg-yellow-100'
            }`}>
              <span className={`text-3xl font-bold ${
                result.accuracy >= 85 ? 'text-green-600' : result.accuracy >= 70 ? 'text-blue-600' : 'text-yellow-600'
              }`}>
                {result.accuracy}%
              </span>
            </div>
            <h3 className="text-xl font-semibold text-stone-800 mb-2">
              {result.accuracy >= 85 ? 'Excellent Work!' : result.accuracy >= 70 ? 'Good Progress!' : 'Keep Practicing!'}
            </h3>
            <p className="text-stone-600">{result.overallFeedback}</p>
          </div>

          {result.suggestions && result.suggestions.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <i className="fas fa-lightbulb"></i>
                Tips
              </h4>
              <ul className="space-y-1">
                {result.suggestions.slice(0, 2).map((suggestion, index) => (
                  <li key={index} className="text-sm text-amber-800 flex items-start gap-2">
                    <i className="fas fa-chevron-right text-xs mt-1"></i>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 justify-between">
        <button
          onClick={goToPreviousVerse}
          disabled={currentVerseIndex === 0}
          className="px-6 py-3 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed text-stone-700 rounded-full font-medium transition-colors flex items-center gap-2"
        >
          <i className="fas fa-arrow-left"></i>
          Previous Verse
        </button>

        <div className="flex gap-3">
          {hidingStage !== 'show-all' && (
            <button
              onClick={previousStage}
              className="px-6 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full font-medium transition-colors"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
          )}
          {!showResult && (
            <button
              onClick={advanceStage}
              className="px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-full font-medium transition-all shadow-lg"
            >
              {hidingStage === 'hide-all' ? 'Next Verse' : 'Next Stage'}
            </button>
          )}
        </div>

        <button
          onClick={goToNextVerse}
          disabled={currentVerseIndex === verses.length - 1}
          className="px-6 py-3 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed text-stone-700 rounded-full font-medium transition-colors flex items-center gap-2"
        >
          Next Verse
          <i className="fas fa-arrow-right"></i>
        </button>
      </div>

      {/* Overall Progress Summary */}
      <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
          <i className="fas fa-chart-line"></i>
          Your Memorization Progress
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {Object.keys(progress).length}
            </div>
            <div className="text-xs text-stone-500">Verses Practiced</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(progress).filter((p: VerseProgress) => p.bestAccuracy >= 90).length}
            </div>
            <div className="text-xs text-stone-500">Mastered (90%+)</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">
              {Math.max(...Object.values(progress).map((p: VerseProgress) => p.currentStreak), 0)}
            </div>
            <div className="text-xs text-stone-500">Longest Streak</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-rose-600">
              {Object.values(progress).reduce((sum: number, p: VerseProgress) => sum + p.attempts, 0)}
            </div>
            <div className="text-xs text-stone-500">Total Attempts</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const stages: HidingStage[] = ['show-all', 'hide-translation', 'hide-partial', 'hide-all'];

export default MemorizationMode;
