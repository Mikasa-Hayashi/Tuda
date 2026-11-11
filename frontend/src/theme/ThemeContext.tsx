import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';

export const lightColors = {
  background: '#F2F2F7',
  card: '#FFFFFF',
  cardElevated: '#F2F2F7',
  text: '#000000',
  textSecondary: '#6C6C70',
  textMuted: '#8E8E93',
  primary: '#007AFF',
  primaryDim: '#007AFF22',
  primaryDeep: '#007AFF',
  border: '#C6C6C8',
  separator: '#C6C6C8',
  icon: '#6C6C70',
  oppositeText: '#FFFFFF',
  danger: '#FF3B30',
  success: '#34C759',
  overlay: 'rgba(0,0,0,0.4)',
  like: '#FF3B30',
  tabBar: 'rgba(249,249,249,0.94)',
};

export const darkColors = {
  background: '#000000',
  card: '#1C1C1E',
  cardElevated: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#AEAEB2',
  textMuted: '#8E8E93',
  primary: '#0A84FF',
  primaryDim: '#0A84FF33',
  primaryDeep: '#0A84FF',
  border: '#38383A',
  separator: '#38383A',
  icon: '#AEAEB2',
  oppositeText: '#FFFFFF',
  danger: '#FF453A',
  success: '#30D158',
  overlay: 'rgba(0,0,0,0.6)',
  like: '#FF453A',
  tabBar: 'rgba(30,30,30,0.94)',
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

  // Native UI (navigation bars, tab bar, sheets, menus, alerts, SwiftUI controls) follows the
  // system appearance, not our JS colours. Tell iOS which scheme the user picked in the app;
  // 'unspecified' hands control back to the system setting.
  useEffect(() => {
    Appearance.setColorScheme(themeMode === 'system' ? 'unspecified' : themeMode);
  }, [themeMode]);

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
