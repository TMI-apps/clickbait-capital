# Decisions — installable-app

| # | Decision | Why | Source |
|---|----------|-----|--------|
| D1 | Add `vite-plugin-pwa@2.0.0` (pinned devDependency) instead of a hand-written SW | Per-build hashed precache + tested update flow, no SW source to maintain | Owner approved via orchestrator, 2026-11-04 |
| D2 | Add `workbox-window@7.4.1` (pinned devDependency) | Required peer of vite-plugin-pwa for `virtual:pwa-register/*`; build fails without it. Part of the approved tool, not a separate choice | Plugin `peerDependencies` |
| D3 | `registerType: "prompt"` with a Dutch banner (Herladen / Later) | Never reload a running game without consent; waiting SW activates on next full load otherwise | Task text |
| D4 | `start_url` / `id` `/spel`, `scope` `/` | Installed app opens into the game; other routes stay in-app | Agent pick (task suggested it) |
| D5 | Manifest stays the hand-written `public/manifest.json` (`manifest: false`) | One SSOT, already linked from `index.html` | Existing file |
| D6 | Cards: runtime cache-first `/cards/*`, excluded from precache | Images added later work without config changes and don't bloat install | Task text |
| D7 | New feature `src/features/app-update/` | One concept (app version lifecycle); no existing home | architecture rule |
