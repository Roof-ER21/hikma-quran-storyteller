/**
 * Islamic Tools Component
 *
 * Provides Prayer Times, Qibla Direction, and Islamic Calendar
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  PrayerTimes,
  QiblaDirection,
  IslamicDate,
  getUserLocation,
  calculateQiblaDirection,
  getPrayerTimes,
  getLocationName,
  getIslamicDate,
  getNextPrayer,
  getTimeUntilPrayer,
  watchCompassHeading,
  CALCULATION_METHODS,
} from '../services/islamicToolsService';

type TabType = 'prayer' | 'qibla' | 'calendar';

interface IslamicToolsProps {
  onBack?: () => void;
}

export default function IslamicTools({ onBack }: IslamicToolsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('prayer');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Prayer times state
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [calculationMethod, setCalculationMethod] = useState<number>(3);
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; nameAr: string } | null>(null);
  const [timeUntil, setTimeUntil] = useState<string>('');

  // Qibla state
  const [qiblaDirection, setQiblaDirection] = useState<QiblaDirection | null>(null);
  const [compassHeading, setCompassHeading] = useState<number | null>(null);
  const [compassPermission, setCompassPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  // Islamic date state
  const [islamicDate, setIslamicDate] = useState<IslamicDate | null>(null);

  // Get user location on mount
  useEffect(() => {
    async function fetchLocation() {
      setLoading(true);
      setError(null);

      // First, try to get location - this is required
      let loc: { lat: number; lng: number };
      try {
        loc = await getUserLocation();
        setLocation(loc);
      } catch (err) {
        console.error('Error getting location:', err);
        setError('Unable to get your location. Please enable location services and try again.');
        setLoading(false);
        return;
      }

      // Get location name (non-blocking)
      getLocationName(loc.lat, loc.lng)
        .then(name => setLocationName(name))
        .catch(() => setLocationName('Unknown Location'));

      // Calculate Qibla direction (local calculation, won't fail)
      const qibla = calculateQiblaDirection(loc.lat, loc.lng);
      setQiblaDirection(qibla);

      // Get prayer times
      try {
        const prayers = await getPrayerTimes(loc.lat, loc.lng, calculationMethod);
        setPrayerTimes(prayers);
      } catch (err) {
        console.error('Error getting prayer times:', err);
        // Don't set error - other features can still work
      }

      // Get Islamic date (non-blocking, has fallback)
      getIslamicDate()
        .then(hijri => setIslamicDate(hijri))
        .catch(err => {
          console.error('Error getting Islamic date:', err);
          // The service now has fallback calculation
        });

      setLoading(false);
    }

    fetchLocation();
  }, [calculationMethod]);

  // Update next prayer and countdown
  useEffect(() => {
    if (!prayerTimes) return;

    const updateNextPrayer = () => {
      const next = getNextPrayer(prayerTimes);
      setNextPrayer(next);
      if (next) {
        setTimeUntil(getTimeUntilPrayer(next.time));
      }
    };

    updateNextPrayer();
    const interval = setInterval(updateNextPrayer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [prayerTimes]);

  // Watch compass heading for Qibla
  useEffect(() => {
    if (activeTab !== 'qibla') return;

    const cleanup = watchCompassHeading((heading) => {
      setCompassHeading(heading);
      setCompassPermission('granted');
    });

    return cleanup;
  }, [activeTab]);

  const requestCompassPermission = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          setCompassPermission('granted');
        } else {
          setCompassPermission('denied');
        }
      } catch (err) {
        console.error('Error requesting compass permission:', err);
        setCompassPermission('denied');
      }
    }
  };

  const refreshData = useCallback(async () => {
    if (!location) return;

    try {
      setLoading(true);
      const prayers = await getPrayerTimes(location.lat, location.lng, calculationMethod);
      setPrayerTimes(prayers);
      const hijri = await getIslamicDate();
      setIslamicDate(hijri);
      setLoading(false);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setLoading(false);
    }
  }, [location, calculationMethod]);

  const renderPrayerTimes = () => {
    if (!prayerTimes) return null;

    const prayers = [
      { name: 'Fajr', nameAr: 'الفجر', time: prayerTimes.fajr, icon: 'fa-moon' },
      { name: 'Sunrise', nameAr: 'الشروق', time: prayerTimes.sunrise, icon: 'fa-sun', isSecondary: true },
      { name: 'Dhuhr', nameAr: 'الظهر', time: prayerTimes.dhuhr, icon: 'fa-sun' },
      { name: 'Asr', nameAr: 'العصر', time: prayerTimes.asr, icon: 'fa-cloud-sun' },
      { name: 'Maghrib', nameAr: 'المغرب', time: prayerTimes.maghrib, icon: 'fa-cloud-moon' },
      { name: 'Isha', nameAr: 'العشاء', time: prayerTimes.isha, icon: 'fa-star' },
    ];

    return (
      <div className="space-y-6">
        {/* Next Prayer Card */}
        {nextPrayer && (
          <div className="bg-gradient-to-br from-rose-600 to-rose-800 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rose-200 text-sm uppercase tracking-wider">Next Prayer</p>
                <h3 className="text-3xl font-bold mt-1">{nextPrayer.name}</h3>
                <p className="text-rose-100 font-arabic text-xl">{nextPrayer.nameAr}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold">{nextPrayer.time}</p>
                <p className="text-rose-200">in {timeUntil}</p>
              </div>
            </div>
          </div>
        )}

        {/* Location & Date Info */}
        <div className="bg-white rounded-xl p-4 shadow-md border border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <i className="fas fa-map-marker-alt text-amber-600"></i>
            </div>
            <div className="flex-1">
              <p className="font-medium text-stone-800">{locationName || prayerTimes.location}</p>
              <p className="text-sm text-stone-500">{prayerTimes.date}</p>
            </div>
            <button
              onClick={refreshData}
              className="w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
            >
              <i className={`fas fa-sync-alt text-stone-600 ${loading ? 'animate-spin' : ''}`}></i>
            </button>
          </div>
        </div>

        {/* Calculation Method Selector */}
        <div className="bg-white rounded-xl p-4 shadow-md border border-stone-100">
          <label className="text-sm font-medium text-stone-500 mb-2 block">Calculation Method</label>
          <select
            value={calculationMethod}
            onChange={(e) => setCalculationMethod(Number(e.target.value))}
            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            {Object.entries(CALCULATION_METHODS).map(([key, value]) => (
              <option key={key} value={key}>
                {value.name}
              </option>
            ))}
          </select>
        </div>

        {/* Prayer Times Grid */}
        <div className="grid grid-cols-2 gap-3">
          {prayers.map((prayer) => (
            <div
              key={prayer.name}
              className={`rounded-xl p-4 transition-all ${
                nextPrayer?.name === prayer.name
                  ? 'bg-rose-50 border-2 border-rose-300 shadow-md'
                  : prayer.isSecondary
                  ? 'bg-stone-50 border border-stone-200'
                  : 'bg-white border border-stone-100 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  nextPrayer?.name === prayer.name
                    ? 'bg-rose-200 text-rose-700'
                    : 'bg-stone-100 text-stone-600'
                }`}>
                  <i className={`fas ${prayer.icon}`}></i>
                </div>
                <div>
                  <p className={`font-medium ${nextPrayer?.name === prayer.name ? 'text-rose-800' : 'text-stone-800'}`}>
                    {prayer.name}
                  </p>
                  <p className="font-arabic text-sm text-stone-500">{prayer.nameAr}</p>
                </div>
              </div>
              <p className={`text-2xl font-bold mt-2 ${
                nextPrayer?.name === prayer.name ? 'text-rose-700' : 'text-stone-700'
              }`}>
                {prayer.time}
              </p>
            </div>
          ))}
        </div>

        {/* Midnight */}
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <i className="fas fa-moon text-indigo-600"></i>
              </div>
              <div>
                <p className="font-medium text-indigo-800">Midnight</p>
                <p className="font-arabic text-sm text-indigo-600">منتصف الليل</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-indigo-700">{prayerTimes.midnight}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderQibla = () => {
    if (!qiblaDirection) return null;

    const qiblaAngle = qiblaDirection.direction;
    const adjustedAngle = compassHeading !== null
      ? (qiblaAngle - compassHeading + 360) % 360
      : qiblaAngle;

    return (
      <div className="space-y-6">
        {/* Qibla Info Card */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-6 text-white shadow-xl">
          <div className="text-center">
            <p className="text-emerald-200 text-sm uppercase tracking-wider">Direction to Mecca</p>
            <h3 className="text-5xl font-bold mt-2">{qiblaAngle.toFixed(1)}°</h3>
            <p className="text-emerald-100 mt-1">from North</p>
          </div>
        </div>

        {/* Compass */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-stone-100">
          <div className="relative w-64 h-64 mx-auto">
            {/* Compass Rose Background */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-stone-50 to-stone-100 border-4 border-stone-200 shadow-inner">
              {/* Cardinal Directions */}
              <span className="absolute top-2 left-1/2 -translate-x-1/2 font-bold text-stone-700">N</span>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 font-medium text-stone-500">S</span>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 font-medium text-stone-500">E</span>
              <span className="absolute left-2 top-1/2 -translate-y-1/2 font-medium text-stone-500">W</span>

              {/* Degree markers */}
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                <div
                  key={deg}
                  className="absolute w-0.5 h-3 bg-stone-300 origin-bottom"
                  style={{
                    left: '50%',
                    top: '8px',
                    transform: `translateX(-50%) rotate(${deg}deg)`,
                    transformOrigin: '50% 120px'
                  }}
                />
              ))}
            </div>

            {/* Kaaba Direction Arrow */}
            <div
              className="absolute inset-0 transition-transform duration-300"
              style={{ transform: `rotate(${adjustedAngle}deg)` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full">
                <div className="w-4 h-24 relative">
                  {/* Arrow shaft */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-20 bg-gradient-to-t from-emerald-400 to-emerald-600 rounded-full" />
                  {/* Arrow head */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[20px] border-l-transparent border-r-transparent border-b-emerald-600" />
                </div>
              </div>
            </div>

            {/* Center Kaaba Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-stone-800 rounded-lg flex items-center justify-center shadow-lg transform rotate-45">
                <i className="fas fa-kaaba text-amber-400 text-2xl transform -rotate-45"></i>
              </div>
            </div>
          </div>

          {/* Compass Status */}
          <div className="mt-6 text-center">
            {compassHeading !== null ? (
              <p className="text-emerald-600 flex items-center justify-center gap-2">
                <i className="fas fa-check-circle"></i>
                Compass active - Point your device towards the arrow
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-stone-500">Enable compass for real-time direction</p>
                <button
                  onClick={requestCompassPermission}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <i className="fas fa-compass mr-2"></i>
                  Enable Compass
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Distance to Mecca */}
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <i className="fas fa-route text-amber-600"></i>
            </div>
            <div>
              <p className="text-sm text-amber-700">Distance to Mecca</p>
              <p className="text-2xl font-bold text-amber-800">{qiblaDirection.distance.toLocaleString()} km</p>
            </div>
          </div>
        </div>

        {/* Your Location */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
          <p className="text-sm text-stone-500 mb-2">Your Location</p>
          <div className="flex items-center gap-3">
            <i className="fas fa-map-marker-alt text-rose-500"></i>
            <span className="font-medium">{locationName || 'Getting location...'}</span>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            {qiblaDirection.latitude.toFixed(4)}°, {qiblaDirection.longitude.toFixed(4)}°
          </p>
        </div>
      </div>
    );
  };

  const renderCalendar = () => {
    if (!islamicDate) return null;

    return (
      <div className="space-y-6">
        {/* Hijri Date Card */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-8 text-white shadow-xl text-center">
          <p className="text-purple-200 text-sm uppercase tracking-wider">Islamic Date</p>
          <h3 className="text-5xl font-bold mt-4 font-arabic">{islamicDate.day}</h3>
          <p className="text-3xl mt-2 font-arabic">{islamicDate.monthNameAr}</p>
          <p className="text-purple-200 mt-1">{islamicDate.monthName}</p>
          <p className="text-2xl mt-4 font-bold">{islamicDate.year} {islamicDate.designation}</p>
        </div>

        {/* Holidays */}
        {islamicDate.holidays.length > 0 && (
          <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200 shadow-md">
            <div className="flex items-center gap-2 text-amber-800 mb-3">
              <i className="fas fa-star text-amber-500"></i>
              <span className="font-bold">Special Day</span>
            </div>
            {islamicDate.holidays.map((holiday, idx) => (
              <p key={idx} className="text-amber-900 font-medium text-lg">
                {holiday}
              </p>
            ))}
          </div>
        )}

        {/* Gregorian Date */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-stone-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-stone-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-calendar-alt text-stone-600 text-2xl"></i>
            </div>
            <div>
              <p className="text-sm text-stone-500">Gregorian Date</p>
              <p className="text-xl font-bold text-stone-800">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Islamic Months Reference */}
        <div className="bg-white rounded-xl shadow-md border border-stone-100 overflow-hidden">
          <div className="p-4 bg-stone-50 border-b border-stone-100">
            <h4 className="font-bold text-stone-800">Islamic Months</h4>
          </div>
          <div className="grid grid-cols-2 gap-px bg-stone-100">
            {[
              { en: 'Muharram', ar: 'مُحَرَّم', num: 1 },
              { en: 'Safar', ar: 'صَفَر', num: 2 },
              { en: "Rabi' al-Awwal", ar: 'رَبِيع الأَوَّل', num: 3 },
              { en: "Rabi' al-Thani", ar: 'رَبِيع الثَّانِي', num: 4 },
              { en: 'Jumada al-Awwal', ar: 'جُمَادَى الأُولَى', num: 5 },
              { en: 'Jumada al-Thani', ar: 'جُمَادَى الآخِرَة', num: 6 },
              { en: 'Rajab', ar: 'رَجَب', num: 7 },
              { en: "Sha'ban", ar: 'شَعْبَان', num: 8 },
              { en: 'Ramadan', ar: 'رَمَضَان', num: 9 },
              { en: 'Shawwal', ar: 'شَوَّال', num: 10 },
              { en: "Dhu al-Qi'dah", ar: 'ذُو القَعْدَة', num: 11 },
              { en: 'Dhu al-Hijjah', ar: 'ذُو الحِجَّة', num: 12 },
            ].map((month) => (
              <div
                key={month.num}
                className={`p-3 bg-white ${
                  month.num === islamicDate.month ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-400">{month.num}</p>
                    <p className={`font-medium ${month.num === islamicDate.month ? 'text-purple-700' : 'text-stone-700'}`}>
                      {month.en}
                    </p>
                  </div>
                  <p className={`font-arabic ${month.num === islamicDate.month ? 'text-purple-600' : 'text-stone-500'}`}>
                    {month.ar}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading && !prayerTimes) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <div className="w-16 h-16 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-stone-600">Getting your location...</p>
        <p className="text-sm text-stone-400 mt-1">Please allow location access when prompted</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 px-4">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <i className="fas fa-exclamation-triangle text-red-500 text-3xl"></i>
        </div>
        <h3 className="text-xl font-bold text-stone-800 mb-2">Location Required</h3>
        <p className="text-stone-600 text-center max-w-md mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors"
        >
          <i className="fas fa-redo mr-2"></i>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
          >
            <i className="fas fa-arrow-left text-stone-600"></i>
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-rose-900">Islamic Tools</h1>
          <p className="text-sm text-stone-500">أدوات إسلامية</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-stone-100 px-2">
        <div className="flex">
          <button
            onClick={() => setActiveTab('prayer')}
            className={`flex-1 py-4 text-center font-medium transition-colors relative ${
              activeTab === 'prayer' ? 'text-rose-700' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <i className="fas fa-mosque mr-2"></i>
            Prayer Times
            {activeTab === 'prayer' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('qibla')}
            className={`flex-1 py-4 text-center font-medium transition-colors relative ${
              activeTab === 'qibla' ? 'text-emerald-700' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <i className="fas fa-compass mr-2"></i>
            Qibla
            {activeTab === 'qibla' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 py-4 text-center font-medium transition-colors relative ${
              activeTab === 'calendar' ? 'text-purple-700' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <i className="fas fa-calendar-alt mr-2"></i>
            Calendar
            {activeTab === 'calendar' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 bg-stone-50">
        <div className="max-w-lg mx-auto pb-6">
          {activeTab === 'prayer' && renderPrayerTimes()}
          {activeTab === 'qibla' && renderQibla()}
          {activeTab === 'calendar' && renderCalendar()}
        </div>
      </div>
    </div>
  );
}
