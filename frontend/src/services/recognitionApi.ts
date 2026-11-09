import { Platform } from 'react-native';

const ML_URL = process.env.EXPO_PUBLIC_ML_URL ?? 'http://localhost:8001';

export type RecognitionCandidate = {
  id: string | null;
  name: string | null;
  neg: boolean;
  p: number;
};

export type RecognitionResult = {
  recognized: boolean;
  id: string | null;
  name: string | null;
  confidence: number;
  margin: number;
  top: RecognitionCandidate[];
  ms: number;
};

export async function recognizeImage(uri: string, lang: string): Promise<RecognitionResult> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    form.append('image', blob, 'photo.jpg');
  } else {
    form.append('image', { uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
  }
  form.append('lang', lang);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(`${ML_URL}/recognize`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Recognition failed: ${res.status}`);
    return (await res.json()) as RecognitionResult;
  } finally {
    clearTimeout(timer);
  }
}
