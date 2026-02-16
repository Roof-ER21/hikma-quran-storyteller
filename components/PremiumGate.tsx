import React, { useState, useEffect } from 'react';
import {
  checkPremiumStatus,
  getOfferings,
  openSubscriptionManagement,
  purchasePackage,
  restorePurchases,
} from '../services/subscriptionService';
import { Capacitor } from '@capacitor/core';

interface PremiumGateProps {
  feature: 'tutor' | 'kids' | 'scholar';
  usesRemaining?: number;
  children: React.ReactNode;
  onUpgraded?: () => void;
}

const FEATURE_INFO = {
  tutor: {
    title: 'Unlock Unlimited AI Tutor',
    description: 'Get unlimited AI tutor sessions for deeper Quranic learning.',
    icon: '\u{1F393}',
  },
  kids: {
    title: 'Unlock All Kids Content',
    description: 'Give your children unlimited access to interactive Quranic stories.',
    icon: '\u{1F31F}',
  },
  scholar: {
    title: 'Quran Scholar Premium',
    description: 'Access all reciters, annotation tools, and advanced features.',
    icon: '\u{1F4D6}',
  },
};

const PremiumGate: React.FC<PremiumGateProps> = ({
  feature,
  usesRemaining,
  children,
  onUpgraded,
}) => {
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [offerings, setOfferings] = useState<any>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isNative = Capacitor.isNativePlatform();
  const info = FEATURE_INFO[feature];

  useEffect(() => {
    checkPremiumStatus().then(setIsPremium);
  }, []);

  if (isPremium === null) return null; // Loading
  if (isPremium) return <>{children}</>; // Premium user, no gate

  const handleShowPaywall = async () => {
    setShowPaywall(true);
    setError(null);
    setStatusMessage(null);
    if (isNative) {
      const off = await getOfferings();
      setOfferings(off);
    }
  };

  const handlePurchase = async (pkg: any) => {
    setPurchasing(true);
    setError(null);
    setStatusMessage(null);
    try {
      const success = await purchasePackage(pkg);
      if (success) {
        setStatusMessage('Subscription activated successfully.');
        setIsPremium(true);
        setShowPaywall(false);
        onUpgraded?.();
      }
    } catch (e: any) {
      setError(e.message || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (!isNative) {
      setError('Restore is available in the iOS/Android app after signing in with the same store account.');
      return;
    }

    setRestoring(true);
    setError(null);
    setStatusMessage(null);
    try {
      const success = await restorePurchases();
      if (success) {
        setStatusMessage('Purchase restored successfully.');
        setIsPremium(true);
        setShowPaywall(false);
        onUpgraded?.();
      } else {
        setError('No active subscription found');
      }
    } catch (e: any) {
      setError(e.message || 'Restore failed');
    } finally {
      setRestoring(false);
    }
  };

  const handleManageSubscription = () => {
    setError(null);
    setStatusMessage('Opening subscription management...');
    openSubscriptionManagement();
  };

  // Inline upgrade prompt (shown in content area)
  if (!showPaywall) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        {children}
        {usesRemaining !== undefined && usesRemaining <= 0 && (
          <div className="mt-6 bg-gradient-to-br from-amber-50 to-rose-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-6 max-w-md w-full text-center shadow-lg border border-amber-200/50 dark:border-amber-700/30">
            <div className="text-4xl mb-3">{info.icon}</div>
            <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">
              {info.title}
            </h3>
            <p className="text-stone-600 dark:text-stone-300 text-sm mb-4">
              {info.description}
            </p>
            <button
              onClick={handleShowPaywall}
              className="w-full py-3 px-6 bg-gradient-to-r from-rose-600 to-amber-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300"
            >
              Upgrade Now
            </button>
            <button
              onClick={handleRestore}
              disabled={restoring}
              className="mt-2 text-sm text-stone-500 dark:text-stone-400 underline"
            >
              {restoring ? 'Restoring...' : 'Restore Purchase'}
            </button>
            <button
              onClick={handleManageSubscription}
              className="mt-2 block w-full text-sm text-stone-500 dark:text-stone-400 underline"
            >
              Manage Subscription
            </button>
          </div>
        )}
      </div>
    );
  }

  // Full paywall modal
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 max-h-screen-safe overflow-y-auto">
        <div className="text-center">
          <div className="text-5xl mb-3">{info.icon}</div>
          <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            {info.title}
          </h2>
          <p className="text-stone-600 dark:text-stone-300 mt-2">
            {info.description}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg text-sm text-center">
            {error}
          </div>
        )}
        {statusMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-lg text-sm text-center">
            {statusMessage}
          </div>
        )}

        <div className="bg-stone-50 dark:bg-slate-700/40 rounded-xl p-3 text-xs text-stone-600 dark:text-stone-300 space-y-1">
          <p><i className="fas fa-check-circle mr-1 text-emerald-600"></i>Cancel anytime in your App Store / Play subscriptions.</p>
          <p><i className="fas fa-check-circle mr-1 text-emerald-600"></i>No hidden charges. Store pricing is shown before purchase.</p>
          <p><i className="fas fa-check-circle mr-1 text-emerald-600"></i>Restore purchases any time on a new device.</p>
        </div>

        {isNative && offerings?.current?.availablePackages ? (
          <div className="space-y-3">
            {offerings.current.availablePackages.map((pkg: any) => (
              <button
                key={pkg.identifier}
                onClick={() => handlePurchase(pkg)}
                disabled={purchasing}
                className="w-full p-4 bg-gradient-to-r from-rose-50 to-amber-50 dark:from-slate-700 dark:to-slate-600 border-2 border-rose-200 dark:border-amber-700/50 rounded-xl text-left hover:border-rose-400 transition-all"
              >
                <div className="font-semibold text-stone-800 dark:text-stone-100">
                  {pkg.product.title}
                </div>
                <div className="text-sm text-stone-600 dark:text-stone-300">
                  {pkg.product.priceString}
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Auto-renewing subscription billed by {Capacitor.getPlatform() === 'ios' ? 'Apple' : 'Google'}.
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-stone-600 dark:text-stone-300 text-sm">
              {isNative
                ? 'Loading plans...'
                : 'In-app purchases are available in the iOS app. Download from the App Store to subscribe.'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
          <button
            onClick={handleRestore}
            disabled={restoring}
            className="py-2 text-sm text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-600 rounded-lg hover:bg-stone-50 dark:hover:bg-slate-700"
          >
            {restoring ? 'Restoring...' : 'Restore Purchase'}
          </button>
          <button
            onClick={handleManageSubscription}
            className="py-2 text-sm text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-600 rounded-lg hover:bg-stone-50 dark:hover:bg-slate-700"
          >
            Manage
          </button>
          <button
            onClick={() => setShowPaywall(false)}
            className="py-2 text-sm text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-600 rounded-lg hover:bg-stone-50 dark:hover:bg-slate-700"
          >
            Maybe Later
          </button>
        </div>
        <p className="text-[11px] text-center text-stone-500 dark:text-stone-400">
          Premium helps fund ad-free kids learning and continuous reliability improvements.
        </p>
      </div>
    </div>
  );
};

export default PremiumGate;
