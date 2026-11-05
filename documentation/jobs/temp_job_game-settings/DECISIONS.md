# DECISIONS — game-settings

| # | Decision | Alternatives | Why |
|---|----------|--------------|-----|
| D1 | Pause menu shows the settings panel inside its dialog instead of navigating to `/instellingen` | Link to the route | The run lives in memory on `/spel`; navigating away would end it. Same component, so one settings UI. |
| D2 | Motion store is a module-level external store (`useSyncExternalStore`), like the sound player's mute | React context provider in App.tsx | Readable from any feature (game-juice) without a provider; mirrors game-audio. |
| D3 | "Verminderd" sets the five `--duration-*` tokens to 0.01ms inline on `<html>`; "Volledig" lifts only JS juice, CSS still honours an OS reduce request | Rebuild token pipeline with a `[data-motion]` selector | Token pipeline belongs to the juice thread; OS reduce is a safety preference. `data-motion` attribute is set for CSS hooks. |
| D4 | "Voortgang wissen" clears every `localStorage` key with prefix `clickbait-capital:`; colour mode (`color-mode`) is kept | Clear everything | Colour mode is a display preference shared with the harness, not game data. |
| D5 | Error/offline states live in a new `app-status` feature | Put them in game-settings or app-update | Different reason to change than settings; app-update owns only the service worker. |
| D6 | Offline is a non-blocking banner (the game works offline); the full Offline screen shows only when a load fails while offline | Full-screen offline | The app is installable/offline-capable; blocking play would be wrong. |
| D7 | app-status imports `UI_COPY` from a copy-only entry `@/features/game-content/api/copy` | `/* @__PURE__ */` on the deck Maps (tried: no effect); accept +18 kB gzip | Rolldown places a module in the chunk that statically reaches it; the barrel import pulled the whole deck into the main chunk. Orchestrator-approved. |
