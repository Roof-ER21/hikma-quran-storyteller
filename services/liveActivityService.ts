/**
 * Live Activity Service for Prayer Time Countdown
 * Manages iOS Lock Screen Live Activities showing next prayer countdown
 * Requires iOS 16.1+ and the PrayerCountdown Widget Extension target in Xcode
 */

import { Capacitor, registerPlugin } from '@capacitor/core';

// Prayer activity state interface
interface PrayerActivityState {
  prayerName: string;
  prayerNameArabic: string;
  prayerTime: string; // ISO 8601
  nextPrayerName: string;
  nextPrayerTime: string; // ISO 8601
}

// Native plugin interface
interface PrayerActivityPlugin {
  start(options: PrayerActivityState): Promise<{ activityId: string }>;
  update(options: PrayerActivityState & { activityId: string }): Promise<void>;
  end(options: { activityId: string }): Promise<void>;
  endAll(): Promise<void>;
}

// Register the native plugin
const PrayerActivity = registerPlugin<PrayerActivityPlugin>('PrayerActivity');

// Check if Live Activities are supported (iOS 16.1+)
export function isLiveActivitySupported(): boolean {
  // Live Activities only work on native iOS, not web
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  return isIOS && 'webkit' in window;
}

// Start a prayer countdown Live Activity
export async function startPrayerActivity(state: PrayerActivityState): Promise<string | null> {
  if (!isLiveActivitySupported()) return null;

  try {
    if (!Capacitor.isNativePlatform()) return null;

    // Call the native plugin
    const result = await PrayerActivity.start({
      prayerName: state.prayerName,
      prayerNameArabic: state.prayerNameArabic,
      prayerTime: state.prayerTime,
      nextPrayerName: state.nextPrayerName,
      nextPrayerTime: state.nextPrayerTime,
    });

    return result?.activityId || null;
  } catch (error) {
    console.warn('Live Activity not available:', error);
    return null;
  }
}

// Update an existing Live Activity with new prayer info
export async function updatePrayerActivity(
  activityId: string,
  state: PrayerActivityState
): Promise<boolean> {
  if (!isLiveActivitySupported()) return false;

  try {
    if (!Capacitor.isNativePlatform()) return false;

    await PrayerActivity.update({
      activityId,
      ...state,
    });
    return true;
  } catch (error) {
    console.warn('Failed to update Live Activity:', error);
    return false;
  }
}

// End a Live Activity
export async function endPrayerActivity(activityId: string): Promise<void> {
  try {
    if (!Capacitor.isNativePlatform()) return;

    await PrayerActivity.end({ activityId });
  } catch (error) {
    console.warn('Failed to end Live Activity:', error);
  }
}

// End all prayer activities
export async function endAllPrayerActivities(): Promise<void> {
  try {
    if (!Capacitor.isNativePlatform()) return;

    await PrayerActivity.endAll();
  } catch (error) {
    console.warn('Failed to end all Live Activities:', error);
  }
}

// Helper: Schedule prayer activity from prayer times data
export async function schedulePrayerActivity(prayers: {
  fajr: string; dhuhr: string; asr: string; maghrib: string; isha: string;
}): Promise<string | null> {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const prayerList = [
    { name: 'Fajr', arabic: 'الفجر', time: prayers.fajr },
    { name: 'Dhuhr', arabic: 'الظهر', time: prayers.dhuhr },
    { name: 'Asr', arabic: 'العصر', time: prayers.asr },
    { name: 'Maghrib', arabic: 'المغرب', time: prayers.maghrib },
    { name: 'Isha', arabic: 'العشاء', time: prayers.isha },
  ];

  // Find the next upcoming prayer
  let currentIdx = -1;
  for (let i = 0; i < prayerList.length; i++) {
    const prayerDate = new Date(`${today}T${prayerList[i].time}`);
    if (prayerDate > now) {
      currentIdx = i;
      break;
    }
  }

  // If all prayers have passed today, show Fajr tomorrow
  if (currentIdx === -1) return null;

  const current = prayerList[currentIdx];
  const next = prayerList[(currentIdx + 1) % prayerList.length];

  return startPrayerActivity({
    prayerName: current.name,
    prayerNameArabic: current.arabic,
    prayerTime: `${today}T${current.time}:00`,
    nextPrayerName: next.name,
    nextPrayerTime: `${today}T${next.time}:00`,
  });
}
