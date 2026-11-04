# Game audio

Sound effects and the mute toggle for Clickbait Capital. Juice rules: `documentation/DOC_GAME_DESIGN.md` § 5 (asymmetric game juice).

## Purpose

- Plays short sound effects by id: `const { play } = useSoundEffects(); play("card-viral")`.
- Muted until the first user gesture (browser autoplay rules): the first `pointerdown`, `keydown` or `touchend` anywhere on the page unlocks audio and loads the sounds.
- One mute switch for the whole page, remembered in `localStorage` (`clickbait-capital:audio-muted`; a blocked storage only loses the memory).
- `MuteToggle`: 48 px button, `aria-pressed` (true = sound on), icon plus Dutch label.
- Not wired into the board here; the board imports `@/features/game-audio/api`.

## Structure

| Layer | Path | Purpose |
|-------|------|---------|
| API | `api/index.ts` | Public barrel: `useSoundEffects`, `MuteToggle`, `SOUND_EFFECT_IDS`, `SOUND_MANIFEST`, `SOUND_STYLE`, `AUDIO_CREDIT_LINE`, types |
| Components | `components/MuteToggle.tsx` | Sound on/off toggle (kit `Button`, lucide `Volume2` / `VolumeX`) |
| Hooks | `hooks/useSoundEffects.ts` | `play`, `muted`, `setMuted`, `toggleMuted`; installs the one-time unlock listeners |
| Services | `services/soundPlayer.ts` | `createSoundPlayer` (Web Audio: decode, per-sound gain, mute, subscribe) and the page-wide `getSoundPlayer` |
| Services | `services/soundManifest.ts` | Audio manifest (file, mix volume, generator, prompt, date, license), `SOUND_STYLE`, credit line |
| Services | `services/muteStorage.ts` | Read / store the mute choice with try/catch |
| Types | `types/soundEffect.types.ts` | `SOUND_EFFECT_IDS`, `SoundEffectId`, `SoundManifestEntry`, `SoundPlayer` |

Files: `public/audio/<id>.mp3` (mono, 44.1 kHz, 96 kbps, about 124 KB for all 11).

## Sounds

| Id | When the board plays it | Length |
|----|-------------------------|--------|
| `card-viral` | Viral card played | ~0.9 s |
| `card-ad` | Ad card played | ~0.9 s |
| `card-news` | News card played (deliberately dull) | ~0.5 s |
| `event-appear` | An event interrupts | ~0.8 s |
| `event-choice` | Event option chosen | ~0.5 s |
| `meter-gain` / `meter-loss` | A meter rises / falls noticeably | ~0.5 s |
| `phase-up` | Next phase reached | ~1.5 s |
| `game-over` | Bankroet / Verlaten / Verbod | ~2 s |
| `ipo-win` | IPO ending | ~1.1 s |
| `ui-tap` | Generic button tap | ~0.5 s |

## Sound style

Every prompt is `STYLE + SOUND (+ TYPE TWIST)`, so the set sounds like one family. The exact prompts are in `SOUND_MANIFEST`.

- **STYLE:** "Glossy retro-synth mobile game UI sound, neon arcade, clean and punchy, short, no voice, no music bed, dry studio mix." (`SOUND_STYLE`)
- **Viral twist:** bright, rising, euphoric, sparkly, bass-boosted notification ping. Loudest in the mix (volume 1).
- **Ad twist:** golden, satisfying ka-ching, coin jingle, slot-machine tick (0.85).
- **News twist:** deliberately dull and flat, one soft wooden click, no sparkle, no rise; quiet in the mix (0.4). Same STYLE words so it belongs to the family, just drained.
- **Neutral UI and events:** STYLE plus "subtle"; meters and taps sit low in the mix (0.35–0.5).
- **Durations:** UI 0.5 s (generator minimum), card plays 0.5–0.9 s, phase / end sounds 1.5–2.5 s requested.
- **Loudness:** each file is peak-normalized to −1.5 dBFS and tail-trimmed; the relative mix lives in the manifest `volume`, not in the files.

## Provenance and license

- Generated with ElevenLabs Sound Effects (`eleven_text_to_sound_v2`, prompt influence 0.5, 1 take each) on the owner's ElevenLabs account, 2026-11-04, at build time by an agent. No API key is in the app or repo; the app only serves the resulting MP3s.
- License: commercial use allowed on the owner's paid plan under the ElevenLabs Terms of Service; no attribution required. Credit line for the credits screen: `AUDIO_CREDIT_LINE` ("Geluidseffecten gemaakt met ElevenLabs Sound Effects.").
- To regenerate or add a sound: keep `SOUND_STYLE`, add the id to `SOUND_EFFECT_IDS` and its seed in `soundManifest.ts`, save `public/audio/<id>.mp3` with the same processing, and update the date.

## Decisions

- **Web Audio, no library (game-audio D1):** decoded buffers give low latency, overlapping plays and a per-sound gain that also works on iOS Safari (where `HTMLAudioElement.volume` is ignored). Howler.js is the common package for this; for 11 one-shot sounds without sprites or streaming a ~100-line player avoids a new dependency.
- **Unlock on first gesture (D2):** the `AudioContext` is created inside the first gesture, so no autoplay warning and no sound before the player interacts. Sounds load right after unlock (124 KB total).
- **Mute is a sound-on toggle (D3):** `aria-pressed` reflects "sound on" under the stable name "Geluid"; visible text says "Geluid aan" / "Geluid uit".
- **Mix in data (D4):** files are normalized; the design's asymmetry (loud viral, quiet news) is the manifest `volume`.
- **No background music yet (D5):** kept out for size and credits; a loopable track can be added as another manifest entry later.

## Testing

Vitest, colocated: `services/soundPlayer.test.ts` (fake `AudioContext`: locked until gesture, mute, volume, failing file, no Web Audio, manifest shape), `services/muteStorage.test.ts`, `components/MuteToggle.test.tsx`. Hearing the sounds is a manual check on a phone.

## Dependencies

- `@/components/common/Button/Button`, `lucide-react`.
- No other feature; no Supabase.
