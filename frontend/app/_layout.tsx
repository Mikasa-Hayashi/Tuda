import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import '../src/i18n/i18n';
import { ThemeProvider } from "../src/theme/ThemeContext";
import { setupDatabase } from "../src/db/dbInit"; // ← новый импорт

// Инициализируем БД один раз при старте приложения.
// setupDatabase() синхронный — выполнится до первого рендера.
setupDatabase();

export default function RootLayout() {
  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack
          initialRouteName="index"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen
            name="select-city"
            options={{
              presentation: "modal",
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="(tabs)"
            options={{
              gestureEnabled: false,
              animationTypeForReplace: "pop",
            }}
          />
          <Stack.Screen name="info" />
          <Stack.Screen name="route-info" />
          <Stack.Screen name="camera" />
          <Stack.Screen name="quiz" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="menu" />
        </Stack>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
