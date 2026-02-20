import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

type Mode = 'login' | 'signup';

interface ParentGateProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthed: (token: string, parentName: string, remember: boolean) => void;
}

interface LocalParentAuthRecord {
  name: string;
  pinHash: string;
  createdAt: string;
}

const LOCAL_PARENT_AUTH_KEY = 'alayasoad_local_parent_auth_v1';

const readLocalParentAuth = (): LocalParentAuthRecord | null => {
  try {
    const raw = localStorage.getItem(LOCAL_PARENT_AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalParentAuthRecord;
  } catch {
    return null;
  }
};

const writeLocalParentAuth = (record: LocalParentAuthRecord): void => {
  localStorage.setItem(LOCAL_PARENT_AUTH_KEY, JSON.stringify(record));
};

const hashPin = async (pinValue: string): Promise<string> => {
  try {
    if (window.crypto?.subtle) {
      const input = new TextEncoder().encode(`alayasoad:${pinValue}`);
      const digest = await window.crypto.subtle.digest('SHA-256', input);
      return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // Fall back to a deterministic string hash if subtle crypto is unavailable.
  }
  return btoa(`alayasoad:${pinValue}`);
};

const ParentGate: React.FC<ParentGateProps> = ({ isOpen, onClose, onAuthed }) => {
  const { t, i18n } = useTranslation('home');
  const isArabic = i18n.language === 'ar-EG';
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);
  const [coppaConsent, setCoppaConsent] = useState(false);
  const [aiTutorConsent, setAiTutorConsent] = useState(true);

  if (!isOpen) return null;

  const submit = async () => {
    setError(null);
    if (!name.trim() || !pin.trim()) {
      setError(t('parentGate.missingFields'));
      return;
    }
    if (mode === 'signup' && !coppaConsent) {
      setError(t('parentGate.consentRequired'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/parent/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pin })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      // Store COPPA consent preferences
      if (mode === 'signup') {
        localStorage.setItem('alayasoad_coppa_consent', 'true');
        localStorage.setItem('alayasoad_ai_tutor_enabled', aiTutorConsent ? 'true' : 'false');
        localStorage.setItem('alayasoad_sync_enabled', 'true');
      }
      onAuthed(data.token, data.parent?.name || name, remember);
      onClose();
    } catch (e: any) {
      // Native/embedded builds may not have backend auth endpoints available.
      // Fall back to local-only parent auth so Kids mode remains usable.
      try {
        const normalizedName = name.trim();
        const pinHash = await hashPin(pin.trim());
        const stored = readLocalParentAuth();

        if (mode === 'signup') {
          writeLocalParentAuth({
            name: normalizedName,
            pinHash,
            createdAt: new Date().toISOString(),
          });
          localStorage.setItem('alayasoad_coppa_consent', 'true');
          localStorage.setItem('alayasoad_ai_tutor_enabled', aiTutorConsent ? 'true' : 'false');
          localStorage.setItem('alayasoad_sync_enabled', 'true');
          onAuthed(`local-${Date.now()}`, normalizedName, remember);
          onClose();
          return;
        }

        const sameName = !!stored && stored.name.toLowerCase() === normalizedName.toLowerCase();
        const samePin = !!stored && stored.pinHash === pinHash;
        if (sameName && samePin) {
          onAuthed(`local-${Date.now()}`, stored.name, remember);
          onClose();
          return;
        }
      } catch {
        // Continue to user-facing error handling below.
      }

      const userFriendlyError =
        e.message?.includes('Invalid') || e.message?.includes('incorrect')
          ? t('parentGate.invalidCredentials')
          : t('parentGate.error');
      setError(userFriendlyError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[calc((var(--app-vh,1vh)*100)-2rem)] overflow-y-auto mobile-scroll ${isArabic ? 'text-right' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="flex justify-between items-center">
          <h2 className={`text-2xl font-bold text-rose-900 ${isArabic ? 'font-arabic' : ''}`}>
            {mode === 'login' ? t('parentGate.parentLogin') : t('parentGate.createPIN')}
          </h2>
          <button onClick={onClose} className="text-stone-500 hover:text-rose-700">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <p className={`text-sm text-stone-500 ${isArabic ? 'font-arabic' : ''}`}>
          {t('parentGate.manageSettings')}
        </p>

        <div className="space-y-2">
          <label className={`text-sm font-semibold text-stone-600 ${isArabic ? 'font-arabic' : ''}`}>
            {t('parentGate.nameLabel')}
          </label>
          <input
            className={`w-full border border-stone-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-rose-500 outline-none ${isArabic ? 'text-right' : ''}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('parentGate.parentName')}
            dir={isArabic ? 'rtl' : 'ltr'}
          />
        </div>
        <div className="space-y-2">
          <label className={`text-sm font-semibold text-stone-600 ${isArabic ? 'font-arabic' : ''}`}>
            {t('parentGate.pinLabel')}
          </label>
          <input
            className={`w-full border border-stone-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-rose-500 outline-none ${isArabic ? 'text-right' : ''}`}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder={t('parentGate.enterPIN')}
            inputMode="numeric"
            maxLength={8}
            dir="ltr"
          />
        </div>

        <label className={`flex items-center gap-2 text-sm text-stone-600 ${isArabic ? 'flex-row-reverse font-arabic' : ''}`}>
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 text-rose-600 rounded border-stone-300"
          />
          {t('parentGate.rememberMe')}
        </label>

        {mode === 'signup' && (
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <label className={`flex items-start gap-2 text-xs text-stone-600 ${isArabic ? 'flex-row-reverse font-arabic' : ''}`}>
              <input
                type="checkbox"
                checked={coppaConsent}
                onChange={(e) => setCoppaConsent(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-rose-600 rounded border-stone-300 flex-shrink-0"
              />
              <span>
                {t('parentGate.coppaConsentText')}
              </span>
            </label>
            <label className={`flex items-start gap-2 text-xs text-stone-600 ${isArabic ? 'flex-row-reverse font-arabic' : ''}`}>
              <input
                type="checkbox"
                checked={aiTutorConsent}
                onChange={(e) => setAiTutorConsent(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-rose-600 rounded border-stone-300 flex-shrink-0"
              />
              <span>
                {t('parentGate.aiTutorConsentText')}
              </span>
            </label>
          </div>
        )}

        {error && <div className={`text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 ${isArabic ? 'font-arabic text-right' : ''}`}>{error}</div>}

        <div className={`flex items-center justify-between gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className={`text-sm text-rose-700 hover:underline ${isArabic ? 'font-arabic' : ''}`}
          >
            {mode === 'login' ? t('parentGate.createAccount') : t('parentGate.alreadyHavePIN')}
          </button>
          <button
            onClick={submit}
            disabled={!name || !pin || loading}
            className={`px-4 py-2 rounded-xl bg-rose-900 text-white shadow-md hover:bg-rose-800 disabled:opacity-50 ${isArabic ? 'font-arabic' : ''}`}
          >
            {loading ? t('parentGate.pleaseWait') : mode === 'login' ? t('parentGate.login') : t('parentGate.savePIN')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParentGate;
