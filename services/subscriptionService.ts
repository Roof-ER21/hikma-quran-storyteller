/**
 * Subscription Service for Hikma Quran Storyteller
 * Uses RevenueCat on iOS (Capacitor) and localStorage tracking on web
 */

import { Capacitor } from '@capacitor/core';

// RevenueCat types (imported dynamically on native)
interface SubscriptionState {
  isPremium: boolean;
  expiresAt: string | null;
  productId: string | null;
}

const STORAGE_KEY = 'hikma_subscription';
const FREE_TUTOR_LIMIT = 3; // Free AI tutor sessions per day
const FREE_KIDS_LIMIT = 5; // Free kids lessons per day
const USAGE_KEY = 'hikma_usage';

// Platform detection
const isNative = Capacitor.isNativePlatform();

// ============================================================
// Core subscription functions
// ============================================================

export async function initSubscription(): Promise<void> {
  if (!isNative) return;

  const apiKey = import.meta.env.VITE_REVENUECAT_API_KEY;
  if (!apiKey) {
    console.warn('RevenueCat API key not configured. In-app purchases disabled.');
    return;
  }

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    await Purchases.configure({
      apiKey: apiKey,
    });
    console.log('RevenueCat initialized successfully');
  } catch (e) {
    console.warn('RevenueCat init failed (expected on web):', e);
  }
}

export async function checkPremiumStatus(): Promise<boolean> {
  if (!isNative) {
    const state = getLocalSubscription();
    return state.isPremium;
  }

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.getCustomerInfo();
    const isPremium =
      customerInfo.entitlements.active['premium'] !== undefined ||
      customerInfo.entitlements.active['kids_premium'] !== undefined ||
      customerInfo.entitlements.active['scholar'] !== undefined;

    // Cache locally
    setLocalSubscription({ isPremium, expiresAt: null, productId: null });
    return isPremium;
  } catch {
    // Fallback to cached state
    return getLocalSubscription().isPremium;
  }
}

export async function getOfferings(): Promise<any | null> {
  if (!isNative) return null;

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { offerings } = await Purchases.getOfferings();
    return offerings;
  } catch (e) {
    console.error('Error getting offerings:', e);
    return null;
  }
}

export async function purchasePackage(pkg: any): Promise<boolean> {
  if (!isNative) return false;

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const result = await Purchases.purchasePackage({ aPackage: pkg });
    const isPremium =
      result.customerInfo.entitlements.active['premium'] !== undefined ||
      result.customerInfo.entitlements.active['kids_premium'] !== undefined ||
      result.customerInfo.entitlements.active['scholar'] !== undefined;

    setLocalSubscription({ isPremium, expiresAt: null, productId: pkg.identifier });
    return isPremium;
  } catch (e: any) {
    if (e?.code === '1' || e?.userCancelled) return false;
    throw e;
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!isNative) return false;

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.restorePurchases();
    const isPremium =
      customerInfo.entitlements.active['premium'] !== undefined ||
      customerInfo.entitlements.active['kids_premium'] !== undefined ||
      customerInfo.entitlements.active['scholar'] !== undefined;

    setLocalSubscription({ isPremium, expiresAt: null, productId: null });
    return isPremium;
  } catch {
    return false;
  }
}

// ============================================================
// Usage tracking (free tier limits)
// ============================================================

interface DailyUsage {
  date: string;
  tutorSessions: number;
  kidsLessons: number;
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function getDailyUsage(): DailyUsage {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) return { date: getTodayKey(), tutorSessions: 0, kidsLessons: 0 };
    const usage: DailyUsage = JSON.parse(raw);
    if (usage.date !== getTodayKey()) {
      return { date: getTodayKey(), tutorSessions: 0, kidsLessons: 0 };
    }
    return usage;
  } catch {
    return { date: getTodayKey(), tutorSessions: 0, kidsLessons: 0 };
  }
}

function saveDailyUsage(usage: DailyUsage): void {
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
}

export function canUseTutor(): boolean {
  const usage = getDailyUsage();
  return usage.tutorSessions < FREE_TUTOR_LIMIT;
}

export function recordTutorUse(): void {
  const usage = getDailyUsage();
  usage.tutorSessions++;
  saveDailyUsage(usage);
}

export function getTutorUsesRemaining(): number {
  const usage = getDailyUsage();
  return Math.max(0, FREE_TUTOR_LIMIT - usage.tutorSessions);
}

export function canUseKidsContent(): boolean {
  const usage = getDailyUsage();
  return usage.kidsLessons < FREE_KIDS_LIMIT;
}

export function recordKidsUse(): void {
  const usage = getDailyUsage();
  usage.kidsLessons++;
  saveDailyUsage(usage);
}

export function getKidsUsesRemaining(): number {
  const usage = getDailyUsage();
  return Math.max(0, FREE_KIDS_LIMIT - usage.kidsLessons);
}

// ============================================================
// Local storage helpers
// ============================================================

function getLocalSubscription(): SubscriptionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { isPremium: false, expiresAt: null, productId: null };
    return JSON.parse(raw);
  } catch {
    return { isPremium: false, expiresAt: null, productId: null };
  }
}

function setLocalSubscription(state: SubscriptionState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
