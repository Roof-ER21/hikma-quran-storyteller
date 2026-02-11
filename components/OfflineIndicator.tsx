import React, { useState, useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { useTranslation } from 'react-i18next';

interface OfflineIndicatorProps {
  onDownloadClick?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onDownloadClick }) => {
  const { t, i18n } = useTranslation('common');
  const isArabic = i18n.language === 'ar-EG';
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [updateSW, setUpdateSW] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    // Register service worker and handle updates
    const updateServiceWorker = registerSW({
      onNeedRefresh() {
        setShowUpdateBanner(true);
      },
      onOfflineReady() {
        // App ready for offline use
      },
    });

    setUpdateSW(() => updateServiceWorker);

    // Online/Offline detection
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineBanner(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setShowOfflineBanner(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleUpdate = async () => {
    if (updateSW) {
      await updateSW();
      setShowUpdateBanner(false);
    }
  };

  return (
    <>
      {/* Offline Banner */}
      {showOfflineBanner && (
        <div role="alert" className={`fixed top-0 left-0 right-0 bg-amber-500 text-white px-4 py-2 z-50 flex items-center justify-between shadow-lg ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <i className="fas fa-wifi-slash"></i>
            <span className="text-sm font-medium">{t('status.offline')}</span>
            <span className="text-xs opacity-80">- {t('offline.cachedAvailable')}</span>
          </div>
          {onDownloadClick && (
            <button
              onClick={onDownloadClick}
              className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
            >
              {t('offline.manageDownloads')}
            </button>
          )}
        </div>
      )}

      {/* Update Available Banner */}
      {showUpdateBanner && (
        <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-blue-600 text-white rounded-xl shadow-2xl p-4 z-50 animate-slide-up ${isArabic ? 'text-right' : ''}`}>
          <div className={`flex items-start gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fas fa-arrow-up"></i>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">{t('offline.updateAvailable')}</h4>
              <p className="text-sm text-blue-100 mb-3">
                {t('offline.updateMessage')}
              </p>
              <div className={`flex gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <button
                  onClick={handleUpdate}
                  className="bg-white text-blue-600 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                  {t('offline.updateNow')}
                </button>
                <button
                  onClick={() => setShowUpdateBanner(false)}
                  className="text-white/80 hover:text-white px-3 py-1.5 text-sm transition-colors"
                >
                  {t('offline.later')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Online/Offline Status Indicator (subtle) */}
      <div
        className={`fixed bottom-4 right-4 w-3 h-3 rounded-full transition-all duration-300 z-40 ${
          isOnline ? 'bg-green-500' : 'bg-amber-500 animate-pulse'
        }`}
        title={isOnline ? t('status.online') : t('status.offline')}
      />
    </>
  );
};

// PWA Install Prompt Component
interface InstallPromptProps {
  onInstall?: () => void;
}

export const PWAInstallPrompt: React.FC<InstallPromptProps> = ({ onInstall }) => {
  const { t, i18n } = useTranslation('common');
  const isArabic = i18n.language === 'ar-EG';
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Show prompt after a delay (don't be too aggressive)
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const dismissedAt = dismissed ? parseInt(dismissed) : 0;
      const daysSinceDismissed = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);

      if (!dismissed || daysSinceDismissed > 7) {
        setTimeout(() => setShowPrompt(true), 30000); // Show after 30 seconds
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      onInstall?.();
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <div className={`fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-rose-700 to-rose-800 text-white rounded-2xl shadow-2xl p-5 z-50 animate-slide-up ${isArabic ? 'text-right' : ''}`}>
      <button
        onClick={handleDismiss}
        className={`absolute top-3 ${isArabic ? 'left-3' : 'right-3'} text-white/60 hover:text-white`}
      >
        <i className="fas fa-times"></i>
      </button>

      <div className={`flex items-start gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
        <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
          <img
            src="/icons/icon.svg"
            alt="Hikma"
            className="w-10 h-10"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">{t('pwa.installTitle')}</h3>
          <p className="text-rose-200 text-sm mb-4">
            {t('pwa.installMessage')}
          </p>
          <div className={`flex gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={handleInstall}
              className={`bg-white text-rose-700 px-5 py-2 rounded-lg font-semibold hover:bg-rose-50 transition-colors flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}
            >
              <i className="fas fa-plus"></i>
              {t('pwa.install')}
            </button>
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white px-4 py-2 transition-colors"
            >
              {t('pwa.notNow')}
            </button>
          </div>
        </div>
      </div>

      {/* Feature highlights */}
      <div className="mt-4 pt-4 border-t border-white/20 flex justify-around text-center">
        <div>
          <i className="fas fa-bolt text-amber-300 mb-1"></i>
          <p className="text-xs text-rose-200">{t('pwa.features.fast')}</p>
        </div>
        <div>
          <i className="fas fa-wifi-slash text-amber-300 mb-1"></i>
          <p className="text-xs text-rose-200">{t('pwa.features.offline')}</p>
        </div>
        <div>
          <i className="fas fa-bell text-amber-300 mb-1"></i>
          <p className="text-xs text-rose-200">{t('pwa.features.reminders')}</p>
        </div>
        <div>
          <i className="fas fa-moon text-amber-300 mb-1"></i>
          <p className="text-xs text-rose-200">{t('pwa.features.fullScreen')}</p>
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;
