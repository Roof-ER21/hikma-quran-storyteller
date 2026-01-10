import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

type Mode = 'login' | 'signup';

interface ParentGateProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthed: (token: string, parentName: string, remember: boolean) => void;
}

const ParentGate: React.FC<ParentGateProps> = ({ isOpen, onClose, onAuthed }) => {
  const { t, i18n } = useTranslation('home');
  const isArabic = i18n.language === 'ar-EG';
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);

  if (!isOpen) return null;

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/parent/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pin })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      onAuthed(data.token, data.parent?.name || name, remember);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 ${isArabic ? 'text-right' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
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

        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>}

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
