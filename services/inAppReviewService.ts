/**
 * In-App Review Service
 * Triggers native iOS App Store review prompt at strategic positive moments.
 * Apple allows max 3 prompts per 365-day period - we track internally.
 */
import { Capacitor } from '@capacitor/core';
import { buildIssueReportEmailLink } from './issueReportService';

const REVIEW_STORAGE_KEY = 'hikma_review_state';
const MAX_PROMPTS_PER_YEAR = 3;
const MIN_DAYS_BETWEEN_REVIEW_PROMPTS = 30;
const MIN_DAYS_BETWEEN_EXPERIENCE_PROMPTS = 45;
const MIN_SESSIONS_FOR_EXPERIENCE_PROMPT = 4;
const MIN_STORIES_FOR_EXPERIENCE_PROMPT = 2;

interface ReviewState {
  promptCount: number;
  lastPromptDate: string | null;
  storiesCompleted: number;
  sessionsCount: number;
  experiencePromptLastShown: string | null;
  lowSatisfactionCount: number;
  lastFeedbackDate: string | null;
}

function getReviewState(): ReviewState {
  const defaults: ReviewState = {
    promptCount: 0,
    lastPromptDate: null,
    storiesCompleted: 0,
    sessionsCount: 0,
    experiencePromptLastShown: null,
    lowSatisfactionCount: 0,
    lastFeedbackDate: null,
  };

  try {
    const stored = localStorage.getItem(REVIEW_STORAGE_KEY);
    if (stored) {
      const state = { ...defaults, ...JSON.parse(stored) } as ReviewState;
      // Reset counter if more than a year has passed
      if (state.lastPromptDate) {
        const daysSince = (Date.now() - new Date(state.lastPromptDate).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince > 365) {
          return defaults;
        }
      }
      return state;
    }
  } catch {}
  return defaults;
}

function saveReviewState(state: ReviewState): void {
  localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(state));
}

async function requestReview(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  const state = getReviewState();
  if (state.promptCount >= MAX_PROMPTS_PER_YEAR) return false;

  // Don't prompt again within 30 days.
  if (state.lastPromptDate) {
    const daysSince = (Date.now() - new Date(state.lastPromptDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < MIN_DAYS_BETWEEN_REVIEW_PROMPTS) return false;
  }

  try {
    const { InAppReview } = await import('@capacitor-community/in-app-review');
    await InAppReview.requestReview();
    state.promptCount++;
    state.lastPromptDate = new Date().toISOString();
    saveReviewState(state);
    return true;
  } catch (e) {
    console.error('In-app review failed:', e);
    return false;
  }
}

/** Call after a story is completed to track and potentially trigger review */
export function trackStoryCompletion(): void {
  const state = getReviewState();
  state.storiesCompleted++;
  saveReviewState(state);
}

/** Call on each app session start */
export function trackSessionStart(): void {
  const state = getReviewState();
  state.sessionsCount++;
  saveReviewState(state);
}

/** Ratings-protection funnel: ask experience first, then route review/support. */
export function shouldShowExperiencePrompt(): boolean {
  const state = getReviewState();
  const enoughUsage =
    state.sessionsCount >= MIN_SESSIONS_FOR_EXPERIENCE_PROMPT ||
    state.storiesCompleted >= MIN_STORIES_FOR_EXPERIENCE_PROMPT;
  if (!enoughUsage) return false;

  if (!state.experiencePromptLastShown) return true;

  const daysSinceLastShown =
    (Date.now() - new Date(state.experiencePromptLastShown).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceLastShown >= MIN_DAYS_BETWEEN_EXPERIENCE_PROMPTS;
}

export function markExperiencePromptShown(): void {
  const state = getReviewState();
  state.experiencePromptLastShown = new Date().toISOString();
  saveReviewState(state);
}

export function recordLowSatisfactionFeedback(): void {
  const state = getReviewState();
  state.lowSatisfactionCount += 1;
  state.lastFeedbackDate = new Date().toISOString();
  saveReviewState(state);
}

export async function requestInAppReviewIfEligible(): Promise<boolean> {
  return requestReview();
}

export function buildSupportEmailLink(): string {
  return buildIssueReportEmailLink({
    source: 'experience_prompt',
    category: 'feedback',
  });
}
