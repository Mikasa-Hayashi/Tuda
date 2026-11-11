import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';

/**
 * Profile photo, stored on the device (one per account, or one for the guest). The picked image
 * is copied into the app's document folder under a fresh name each time, so the image cache never
 * shows a stale photo.
 */
const keyFor = (userId: number | null) => `avatar.${userId ?? 'guest'}`;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function read(userId: number | null): Promise<string | null> {
  const uri = await AsyncStorage.getItem(keyFor(userId)).catch(() => null);
  if (!uri) return null;
  return new File(uri).exists ? uri : null;
}

/** Opens the photo library (square crop) and saves the choice. Returns false if cancelled. */
export async function pickAvatar(userId: number | null): Promise<boolean> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (result.canceled || !result.assets[0]) return false;

  const dir = new Directory(Paths.document, 'avatars');
  if (!dir.exists) dir.create();
  const target = new File(dir, `${userId ?? 'guest'}-${Date.now()}.jpg`);
  new File(result.assets[0].uri).copy(target);

  const previous = await read(userId);
  await AsyncStorage.setItem(keyFor(userId), target.uri);
  if (previous) {
    try {
      new File(previous).delete();
    } catch {
      // already gone
    }
  }
  emit();
  return true;
}

export async function removeAvatar(userId: number | null): Promise<void> {
  const previous = await read(userId);
  await AsyncStorage.removeItem(keyFor(userId));
  if (previous) {
    try {
      new File(previous).delete();
    } catch {
      // already gone
    }
  }
  emit();
}

export function useAvatar(userId: number | null): string | null {
  const [uri, setUri] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () =>
      void read(userId).then((u) => {
        if (alive) setUri(u);
      });
    load();
    listeners.add(load);
    return () => {
      alive = false;
      listeners.delete(load);
    };
  }, [userId]);
  return uri;
}
