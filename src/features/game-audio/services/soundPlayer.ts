import { readStoredMuted, storeMuted } from "@/features/game-audio/services/muteStorage";
import { SOUND_MANIFEST } from "@/features/game-audio/services/soundManifest";
import {
  SOUND_EFFECT_IDS,
  type SoundEffectId,
  type SoundPlayOptions,
  type SoundPlayer,
} from "@/features/game-audio/types/soundEffect.types";

/** Minimal Web Audio surface the player uses; lets tests pass a fake context. */
export interface AudioContextLike {
  state: string;
  destination: AudioNode;
  resume: () => Promise<void>;
  decodeAudioData: (data: ArrayBuffer) => Promise<AudioBuffer>;
  createBufferSource: () => AudioBufferSourceNode;
  createGain: () => GainNode;
}

export interface SoundPlayerDeps {
  /** Builds the audio context; called once, inside the first user gesture. */
  createContext: () => AudioContextLike | null;
  /** Fetches one sound file's bytes. */
  fetchBytes: (url: string) => Promise<ArrayBuffer>;
  readMuted: () => boolean;
  writeMuted: (muted: boolean) => void;
}

const defaultCreateContext = (): AudioContextLike | null => {
  if (typeof window === "undefined" || typeof window.AudioContext !== "function") return null;
  return new window.AudioContext();
};

const defaultFetchBytes = async (url: string): Promise<ArrayBuffer> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Sound ${url} failed to load (${response.status})`);
  return response.arrayBuffer();
};

/** Second copy: juice-engine `clampJuice`; extract to `src/shared/utils/` at a third. */
const clamp = (value: number, min: number, max: number): number =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;

const DEFAULT_DEPS: SoundPlayerDeps = {
  createContext: defaultCreateContext,
  fetchBytes: defaultFetchBytes,
  readMuted: readStoredMuted,
  writeMuted: storeMuted,
};

/**
 * Web Audio sound player (decoded buffers: low latency, overlapping plays, per-sound gain that
 * also works on iOS, where HTMLAudioElement ignores `volume`). The context is created on the
 * first gesture, so the game stays silent until the player touches it (browser autoplay rules).
 * A missing file or an unsupported browser only means that sound stays silent; it never throws.
 */
export const createSoundPlayer = (overrides: Partial<SoundPlayerDeps> = {}): SoundPlayer => {
  const deps = { ...DEFAULT_DEPS, ...overrides };
  const buffers = new Map<SoundEffectId, AudioBuffer>();
  const listeners = new Set<() => void>();
  let context: AudioContextLike | null = null;
  let unlocked = false;
  let muted = deps.readMuted();

  const notify = (): void => listeners.forEach((listener) => listener());

  const loadOne = async (ctx: AudioContextLike, id: SoundEffectId): Promise<void> => {
    try {
      const bytes = await deps.fetchBytes(SOUND_MANIFEST[id].file);
      buffers.set(id, await ctx.decodeAudioData(bytes));
    } catch {
      // This sound stays silent; the game plays on.
    }
  };

  const unlock = async (): Promise<void> => {
    if (unlocked) return;
    context = context ?? deps.createContext();
    if (!context) return;
    unlocked = true;
    notify();
    if (context.state === "suspended") await context.resume().catch(() => undefined);
    const ctx = context;
    await Promise.all(SOUND_EFFECT_IDS.map((id) => loadOne(ctx, id)));
  };

  const play = (id: SoundEffectId, { volume = 1, rate = 1 }: SoundPlayOptions = {}): void => {
    const buffer = buffers.get(id);
    if (muted || !unlocked || !context || !buffer) return;
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.value = SOUND_MANIFEST[id].volume * clamp(volume, 0, 1);
    // Older engines may lack a rate param; the sound then plays at its own pitch.
    if (source.playbackRate) source.playbackRate.value = clamp(rate, 0.5, 2);
    source.connect(gain);
    gain.connect(context.destination);
    source.start();
  };

  const setMuted = (next: boolean): void => {
    if (next === muted) return;
    muted = next;
    deps.writeMuted(next);
    notify();
  };

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return {
    play,
    unlock,
    isUnlocked: () => unlocked,
    isMuted: () => muted,
    setMuted,
    subscribe,
  };
};

let sharedPlayer: SoundPlayer | null = null;

/** The page-wide player, so every component shares one context and one mute state. */
export const getSoundPlayer = (): SoundPlayer => {
  sharedPlayer = sharedPlayer ?? createSoundPlayer();
  return sharedPlayer;
};
