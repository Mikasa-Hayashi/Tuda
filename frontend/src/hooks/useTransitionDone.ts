import { useNavigation, type NativeStackNavigationProp } from 'expo-router';
import { useEffect, useState } from 'react';

/**
 * True once the screen's opening animation (push / sheet) has finished, so heavy work (sync DB
 * reads, starting playback) can wait for it instead of guessing a delay.
 *
 * `fallbackMs` is only a safety net for presentations that do not emit `transitionEnd`.
 */
export function useTransitionDone(fallbackMs = 1200): boolean {
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('transitionEnd', (e) => {
      if (!e.data.closing) setDone(true);
    });
    const timer = setTimeout(() => setDone(true), fallbackMs);
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [navigation, fallbackMs]);

  return done;
}
