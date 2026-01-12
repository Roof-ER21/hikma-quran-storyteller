/**
 * Theme Service - Dark Mode Management
 *
 * Handles theme switching, persistence, and system preference detection
 */

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'hikma_theme_preference';

/**
 * Get the user's preferred theme from localStorage
 */
export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system'; // Default to system preference
}

/**
 * Save theme preference to localStorage
 */
export function setStoredTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, theme);
}

/**
 * Check if system prefers dark mode
 */
export function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Get the effective theme (resolves 'system' to actual theme)
 */
export function getEffectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return systemPrefersDark() ? 'dark' : 'light';
  }
  return theme;
}

/**
 * Apply theme to document
 */
export function applyTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;

  const effectiveTheme = getEffectiveTheme(theme);
  const root = document.documentElement;

  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Update meta theme-color for browser chrome
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      'content',
      effectiveTheme === 'dark' ? '#0f0f14' : '#881337'
    );
  }
}

/**
 * Initialize theme on app load
 */
export function initializeTheme(): Theme {
  const storedTheme = getStoredTheme();
  applyTheme(storedTheme);
  return storedTheme;
}

/**
 * Watch for system theme changes
 */
export function watchSystemTheme(callback: (isDark: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };

  mediaQuery.addEventListener('change', handler);

  return () => {
    mediaQuery.removeEventListener('change', handler);
  };
}

/**
 * Cycle through themes: light -> dark -> system -> light
 */
export function cycleTheme(currentTheme: Theme): Theme {
  const cycle: Theme[] = ['light', 'dark', 'system'];
  const currentIndex = cycle.indexOf(currentTheme);
  return cycle[(currentIndex + 1) % cycle.length];
}

/**
 * Get theme icon for UI
 */
export function getThemeIcon(theme: Theme): string {
  switch (theme) {
    case 'light': return 'fa-sun';
    case 'dark': return 'fa-moon';
    case 'system': return 'fa-circle-half-stroke';
    default: return 'fa-sun';
  }
}

/**
 * Get theme label for UI
 */
export function getThemeLabel(theme: Theme, isArabic: boolean): string {
  const labels = {
    light: isArabic ? 'فاتح' : 'Light',
    dark: isArabic ? 'داكن' : 'Dark',
    system: isArabic ? 'تلقائي' : 'Auto',
  };
  return labels[theme] || labels.light;
}
