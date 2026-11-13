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
import { audioLang, audioSource, type AudioLang } from './audioFiles';
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
  /** Language of the narration (independent of the interface language). */
  lang: AudioLang;
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
  /** Switches the narration language, continuing from the same relative position. */
  setLang: (lang: AudioLang) => void;
  setScrubbing: (scrubbing: boolean) => void;
  stop: () => void;
};

const AudioGuideContext = createContext<AudioGuideState | null>(null);

export function AudioGuideProvider({ children }: { children: React.ReactNode }) {
  const [track, setTrack] = useState<AudioTrack | null>(null);
  const [lang, setLangState] = useState<AudioLang>(() => audioLang(i18n.language));
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeedState] = useState(1);
  const scrubbing = useRef(false);
  const playerRef = useRef<AudioPlayer | null>(null);
  const loaded = useRef<{ id: string; lang: AudioLang } | null>(null);
  const speedRef = useRef(1);
  const langRef = useRef<AudioLang>(lang);
  const userPickedLang = useRef(false);
  // After a seek the player keeps reporting the old position for a moment; ignore it.
  const ignoreStatusUntil = useRef(0);
  // Set when the language changes: restore this fraction of the track once the new file's
  // duration is known.
  const pendingFraction = useRef<number | null>(null);

  const getPlayer = useCallback((): AudioPlayer => {
    if (playerRef.current) return playerRef.current;
    const player = createAudioPlayer(null, { updateInterval: 250 });
    player.addListener('playbackStatusUpdate', (status) => {
      // Duration of a streamed mp3 is an estimate that wobbles: only accept real changes.
      if (status.duration > 0) {
        setDuration((prev) =>
          prev === 0 || Math.abs(prev - status.duration) > 1 ? status.duration : prev,
        );
        if (pendingFraction.current !== null) {
          const target = pendingFraction.current * status.duration;
          pendingFraction.current = null;
          ignoreStatusUntil.current = Date.now() + 500;
          setPosition(target);
          void player.seekTo(target);
          return;
        }
      }
      if (!scrubbing.current && Date.now() >= ignoreStatusUntil.current) {
        // While playing, time only moves forward: drop small backward jitter.
        setPosition((prev) =>
          status.playing && status.currentTime < prev && prev - status.currentTime < 1
            ? prev
            : status.currentTime,
        );
      }
      if (status.didJustFinish) {
        // The streamed duration is only an estimate: snap both to the real end so the progress
        // bars finish exactly full.
        const end = status.currentTime > 0 ? status.currentTime : status.duration;
        setDuration(end);
        setPosition(end);
        setIsPlaying(false);
        return;
      }
      setIsPlaying(status.playing);
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

  const load = useCallback(
    (id: string, language: AudioLang) => {
      const player = getPlayer();
      loaded.current = { id, lang: language };
      player.replace({ uri: audioSource(id, language) });
      player.setPlaybackRate(speedRef.current);
    },
    [getPlayer],
  );

  const start = useCallback(
    (next: AudioTrack) => {
      achievements.recordAudio(next.monumentId);
      const player = getPlayer();
      setTrack(next);
      if (!userPickedLang.current) {
        langRef.current = audioLang(i18n.language);
        setLangState(langRef.current);
      }
      if (loaded.current?.id !== next.monumentId || loaded.current.lang !== langRef.current) {
        setPosition(0);
        setDuration(0);
        pendingFraction.current = null;
        load(next.monumentId, langRef.current);
      }
      player.play();
      setIsPlaying(true);
    },
    [getPlayer, load],
  );

  const setLang = useCallback(
    (next: AudioLang) => {
      userPickedLang.current = true;
      if (next === langRef.current) return;
      langRef.current = next;
      setLangState(next);
      const current = loaded.current;
      const player = playerRef.current;
      if (!current || !player) return;
      const wasPlaying = player.playing;
      pendingFraction.current = duration > 0 ? player.currentTime / duration : null;
      setDuration(0);
      load(current.id, next);
      if (wasPlaying) player.play();
    },
    [duration, load],
  );

  const beginSeek = useCallback((target: number) => {
    const player = playerRef.current;
    if (!player) return;
    ignoreStatusUntil.current = Number.MAX_SAFE_INTEGER;
    const done = () => {
      ignoreStatusUntil.current = Date.now() + 300;
    };
    player.seekTo(target).then(done, done);
  }, []);

  const toggle = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (player.playing) {
      player.pause();
      setIsPlaying(false);
      return;
    }
    if (duration > 0 && player.currentTime >= duration - 0.2) {
      setPosition(0);
      beginSeek(0);
    }
    player.play();
    setIsPlaying(true);
  }, [duration, beginSeek]);

  const seek = useCallback(
    (seconds: number) => {
      const target = Math.min(duration || seconds, Math.max(0, seconds));
      setPosition(target);
      // A streamed file keeps reporting the old time until the seek completes.
      beginSeek(target);
    },
    [duration, beginSeek],
  );

  const skip = useCallback(
    (delta: number) => {
      seek((playerRef.current?.currentTime ?? 0) + delta);
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
    loaded.current = null;
    pendingFraction.current = null;
    setIsPlaying(false);
    setTrack(null);
    setPosition(0);
    setDuration(0);
  }, []);

  const value = useMemo<AudioGuideState>(
    () => ({
      track,
      lang,
      isPlaying,
      position,
      duration,
      speed,
      start,
      toggle,
      seek,
      skip,
      setSpeed,
      setLang,
      setScrubbing,
      stop,
    }),
    [
      track,
      lang,
      isPlaying,
      position,
      duration,
      speed,
      start,
      toggle,
      seek,
      skip,
      setSpeed,
      setLang,
      setScrubbing,
      stop,
    ],
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
