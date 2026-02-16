/**
 * AI Provider Settings Component
 * Manage AI provider modes, view status, and run health checks
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getAllProviderStatus,
  checkAllProviders,
  setCostPreference,
  getCostPreference,
  type ProviderStatus,
  type CostPreference,
  type AIProviderType,
  type AICapability
} from '../../services/ai';
import { getFallbackChain, providerSupports } from '../../services/ai/config/fallbackChains';

interface AIProviderSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

// Provider display info
const PROVIDER_INFO: Record<AIProviderType, { name: string; icon: string; color: string }> = {
  gemini: { name: 'Google Gemini', icon: 'fa-google', color: 'text-blue-500' },
  openai: { name: 'OpenAI', icon: 'fa-robot', color: 'text-green-500' },
  groq: { name: 'Groq', icon: 'fa-bolt', color: 'text-orange-500' },
  ollama: { name: 'Ollama (Local)', icon: 'fa-server', color: 'text-purple-500' },
  huggingface: { name: 'HuggingFace', icon: 'fa-face-smile', color: 'text-yellow-500' }
};

// Capability icons
const CAPABILITY_ICONS: Record<AICapability, string> = {
  text: 'fa-comment',
  tts: 'fa-volume-up',
  stt: 'fa-microphone',
  image: 'fa-image',
  'live-audio': 'fa-podcast'
};

// Mode descriptions
const MODE_INFO: Record<CostPreference | 'kids', { name: string; nameAr: string; description: string; descriptionAr: string; icon: string }> = {
  quality: {
    name: 'Quality',
    nameAr: 'جودة عالية',
    description: 'Best results, higher cost',
    descriptionAr: 'أفضل النتائج، تكلفة أعلى',
    icon: 'fa-crown'
  },
  balanced: {
    name: 'Balanced',
    nameAr: 'متوازن',
    description: 'Good quality, reasonable cost',
    descriptionAr: 'جودة جيدة، تكلفة معقولة',
    icon: 'fa-balance-scale'
  },
  budget: {
    name: 'Budget',
    nameAr: 'اقتصادي',
    description: 'Minimize cost, use local models',
    descriptionAr: 'تقليل التكلفة، استخدام النماذج المحلية',
    icon: 'fa-piggy-bank'
  },
  kids: {
    name: 'Kids Mode',
    nameAr: 'وضع الأطفال',
    description: 'Reliability & safety priority',
    descriptionAr: 'الأولوية للموثوقية والأمان',
    icon: 'fa-child'
  }
};

export const AIProviderSettings: React.FC<AIProviderSettingsProps> = ({
  isOpen,
  onClose
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ar-EG';
  const language = isRTL ? 'ar' : 'en';

  // State
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [currentMode, setCurrentMode] = useState<CostPreference | 'kids'>(getCostPreference());
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [selectedCapability, setSelectedCapability] = useState<AICapability>('text');

  // Load provider status
  useEffect(() => {
    if (isOpen) {
      setProviders(getAllProviderStatus());
      setCurrentMode(getCostPreference());
    }
  }, [isOpen]);

  // Run health check
  const runHealthCheck = useCallback(async () => {
    setIsChecking(true);
    try {
      const results = await checkAllProviders();
      setProviders(results);
      setLastCheckTime(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Handle mode change
  const handleModeChange = useCallback((mode: CostPreference | 'kids') => {
    setCurrentMode(mode);
    setCostPreference(mode);
  }, []);

  // Get fallback chain for current mode and capability
  const fallbackChain = getFallbackChain(selectedCapability, currentMode);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`
          relative w-full max-w-2xl max-h-screen-safe
          bg-white rounded-2xl shadow-2xl
          flex flex-col overflow-hidden
          ${isRTL ? 'rtl' : 'ltr'}
        `}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <i className="fas fa-cogs text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">
                {language === 'ar' ? 'إعدادات الذكاء الاصطناعي' : 'AI Provider Settings'}
              </h2>
              <p className="text-white/80 text-xs">
                {language === 'ar' ? 'إدارة مزودي الذكاء الاصطناعي' : 'Manage AI providers and fallback'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Close"
          >
            <i className="fas fa-times text-white text-lg"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Mode Selection */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <i className="fas fa-sliders-h text-indigo-600"></i>
              {language === 'ar' ? 'وضع التشغيل' : 'Operating Mode'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {(['quality', 'balanced', 'budget', 'kids'] as const).map((mode) => {
                const info = MODE_INFO[mode];
                const isActive = currentMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => handleModeChange(mode)}
                    className={`
                      p-4 rounded-xl border-2 transition-all text-left
                      ${isActive
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-indigo-300'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <i className={`fas ${info.icon} ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}></i>
                      <span className={`font-semibold ${isActive ? 'text-indigo-700' : 'text-gray-700'}`}>
                        {language === 'ar' ? info.nameAr : info.name}
                      </span>
                      {isActive && (
                        <i className="fas fa-check-circle text-indigo-600 ml-auto"></i>
                      )}
                    </div>
                    <p className={`text-xs ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}>
                      {language === 'ar' ? info.descriptionAr : info.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Provider Status */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <i className="fas fa-server text-indigo-600"></i>
                {language === 'ar' ? 'حالة المزودين' : 'Provider Status'}
              </h3>
              <button
                onClick={runHealthCheck}
                disabled={isChecking}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${isChecking
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                  }
                `}
              >
                {isChecking ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-1"></i>
                    {language === 'ar' ? 'جاري الفحص...' : 'Checking...'}
                  </>
                ) : (
                  <>
                    <i className="fas fa-sync-alt mr-1"></i>
                    {language === 'ar' ? 'فحص الصحة' : 'Health Check'}
                  </>
                )}
              </button>
            </div>

            {lastCheckTime && (
              <p className="text-xs text-gray-500 mb-2">
                {language === 'ar' ? 'آخر فحص: ' : 'Last check: '}
                {lastCheckTime.toLocaleTimeString()}
              </p>
            )}

            <div className="space-y-2">
              {providers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-info-circle text-2xl mb-2"></i>
                  <p>{language === 'ar' ? 'لم يتم تكوين أي مزود' : 'No providers configured'}</p>
                  <p className="text-xs mt-1">
                    {language === 'ar'
                      ? 'أضف مفاتيح API في ملف .env.local'
                      : 'Add API keys in .env.local file'}
                  </p>
                </div>
              ) : (
                providers.map((status) => {
                  const info = PROVIDER_INFO[status.provider];
                  return (
                    <div
                      key={status.provider}
                      className={`
                        p-3 rounded-lg border flex items-center justify-between
                        ${status.healthy
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${status.healthy ? 'bg-green-100' : 'bg-red-100'}`}>
                          <i className={`fab ${info.icon} ${info.color}`}></i>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{info.name}</p>
                          <div className="flex items-center gap-2 text-xs">
                            {/* Capability badges */}
                            {(['text', 'tts', 'stt', 'image', 'live-audio'] as AICapability[]).map((cap) => {
                              const supported = providerSupports(status.provider, cap);
                              return (
                                <span
                                  key={cap}
                                  className={`
                                    px-1.5 py-0.5 rounded
                                    ${supported
                                      ? 'bg-indigo-100 text-indigo-700'
                                      : 'bg-gray-100 text-gray-400'
                                    }
                                  `}
                                  title={cap}
                                >
                                  <i className={`fas ${CAPABILITY_ICONS[cap]} text-xs`}></i>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`flex items-center gap-1 ${status.healthy ? 'text-green-600' : 'text-red-600'}`}>
                          <i className={`fas ${status.healthy ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                          <span className="text-sm font-medium">
                            {status.healthy
                              ? (language === 'ar' ? 'متصل' : 'Online')
                              : (language === 'ar' ? 'غير متصل' : 'Offline')
                            }
                          </span>
                        </div>
                        {status.latencyMs && (
                          <p className="text-xs text-gray-500">
                            {status.latencyMs}ms
                          </p>
                        )}
                        {status.error && (
                          <p className="text-xs text-red-500 truncate max-w-[150px]">
                            {status.error}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Fallback Chain Visualization */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <i className="fas fa-sitemap text-indigo-600"></i>
              {language === 'ar' ? 'ترتيب الأولوية' : 'Fallback Order'}
            </h3>

            {/* Capability selector */}
            <div className="flex flex-wrap gap-2 mb-3">
              {(['text', 'tts', 'stt', 'image', 'live-audio'] as AICapability[]).map((cap) => (
                <button
                  key={cap}
                  onClick={() => setSelectedCapability(cap)}
                  className={`
                    px-3 py-1.5 rounded-full text-sm font-medium transition-all
                    ${selectedCapability === cap
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  <i className={`fas ${CAPABILITY_ICONS[cap]} mr-1`}></i>
                  {cap === 'live-audio' ? 'Live' : cap.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Chain visualization */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg overflow-x-auto">
              {fallbackChain.map((provider, idx) => {
                const info = PROVIDER_INFO[provider];
                const status = providers.find(p => p.provider === provider);
                return (
                  <React.Fragment key={provider}>
                    <div
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg
                        ${status?.healthy
                          ? 'bg-white border border-green-200'
                          : status
                            ? 'bg-red-50 border border-red-200 opacity-60'
                            : 'bg-gray-100 border border-gray-200 opacity-40'
                        }
                      `}
                    >
                      <span className="text-xs text-gray-400 font-bold">{idx + 1}</span>
                      <i className={`fab ${info.icon} ${info.color}`}></i>
                      <span className="text-sm font-medium">{provider}</span>
                    </div>
                    {idx < fallbackChain.length - 1 && (
                      <i className="fas fa-arrow-right text-gray-300"></i>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {language === 'ar'
                ? 'إذا فشل المزود الأول، سيتم تجربة المزود التالي تلقائياً'
                : 'If the first provider fails, the next one will be tried automatically'}
            </p>
          </section>

          {/* API Configuration Info */}
          <section className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
              <i className="fas fa-key"></i>
              {language === 'ar' ? 'تكوين المفاتيح' : 'API Key Configuration'}
            </h4>
            <p className="text-sm text-amber-700 mb-2">
              {language === 'ar'
                ? 'أضف مفاتيح API في ملف .env.local:'
                : 'Add API keys in your .env.local file:'}
            </p>
            <pre className="bg-amber-100 p-2 rounded text-xs text-amber-900 overflow-x-auto">
{`VITE_GEMINI_API_KEY=your_key
VITE_OPENAI_API_KEY=your_key
VITE_GROQ_API_KEY=your_key
VITE_HUGGINGFACE_API_KEY=your_key
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_AI_COST_PREFERENCE=balanced`}
            </pre>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            {language === 'ar' ? 'تم' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Settings button component for easy integration
interface AISettingsButtonProps {
  onClick: () => void;
  className?: string;
}

export const AISettingsButton: React.FC<AISettingsButtonProps> = ({
  onClick,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        p-2 rounded-full bg-indigo-100 text-indigo-600
        hover:bg-indigo-200 transition-colors
        ${className}
      `}
      aria-label="AI Settings"
      title="AI Provider Settings"
    >
      <i className="fas fa-cogs"></i>
    </button>
  );
};

// Wrapper component that includes the button and modal
export const AISettingsWrapper: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <AISettingsButton onClick={() => setIsOpen(true)} />
      <AIProviderSettings isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default AIProviderSettings;
