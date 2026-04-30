import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeName, ThemeColors, THEMES } from './colors';

const STORAGE_KEY = 'streakapp_theme';

interface ThemeContextValue {
  theme: ThemeName;
  colors: ThemeColors;
  toggle: () => void;
  setTheme: (t: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemDefault(): ThemeName {
  return Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(systemDefault);

  // Load stored preference (overrides system default)
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY).then(v => {
      if (cancelled) return;
      if (v === 'dark' || v === 'light') setThemeState(v);
    });
    return () => { cancelled = true; };
  }, []);

  const setTheme = useCallback((t: ThemeName) => {
    setThemeState(t);
    AsyncStorage.setItem(STORAGE_KEY, t).catch(() => {});
  }, []);

  const toggle = useCallback(() => {
    setThemeState(prev => {
      const next: ThemeName = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const value: ThemeContextValue = {
    theme,
    colors: THEMES[theme],
    toggle,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
