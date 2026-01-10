import React, { useState, useEffect } from 'react';
import { getParentProfile, changeParentPin, syncProgressToServer, loadAndMergeServerProgress } from '../services/progressSyncService';
import ShareButton from './ShareButton';

interface ParentProfileProps {
  isOpen: boolean;
  onClose: () => void;
  parentName: string;
  onLogout: () => void;
}

// Level definitions matching KidsHome
const LEVELS = [
  { level: 1, name: 'Seedling', emoji: '🌱', starsRequired: 0 },
  { level: 2, name: 'Sprout', emoji: '🌿', starsRequired: 10 },
  { level: 3, name: 'Flower', emoji: '🌸', starsRequired: 25 },
  { level: 4, name: 'Tree', emoji: '🌳', starsRequired: 50 },
  { level: 5, name: 'Garden', emoji: '🏡', starsRequired: 100 },
  { level: 6, name: 'Forest', emoji: '🌲', starsRequired: 150 },
  { level: 7, name: 'Mountain', emoji: '🏔️', starsRequired: 200 },
  { level: 8, name: 'Sky', emoji: '🌤️', starsRequired: 300 },
  { level: 9, name: 'Stars', emoji: '✨', starsRequired: 400 },
  { level: 10, name: 'Jannah', emoji: '🌟', starsRequired: 500 },
];

// Badge definitions
const BADGE_INFO: Record<string, { name: string; emoji: string }> = {
  'letter-explorer': { name: 'Letter Explorer', emoji: '🔤' },
  'alphabet-champion': { name: 'Alphabet Champion', emoji: '🏆' },
  'quran-listener': { name: 'Quran Listener', emoji: '🎧' },
  'fatiha-star': { name: 'Fatiha Star', emoji: '⭐' },
  'story-lover': { name: 'Story Lover', emoji: '📚' },
  'streak-3': { name: '3-Day Streak', emoji: '🔥' },
  'star-collector': { name: 'Star Collector', emoji: '💫' },
};

export default function ParentProfile({ isOpen, onClose, parentName, onLogout }: ParentProfileProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [profile, setProfile] = useState<{
    progress: {
      totalStars: number;
      level: number;
      badges: string[];
      currentStreak: number;
      lastPlayDate: string | null;
    };
    summary: {
      lettersMastered: number;
      surahsCompleted: number;
      storiesCompleted: number;
    };
  } | null>(null);

  // PIN change state
  const [showPinChange, setShowPinChange] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);
  const [changingPin, setChangingPin] = useState(false);

  // Logout confirmation
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getParentProfile();
      if (data) {
        setProfile({
          progress: data.progress,
          summary: data.summary
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncProgressToServer();
      await loadAndMergeServerProgress();
      await loadProfile();
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handlePinChange = async () => {
    setPinError('');
    setPinSuccess(false);

    if (newPin.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }

    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }

    setChangingPin(true);
    const result = await changeParentPin(currentPin, newPin);
    setChangingPin(false);

    if (result.success) {
      setPinSuccess(true);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setTimeout(() => {
        setShowPinChange(false);
        setPinSuccess(false);
      }, 2000);
    } else {
      setPinError(result.error || 'Failed to change PIN');
    }
  };

  const getLevelInfo = (level: number) => {
    return LEVELS.find(l => l.level === level) || LEVELS[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 text-white p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <i className="fas fa-times text-lg"></i>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <i className="fas fa-user-shield text-3xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold">{parentName}</h2>
              <p className="text-rose-100 text-sm">Parent Account</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-rose-600 border-b-2 border-rose-600'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <i className="fas fa-chart-line mr-2"></i>
            Progress
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'text-rose-600 border-b-2 border-rose-600'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <i className="fas fa-cog mr-2"></i>
            Settings
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <i className="fas fa-spinner fa-spin text-2xl text-rose-600"></i>
                </div>
              ) : profile ? (
                <>
                  {/* Level & Stars */}
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{getLevelInfo(profile.progress.level).emoji}</span>
                        <div>
                          <p className="font-bold text-amber-900">{getLevelInfo(profile.progress.level).name}</p>
                          <p className="text-sm text-amber-700">Level {profile.progress.level}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-amber-900">{profile.progress.totalStars}</p>
                        <p className="text-xs text-amber-700">Total Stars</p>
                      </div>
                    </div>

                    {/* Progress to next level */}
                    {profile.progress.level < 10 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-amber-700 mb-1">
                          <span>Progress to {LEVELS[profile.progress.level]?.name}</span>
                          <span>{LEVELS[profile.progress.level]?.starsRequired - profile.progress.totalStars} stars to go</span>
                        </div>
                        <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, ((profile.progress.totalStars - LEVELS[profile.progress.level - 1].starsRequired) / (LEVELS[profile.progress.level].starsRequired - LEVELS[profile.progress.level - 1].starsRequired)) * 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-stone-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-stone-800">{profile.summary.lettersMastered}</p>
                      <p className="text-xs text-stone-500">Letters Mastered</p>
                    </div>
                    <div className="bg-stone-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-stone-800">{profile.summary.surahsCompleted}</p>
                      <p className="text-xs text-stone-500">Surahs Completed</p>
                    </div>
                    <div className="bg-stone-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-stone-800">{profile.summary.storiesCompleted}</p>
                      <p className="text-xs text-stone-500">Stories Done</p>
                    </div>
                  </div>

                  {/* Streak */}
                  {profile.progress.currentStreak > 0 && (
                    <div className="bg-orange-50 rounded-xl p-4 flex items-center gap-3">
                      <span className="text-3xl">🔥</span>
                      <div>
                        <p className="font-bold text-orange-900">{profile.progress.currentStreak} Day Streak!</p>
                        <p className="text-sm text-orange-700">Keep learning every day</p>
                      </div>
                    </div>
                  )}

                  {/* Badges */}
                  {profile.progress.badges && profile.progress.badges.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-stone-800 mb-3">Badges Earned</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.progress.badges.map(badgeId => {
                          const badge = BADGE_INFO[badgeId];
                          return badge ? (
                            <div
                              key={badgeId}
                              className="bg-purple-50 text-purple-800 px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5"
                            >
                              <span>{badge.emoji}</span>
                              <span>{badge.name}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Sync Button */}
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <i className={`fas ${syncing ? 'fa-spinner fa-spin' : 'fa-sync'}`}></i>
                    {syncing ? 'Syncing...' : 'Sync Progress'}
                  </button>
                </>
              ) : (
                <div className="text-center py-8 text-stone-500">
                  <i className="fas fa-exclamation-circle text-2xl mb-2"></i>
                  <p>Unable to load progress</p>
                  <button
                    onClick={loadProfile}
                    className="mt-2 text-rose-600 hover:text-rose-700"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              {/* Share App */}
              <div className="bg-stone-50 rounded-xl p-4">
                <h3 className="font-semibold text-stone-800 mb-2">Share with Friends</h3>
                <p className="text-sm text-stone-500 mb-3">
                  Share this app with other families
                </p>
                <ShareButton
                  type="app"
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                />
              </div>

              {/* Change PIN */}
              <div className="bg-stone-50 rounded-xl p-4">
                <h3 className="font-semibold text-stone-800 mb-2">Change PIN</h3>
                {!showPinChange ? (
                  <button
                    onClick={() => setShowPinChange(true)}
                    className="text-rose-600 hover:text-rose-700 text-sm font-medium"
                  >
                    Change your parent PIN
                  </button>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="password"
                      placeholder="Current PIN"
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-center text-lg tracking-widest"
                      maxLength={8}
                    />
                    <input
                      type="password"
                      placeholder="New PIN (4+ digits)"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-center text-lg tracking-widest"
                      maxLength={8}
                    />
                    <input
                      type="password"
                      placeholder="Confirm New PIN"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-center text-lg tracking-widest"
                      maxLength={8}
                    />
                    {pinError && (
                      <p className="text-red-600 text-sm">{pinError}</p>
                    )}
                    {pinSuccess && (
                      <p className="text-green-600 text-sm">PIN changed successfully!</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowPinChange(false);
                          setCurrentPin('');
                          setNewPin('');
                          setConfirmPin('');
                          setPinError('');
                        }}
                        className="flex-1 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg text-sm transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handlePinChange}
                        disabled={changingPin}
                        className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm transition-colors"
                      >
                        {changingPin ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Logout */}
              <div className="bg-red-50 rounded-xl p-4">
                <h3 className="font-semibold text-red-800 mb-2">Logout</h3>
                {!showLogoutConfirm ? (
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Sign out of parent account
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-red-700">
                      Are you sure you want to logout? Kids' progress will be saved locally.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowLogoutConfirm(false)}
                        className="flex-1 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg text-sm transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={onLogout}
                        className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
