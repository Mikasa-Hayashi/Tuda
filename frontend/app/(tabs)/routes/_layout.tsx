import { Stack } from 'expo-router';

// Each native tab owns a Stack, so the screen gets the system navigation bar
// (large title, search bar, toolbar menu).
export default function RoutesLayout() {
  return <Stack />;
}
