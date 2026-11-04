import type {
  SoundEffectId,
  SoundManifestEntry,
} from "@/features/game-audio/types/soundEffect.types";

/** Shared words in every generation prompt, so the set sounds like one family (README § Sound style). */
export const SOUND_STYLE =
  "Glossy retro-synth mobile game UI sound, neon arcade, clean and punchy, short, no voice, no music bed, dry studio mix.";

/** Credit line for the credits screen (Dutch, player-facing). */
export const AUDIO_CREDIT_LINE = "Geluidseffecten gemaakt met ElevenLabs Sound Effects.";

const GENERATOR = "ElevenLabs Sound Effects (eleven_text_to_sound_v2), prompt influence 0.5";
const GENERATED_ON = "2026-11-04";
const LICENSE =
  "Generated on the owner's paid ElevenLabs plan; commercial use allowed under the ElevenLabs Terms of Service. No attribution required; credited in the credits screen.";

type ManifestSeed = Pick<SoundManifestEntry, "volume"> & { sound: string };

/**
 * Per-sound prompt tail and mix volume. The design's asymmetry (DOC_GAME_DESIGN § 5) lives in
 * both: viral is loud and bright, ad satisfying, news deliberately dull and quiet.
 */
const SEEDS: Record<SoundEffectId, ManifestSeed> = {
  "card-viral": {
    volume: 1,
    sound: "Rising synth swoosh into a bass-boosted notification ping, bright, euphoric, sparkly.",
  },
  "card-ad": {
    volume: 0.85,
    sound: "Golden, satisfying cash-register ka-ching with a coin jingle and a slot-machine tick.",
  },
  "card-news": {
    volume: 0.4,
    sound: "Deliberately dull and flat: a single soft wooden click, muted, no sparkle, no rise.",
  },
  "event-appear": { volume: 0.7, sound: "Subtle alert sting, two quick attention tones." },
  "event-choice": { volume: 0.5, sound: "Subtle confirm select click." },
  "meter-gain": { volume: 0.45, sound: "Subtle short ascending two-note blip." },
  "meter-loss": { volume: 0.45, sound: "Subtle short descending two-note blip, low." },
  "phase-up": { volume: 0.85, sound: "Level-up fanfare arpeggio with a short sparkle." },
  "game-over": { volume: 0.8, sound: "Descending defeat jingle, power-down." },
  "ipo-win": { volume: 0.9, sound: "Victory jingle with a bright bell ring and a cash sparkle." },
  "ui-tap": { volume: 0.35, sound: "Subtle soft button tap." },
};

const toEntry = (id: SoundEffectId): SoundManifestEntry => ({
  id,
  file: `/audio/${id}.mp3`,
  volume: SEEDS[id].volume,
  generator: GENERATOR,
  prompt: `${SOUND_STYLE} ${SEEDS[id].sound}`,
  generatedOn: GENERATED_ON,
  license: LICENSE,
});

/** Audio manifest: one entry per sound id (file, mix volume, generator, prompt, date, license). */
export const SOUND_MANIFEST: Record<SoundEffectId, SoundManifestEntry> = Object.fromEntries(
  (Object.keys(SEEDS) as SoundEffectId[]).map((id) => [id, toEntry(id)])
) as Record<SoundEffectId, SoundManifestEntry>;
