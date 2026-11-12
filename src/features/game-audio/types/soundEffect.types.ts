/**
 * Every sound the game can play. The board calls `play(id)` with one of these ids; the
 * manifest (`services/soundManifest.ts`) maps each id to its file, mix volume and provenance.
 */
export const SOUND_EFFECT_IDS = [
  "card-viral",
  "card-ad",
  "card-news",
  "event-appear",
  "event-choice",
  "meter-gain",
  "meter-loss",
  "phase-up",
  "game-over",
  "ipo-win",
  "ui-tap",
] as const;

export type SoundEffectId = (typeof SOUND_EFFECT_IDS)[number];

/** Provenance and mix data for one sound file (license manifest, like the card images). */
export interface SoundManifestEntry {
  id: SoundEffectId;
  /** Public URL path, served from `public/audio/`. */
  file: string;
  /** Mix level 0–1 relative to the other sounds; files are peak-normalized, the mix lives here. */
  volume: number;
  /** Tool and model that produced the file. */
  generator: string;
  /** Exact prompt sent to the generator (shared style words + sound + type twist). */
  prompt: string;
  /** Generation date, ISO `YYYY-MM-DD`. */
  generatedOn: string;
  /** License / terms note for this file. */
  license: string;
}

/** Per-play mix tweaks (the juice recipes vary volume and pitch). */
export interface SoundPlayOptions {
  /** 0–1, multiplies the manifest volume (default 1). */
  volume?: number;
  /** Playback rate 0.5–2: pitch and speed (default 1). */
  rate?: number;
}

/** Plays sounds and owns the mute state; one instance per page (`getSoundPlayer`). */
export interface SoundPlayer {
  /** Plays a sound; silent while muted, before the first user gesture, or before it loaded. */
  play: (id: SoundEffectId, options?: SoundPlayOptions) => void;
  /** Creates/resumes the audio context; call from a user gesture (browser autoplay rules). */
  unlock: () => Promise<void>;
  isUnlocked: () => boolean;
  isMuted: () => boolean;
  setMuted: (muted: boolean) => void;
  /** Notifies on mute or unlock changes (for `useSyncExternalStore`). Returns an unsubscribe. */
  subscribe: (listener: () => void) => () => void;
}
