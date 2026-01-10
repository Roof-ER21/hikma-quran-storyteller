/**
 * Islamic Tools Service
 *
 * Provides prayer times, Qibla direction, and Islamic date calculations
 */

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  midnight: string;
  date: string;
  hijriDate: string;
  timezone: string;
  location: string;
}

export interface QiblaDirection {
  direction: number; // degrees from North
  latitude: number;
  longitude: number;
  distance: number; // km to Mecca
}

export interface IslamicDate {
  day: number;
  month: number;
  monthName: string;
  monthNameAr: string;
  year: number;
  designation: string;
  holidays: string[];
}

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

// Prayer time calculation methods
export const CALCULATION_METHODS: Record<number, { name: string; description: string }> = {
  0: { name: 'Shia Ithna-Ashari', description: 'Shia Ithna-Ashari, Leva Institute, Qum' },
  1: { name: 'University of Islamic Sciences, Karachi', description: 'Pakistan' },
  2: { name: 'Islamic Society of North America', description: 'ISNA (North America)' },
  3: { name: 'Muslim World League', description: 'MWL (Recommended for most locations)' },
  4: { name: 'Umm Al-Qura University, Makkah', description: 'Saudi Arabia' },
  5: { name: 'Egyptian General Authority of Survey', description: 'Egypt' },
  7: { name: 'Institute of Geophysics, University of Tehran', description: 'Iran' },
  8: { name: 'Gulf Region', description: 'Gulf countries' },
  9: { name: 'Kuwait', description: 'Kuwait' },
  10: { name: 'Qatar', description: 'Qatar' },
  11: { name: 'Majlis Ugama Islam Singapura', description: 'Singapore' },
  12: { name: 'Union Organization Islamic de France', description: 'France' },
  13: { name: 'Diyanet İşleri Başkanlığı', description: 'Turkey' },
  14: { name: 'Spiritual Administration of Muslims of Russia', description: 'Russia' },
  15: { name: 'Moonsighting Committee Worldwide', description: 'Global moonsighting' },
};

// Islamic months
const ISLAMIC_MONTHS: { en: string; ar: string }[] = [
  { en: 'Muharram', ar: 'مُحَرَّم' },
  { en: 'Safar', ar: 'صَفَر' },
  { en: 'Rabi\' al-Awwal', ar: 'رَبِيع الأَوَّل' },
  { en: 'Rabi\' al-Thani', ar: 'رَبِيع الثَّانِي' },
  { en: 'Jumada al-Awwal', ar: 'جُمَادَى الأُولَى' },
  { en: 'Jumada al-Thani', ar: 'جُمَادَى الآخِرَة' },
  { en: 'Rajab', ar: 'رَجَب' },
  { en: 'Sha\'ban', ar: 'شَعْبَان' },
  { en: 'Ramadan', ar: 'رَمَضَان' },
  { en: 'Shawwal', ar: 'شَوَّال' },
  { en: 'Dhu al-Qi\'dah', ar: 'ذُو القَعْدَة' },
  { en: 'Dhu al-Hijjah', ar: 'ذُو الحِجَّة' },
];

// Cache for API responses
const prayerCache = new Map<string, { data: PrayerTimes; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Get user's current location
 */
export function getUserLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  });
}

/**
 * Calculate Qibla direction from a given location
 */
export function calculateQiblaDirection(lat: number, lng: number): QiblaDirection {
  // Convert to radians
  const lat1 = lat * (Math.PI / 180);
  const lng1 = lng * (Math.PI / 180);
  const lat2 = KAABA_LAT * (Math.PI / 180);
  const lng2 = KAABA_LNG * (Math.PI / 180);

  // Calculate direction using spherical trigonometry
  const dLng = lng2 - lng1;
  const x = Math.sin(dLng) * Math.cos(lat2);
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  let direction = Math.atan2(x, y) * (180 / Math.PI);
  direction = (direction + 360) % 360; // Normalize to 0-360

  // Calculate distance using Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = lat2 - lat1;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return {
    direction: Math.round(direction * 10) / 10,
    latitude: lat,
    longitude: lng,
    distance: Math.round(distance),
  };
}

/**
 * Fetch prayer times from Aladhan API
 */
export async function getPrayerTimes(
  lat: number,
  lng: number,
  method: number = 3, // Default: Muslim World League
  date?: Date
): Promise<PrayerTimes> {
  const targetDate = date || new Date();
  const dateStr = `${targetDate.getDate()}-${targetDate.getMonth() + 1}-${targetDate.getFullYear()}`;
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)},${method},${dateStr}`;

  // Check cache
  const cached = prayerCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const response = await fetch(
      `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=${method}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const timings = data.data.timings;
    const hijri = data.data.date.hijri;
    const gregorian = data.data.date.gregorian;

    const prayerTimes: PrayerTimes = {
      fajr: timings.Fajr,
      sunrise: timings.Sunrise,
      dhuhr: timings.Dhuhr,
      asr: timings.Asr,
      maghrib: timings.Maghrib,
      isha: timings.Isha,
      midnight: timings.Midnight,
      date: `${gregorian.weekday.en}, ${gregorian.day} ${gregorian.month.en} ${gregorian.year}`,
      hijriDate: `${hijri.day} ${hijri.month.en} ${hijri.year} AH`,
      timezone: data.data.meta.timezone,
      location: data.data.meta.timezone.split('/').pop()?.replace(/_/g, ' ') || 'Unknown',
    };

    // Cache the result
    prayerCache.set(cacheKey, { data: prayerTimes, timestamp: Date.now() });

    return prayerTimes;
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    throw error;
  }
}

/**
 * Get location name from timezone string
 * (Nominatim has CORS issues, so we extract from Aladhan's timezone)
 */
export function getLocationFromTimezone(timezone: string): string {
  if (!timezone) return 'Unknown Location';

  // Extract city name from timezone like "America/New_York" -> "New York"
  const parts = timezone.split('/');
  if (parts.length >= 2) {
    return parts[parts.length - 1].replace(/_/g, ' ');
  }
  return timezone;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Schedule a prayer notification
 */
export function schedulePrayerNotification(
  prayerName: string,
  prayerNameAr: string,
  prayerTime: string,
  minutesBefore: number = 10
): NodeJS.Timeout | null {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return null;
  }

  const now = new Date();
  const [hours, minutes] = prayerTime.split(':').map(Number);

  const prayerDate = new Date();
  prayerDate.setHours(hours, minutes, 0, 0);

  // Subtract minutes before
  const notifyTime = new Date(prayerDate.getTime() - minutesBefore * 60 * 1000);

  // If notification time is in the past, skip
  if (notifyTime <= now) {
    return null;
  }

  const delay = notifyTime.getTime() - now.getTime();

  return setTimeout(() => {
    new Notification(`${prayerName} Prayer (${prayerNameAr})`, {
      body: minutesBefore > 0
        ? `${prayerName} prayer in ${minutesBefore} minutes at ${prayerTime}`
        : `Time for ${prayerName} prayer`,
      icon: '/icons/icon-192.png',
      tag: `prayer-${prayerName}`,
      requireInteraction: true,
    });
  }, delay);
}

/**
 * Schedule all prayer notifications for the day
 */
export function scheduleAllPrayerNotifications(
  prayerTimes: PrayerTimes,
  minutesBefore: number = 10
): NodeJS.Timeout[] {
  const timers: NodeJS.Timeout[] = [];

  const prayers = [
    { name: 'Fajr', nameAr: 'الفجر', time: prayerTimes.fajr },
    { name: 'Dhuhr', nameAr: 'الظهر', time: prayerTimes.dhuhr },
    { name: 'Asr', nameAr: 'العصر', time: prayerTimes.asr },
    { name: 'Maghrib', nameAr: 'المغرب', time: prayerTimes.maghrib },
    { name: 'Isha', nameAr: 'العشاء', time: prayerTimes.isha },
  ];

  for (const prayer of prayers) {
    const timer = schedulePrayerNotification(prayer.name, prayer.nameAr, prayer.time, minutesBefore);
    if (timer) {
      timers.push(timer);
    }
  }

  return timers;
}

/**
 * Clear all scheduled notifications
 */
export function clearPrayerNotifications(timers: NodeJS.Timeout[]): void {
  for (const timer of timers) {
    clearTimeout(timer);
  }
}

/**
 * Get Islamic (Hijri) date
 */
export async function getIslamicDate(date?: Date): Promise<IslamicDate> {
  const targetDate = date || new Date();
  const dateStr = `${targetDate.getDate()}-${targetDate.getMonth() + 1}-${targetDate.getFullYear()}`;

  try {
    const response = await fetch(
      `https://api.aladhan.com/v1/gToH/${dateStr}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const hijri = data.data.hijri;
    const monthIndex = parseInt(hijri.month.number, 10) - 1;

    // Check for Islamic holidays
    const holidays = getIslamicHolidays(parseInt(hijri.day, 10), monthIndex + 1);

    return {
      day: parseInt(hijri.day, 10),
      month: monthIndex + 1,
      monthName: ISLAMIC_MONTHS[monthIndex].en,
      monthNameAr: ISLAMIC_MONTHS[monthIndex].ar,
      year: parseInt(hijri.year, 10),
      designation: hijri.designation.abbreviated,
      holidays,
    };
  } catch (error) {
    console.error('Error fetching Islamic date:', error);
    // Return fallback date calculation if API fails
    return calculateHijriDateFallback(targetDate);
  }
}

/**
 * Fallback Hijri date calculation (approximate)
 */
function calculateHijriDateFallback(date: Date): IslamicDate {
  // Approximate conversion: Hijri epoch is July 16, 622 CE
  const hijriEpoch = new Date(622, 6, 16);
  const daysSinceEpoch = Math.floor((date.getTime() - hijriEpoch.getTime()) / (1000 * 60 * 60 * 24));

  // Average Hijri year is 354.36667 days
  const hijriYear = Math.floor(daysSinceEpoch / 354.36667) + 1;
  const daysInCurrentYear = daysSinceEpoch % 354.36667;

  // Approximate month (29.5 days average)
  const hijriMonth = Math.floor(daysInCurrentYear / 29.5) + 1;
  const hijriDay = Math.floor(daysInCurrentYear % 29.5) + 1;

  const monthIndex = Math.min(hijriMonth - 1, 11);
  const holidays = getIslamicHolidays(hijriDay, hijriMonth);

  return {
    day: hijriDay,
    month: hijriMonth,
    monthName: ISLAMIC_MONTHS[monthIndex].en,
    monthNameAr: ISLAMIC_MONTHS[monthIndex].ar,
    year: hijriYear,
    designation: 'AH',
    holidays,
  };
}

/**
 * Get Islamic holidays for a given day/month
 */
function getIslamicHolidays(day: number, month: number): string[] {
  const holidays: string[] = [];

  // Muharram
  if (month === 1) {
    if (day === 1) holidays.push('Islamic New Year');
    if (day === 10) holidays.push('Day of Ashura');
  }

  // Rabi' al-Awwal
  if (month === 3) {
    if (day === 12) holidays.push('Mawlid al-Nabi (Prophet\'s Birthday)');
  }

  // Rajab
  if (month === 7) {
    if (day === 27) holidays.push('Isra and Mi\'raj');
  }

  // Sha'ban
  if (month === 8) {
    if (day === 15) holidays.push('Mid-Sha\'ban (Laylat al-Bara\'ah)');
  }

  // Ramadan
  if (month === 9) {
    if (day === 1) holidays.push('First day of Ramadan');
    if (day >= 21 && day <= 29 && day % 2 === 1) {
      holidays.push('Possible Laylat al-Qadr');
    }
  }

  // Shawwal
  if (month === 10) {
    if (day === 1) holidays.push('Eid al-Fitr');
  }

  // Dhu al-Hijjah
  if (month === 12) {
    if (day === 9) holidays.push('Day of Arafah');
    if (day === 10) holidays.push('Eid al-Adha');
    if (day >= 11 && day <= 13) holidays.push('Days of Tashreeq');
  }

  return holidays;
}

/**
 * Get the next prayer time
 */
export function getNextPrayer(prayerTimes: PrayerTimes): { name: string; time: string; nameAr: string } | null {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const prayers = [
    { name: 'Fajr', nameAr: 'الفجر', time: prayerTimes.fajr },
    { name: 'Sunrise', nameAr: 'الشروق', time: prayerTimes.sunrise },
    { name: 'Dhuhr', nameAr: 'الظهر', time: prayerTimes.dhuhr },
    { name: 'Asr', nameAr: 'العصر', time: prayerTimes.asr },
    { name: 'Maghrib', nameAr: 'المغرب', time: prayerTimes.maghrib },
    { name: 'Isha', nameAr: 'العشاء', time: prayerTimes.isha },
  ];

  for (const prayer of prayers) {
    const [hours, minutes] = prayer.time.split(':').map(Number);
    const prayerTime = hours * 60 + minutes;
    if (prayerTime > currentTime) {
      return prayer;
    }
  }

  // After Isha, next prayer is Fajr
  return { name: 'Fajr', nameAr: 'الفجر', time: prayerTimes.fajr };
}

/**
 * Format time remaining until a prayer
 */
export function getTimeUntilPrayer(prayerTime: string): string {
  const now = new Date();
  const [hours, minutes] = prayerTime.split(':').map(Number);

  const prayerDate = new Date();
  prayerDate.setHours(hours, minutes, 0, 0);

  // If prayer time is earlier today, it's tomorrow's prayer
  if (prayerDate <= now) {
    prayerDate.setDate(prayerDate.getDate() + 1);
  }

  const diff = prayerDate.getTime() - now.getTime();
  const diffHours = Math.floor(diff / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  }
  return `${diffMinutes}m`;
}

/**
 * Get compass heading from device
 */
export function watchCompassHeading(callback: (heading: number) => void): () => void {
  let watchId: number | null = null;

  // Try using DeviceOrientationEvent
  const handleOrientation = (event: DeviceOrientationEvent) => {
    if (event.alpha !== null) {
      // iOS uses webkitCompassHeading, Android uses alpha
      const heading = (event as any).webkitCompassHeading ?? (360 - event.alpha);
      callback(heading);
    }
  };

  // Check if DeviceOrientationEvent is available
  if (typeof DeviceOrientationEvent !== 'undefined') {
    // iOS 13+ requires permission
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((permission: string) => {
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }
  }

  // Return cleanup function
  return () => {
    window.removeEventListener('deviceorientation', handleOrientation);
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
  };
}
