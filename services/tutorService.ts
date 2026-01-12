/**
 * Tutor Service - Manages tutor selection and persistence
 */

import type { TutorPreset } from './tutorPresets';
import { TUTOR_PRESETS, DEFAULT_TUTOR_ID, getTutorById, getDefaultTutor } from './tutorPresets';

// Storage key for selected tutor
const STORAGE_KEY = 'alayasoad_selected_tutor';

/**
 * Get the currently selected tutor ID from storage
 */
export function getSelectedTutorId(): string {
  if (typeof window === 'undefined') return DEFAULT_TUTOR_ID;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && getTutorById(stored)) {
    return stored;
  }
  return DEFAULT_TUTOR_ID;
}

/**
 * Get the currently selected tutor preset
 */
export function getSelectedTutor(): TutorPreset {
  const id = getSelectedTutorId();
  return getTutorById(id) || getDefaultTutor();
}

/**
 * Save the selected tutor ID to storage
 */
export function setSelectedTutor(tutorId: string): boolean {
  if (typeof window === 'undefined') return false;

  const tutor = getTutorById(tutorId);
  if (!tutor) {
    console.warn(`Invalid tutor ID: ${tutorId}`);
    return false;
  }

  localStorage.setItem(STORAGE_KEY, tutorId);
  return true;
}

/**
 * Clear the selected tutor (resets to default)
 */
export function clearSelectedTutor(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get all available tutors
 */
export function getAllTutors(): TutorPreset[] {
  return TUTOR_PRESETS;
}

/**
 * Build the complete system prompt for a tutor + learning mode
 * Combines the tutor's personality with the mode-specific instructions
 */
export function buildTutorPrompt(tutorId: string, modePrompt: string): string {
  const tutor = getTutorById(tutorId) || getDefaultTutor();

  // Combine tutor personality with mode-specific instructions
  return `${tutor.systemPrompt}

---

CURRENT LEARNING MODE INSTRUCTIONS:
${modePrompt}

---

Remember to maintain your personality (${tutor.name}) throughout the session while following the mode-specific instructions above.`;
}

/**
 * Get voice configuration for a tutor
 */
export function getTutorVoiceConfig(tutorId: string): { name: string; speed: number } {
  const tutor = getTutorById(tutorId) || getDefaultTutor();
  return tutor.voice;
}

/**
 * Check if a tutor is the currently selected one
 */
export function isSelectedTutor(tutorId: string): boolean {
  return getSelectedTutorId() === tutorId;
}

// Re-export types and presets for convenience
export type { TutorPreset };
export { TUTOR_PRESETS, DEFAULT_TUTOR_ID };
