import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

export const lightColors = {
  background: '#F6F2EA',
  card: '#FFFFFF',
  cardElevated: '#F3EEE3',
  text: '#1C1A17',
  textSecondary: '#5B554C',
  textMuted: '#9A9388',
  primary: '#C8782A',
  primaryDim: '#C8782A22',
  primaryDeep: '#A65E1B',
  border: '#E7E0D4',
  separator: '#E7E0D4',
  icon: '#5B554C',
  oppositeText: '#FFFFFF',
  danger: '#E0563B',
  success: '#3E7A5E',
  overlay: 'rgba(20,14,6,0.4)',
  like: '#E0563B',
  tabBar: 'rgba(246,242,234,0.95)',
};

export const darkColors = {
  background: '#1C1A17',
  card: '#2A2620',
  cardElevated: '#332E28',
  text: '#F6F2EA',
  textSecondary: '#C8BFB0',
  textMuted: '#9A9388',
  primary: '#D8882A',
  primaryDim: '#D8882A33',
  primaryDeep: '#E89540',
  border: '#3D3830',
  separator: '#3D3830',
  icon: '#C8BFB0',
  oppositeText: '#FFFFFF',
  danger: '#E0563B',
  success: '#3E7A5E',
  overlay: 'rgba(0,0,0,0.6)',
  like: '#E0563B',
  tabBar: 'rgba(28,26,23,0.95)',
};

type ThemeType = 'light' | 'dark' | 'system';
type ThemeContextType = {
  themeMode: ThemeType;
  colors: typeof lightColors;
  setThemeMode: (mode: ThemeType) => void;
  isDark: boolean;
};

const THEME_KEY = 'app.themeMode';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeType>('system');

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
