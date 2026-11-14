# App name

The name the player gives their app at the start of a new game (app-name lap, `documentation/jobs/temp_job_app-name/BRIEF.md`). The feed is that app's official account, and the name fills `{app}` in the game texts (owner decision D2, `documentation/jobs/temp_job_policy-cards/PROPOSAL.md` § 0).

## Purpose

- **Rules:** `checkAppName(raw)` trims and collapses spaces, then accepts 2–16 characters of letters (accents included), digits, spaces, `-` and `_`. It refuses swear words and real platform or brand names. It returns the cleaned name or the reason (`empty`, `short`, `long`, `chars`, `blocked`), which the naming screen maps to `UI_COPY.appName.errors`.
- **Filter:** `isBlockedAppName` lowercases, strips accents, undoes common letter swaps (0→o, 1→i, 3→e, 4→a, 5→s, 7→t, @→a, $→s, !→i) and drops every non-letter. Unambiguous swear words and the deck's brand list (game-content `REAL_BRAND_NAMES`) are blocked anywhere in the name. Short or common words (`kut`, `lul`, `meta`, `x`, …) are blocked only as a whole word, so "Catering" or "Kickoff" pass.
- **Suggestions:** `suggestAppName(current)` picks an invented name from `APP_NAME_SUGGESTIONS` that differs from the current one (the 🎲 button).
- **Screen:** `AppNameScreen` is shown by `/spel` (`GamePage`) before a new run and after "Nieuw spel" on the resume screen. A resumed run keeps its own name. The heading takes focus like every flow screen (game-flow D1); Enter in the field submits; a refusal shows under the field (`role="alert"`, the field gets `aria-invalid` and `aria-describedby`). Where the name is stored and shown: game-session (`SessionState.appName`), game-save (`SavedRun.appName`), game-board (feed header, official posts, `{app}`), game-flow (intros, endings), follower-comments.

## Structure

| Layer    | Path                         | Purpose                                                                           |
| -------- | ---------------------------- | --------------------------------------------------------------------------------- |
| API        | `api/index.ts`                     | `AppNameScreen`, `checkAppName`, `isBlockedAppName`, `normalizeAppName`, `suggestAppName`, `APP_NAME_SUGGESTIONS`, limits |
| Components | `components/AppNameScreen.tsx`     | "Hoe heet jouw app?": field with suggestion, 🎲, Start, inline refusal (game-flow `FlowScreen`)                           |
| Hooks      | `hooks/useAppNameField.ts`         | Field state: name, refusal reason, dice, submit                                                                          |
| Services   | `services/appNameRules.ts`         | Length and character rules, swear-word and brand filter, suggestion pick                                                 |
| Services   | `services/appNameSuggestions.ts`   | `APP_NAME_SUGGESTIONS`: 20 invented names                                                                                 |
| Types      | `types/appName.types.ts`           | Limits, `AppNameError`, `AppNameCheck`                                                                                    |

## Decisions

- **AN2 Own feature:** the name's rules, suggestions and screen are one concept with their own reason to change (a new swear word, another platform). The screen reuses game-flow's exported `FlowScreen`, so it looks and focuses like the other flow screens.
- **AN3 No package:** a small Dutch + English list with letter-swap normalising; a package would be a new dependency, and the common ones have no Dutch. A basic filter, not moderation: a glued-on compound ("Scrollkut") passes, as do words the list does not hold.
- **AN4 Real brands blocked:** the tone rule (no real platforms, games or brands, kids-content D6) also covers the player's input. One brand list in game-content serves the copy test and this filter; platform names too short or too common to scan the copy for are blocked here as whole words.

## Testing

Colocated Vitest: `services/appNameRules.test.ts` (cleaning, length and character limits, swear words with letter swaps and spaces, ordinary words that contain a short swear word, real brands, every suggestion passes, the dice never repeats the current name). The flow: `src/pages/GamePage.test.tsx` (name step on a new game and after "Nieuw spel", refusal reasons, dice, the name in the feed and in the save, the saved name on the resume screen).
