/**
 * AudioGuideContext.tsx
 * App-wide audio-guide player state, so the player keeps going after its sheet is dismissed and
 * a mini player (tab-bar accessory / floating capsule) can control it from anywhere.
 *
 * Playback uses `expo-audio`: the mp3 comes from the downloaded local copy when there is one,
 * otherwise it streams from the server (see audioFiles.ts).
 */

import i18n from '@/src/i18n/i18n';
import { achievements } from '@/src/storage/achievements';
import { audioLang, audioSource } from './audioFiles';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
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

const AudioGuideContext = createContext<AudioGuideState | null>(null);

export function AudioGuideProvider({ children }: { children: React.ReactNode }) {
  const [track, setTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeedState] = useState(1);
  const scrubbing = useRef(false);
  const playerRef = useRef<AudioPlayer | null>(null);
  const loadedId = useRef<string | null>(null);
  const speedRef = useRef(1);

  const getPlayer = useCallback((): AudioPlayer => {
    if (playerRef.current) return playerRef.current;
    const player = createAudioPlayer(null, { updateInterval: 250 });
    player.addListener('playbackStatusUpdate', (status) => {
      if (!scrubbing.current) setPosition(status.currentTime);
      if (status.duration > 0) setDuration(status.duration);
      setIsPlaying(status.playing);
      if (status.didJustFinish) setIsPlaying(false);
    });
    playerRef.current = player;
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    return player;
  }, []);

  useEffect(
    () => () => {
      playerRef.current?.remove();
      playerRef.current = null;
    },
    [],
  );

  const start = useCallback(
    (next: AudioTrack) => {
      achievements.recordAudio(next.monumentId);
      const player = getPlayer();
      setTrack(next);
      if (loadedId.current !== next.monumentId) {
        loadedId.current = next.monumentId;
        setPosition(0);
        setDuration(0);
        player.replace({ uri: audioSource(next.monumentId, audioLang(i18n.language)) });
        player.setPlaybackRate(speedRef.current);
      }
      player.play();
      setIsPlaying(true);
    },
    [getPlayer],
  );

  const toggle = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (player.playing) {
      player.pause();
      setIsPlaying(false);
      return;
    }
    if (duration > 0 && player.currentTime >= duration - 0.2) {
      void player.seekTo(0);
      setPosition(0);
    }
    player.play();
    setIsPlaying(true);
  }, [duration]);

  const seek = useCallback(
    (seconds: number) => {
      const target = Math.min(duration || seconds, Math.max(0, seconds));
      setPosition(target);
      void playerRef.current?.seekTo(target);
    },
    [duration],
  );

  const skip = useCallback(
    (delta: number) => {
      const current = playerRef.current?.currentTime ?? 0;
      seek(current + delta);
    },
    [seek],
  );

  const setSpeed = useCallback((value: number) => {
    speedRef.current = value;
    setSpeedState(value);
    playerRef.current?.setPlaybackRate(value);
  }, []);

  const setScrubbing = useCallback((value: boolean) => {
    scrubbing.current = value;
  }, []);

  const stop = useCallback(() => {
    playerRef.current?.pause();
    loadedId.current = null;
    setIsPlaying(false);
    setTrack(null);
    setPosition(0);
    setDuration(0);
  }, []);

  const value = useMemo<AudioGuideState>(
    () => ({
      track,
      isPlaying,
      position,
      duration,
      speed,
      start,
      toggle,
      seek,
      skip,
      setSpeed,
      setScrubbing,
      stop,
    }),
    [track, isPlaying, position, duration, speed, start, toggle, seek, skip, setSpeed, setScrubbing, stop],
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
