# DECISIONS — app-update-flow

| # | Decision | State | Choice | By | Why |
|---|----------|-------|--------|----|-----|
| D1 | Update policy | closed | Keep `registerType: "prompt"`; the app itself applies a waiting update at a safe moment: before the first pointer/key input of the page load, or on any route change. Otherwise a banner with **Nu laden**. Rejected: `autoUpdate` (skipWaiting + claim swaps the worker under a running game; old lazy chunks can be purged mid-run), reload on visibility (would wipe a game paused in the background) | agent (clear winner) | The run lives only in memory on `/spel`; before input nothing exists to lose, and a route change already ends or never started a run |
| D2 | Update checks | closed | `registration.update()` when the app returns to the foreground and every 60 min | agent (clear winner) | Browsers only re-check `sw.js` on navigation; an installed app resumed from background otherwise never sees a deploy |
| D3 | Banner copy | closed | "Nieuwe versie klaar" + "Laadt na dit spel." with **Nu laden** / **Later** | agent (clear winner) | States what happens next so "Later" is not a dead end; one row keeps the hand cards playable at 390px |
