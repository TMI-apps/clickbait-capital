# Decisions — temp_job_feedback-hooks

Job: `temp_job_feedback-hooks`
Updated: 2026-11-03

## Closed

| id | topic | status | choice | source | notes |
|----|-------|--------|--------|--------|-------|
| D1 | Which hooks | closed | both; Stop = type-check only (tests stay with pre-commit/CI) | loop-refine | owner via orchestrator question tool; also consented: push-safety.md step 6 trim, DOC row |
| D2 | Tool invocation on Windows | closed | Node API / `node node_modules/...` (no pnpm spawn) | loop-refine | clear winner: avoids `.cmd` shim spawn and ~1 s pnpm overhead; alt: `pnpm exec` |
| D4 | Formatting tool | closed | `eslint --fix` only (Prettier runs as an ESLint rule) | loop-build | reductive: one tool, one pass |
| D3 | Stop loop guard | closed | skip when tree fingerprint unchanged since last pass; on `stop_hook_active` with the same failure fingerprint, allow stop | loop-refine | clear winner over relying on the 8-cap alone |

## Open

| id | topic | status | options briefly | blocked phase |
|----|-------|--------|-----------------|---------------|

## Log

- 2026-11-03 — D2, D3 closed via loop-refine (clear-winner)
- 2026-11-03 — D1 closed via loop-refine (asked)
- 2026-11-03 — D4 closed via loop-build (clear-winner): ESLint alone covers formatting (`prettier/prettier` is an error rule in the config), so no separate Prettier run
