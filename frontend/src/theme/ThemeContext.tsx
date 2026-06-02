import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

// 1. Наши палитры цветов (одинаковые ключи, разные значения)
export const lightColors = {
  background: '#F2F2F7', // Светло-серый фон как в iOS
  card: '#FFFFFF',       // Белые карточки
  text: '#000000',       // Черный текст
  oppositeText: '#FFFFFF',
  textMuted: '#8E8E93',  // Серый текст для описаний
  primary: '#FFD700',    // Наш желтый акцент (оставляем одинаковым)
  border: '#E5E5EA',     // Линии разделения
  icon: '#3C3C43',
};

// yellow: '#FFD700',  // gold
// green:  '#34C759',  // iOS system green
// red:    '#FF3B30',  // iOS system red
// blue:   '#007AFF',  // iOS system blue

export const darkColors = {
  background: '#000000',
  card: '#1C1C1E',
  text: '#FFFFFF',
  oppositeText: '#000000',
  textMuted: '#A0A0A0',
  primary: '#FFD700',
  border: '#2C2C2E',
  icon: '#FFFFFF',
};

// Типы для нашего контекста
type ThemeType = 'light' | 'dark' | 'system';
type ThemeContextType = {
  themeMode: ThemeType;
  colors: typeof lightColors;
  setThemeMode: (mode: ThemeType) => void;
  isDark: boolean;
};

// 2. Создаем сам Контекст
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 3. Создаем Провайдер (Оболочку)
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Хук useColorScheme слушает, какая тема стоит в настройках самого телефона (iOS/Android)
  const systemColorScheme = useColorScheme(); 
  
  // Стейт, который хранит выбор пользователя (по умолчанию пусть будет система)
  const [themeMode, setThemeMode] = useState<ThemeType>('system');

  // Вычисляем, какая тема РЕАЛЬНО сейчас должна отображаться
  const isDark = 
    themeMode === 'dark' || 
    (themeMode === 'system' && systemColorScheme === 'dark');

  // Выбираем нужную палитру
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ themeMode, colors, setThemeMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 4. Удобный хук, чтобы доставать цвета в любом экране
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};