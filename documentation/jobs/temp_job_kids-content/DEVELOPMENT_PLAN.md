# Development plan: Kids content (groep 7/8)

## Summary

- **Goal:** All copy at the level of an 11-year-old, hard words explained on tap, and a deck that fits the pupils' world.
- **Why:** The audience is groep 7/8; the current copy and a third of the deck are written for adults.
- **Brief:** `BRIEF.md` (problem, success check, in / out, edges, rubric)
- **Size:** M — narrow code (one kit component, one parser, eight render sites), large data rewrite
- **Acceptance test:** `src/features/game-content/services/gameContent.test.ts` § glossary (every marked term in the glossary, markup only in rich fields, no trademarks) + `src/components/common/GlossaryTerm/GlossaryTerm.test.tsx` (tap opens meaning, Escape closes, `aria-describedby`)
- **Plan review:** Done 2026-11-05 (self-review against the lenses below; one amendment)
- **Scope / constraints:** no new dependency, no protected-file edits, no game-board layout files, balance assertions stay green

## Phase overview

| Phase | Goal                                                                                          | Gate                                 | Status  |
| ----- | --------------------------------------------------------------------------------------------- | ------------------------------------ | ------- |
| 1     | Markup parser + kit `GlossaryTerm` / `GlossaryText` + tests                                   | unit tests, lint, type-check, arch   | Done |
| 2     | Render sites use `GlossaryText`; feed strips markup                                           | type-check, existing component tests | Done |
| 3     | `GLOSSARY`, copy rewrite, deck swap, content tests                                            | content + balance tests              | Done |
| 4     | Balance rerun and retune if needed; README numbers                                            | balance simulation green             | Done |
| 5     | Docs (design doc, decision log, READMEs), full gate list, Playwright at 390 px on the preview | loop-check                           | Done |

## Conflict & compliance

- Applicable rules: architecture (kit = presentation only; `radix-ui` only in `components/common`), code-style (naming: `GlossaryTerm` / `GlossaryText` / `glossaryMarkup` are role names), testing (TDD for the parser; content tests), file-placement, security (n/a), agent-behavior (no protected files).
- File placements: `src/components/common/GlossaryTerm/{GlossaryTerm.tsx,GlossaryText.tsx,GlossaryTerm.test.tsx,index.ts}`; `src/shared/utils/glossaryMarkup.ts` (+ test); `GLOSSARY` in `src/features/game-content/services/uiCopy.ts`, tests in `gameContent.test.ts` (D9). All match the whitelist.
- Layers: kit imports `@/shared/utils/glossaryMarkup` (downward). game-content services import the same util. `GLOSSARY` is exported from `api/index.ts` and `api/copy.ts` (pages in the main chunk use `copy.ts`-level data only).
- Reuse / packages: Radix Popover ships in the installed `radix-ui` umbrella package — no new dependency. Markup parsing is ~20 lines; no library warranted (`spec-reuse-package` skipped: bespoke).
- Foundation cleanup: `Modal.description` and `GameCard.flavor` widen from `string` to `ReactNode` (both are kit slots; no other behaviour change).
- Risks: (1) balance shift from new effects → mirror the removed cards' effect ranges per phase, rerun; (2) popover inside the Radix Dialog → covered by Playwright; (3) main-chunk budget → glossary is ~3 KB, check `validate:bundle-size`; (4) an old local save may replay into a deck that lost a card → local-save D2 discards it (fresh game).
- Standards diversions: none.

## Review contract

- **Rules pinned:** `rules@af789e7` — architecture, code-style, testing, file-placement, agent-behavior
- **Required lenses:** Pattern & precedent (below), Reuse (Radix Popover), Feature decomposition (glossary is game-content data; rendering is kit), Foundation cleanup (two prop widenings), Naming (role names)
- **Tooling gate:** `loop-check/references/rule-audit.md` § Tooling pass
- **Locked decisions:** `DECISIONS.md` D1–D7 + Amendments

### Amendments

| #   | Date       | Source                  | Change                                                                                                                                               | Applied to |
| --- | ---------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| A1  | 2026-11-05 | plan review (a11y lens) | Popover keeps focus on the term (`onOpenAutoFocus` prevented) so reading continues; meaning also reachable via `aria-describedby` on a `hidden` span | Phase 1    |

## Pattern & precedent

| Field                | Value                                                                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Capability**       | Tap a highlighted word in a sentence to see a short explanation                                                                                                                      |
| **Precedents**       | Wikipedia page previews, Duolingo word hints, school e-readers (dotted-underline glossary words), WAI-ARIA disclosure / toggletip pattern                                            |
| **Aspects reviewed** | Trigger affordance (dotted underline + colour), touch support (tap, not hover), keyboard (button, Escape), screen reader (toggletip: button + describedby), placement inside dialogs |
| **Findings**         | aligns: toggletip is the accessible pattern for touch; hover tooltips fail on phones                                                                                                 |
| **Verdict**          | Aligns with precedent                                                                                                                                                                |

## Notes during development

- Local deps were stale (`vite-plugin-pwa` missing): `pnpm install --frozen-lockfile` fixed `type-check`, `build` and the token test; not a code issue.
- Balance rerun: all assertions green without a retune (README § Balance simulation).
- Removing items broke `cardImageLookup.test.ts` (67 ids): rewritten to "every photo belongs to the deck; only the 40 additions lack one" (D10).

## Decisions made

| #   | Topic | Choice | Precedent? |
| --- | ----- | ------ | ---------- |
