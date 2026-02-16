/**
 * Live Activity Service for Prayer Time Countdown
 * Manages iOS Lock Screen Live Activities showing next prayer countdown
 * Requires iOS 16.1+ and the PrayerCountdown Widget Extension target in Xcode
 */

import { Capacitor, registerPlugin } from '@capacitor/core';

// Prayer activity state interface
export interface PrayerActivityState {
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
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
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

type DailyPrayerTimes = {
  fajr: string; dhuhr: string; asr: string; maghrib: string; isha: string;
};

const PRAYER_LIST: Array<{ name: string; arabic: string; key: keyof DailyPrayerTimes }> = [
  { name: 'Fajr', arabic: 'الفجر', key: 'fajr' },
  { name: 'Dhuhr', arabic: 'الظهر', key: 'dhuhr' },
  { name: 'Asr', arabic: 'العصر', key: 'asr' },
  { name: 'Maghrib', arabic: 'المغرب', key: 'maghrib' },
  { name: 'Isha', arabic: 'العشاء', key: 'isha' },
];

function getPrayerDate(base: Date, time: string, dayOffset = 0): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const dt = new Date(base);
  dt.setDate(dt.getDate() + dayOffset);
  dt.setHours(hours, minutes, 0, 0);
  return dt;
}

export function getUpcomingPrayerActivityState(prayers: DailyPrayerTimes): PrayerActivityState {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const prayerSchedule = PRAYER_LIST.map((prayer) => ({
    ...prayer,
    time: prayers[prayer.key],
    date: getPrayerDate(today, prayers[prayer.key], 0),
  }));

  // Find next upcoming prayer for today
  let currentIdx = -1;
  for (let i = 0; i < prayerSchedule.length; i++) {
    if (prayerSchedule[i].date > now) {
      currentIdx = i;
      break;
    }
  }

  // After Isha, roll to tomorrow's Fajr
  const useTomorrow = currentIdx === -1;
  if (useTomorrow) currentIdx = 0;
  const nextIdx = (currentIdx + 1) % prayerSchedule.length;

  const current = prayerSchedule[currentIdx];
  const next = prayerSchedule[nextIdx];
  const currentDate = getPrayerDate(today, current.time, useTomorrow ? 1 : 0);
  const nextDayOffset = useTomorrow || nextIdx <= currentIdx ? 1 : 0;
  const nextDate = getPrayerDate(today, next.time, nextDayOffset);

  return {
    prayerName: current.name,
    prayerNameArabic: current.arabic,
    prayerTime: currentDate.toISOString(),
    nextPrayerName: next.name,
    nextPrayerTime: nextDate.toISOString(),
  };
}

// Helper: Schedule prayer activity from prayer times data
export async function schedulePrayerActivity(prayers: DailyPrayerTimes): Promise<string | null> {
  const state = getUpcomingPrayerActivityState(prayers);
  return startPrayerActivity(state);
}
