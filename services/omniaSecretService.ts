/**
 * Omnia Secret Service
 *
 * A special service for the secret love page feature for Omnia.
 * When Omnia logs in and answers the secret question correctly,
 * she sees a beautiful love page from Ahmed, Jasmine, and Malik.
 */

/**
 * Check if the logged-in user is Omnia (case-insensitive)
 */
export function isOmnia(name: string | null): boolean {
  if (!name) return false;
  const normalized = name.toLowerCase().trim();
  // Check English "omnia" or Arabic "أمنية"
  return normalized === 'omnia' || name.trim() === 'أمنية';
}

/**
 * Verify the secret answer
 * Accepts "scooby" or "scooby doo" (case-insensitive)
 */
export function verifyOmniaSecret(answer: string): boolean {
  if (!answer) return false;
  return answer.toLowerCase().trim().includes('scooby');
}

/**
 * The secret question to ask Omnia
 */
export const OMNIA_SECRET_QUESTION = "Who's my dawg?";
