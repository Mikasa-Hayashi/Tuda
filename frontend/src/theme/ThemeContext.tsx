import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

export const darkColors = {
  background: '#000000',
  card: '#1C1C1E',
  cardElevated: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#EBEBF5CC',
  textMuted: '#8E8E93',
  primary: '#FFD60A',
  primaryDim: '#FFD60A33',
  border: '#38383A',
  separator: '#38383A',
  icon: '#EBEBF5',
  oppositeText: '#000000',
  danger: '#FF453A',
  success: '#30D158',
  overlay: 'rgba(0,0,0,0.6)',
};

export const lightColors = {
  background: '#F2F2F7',
  card: '#FFFFFF',
  cardElevated: '#EFEFF4',
  text: '#000000',
  textSecondary: '#3C3C4399',
  textMuted: '#6C6C70',
  primary: '#C47900',
  primaryDim: '#C4790022',
  border: '#E5E5EA',
  separator: '#C6C6C8',
  icon: '#3C3C43',
  oppositeText: '#FFFFFF',
  danger: '#FF3B30',
  success: '#34C759',
  overlay: 'rgba(0,0,0,0.4)',
};

type ThemeType = 'light' | 'dark' | 'system';
type ThemeContextType = {
  themeMode: ThemeType;
  colors: typeof darkColors;
  setThemeMode: (mode: ThemeType) => void;
  isDark: boolean;
};

const THEME_KEY = 'app.themeMode';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeType>('dark');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemeModeState(saved);
      }
    });
  }, []);

  const setThemeMode = (mode: ThemeType) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_KEY, mode);
  };

  const isDark =
    themeMode === 'dark' ||
    (themeMode === 'system' && systemColorScheme === 'dark');

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ themeMode, colors, setThemeMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
