/**
 * AudioGuideContext.tsx
 * App-wide audio-guide player state, so the player keeps going after its sheet is dismissed and
 * a mini player (tab-bar accessory / floating capsule) can control it from anywhere.
 *
 * NOTE: there is no audio source in the data yet, so playback is SIMULATED with a timer
 * (DEMO_DURATION seconds). To play real audio, swap the interval in this file for an
 * `expo-audio` player created from the track's audio URL.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type AudioTrack = { monumentId: string; name: string; imageUrl?: string };

type AudioGuideState = {
  track: AudioTrack | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  speed: number;
  /** Loads the track (keeps position if it is already loaded) and starts playing. */
  start: (track: AudioTrack) => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  skip: (deltaSeconds: number) => void;
  setSpeed: (speed: number) => void;
  setScrubbing: (scrubbing: boolean) => void;
  stop: () => void;
};

const DEMO_DURATION = 270; // 4:30, same as the old prototype
const TICK_MS = 250;

const AudioGuideContext = createContext<AudioGuideState | null>(null);

export function AudioGuideProvider({ children }: { children: React.ReactNode }) {
  const [track, setTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [speed, setSpeedState] = useState(1);
  const scrubbing = useRef(false);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      if (scrubbing.current) return;
      setPosition((p) => {
        const next = p + (TICK_MS / 1000) * speed;
        if (next >= DEMO_DURATION) {
          setIsPlaying(false);
          return DEMO_DURATION;
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [isPlaying, speed]);

  const start = useCallback((next: AudioTrack) => {
    setTrack((prev) => {
      if (prev?.monumentId !== next.monumentId) setPosition(0);
      return next;
    });
    setIsPlaying(true);
  }, []);

  const toggle = useCallback(() => {
    setPosition((p) => (p >= DEMO_DURATION ? 0 : p));
    setIsPlaying((v) => !v);
  }, []);

  const seek = useCallback((seconds: number) => {
    setPosition(Math.min(DEMO_DURATION, Math.max(0, seconds)));
  }, []);

  const skip = useCallback((delta: number) => {
    setPosition((p) => Math.min(DEMO_DURATION, Math.max(0, p + delta)));
  }, []);

  const setScrubbing = useCallback((value: boolean) => {
    scrubbing.current = value;
  }, []);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setTrack(null);
    setPosition(0);
  }, []);

  const value = useMemo<AudioGuideState>(
    () => ({
      track,
      isPlaying,
      position,
      duration: DEMO_DURATION,
      speed,
      start,
      toggle,
      seek,
      skip,
      setSpeed: setSpeedState,
      setScrubbing,
      stop,
    }),
    [track, isPlaying, position, speed, start, toggle, seek, skip, setScrubbing, stop],
  );

  return <AudioGuideContext.Provider value={value}>{children}</AudioGuideContext.Provider>;
}

export function useAudioGuide(): AudioGuideState {
  const ctx = useContext(AudioGuideContext);
  if (!ctx) throw new Error('useAudioGuide must be used inside AudioGuideProvider');
  return ctx;
}

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
