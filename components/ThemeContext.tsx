import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Theme } from './ThemeToggle';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem('theme-preference') as Theme | null;
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch {}
  return 'system';
}

function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  const root = document.documentElement;
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // Apply on mount and whenever theme changes
  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem('theme-preference', theme);
    } catch {}
  }, [theme]);

  // Respond to system changes when in 'system' mode
  useEffect(() => {
    const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (!mq) return;
    const handler = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    // Support both modern and legacy listeners
    if ('addEventListener' in mq) {
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else if ('addListener' in mq) {
      // @ts-ignore - older Safari
      mq.addListener(handler);
      return () => {
        // @ts-ignore - older Safari
        mq.removeListener(handler);
      };
    }
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
