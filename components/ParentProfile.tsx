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
  const [activeTab, setActiveTab] = useState<'overview' | 'report' | 'settings'>('overview');
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

  // Helper function to calculate weekly stats
  const getWeeklyStats = () => {
    if (!profile) return { daysActive: 0, estimatedMinutes: 0, newBadges: 0 };

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    // Calculate days active based on streak (simplified)
    const daysActive = profile.progress.currentStreak > 0
      ? Math.min(profile.progress.currentStreak, 7)
      : 0;

    // Estimate time: stars × 2 minutes
    const estimatedMinutes = profile.progress.totalStars * 2;

    // Count recent badges (simplified - all badges for now)
    const newBadges = profile.progress.badges?.length || 0;

    return { daysActive, estimatedMinutes, newBadges };
  };

  // Helper function to get upcoming milestones
  const getUpcomingMilestones = () => {
    if (!profile) return [];

    const milestones: string[] = [];

    // Next level milestone
    if (profile.progress.level < 10) {
      const nextLevel = LEVELS[profile.progress.level];
      const starsNeeded = nextLevel.starsRequired - profile.progress.totalStars;
      if (starsNeeded > 0) {
        milestones.push(`${starsNeeded} more star${starsNeeded !== 1 ? 's' : ''} to reach ${nextLevel.name} level ${nextLevel.emoji}`);
      }
    }

    // Letters milestone
    const lettersRemaining = 28 - profile.summary.lettersMastered;
    if (lettersRemaining > 0) {
      if (profile.summary.lettersMastered < 14) {
        milestones.push(`${14 - profile.summary.lettersMastered} more letter${14 - profile.summary.lettersMastered !== 1 ? 's' : ''} to master half the alphabet`);
      } else {
        milestones.push(`${lettersRemaining} more letter${lettersRemaining !== 1 ? 's' : ''} to complete the alphabet`);
      }
    }

    // Surahs milestone
    if (profile.summary.surahsCompleted < 10) {
      milestones.push(`${10 - profile.summary.surahsCompleted} more surah${10 - profile.summary.surahsCompleted !== 1 ? 's' : ''} to reach 10 surahs`);
    } else if (profile.summary.surahsCompleted < 30) {
      milestones.push(`${30 - profile.summary.surahsCompleted} more surah${30 - profile.summary.surahsCompleted !== 1 ? 's' : ''} to reach Juz Amma mastery`);
    }

    // Stories milestone
    if (profile.summary.storiesCompleted < 12) {
      milestones.push(`${12 - profile.summary.storiesCompleted} more stor${12 - profile.summary.storiesCompleted !== 1 ? 'ies' : 'y'} to reach half the collection`);
    } else if (profile.summary.storiesCompleted < 24) {
      milestones.push(`${24 - profile.summary.storiesCompleted} more stor${24 - profile.summary.storiesCompleted !== 1 ? 'ies' : 'y'} to complete all stories`);
    }

    return milestones.slice(0, 3); // Return top 3 milestones
  };

  // Helper function to generate shareable report
  const generateShareableReport = () => {
    if (!profile) return '';

    const levelInfo = getLevelInfo(profile.progress.level);
    const weeklyStats = getWeeklyStats();

    return `📊 Weekly Learning Report - Hikma App

🌟 Level: ${levelInfo.emoji} ${levelInfo.name} (Level ${profile.progress.level})
⭐ Total Stars: ${profile.progress.totalStars}

📅 This Week:
• ${weeklyStats.daysActive} days active
• ~${weeklyStats.estimatedMinutes} minutes of learning
• ${weeklyStats.newBadges} badge${weeklyStats.newBadges !== 1 ? 's' : ''} earned

📚 Progress:
• Arabic Letters: ${profile.summary.lettersMastered}/28 (${Math.round((profile.summary.lettersMastered / 28) * 100)}%)
• Quran Surahs: ${profile.summary.surahsCompleted}/114 (${Math.round((profile.summary.surahsCompleted / 114) * 100)}%)
• Prophet Stories: ${profile.summary.storiesCompleted}/24 (${Math.round((profile.summary.storiesCompleted / 24) * 100)}%)

${profile.progress.currentStreak > 0 ? `🔥 Current Streak: ${profile.progress.currentStreak} days!\n` : ''}
Keep up the amazing work! 🌙✨`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 text-white p-4 sm:p-6">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/80 hover:text-white"
            aria-label="Close profile"
          >
            <i className="fas fa-times text-lg" aria-hidden="true"></i>
          </button>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center">
              <i className="fas fa-user-shield text-2xl sm:text-3xl"></i>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">{parentName}</h2>
              <p className="text-rose-100 text-xs sm:text-sm">Parent Account</p>
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
            onClick={() => setActiveTab('report')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'report'
                ? 'text-rose-600 border-b-2 border-rose-600'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <i className="fas fa-file-alt mr-2"></i>
            Report
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
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] sm:max-h-[50vh]">
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

          {activeTab === 'report' && (
            <div className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <i className="fas fa-spinner fa-spin text-2xl text-rose-600"></i>
                </div>
              ) : profile ? (
                <>
                  {/* This Week's Activity */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                    <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                      <i className="fas fa-calendar-week"></i>
                      This Week's Activity
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/60 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-blue-900">{getWeeklyStats().daysActive}</p>
                        <p className="text-xs text-blue-700">Days Active</p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-blue-900">~{getWeeklyStats().estimatedMinutes}</p>
                        <p className="text-xs text-blue-700">Minutes</p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-blue-900">{getWeeklyStats().newBadges}</p>
                        <p className="text-xs text-blue-700">Badges</p>
                      </div>
                    </div>
                  </div>

                  {/* Learning Breakdown */}
                  <div>
                    <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
                      <i className="fas fa-chart-bar"></i>
                      Learning Breakdown
                    </h3>
                    <div className="space-y-4">
                      {/* Arabic Letters */}
                      <div className="bg-stone-50 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🔤</span>
                            <span className="text-sm font-medium text-stone-700">Arabic Letters</span>
                          </div>
                          <span className="text-sm font-bold text-stone-800">
                            {profile.summary.lettersMastered}/28
                          </span>
                        </div>
                        <div className="h-3 bg-stone-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all"
                            style={{
                              width: `${Math.round((profile.summary.lettersMastered / 28) * 100)}%`
                            }}
                          />
                        </div>
                        <p className="text-xs text-stone-500 mt-1 text-right">
                          {Math.round((profile.summary.lettersMastered / 28) * 100)}%
                        </p>
                      </div>

                      {/* Quran Surahs */}
                      <div className="bg-stone-50 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📖</span>
                            <span className="text-sm font-medium text-stone-700">Quran Surahs</span>
                          </div>
                          <span className="text-sm font-bold text-stone-800">
                            {profile.summary.surahsCompleted}/114
                          </span>
                        </div>
                        <div className="h-3 bg-stone-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all"
                            style={{
                              width: `${Math.round((profile.summary.surahsCompleted / 114) * 100)}%`
                            }}
                          />
                        </div>
                        <p className="text-xs text-stone-500 mt-1 text-right">
                          {Math.round((profile.summary.surahsCompleted / 114) * 100)}%
                        </p>
                      </div>

                      {/* Prophet Stories */}
                      <div className="bg-stone-50 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📚</span>
                            <span className="text-sm font-medium text-stone-700">Prophet Stories</span>
                          </div>
                          <span className="text-sm font-bold text-stone-800">
                            {profile.summary.storiesCompleted}/24
                          </span>
                        </div>
                        <div className="h-3 bg-stone-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full transition-all"
                            style={{
                              width: `${Math.round((profile.summary.storiesCompleted / 24) * 100)}%`
                            }}
                          />
                        </div>
                        <p className="text-xs text-stone-500 mt-1 text-right">
                          {Math.round((profile.summary.storiesCompleted / 24) * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Milestones */}
                  {getUpcomingMilestones().length > 0 && (
                    <div>
                      <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
                        <i className="fas fa-flag-checkered"></i>
                        Upcoming Milestones
                      </h3>
                      <div className="space-y-2">
                        {getUpcomingMilestones().map((milestone, index) => (
                          <div
                            key={index}
                            className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-3 flex items-center gap-3"
                          >
                            <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-amber-800">{index + 1}</span>
                            </div>
                            <p className="text-sm text-amber-900">{milestone}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Share Report Button */}
                  <button
                    onClick={async () => {
                      const reportText = generateShareableReport();
                      // Try Web Share API first (native share on mobile)
                      if (navigator.share) {
                        try {
                          await navigator.share({
                            title: 'Weekly Learning Report - Hikma App',
                            text: reportText,
                          });
                        } catch (err) {
                          // User cancelled or share failed, fall through to clipboard
                          if ((err as Error).name !== 'AbortError') {
                            await navigator.clipboard.writeText(reportText);
                            alert('Report copied to clipboard!');
                          }
                        }
                      } else {
                        // Fallback to clipboard
                        try {
                          await navigator.clipboard.writeText(reportText);
                          alert('Report copied to clipboard!');
                        } catch (err) {
                          console.error('Failed to copy:', err);
                        }
                      }
                    }}
                    className="w-full py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <i className="fas fa-share-alt"></i>
                    Share Report
                  </button>
                </>
              ) : (
                <div className="text-center py-8 text-stone-500">
                  <i className="fas fa-exclamation-circle text-2xl mb-2"></i>
                  <p>Unable to load report</p>
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
