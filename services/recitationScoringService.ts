/**
 * Recitation Scoring Service
 * Provides enhanced scoring logic for Quran recitation with Arabic text normalization
 */

export interface WordResult {
  word: string;
  status: 'correct' | 'incorrect' | 'missing' | 'extra';
  feedback?: string;
}

export interface ScoringResult {
  accuracy: number;
  wordResults: WordResult[];
  tajweedScore: number;
  encouragement: string;
}

/**
 * Normalize Arabic text for comparison
 * Removes diacritics and normalizes character variants
 */
export const normalizeArabicText = (text: string): string => {
  let normalized = text;

  // Remove Arabic diacritics (tashkeel) - Unicode range U+064B to U+065F
  normalized = normalized.replace(/[\u064B-\u065F]/g, '');

  // Normalize Alef variants (أ إ آ → ا)
  normalized = normalized.replace(/[أإآ]/g, 'ا');

  // Normalize Taa Marbuta variants (ة → ه) - optional, more lenient
  // normalized = normalized.replace(/ة/g, 'ه');

  // Normalize Yaa variants (ى → ي)
  normalized = normalized.replace(/ى/g, 'ي');

  // Remove extra whitespace and trim
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
};

/**
 * Score recitation by comparing transcribed text with correct text
 * Uses simple word-matching algorithm
 */
export const scoreRecitation = (
  transcribedText: string,
  correctText: string
): ScoringResult => {
  // Normalize both texts
  const normalizedTranscription = normalizeArabicText(transcribedText);
  const normalizedCorrect = normalizeArabicText(correctText);

  // Split into words
  const transcribedWords = normalizedTranscription.split(/\s+/).filter(w => w.length > 0);
  const correctWords = normalizedCorrect.split(/\s+/).filter(w => w.length > 0);

  const wordResults: WordResult[] = [];
  let correctCount = 0;
  let incorrectCount = 0;
  let missingCount = 0;
  let extraCount = 0;

  // Track which correct words have been matched
  const matchedCorrectIndices = new Set<number>();
  const matchedTranscribedIndices = new Set<number>();

  // First pass: Find exact matches in order
  let transcribedIndex = 0;
  for (let correctIndex = 0; correctIndex < correctWords.length; correctIndex++) {
    const correctWord = correctWords[correctIndex];

    // Look for this word starting from current position in transcription
    let found = false;
    for (let i = transcribedIndex; i < transcribedWords.length; i++) {
      if (transcribedWords[i] === correctWord && !matchedTranscribedIndices.has(i)) {
        // Exact match found
        wordResults.push({
          word: correctWord,
          status: 'correct'
        });
        correctCount++;
        matchedCorrectIndices.add(correctIndex);
        matchedTranscribedIndices.add(i);
        transcribedIndex = i + 1;
        found = true;
        break;
      }
    }

    if (!found) {
      // Check if there's a similar word (allowing for slight pronunciation differences)
      let similarFound = false;
      for (let i = transcribedIndex; i < transcribedWords.length; i++) {
        if (!matchedTranscribedIndices.has(i) &&
            isSimilarWord(transcribedWords[i], correctWord)) {
          wordResults.push({
            word: correctWord,
            status: 'incorrect',
            feedback: `Said: ${transcribedWords[i]}`
          });
          incorrectCount++;
          matchedCorrectIndices.add(correctIndex);
          matchedTranscribedIndices.add(i);
          transcribedIndex = i + 1;
          similarFound = true;
          break;
        }
      }

      if (!similarFound) {
        // Word is missing from recitation
        wordResults.push({
          word: correctWord,
          status: 'missing',
          feedback: 'This word was not recited'
        });
        missingCount++;
      }
    }
  }

  // Second pass: Find extra words that weren't in the correct text
  for (let i = 0; i < transcribedWords.length; i++) {
    if (!matchedTranscribedIndices.has(i)) {
      wordResults.push({
        word: transcribedWords[i],
        status: 'extra',
        feedback: 'This word should not be here'
      });
      extraCount++;
    }
  }

  // Calculate accuracy based on correct words vs total expected words
  const totalExpectedWords = correctWords.length;
  const accuracy = totalExpectedWords > 0
    ? Math.round((correctCount / totalExpectedWords) * 100)
    : 0;

  // Calculate Tajweed score using weighted system
  const tajweedScore = calculateTajweedScore(wordResults);

  // Get encouragement message
  const encouragement = getEncouragement(accuracy);

  return {
    accuracy,
    wordResults,
    tajweedScore,
    encouragement
  };
};

/**
 * Check if two Arabic words are similar (accounting for minor pronunciation differences)
 * Uses simple character similarity - at least 60% matching characters
 */
const isSimilarWord = (word1: string, word2: string): boolean => {
  if (word1.length === 0 || word2.length === 0) return false;
  if (word1 === word2) return true;

  // Count matching characters
  const minLength = Math.min(word1.length, word2.length);
  let matches = 0;

  for (let i = 0; i < minLength; i++) {
    if (word1[i] === word2[i]) {
      matches++;
    }
  }

  const similarity = matches / Math.max(word1.length, word2.length);
  return similarity >= 0.6; // 60% similarity threshold
};

/**
 * Calculate Tajweed score based on word results
 * Weights:
 * - correct = 1.0
 * - incorrect = 0.3 (partial credit for attempting)
 * - missing = 0.0
 * - extra = -0.1 penalty
 */
export const calculateTajweedScore = (wordResults: WordResult[]): number => {
  if (wordResults.length === 0) return 0;

  let totalScore = 0;
  let maxPossibleScore = 0;

  for (const result of wordResults) {
    switch (result.status) {
      case 'correct':
        totalScore += 1.0;
        maxPossibleScore += 1.0;
        break;
      case 'incorrect':
        totalScore += 0.3;
        maxPossibleScore += 1.0;
        break;
      case 'missing':
        totalScore += 0.0;
        maxPossibleScore += 1.0;
        break;
      case 'extra':
        totalScore -= 0.1;
        // Extra words don't count toward max score
        break;
    }
  }

  // Ensure score is at least 0
  totalScore = Math.max(0, totalScore);

  // Calculate percentage
  const percentage = maxPossibleScore > 0
    ? (totalScore / maxPossibleScore) * 100
    : 0;

  return Math.round(Math.max(0, Math.min(100, percentage)));
};

/**
 * Get encouraging message based on accuracy score
 */
export const getEncouragement = (accuracy: number): string => {
  if (accuracy >= 95) {
    return "Masha'Allah! Perfect recitation!";
  } else if (accuracy >= 85) {
    return "Excellent! Almost there!";
  } else if (accuracy >= 70) {
    return "Good effort! Keep practicing!";
  } else if (accuracy >= 50) {
    return "You're learning! Try again slowly.";
  } else {
    return "Don't give up! Listen to the verse first.";
  }
};
