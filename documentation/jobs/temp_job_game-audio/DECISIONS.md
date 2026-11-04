# DECISIONS — game-audio

- **Protected file consent (2026-11-04):** `projectStructure.config.cjs` gains `public/audio/*.mp3` (this lap) and `public/cards/*.avif|webp|jpg` (for the later imagery lap). Approved by the owner in chat, relayed by the orchestrator session; nothing else in the file changed.
- **Style-guided regeneration:** the first ElevenLabs set (no shared style) was replaced by one generation per sound using the orchestrator's style guide (README § Sound style). The first set is unused.
- **Web Audio without a library, unlock on first gesture, mix volume in the manifest, no music yet:** see `src/features/game-audio/README.md` § Decisions (D1–D5).
