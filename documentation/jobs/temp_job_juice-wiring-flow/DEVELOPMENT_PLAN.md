# Development plan — juice-wiring-flow (lap 4 of 4)

Brief: `BRIEF.md` · Decisions: `DECISIONS.md` D1–D8 · Size M

## Acceptance test

These tests fail before the build and pass after:
- `hapticsPreference.test.ts` (default on, stored off, reset);
- `SettingsPanel.test.tsx` (Trillen hidden without vibration; stored off on a phone that vibrates);
- `juicePress.test.ts` (what counts as a press, disabled, opt-out);
- `usePageJuice.test.tsx` (navigation only);
- `PhaseTransitionScreen.test.tsx` (`phase.intro` once);
- `endFlow.test.ts` (`shareJuiceVariant`);
- `inspectorSamples.test.ts` (every new target on the mock board or app-provided).

## Phases

1. **Trillen.**
   - Store, hook, row and copy.
   - Reset signal.
   - Director gate and tuning reload.
2. **Press and page.**
   - `useJuicePress` + `pressedControl`; remove `withTap`; opt-outs.
   - `usePageJuice` + the `page` anchor.
   - `JuiceNoFields`.
3. **Flow.**
   - `phase.intro`.
   - Modal `contentRef` + the `event-dialog` anchor.
   - `ending:icon`.
   - `share.done` via `onOutcome`.
4. **Inspector.** Mock anchors, and the test inside a router.
5. **Rule line, READMEs, decision log, task archive.**

## Pattern & precedent

- **One global click sound:** the usual way game UI frameworks give every button feedback, rather than per-button wiring.
- **A vibration toggle hidden where unsupported:** avoids a dead control.

## Verification

- Vitest; type-check; lint (no new warnings); arch; structure; feature size; strict feature docs; bundle.
- Playwright on the production build at 390×844, 1440×900 and reduced motion:
  - home → how-to-play → game (taps, page entrance);
  - the phase intro;
  - an event dialog;
  - an ending;
  - results and share;
  - Instellingen with vibration emulated.
