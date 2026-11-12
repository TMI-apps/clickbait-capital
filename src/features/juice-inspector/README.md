# Juice inspector

A dev tool at `/juice` to feel and tune every juice event. It is hidden: there are no links to it and it is not in `PUBLIC_PATHS`. It ships in every build, so the owner can use it on PR previews (juice-core D6). Players never see a link to it.

## Purpose

- **Trigger:** one button per catalog event and variant, grouped by domain. Each button emits the event on the game's real bus, so the real director plays it on a mock board that has every anchor the recipes target: `board`, `meter:users`, `meter:revenue`, `meter:reputation`, `chart`, `feed:newest`, a card as the origin, and a button.
- **Tune:**
  - Global knobs: intensity, tempo (× every duration), volume and vibration.
  - The real Beweging setting, so reduced motion can be previewed.
  - Every step of the selected event. Numbers get a slider plus a number box, using the effect's own param ranges. Texts (target, glyphs, colour token, sound id, pattern) are edited as text.
- **Keep:**
  - Every edit is an override in the game's tuning store. It is saved to `localStorage` (`clickbait-capital:juice-tuning`) and applies in `/spel` too, including in another open tab.
  - "Kopieer JSON" copies the overrides. If the clipboard is blocked, the JSON appears in a text box instead.
  - "Reset" drops all overrides.
- **Log:** the last 20 events on the bus.

## Tuning workflow (owner or agent)

1. Open `/juice` on the preview. Press an event, adjust it until it feels right, and play it again.
2. Play `/spel` to feel the change in context; the overrides apply there.
3. Press "Kopieer JSON" and hand the JSON to an agent, or paste it into the PR. Keys look like `"card.played/viral/2": { "strength": 7 }`, meaning event / branch (`steps` or a variant) / step index.
4. The agent copies those values into the matching steps of `src/features/game-juice/services/gameJuiceRecipes.ts`, and you press Reset.

## Structure

| Layer      | Path                            | Purpose                                                                 |
| ---------- | ------------------------------- | ----------------------------------------------------------------------- |
| API        | `api/index.ts`                  | `JuiceInspector` (used by `src/pages/JuiceInspectorPage.tsx`)           |
| Components | `components/JuiceInspector.tsx` | Layout: sticky mock board, then events, steps, tuning, log              |
| Components | `components/InspectorStage.tsx` | Mock board; each block is a named juice anchor                          |
| Components | `components/EventPad.tsx`       | 44 px trigger buttons per event and variant                             |
| Components | `components/StepEditor.tsx`     | One fieldset per step: start time, numeric params (slider + box), texts |
| Components | `components/TuningPanel.tsx`    | Global knobs, Beweging, Kopieer JSON, Reset                             |
| Components | `components/EventLog.tsx`       | Last events (not a live region)                                         |
| Hooks      | `hooks/useJuiceInspector.ts`    | Store, entries, effect registry, selection, trigger, log                |
| Hooks      | `hooks/useJuiceEventLog.ts`     | Bus listener keeping the last 20 events                                 |
| Services   | `services/inspectorSamples.ts`  | Entries from the recipe book, sample payloads, mock anchor names        |
| Types      | `types/juiceInspector.types.ts` | `InspectorEntry`, `InspectorAnchorNames`                                |

## Decisions

- **D1 — Hidden route, all builds (juice-core D6).** The owner tunes on previews. The route is lazy, so players pay nothing for it.
- **D2 — Real bus, real director (A11).** The inspector emits on `gameJuiceBus`, and the director mounted by `GameJuiceRoot` plays the event. What you see is what the game does. The controls come from the effects' `params`, so a new primitive is editable as soon as it is registered.
- **D3 — The real Beweging setting.** "Preview reduced motion" changes the actual setting, the same way the settings screen does. No separate gate is invented for the inspector.

## Testing

- `components/JuiceInspector.test.tsx` is the lap's acceptance test. It checks that:
  - viral plays its recipe (particle count and sound id are read from the recipe);
  - reduced motion keeps only the sound and the static badge;
  - an edited value applies to the next play and survives a reload from storage.
- `services/inspectorSamples.test.ts` checks that every event and variant is listed and that every recipe target exists on the mock board.
- Browser check with Playwright at 390×844 and 1440×900, including emulated reduced motion (see the lap's PR).

## Dependencies

- `@/features/game-juice/api`: bus, tuning store, effect registry, recipes.
- `@/features/juice-engine/api`: anchors, tuning hook, types.
- `@/features/game-settings/api`: the Beweging setting.
- Kit: `Button`, `Input`, `SegmentedControl`, `Textarea`.
