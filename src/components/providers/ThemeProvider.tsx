'use client';

// =============================================================
// ThemeProvider — Applies CSS custom properties from active theme
// =============================================================
//
// Wraps the app and injects theme CSS variables into a <div>.
// Reads the active theme from:
//   1. localStorage (instant paint, no flash)
//   2. Server-side profile (theme column, synced on load)
//
// Usage: Wrap in root layout:
//   <ThemeProvider><body>{children}</body></ThemeProvider>
// =============================================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { getTheme, themeToCSSVariables } from '@/lib/constants/themes';
import type { ThemeDefinition } from '@/types/economy';

// ── Context ───────────────────────────────────────────────────

interface ThemeContextValue {
  theme: ThemeDefinition;
  themeSlug: string;
  setTheme: (slug: string) => void;
  unlockedThemes: string[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────

const THEME_STORAGE_KEY = 'levelup-theme';
const UNLOCKED_STORAGE_KEY = 'levelup-unlocked-themes';

interface ThemeProviderProps {
  children: ReactNode;
  /** Server-side initial theme slug (from profile) */
  initialTheme?: string;
}

export default function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const [themeSlug, setThemeSlug] = useState<string>(() => {
    // Read from localStorage first for instant paint
    if (typeof window !== 'undefined') {
      return localStorage.getItem(THEME_STORAGE_KEY) || initialTheme || 'default';
    }
    return initialTheme || 'default';
  });

  const [unlockedThemes, setUnlockedThemes] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(UNLOCKED_STORAGE_KEY);
        return stored ? JSON.parse(stored) : ['default'];
      } catch {
        return ['default'];
      }
    }
    return ['default'];
  });

  const theme = useMemo(() => getTheme(themeSlug), [themeSlug]);

  const setTheme = useCallback((slug: string) => {
    setThemeSlug(slug);
    localStorage.setItem(THEME_STORAGE_KEY, slug);

    // Persist to server
    fetch('/api/shop/theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: slug }),
    }).catch(() => { /* best-effort */ });
  }, []);

  // Sync unlocked themes from server on mount
  useEffect(() => {
    fetch('/api/shop/themes')
      .then((r) => r.json())
      .then((data) => {
        if (data.unlockedThemes) {
          setUnlockedThemes(data.unlockedThemes);
          localStorage.setItem(UNLOCKED_STORAGE_KEY, JSON.stringify(data.unlockedThemes));
        }
        if (data.activeTheme && data.activeTheme !== themeSlug) {
          setThemeSlug(data.activeTheme);
          localStorage.setItem(THEME_STORAGE_KEY, data.activeTheme);
        }
      })
      .catch(() => { /* offline: use cached */ });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply CSS variables
  const cssVars = useMemo(() => themeToCSSVariables(theme), [theme]);

  const contextValue = useMemo<ThemeContextValue>(() => ({
    theme,
    themeSlug,
    setTheme,
    unlockedThemes,
  }), [theme, themeSlug, setTheme, unlockedThemes]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <div
        className="contents"
        style={cssVars as React.CSSProperties}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
