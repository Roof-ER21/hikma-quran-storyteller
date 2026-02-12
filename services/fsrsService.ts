import { createEmptyCard, fsrs, generatorParameters, Rating, Card, RecordLog } from 'ts-fsrs';
import {
  saveFSRSCard,
  getFSRSCard,
  getDueFSRSCards,
  getAllFSRSCards,
  FSRSReviewCard
} from './offlineDatabase';

// Custom FSRS parameters optimized for Quran memorization
// Longer intervals since verses need deep, long-term memorization
const QURAN_FSRS_PARAMS = generatorParameters({
  maximum_interval: 365,      // 1 year max interval
  request_retention: 0.90,    // Target 90% retention (Quran needs high accuracy)
  w: [
    0.4072, 1.1829, 3.1262, 15.4722, 7.2102,
    0.5316, 1.0651, 0.0234, 1.616, 0.1544,
    1.0824, 1.9813, 0.0953, 0.2975, 2.2042,
    0.2407, 2.9466, 0.5034, 0.6567
  ]
});

let fsrsInstance: ReturnType<typeof fsrs> | null = null;

/**
 * Initialize FSRS instance with Quran-optimized parameters
 */
export function initializeFSRS() {
  if (!fsrsInstance) {
    fsrsInstance = fsrs(QURAN_FSRS_PARAMS);
  }
  return fsrsInstance;
}

/**
 * Create a new FSRS card for a verse
 * @param verseKey - Format: "{surahNumber}:{verseNumber}" (e.g., "1:1")
 */
export async function createNewCard(verseKey: string): Promise<FSRSReviewCard> {
  const f = initializeFSRS();
  const [surahStr, verseStr] = verseKey.split(':');
  const surahNumber = parseInt(surahStr, 10);
  const verseNumber = parseInt(verseStr, 10);

  const emptyCard = createEmptyCard();
  const now = Date.now();

  const reviewCard: FSRSReviewCard = {
    id: verseKey,
    surahNumber,
    verseNumber,
    card: emptyCard as any,
    lastReview: now,
    nextReview: now, // Due immediately for first review
    totalReviews: 0,
    createdAt: now
  };

  await saveFSRSCard(reviewCard);
  return reviewCard;
}

/**
 * Convert rating string to FSRS Rating enum
 */
function getRatingValue(rating: 'again' | 'hard' | 'good' | 'easy'): Rating {
  const ratingMap: Record<string, Rating> = {
    again: Rating.Again,
    hard: Rating.Hard,
    good: Rating.Good,
    easy: Rating.Easy
  };
  return ratingMap[rating];
}

/**
 * Review a card and schedule next review
 * @param verseKey - Format: "{surahNumber}:{verseNumber}"
 * @param rating - User's performance: 'again' | 'hard' | 'good' | 'easy'
 */
export async function reviewCard(
  verseKey: string,
  rating: 'again' | 'hard' | 'good' | 'easy'
): Promise<FSRSReviewCard> {
  const f = initializeFSRS();

  // Get existing card or create new one
  let existingCard = await getFSRSCard(verseKey);
  if (!existingCard) {
    existingCard = await createNewCard(verseKey);
  }

  const card = existingCard.card as Card;
  const ratingValue = getRatingValue(rating);
  const now = new Date();

  // Schedule next review using FSRS algorithm
  const schedulingCards = f.repeat(card, now);
  const selectedCard = schedulingCards[ratingValue];

  // Update the card
  const updatedCard: FSRSReviewCard = {
    ...existingCard,
    card: selectedCard.card as any,
    lastReview: Date.now(),
    nextReview: selectedCard.card.due.getTime(),
    totalReviews: existingCard.totalReviews + 1
  };

  await saveFSRSCard(updatedCard);
  return updatedCard;
}

/**
 * Get all cards that are due for review today
 */
export async function getDueCards(): Promise<FSRSReviewCard[]> {
  return await getDueFSRSCards();
}

/**
 * Get review statistics
 */
export async function getReviewStats(): Promise<{
  totalCards: number;
  dueToday: number;
  masteredCount: number;
}> {
  const allCards = await getAllFSRSCards();
  const dueCards = await getDueFSRSCards();

  // Consider a card "mastered" if it has 5+ reviews and next review is 30+ days away
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const masteredCards = allCards.filter(card => {
    const daysTillReview = card.nextReview - now;
    return card.totalReviews >= 5 && daysTillReview >= thirtyDaysMs;
  });

  return {
    totalCards: allCards.length,
    dueToday: dueCards.length,
    masteredCount: masteredCards.length
  };
}

/**
 * Get when a specific verse is due for next review
 * @param verseKey - Format: "{surahNumber}:{verseNumber}"
 * @returns Date of next review, or null if card doesn't exist
 */
export async function getNextReviewDate(verseKey: string): Promise<Date | null> {
  const card = await getFSRSCard(verseKey);
  if (!card) return null;
  return new Date(card.nextReview);
}

/**
 * Get all cards for a specific surah
 */
export async function getCardsForSurah(surahNumber: number): Promise<FSRSReviewCard[]> {
  const allCards = await getAllFSRSCards();
  return allCards.filter(card => card.surahNumber === surahNumber);
}

/**
 * Check if a verse has an active FSRS card
 */
export async function hasActiveCard(verseKey: string): Promise<boolean> {
  const card = await getFSRSCard(verseKey);
  return !!card;
}
