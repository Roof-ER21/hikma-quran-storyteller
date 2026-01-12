/**
 * Theme Context - React context for dark mode
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Theme,
  getStoredTheme,
  setStoredTheme,
  applyTheme,
  initializeTheme,
  watchSystemTheme,
  getEffectiveTheme,
  cycleTheme,
  getThemeIcon,
  getThemeLabel,
} from '../../services/themeService';

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  themeIcon: string;
  getLabel: (isArabic: boolean) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => initializeTheme());
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => getEffectiveTheme(theme));

  // Update effective theme when theme or system preference changes
  useEffect(() => {
    const effective = getEffectiveTheme(theme);
    setEffectiveTheme(effective);
    applyTheme(theme);
  }, [theme]);

  // Watch for system theme changes when using 'system' preference
  useEffect(() => {
    if (theme !== 'system') return;

    const unwatch = watchSystemTheme((isDark) => {
      setEffectiveTheme(isDark ? 'dark' : 'light');
      applyTheme('system');
    });

    return unwatch;
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    setStoredTheme(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme = cycleTheme(theme);
    setTheme(nextTheme);
  }, [theme, setTheme]);

  const value: ThemeContextType = {
    theme,
    effectiveTheme,
    isDark: effectiveTheme === 'dark',
    setTheme,
    toggleTheme,
    themeIcon: getThemeIcon(theme),
    getLabel: (isArabic: boolean) => getThemeLabel(theme, isArabic),
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Export a hook for just checking dark mode (simpler API)
export function useDarkMode(): boolean {
  const { isDark } = useTheme();
  return isDark;
}
