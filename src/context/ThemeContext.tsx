import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppTheme } from '../types';

export interface ThemeConfig {
  name: string;
  key: AppTheme;
  description: string;
  palette: {
    bg: string;
    bgSecondary: string;
    card: string;
    primary: string;
    primaryHover: string;
    secondary: string;
    softAccent: string;
    mainText: string;
    secondaryText: string;
    mutedText: string;
    border: string;
    positive: string;
    negative: string;
    warning: string;
    bullGreen: string;
    bearRed: string;
    bearRedSoft: string;
    chartGreens: string[];
    chartReds: string[];
  };
}

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  themeConfig: ThemeConfig;
}

const THEME_STORAGE_KEY = 'smll_active_theme_2026';

export const THEME_CONFIGS: Record<AppTheme, ThemeConfig> = {
  royal_blue: {
    name: 'Donezo Light',
    key: 'royal_blue',
    description: 'Clean off-white canvas with #0D6847 forest green primary, crisp white cards, and balanced trading red accents.',
    palette: {
      bg: '#F4F5F7',
      bgSecondary: '#EBEFEF',
      card: '#FFFFFF',
      primary: '#0D6847',
      primaryHover: '#095237',
      secondary: '#16845B',
      softAccent: '#E6F4ED',
      mainText: '#111827',
      secondaryText: '#4B5563',
      mutedText: '#6B7280',
      border: '#E5E7EB',
      positive: '#0D6847',
      negative: '#B82E3B',
      warning: '#D97706',
      bullGreen: '#0D6847',
      bearRed: '#B82E3B',
      bearRedSoft: '#FDE8E8',
      chartGreens: ['#0D6847', '#16845B', '#299C70', '#72B99A'],
      chartReds: ['#B82E3B', '#D94B4B', '#E66B6B', '#F08A83'],
    },
  },
  premium_emerald: {
    name: 'Modern Dark',
    key: 'premium_emerald',
    description: 'Deep black canvas with unified brand emerald green accents, elevated dark cards, and trading red risk indicators.',
    palette: {
      bg: '#000000',
      bgSecondary: '#080A0D',
      card: '#0D1117',
      primary: '#10B981',
      primaryHover: '#059669',
      secondary: '#299C70',
      softAccent: 'rgba(16, 185, 129, 0.12)',
      mainText: '#F3F4F6',
      secondaryText: '#9CA3AF',
      mutedText: '#6B7280',
      border: '#21262D',
      positive: '#10B981',
      negative: '#D94B4B',
      warning: '#F59E0B',
      bullGreen: '#10B981',
      bearRed: '#D94B4B',
      bearRedSoft: 'rgba(217, 75, 75, 0.16)',
      chartGreens: ['#10B981', '#299C70', '#16845B', '#72B99A'],
      chartReds: ['#D94B4B', '#E66B6B', '#B82E3B', '#F08A83'],
    },
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode; initialTheme?: AppTheme }> = ({ 
  children,
  initialTheme
}) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    let resolved: AppTheme = 'royal_blue';
    if (initialTheme && (initialTheme === 'royal_blue' || initialTheme === 'premium_emerald')) {
      resolved = initialTheme;
    } else {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as AppTheme | null;
      if (stored === 'premium_emerald' || stored === 'royal_blue') {
        resolved = stored;
      }
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', resolved);
      document.documentElement.classList.toggle('dark', resolved === 'premium_emerald');
    }
    return resolved;
  });

  useEffect(() => {
    if (initialTheme && (initialTheme === 'royal_blue' || initialTheme === 'premium_emerald')) {
      if (initialTheme !== theme) {
        setThemeState(initialTheme);
        document.documentElement.setAttribute('data-theme', initialTheme);
        document.documentElement.classList.toggle('dark', initialTheme === 'premium_emerald');
      }
    }
  }, [initialTheme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'premium_emerald');
    document.body.className = `theme-bg theme-main-text antialiased selection:bg-emerald-500/20 selection:text-emerald-950`;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (newTheme: AppTheme) => {
    const validTheme = newTheme === 'premium_emerald' ? 'premium_emerald' : 'royal_blue';
    document.documentElement.setAttribute('data-theme', validTheme);
    document.documentElement.classList.toggle('dark', validTheme === 'premium_emerald');
    setThemeState(validTheme);
    localStorage.setItem(THEME_STORAGE_KEY, validTheme);
  };

  const toggleTheme = () => {
    const nextTheme: AppTheme = theme === 'royal_blue' ? 'premium_emerald' : 'royal_blue';
    setTheme(nextTheme);
  };

  const themeConfig = THEME_CONFIGS[theme] || THEME_CONFIGS.royal_blue;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, themeConfig }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
