import React, { useState } from 'react';

type Mode = 'login' | 'signup';

interface ParentGateProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthed: (token: string, parentName: string) => void;
}

const ParentGate: React.FC<ParentGateProps> = ({ isOpen, onClose, onAuthed }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      onAuthed(data.token, data.parent?.name || name);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-rose-900">{mode === 'login' ? 'Parent Login' : 'Create Parent PIN'}</h2>
          <button onClick={onClose} className="text-stone-500 hover:text-rose-700">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <p className="text-sm text-stone-500">Parents can manage settings; kids can enter freely without a PIN.</p>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-600">Name</label>
          <input
            className="w-full border border-stone-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-rose-500 outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Parent name"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-600">PIN (4+ digits)</label>
          <input
            className="w-full border border-stone-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-rose-500 outline-none"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN"
            inputMode="numeric"
            maxLength={8}
          />
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>}

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-sm text-rose-700 hover:underline"
          >
            {mode === 'login' ? 'Create account' : 'I already have a PIN'}
          </button>
          <button
            onClick={submit}
            disabled={!name || !pin || loading}
            className="px-4 py-2 rounded-xl bg-rose-900 text-white shadow-md hover:bg-rose-800 disabled:opacity-50"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Save PIN'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParentGate;
