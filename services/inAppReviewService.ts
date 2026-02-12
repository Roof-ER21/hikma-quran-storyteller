/**
 * In-App Review Service
 * Triggers native iOS App Store review prompt at strategic positive moments.
 * Apple allows max 3 prompts per 365-day period - we track internally.
 */
import { Capacitor } from '@capacitor/core';

const REVIEW_STORAGE_KEY = 'hikma_review_state';
const MAX_PROMPTS_PER_YEAR = 3;

interface ReviewState {
  promptCount: number;
  lastPromptDate: string | null;
  storiesCompleted: number;
  sessionsCount: number;
}

function getReviewState(): ReviewState {
  try {
    const stored = localStorage.getItem(REVIEW_STORAGE_KEY);
    if (stored) {
      const state = JSON.parse(stored);
      // Reset counter if more than a year has passed
      if (state.lastPromptDate) {
        const daysSince = (Date.now() - new Date(state.lastPromptDate).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince > 365) {
          return { promptCount: 0, lastPromptDate: null, storiesCompleted: 0, sessionsCount: 0 };
        }
      }
      return state;
    }
  } catch {}
  return { promptCount: 0, lastPromptDate: null, storiesCompleted: 0, sessionsCount: 0 };
}

function saveReviewState(state: ReviewState): void {
  localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(state));
}

async function requestReview(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const state = getReviewState();
  if (state.promptCount >= MAX_PROMPTS_PER_YEAR) return;

  // Don't prompt again within 30 days
  if (state.lastPromptDate) {
    const daysSince = (Date.now() - new Date(state.lastPromptDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 30) return;
  }

  try {
    const { InAppReview } = await import('@capacitor-community/in-app-review');
    await InAppReview.requestReview();
    state.promptCount++;
    state.lastPromptDate = new Date().toISOString();
    saveReviewState(state);
  } catch (e) {
    console.error('In-app review failed:', e);
  }
}

/** Call after a story is completed to track and potentially trigger review */
export function trackStoryCompletion(): void {
  const state = getReviewState();
  state.storiesCompleted++;
  saveReviewState(state);
  // Trigger review after 3rd story completion
  if (state.storiesCompleted === 3) {
    requestReview();
  }
}

/** Call on each app session start */
export function trackSessionStart(): void {
  const state = getReviewState();
  state.sessionsCount++;
  saveReviewState(state);
  // Trigger review after 7th session (implies regular usage)
  if (state.sessionsCount === 7) {
    requestReview();
  }
}
