# Decisions — first-load

Job: `temp_job_first-load`
Updated: 2026-11-05

## Closed

| id | topic | status | choice | source | notes |
|----|-------|--------|--------|--------|-------|
| D1 | When supabase-js loads | closed | On demand via `loadSupabase()`; at startup only when `hasPersistedAuthSession()` (stored `sb-*-auth-token*`) or an OAuth/recovery URL needs it | loop-plan (clear-winner) | rejected: load on idle after first paint (still downloads ~50 KiB gzip for every visitor); route-based only (would hide a signed-in user's profile menu on `/`) |
| D2 | Anonymous sign-in on every visit | closed | Runs only when the client loads without a session; no longer on plain visits | loop-plan (clear-winner) | the project refuses it today (`anonymous_provider_disabled`, 422), so nothing visible changes; whether to enable or remove it stays the separate backlog task (auth permission model = owner decision) |
| D3 | Fonts | closed | Self-host latin WOFF2 subsets of the variable fonts in `public/fonts/` (Inter v20 48 KB, Space Grotesk v22 22 KB), `font-display: swap`, preload Space Grotesk; OFL 1.1 text in `public/fonts/OFL.txt` | loop-build (measured) | preloading Inter instead scored 92–93 vs 93–95 (its 48 KB competes with the main JS); rejected: async Google Fonts CSS (still a third-party round trip + no offline) |
| D4 | `projectStructure.config.cjs` `public/fonts` entry (`*.woff2`, `*.txt`) | closed | added | owner via orchestrator | protected-file consent relayed by the orchestrator session 2026-11-05 |
| D5 | Bundle budget | closed | `scripts/check-bundle-size.cjs`: gzip of the JS `dist/index.html` loads up front (entry + modulepreloads) <= 150 KiB; `pnpm validate:bundle-size` after `pnpm build` | loop-plan | 136 KiB after this lap, 185 KiB before; CI step needs `.github/workflows/ci.yml` (protected) → asked via orchestrator |
| D6 | Wire `pnpm validate:bundle-size` into CI | closed | Not in this PR: the script stays manual; the orchestrator lands the `ci.yml` step in a separate PR after the owner's yes | orchestrator | keeps this PR free of protected workflow changes |

## Log

- 2026-11-05 — D1, D2, D5 closed via loop-plan (clear-winner)
- 2026-11-05 — D3 closed via loop-build (measured)
- 2026-11-05 — D4 closed via orchestrator (owner approval relayed)
- 2026-11-05 — D6 closed via orchestrator (ship without the CI step)
