import React, { useState, useRef, useEffect } from 'react';
import { Verse, RecitationResult } from '../types';
import { checkRecitation } from '../services/geminiService';
import { scoreRecitation, ScoringResult } from '../services/recitationScoringService';

interface RecitationCheckerProps {
  verse: Verse;
  surahNumber: number;
  onComplete: (accuracy: number) => void;
  onNext: () => void;
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'results';

export const RecitationChecker: React.FC<RecitationCheckerProps> = ({
  verse,
  surahNumber,
  onComplete,
  onNext
}) => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [result, setResult] = useState<RecitationResult | null>(null);
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
        setAudioBlob(blob);
        setRecordingState('processing');

        // Process recitation
        try {
          const recitationResult = await checkRecitation(
            blob,
            verse.arabic,
            surahNumber,
            verse.numberInSurah
          );
          setResult(recitationResult);

          // Also run scoring service for enhanced validation
          if (recitationResult.transcription) {
            const scoring = scoreRecitation(
              recitationResult.transcription,
              verse.arabic
            );
            setScoringResult(scoring);
          }

          setRecordingState('results');
          onComplete(recitationResult.accuracy);
        } catch (error) {
          console.error('Failed to check recitation:', error);
          setRecordingState('idle');
        }
      };

      mediaRecorder.start();
      setRecordingState('recording');
      setRecordingDuration(0);

      // Start duration timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Please allow microphone access to record your recitation.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const retry = () => {
    setRecordingState('idle');
    setResult(null);
    setScoringResult(null);
    setAudioBlob(null);
    setRecordingDuration(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'correct': return 'text-green-600 bg-green-50';
      case 'incorrect': return 'text-red-600 bg-red-50';
      case 'missing': return 'text-yellow-600 bg-yellow-50';
      case 'extra': return 'text-orange-600 bg-orange-50';
      default: return 'text-stone-600 bg-stone-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'correct': return 'fa-check-circle';
      case 'incorrect': return 'fa-times-circle';
      case 'missing': return 'fa-question-circle';
      case 'extra': return 'fa-plus-circle';
      default: return 'fa-circle';
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'from-green-500 to-emerald-500';
    if (accuracy >= 75) return 'from-blue-500 to-cyan-500';
    if (accuracy >= 60) return 'from-yellow-500 to-amber-500';
    return 'from-red-500 to-rose-500';
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
      {/* Verse Display */}
      <div className="mb-8 text-center">
        <div className="bg-gradient-to-r from-rose-50 to-amber-50 p-6 rounded-xl border border-rose-100">
          <p className="text-3xl font-amiri mb-4 leading-loose text-rose-900" dir="rtl">
            {verse.arabic}
          </p>
          {verse.translation && (
            <p className="text-stone-600 text-lg italic">
              {verse.translation}
            </p>
          )}
          <p className="text-sm text-stone-400 mt-2">
            Verse {verse.numberInSurah}
          </p>
        </div>
      </div>

      {/* Recording Controls */}
      {recordingState === 'idle' && (
        <div className="text-center">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-rose-500 to-rose-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
              onClick={startRecording}
            >
              <i className="fas fa-microphone text-white text-3xl"></i>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-stone-800 mb-2">Ready to Practice</h3>
          <p className="text-stone-600 mb-6">Tap the microphone to start recording your recitation</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <i className="fas fa-lightbulb"></i>
              Tips for Best Results
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>Find a quiet environment</li>
              <li>Speak clearly and at a moderate pace</li>
              <li>Apply proper tajweed rules</li>
              <li>Take a breath before starting</li>
            </ul>
          </div>
        </div>
      )}

      {/* Recording in Progress */}
      {recordingState === 'recording' && (
        <div className="text-center">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <i className="fas fa-microphone text-white text-3xl"></i>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-stone-800 mb-2">Recording...</h3>
          <div className="text-4xl font-bold text-red-600 mb-6 tabular-nums">
            {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
          </div>
          <button
            onClick={stopRecording}
            className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-medium transition-colors"
          >
            Stop Recording
          </button>
          <p className="text-sm text-stone-500 mt-4">Recite the verse clearly</p>
        </div>
      )}

      {/* Processing */}
      {recordingState === 'processing' && (
        <div className="text-center py-12">
          <div className="mb-6">
            <i className="fas fa-spinner fa-spin text-6xl text-rose-600"></i>
          </div>
          <h3 className="text-xl font-semibold text-stone-800 mb-2">Analyzing Your Recitation</h3>
          <p className="text-stone-600">AI is checking your pronunciation and accuracy...</p>
        </div>
      )}

      {/* Results */}
      {recordingState === 'results' && result && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Accuracy Score with Circular Progress */}
          <div className="text-center">
            <div className="flex justify-center items-center gap-6">
              {/* Main Accuracy Circle */}
              <div className="relative inline-block">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-stone-200"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - result.accuracy / 100)}`}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" className={`stop-color-start ${getAccuracyColor(result.accuracy)}`} />
                      <stop offset="100%" className={`stop-color-end ${getAccuracyColor(result.accuracy)}`} />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-stone-800">{result.accuracy}%</span>
                  <span className="text-sm text-stone-500">Accuracy</span>
                </div>
              </div>

              {/* Tajweed Score Badge */}
              {scoringResult && (
                <div className="flex flex-col items-center">
                  <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-2xl px-6 py-4 shadow-lg">
                    <div className="text-3xl font-bold">{scoringResult.tajweedScore}%</div>
                    <div className="text-xs mt-1 opacity-90">Tajweed Score</div>
                  </div>
                </div>
              )}
            </div>

            <h3 className="text-xl font-semibold text-stone-800 mt-4">
              {scoringResult ? scoringResult.encouragement :
               (result.accuracy >= 90 ? 'Excellent!' : result.accuracy >= 75 ? 'Good Job!' : result.accuracy >= 60 ? 'Keep Practicing!' : 'Needs Work')}
            </h3>
          </div>

          {/* Word-by-Word Feedback */}
          <div className="bg-stone-50 rounded-xl p-6">
            <h4 className="font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <i className="fas fa-list-check"></i>
              Word-by-Word Analysis
            </h4>
            <div className="flex flex-wrap gap-2 justify-end" dir="rtl">
              {result.words.map((word, index) => (
                <div
                  key={index}
                  className={`px-3 py-2 rounded-lg ${getStatusColor(word.status)} relative group cursor-help transition-all`}
                >
                  <div className="flex items-center gap-2">
                    <i className={`fas ${getStatusIcon(word.status)} text-sm`}></i>
                    <span className="font-amiri text-lg">{word.word}</span>
                  </div>
                  {word.feedback && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-stone-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {word.feedback}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-stone-800"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-stone-200 flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1">
                <i className="fas fa-check-circle text-green-600"></i>
                <span className="text-stone-600">Correct</span>
              </div>
              <div className="flex items-center gap-1">
                <i className="fas fa-times-circle text-red-600"></i>
                <span className="text-stone-600">Incorrect</span>
              </div>
              <div className="flex items-center gap-1">
                <i className="fas fa-question-circle text-yellow-600"></i>
                <span className="text-stone-600">Missing</span>
              </div>
              <div className="flex items-center gap-1">
                <i className="fas fa-plus-circle text-orange-600"></i>
                <span className="text-stone-600">Extra</span>
              </div>
            </div>
          </div>

          {/* Overall Feedback */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <i className="fas fa-comment-dots"></i>
              Feedback
            </h4>
            <p className="text-blue-800">{result.overallFeedback}</p>
          </div>

          {/* Suggestions */}
          {result.suggestions && result.suggestions.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-200">
              <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                <i className="fas fa-lightbulb"></i>
                Suggestions for Improvement
              </h4>
              <ul className="space-y-2">
                {result.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2 text-amber-800">
                    <i className="fas fa-chevron-right text-amber-600 mt-1 text-xs"></i>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pt-4">
            <button
              onClick={retry}
              className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-full font-medium transition-colors flex items-center gap-2"
            >
              <i className="fas fa-redo"></i>
              Try Again
            </button>
            <button
              onClick={onNext}
              className="px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-full font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              Next Verse
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecitationChecker;
