import React, { useState, useRef, useEffect } from 'react';
import { voiceSearchQuran } from '../services/geminiService';
import { audioManager } from '../services/quranAudioService';
import { VoiceSearchResult } from '../types';

interface VoiceSearchProps {
  onNavigateToVerse?: (surahNumber: number, verseNumber: number) => void;
}

type SearchState = 'idle' | 'recording' | 'processing' | 'results' | 'error';

const VoiceSearch: React.FC<VoiceSearchProps> = ({ onNavigateToVerse }) => {
  const [state, setState] = useState<SearchState>('idle');
  const [transcription, setTranscription] = useState('');
  const [matches, setMatches] = useState<VoiceSearchResult[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingVerse, setPlayingVerse] = useState<{ surah: number; verse: number } | null>(null);

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Waveform visualization refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopRecording();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up audio context for visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Start visualization
      visualize();

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setState('recording');
      setRecordingTime(0);
      setErrorMessage('');

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Microphone access denied:', error);
      setErrorMessage('Microphone access denied. Please grant permission and try again.');
      setState('error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const visualize = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      analyserRef.current!.getByteFrequencyData(dataArray);

      canvasCtx.fillStyle = 'rgb(245, 242, 239)'; // stone-50
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        // Gradient from rose-600 to rose-400
        const gradient = canvasCtx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, 'rgb(225, 29, 72)'); // rose-600
        gradient.addColorStop(1, 'rgb(251, 113, 133)'); // rose-400

        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  };

  const processAudio = async (audioBlob: Blob) => {
    setState('processing');
    setTranscription('');
    setMatches([]);

    try {
      const result = await voiceSearchQuran(audioBlob);

      setTranscription(result.transcription);
      setMatches(result.matches);

      if (result.matches.length === 0) {
        setErrorMessage('No Quran verses detected. Please try reciting again more clearly.');
        setState('error');
      } else {
        setState('results');
      }
    } catch (error) {
      console.error('Voice search failed:', error);
      setErrorMessage('Failed to process audio. Please try again.');
      setState('error');
    }
  };

  const handlePlayVerse = async (surahNumber: number, verseNumber: number) => {
    if (playingVerse?.surah === surahNumber && playingVerse?.verse === verseNumber) {
      audioManager.stop();
      setPlayingVerse(null);
    } else {
      await audioManager.playVerse(surahNumber, verseNumber);
      setPlayingVerse({ surah: surahNumber, verse: verseNumber });

      // Stop playing when audio ends
      audioManager.onEnded(() => {
        setPlayingVerse(null);
      });
    }
  };

  const handleNavigateToVerse = (surahNumber: number, verseNumber: number) => {
    if (onNavigateToVerse) {
      onNavigateToVerse(surahNumber, verseNumber);
    }
  };

  const reset = () => {
    setState('idle');
    setTranscription('');
    setMatches([]);
    setErrorMessage('');
    setRecordingTime(0);
    setPlayingVerse(null);
    audioManager.stop();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-rose-700 rounded-full flex items-center justify-center">
              <i className="fas fa-microphone text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-3xl font-serif text-rose-900">Voice Search</h2>
              <p className="text-stone-600">Shazam for Quran - Find verses by reciting</p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <i className="fas fa-info-circle text-amber-600 mt-0.5"></i>
              <p className="text-sm text-amber-800">
                Tap the microphone to start recording, recite a verse from the Quran, then tap again to stop.
                We'll identify which verse you recited!
              </p>
            </div>
          </div>
        </div>

        {/* Main Recording Interface */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {/* Waveform Visualization */}
          {state === 'recording' && (
            <div className="mb-6">
              <canvas
                ref={canvasRef}
                width={600}
                height={120}
                className="w-full h-32 rounded-lg bg-stone-50"
              />
              <div className="text-center mt-4">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-900 rounded-full font-medium">
                  <span className="w-2 h-2 bg-rose-600 rounded-full animate-pulse"></span>
                  Recording: {formatTime(recordingTime)}
                </span>
              </div>
            </div>
          )}

          {/* Recording Button */}
          <div className="flex flex-col items-center justify-center">
            <button
              onClick={() => {
                if (state === 'idle' || state === 'results' || state === 'error') {
                  startRecording();
                } else if (state === 'recording') {
                  stopRecording();
                }
              }}
              disabled={state === 'processing'}
              className={`
                w-32 h-32 rounded-full shadow-2xl transition-all duration-300 transform
                flex items-center justify-center
                ${state === 'idle' || state === 'results' || state === 'error'
                  ? 'bg-gradient-to-br from-rose-500 to-rose-700 hover:from-rose-600 hover:to-rose-800 hover:scale-105'
                  : state === 'recording'
                  ? 'bg-gradient-to-br from-red-500 to-red-700 animate-pulse hover:scale-105'
                  : 'bg-stone-300 cursor-not-allowed'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {state === 'processing' ? (
                <i className="fas fa-spinner fa-spin text-white text-4xl"></i>
              ) : state === 'recording' ? (
                <i className="fas fa-stop text-white text-4xl"></i>
              ) : (
                <i className="fas fa-microphone text-white text-4xl"></i>
              )}
            </button>

            {/* State Messages */}
            <div className="mt-6 text-center">
              {state === 'idle' && (
                <p className="text-stone-600 text-lg">Tap to start recording</p>
              )}
              {state === 'recording' && (
                <p className="text-rose-700 text-lg font-medium">Listening... Recite a verse</p>
              )}
              {state === 'processing' && (
                <div className="space-y-2">
                  <p className="text-rose-700 text-lg font-medium">Processing your recitation...</p>
                  <p className="text-stone-500 text-sm">Using AI to identify the verse</p>
                </div>
              )}
            </div>
          </div>

          {/* Transcription Display */}
          {transcription && state !== 'idle' && (
            <div className="mt-8 p-4 bg-stone-50 rounded-lg border border-stone-200">
              <h4 className="text-sm font-semibold text-stone-600 mb-2">What we heard:</h4>
              <p className="text-xl font-amiri text-stone-800 text-right" dir="rtl">
                {transcription}
              </p>
            </div>
          )}
        </div>

        {/* Error State */}
        {state === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 mb-1">Error</h4>
                <p className="text-red-700">{errorMessage}</p>
                <button
                  onClick={reset}
                  className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {state === 'results' && matches.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-serif text-rose-900">
                Found {matches.length} {matches.length === 1 ? 'Match' : 'Matches'}
              </h3>
              <button
                onClick={reset}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <i className="fas fa-redo"></i>
                Search Again
              </button>
            </div>

            {matches.map((match, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md border border-stone-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Match Header */}
                <div className="bg-gradient-to-r from-rose-50 to-amber-50 p-4 border-b border-stone-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-rose-700 rounded-full flex items-center justify-center text-white font-bold">
                        {match.surahNumber}
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-800">
                          Surah {match.surahName}
                        </h4>
                        <p className="text-sm text-stone-600">
                          Verse {match.verseNumber}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-stone-600">Match:</span>
                        <div className="relative w-20 h-2 bg-stone-200 rounded-full overflow-hidden">
                          <div
                            className={`absolute inset-y-0 left-0 rounded-full ${
                              match.confidence >= 80
                                ? 'bg-emerald-500'
                                : match.confidence >= 60
                                ? 'bg-amber-500'
                                : 'bg-orange-500'
                            }`}
                            style={{ width: `${match.confidence}%` }}
                          />
                        </div>
                        <span className="font-bold text-stone-700">{match.confidence}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arabic Text */}
                <div className="p-6 border-b border-stone-100">
                  <p className="text-2xl font-amiri leading-loose text-stone-900 text-right mb-4" dir="rtl">
                    {match.arabic}
                  </p>
                </div>

                {/* Translation */}
                <div className="p-6 bg-stone-50">
                  <p className="text-lg text-stone-700 leading-relaxed">
                    {match.translation}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="p-4 bg-white border-t border-stone-200 flex gap-3">
                  <button
                    onClick={() => handlePlayVerse(match.surahNumber, match.verseNumber)}
                    className={`
                      flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2
                      ${playingVerse?.surah === match.surahNumber && playingVerse?.verse === match.verseNumber
                        ? 'bg-amber-500 text-white'
                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                      }
                    `}
                  >
                    <i className={`fas ${playingVerse?.surah === match.surahNumber && playingVerse?.verse === match.verseNumber ? 'fa-pause' : 'fa-play'}`}></i>
                    {playingVerse?.surah === match.surahNumber && playingVerse?.verse === match.verseNumber ? 'Pause' : 'Play Verse'}
                  </button>
                  {onNavigateToVerse && (
                    <button
                      onClick={() => handleNavigateToVerse(match.surahNumber, match.verseNumber)}
                      className="flex-1 py-3 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-book-open"></i>
                      Read in Context
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feature Tips */}
        {state === 'idle' && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: 'fa-microphone-alt',
                title: 'High Quality',
                description: 'Uses advanced AI to recognize Quran recitation'
              },
              {
                icon: 'fa-waveform-lines',
                title: 'Real-time Feedback',
                description: 'See your audio waveform as you recite'
              },
              {
                icon: 'fa-bullseye',
                title: 'Accurate Matching',
                description: 'Get confidence scores for each match'
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 border border-stone-200 text-center">
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className={`fas ${feature.icon} text-rose-600 text-xl`}></i>
                </div>
                <h4 className="font-semibold text-stone-800 mb-2">{feature.title}</h4>
                <p className="text-sm text-stone-600">{feature.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceSearch;
