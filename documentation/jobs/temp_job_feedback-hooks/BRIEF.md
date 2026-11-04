# Brief — Feedback hooks: lint/format on edit, type-check before stop

Task: replace "remember to run X" with Claude Code hooks · Lap: temp_job_feedback-hooks · Harness: v0.44.0

## Problem
Lint, format and type errors reach the agent only at pre-commit (lint-staged, `type-check`) or CI, so the agent edits blind and fixes in a late batch.

## Success check
After an Edit/Write that introduces an ESLint error in a `.ts/.tsx` file, the agent receives the error text in the same tool round; after a turn that leaves a `tsc` error in the working tree, the turn does not end until the error is fixed or the hook has already continued once for the same failure.

## Research (Claude Code hooks docs, code.claude.com/docs/en/hooks)
- PostToolUse input: `tool_name`, `tool_input.file_path` (absolute, native separators — backslashes on Windows), `tool_response`. Feedback: exit 2 → stderr shown to Claude (tool already ran); or JSON `decision:"block"` + `reason`; `additionalContext` for non-error notes.
- Stop input: `stop_hook_active` (true when already continuing because of a stop hook), `last_assistant_message`. Block: exit 2 / `decision:"block"` + `reason`. Built-in cap: 8 consecutive continuations, reset on any tool call (`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`). `additionalContext` also continues the turn.
- `timeout` in seconds, default 600 for command hooks. `shell: "bash"` (Git Bash on Windows, as the existing hooks use). `async` / `asyncRewake` exist (background, wake on exit 2).
- Windows: `.cmd` shims (pnpm) don't spawn without a shell → call `node node_modules/<tool>/bin/...` or the Node API directly.

## Measured cost (Linux cloud container, 4 cores)
- ESLint one file (typed lint, `parserOptions.project`): ~4 s cold, ~2 s cached; first run of a session up to ~15 s.
- Prettier one file: ~0.2 s.
- `pnpm type-check`: ~6 s whole project (independent of diff size).
- Vitest related: scales with the diff; unbounded on large diffs.

## In scope
- New hook scripts under `scripts/` + `hooks` block entries in `.claude/settings.json` for the approved option(s) only.
- Extract the shared hook-input reader into one module (third copy → code-style § Naming F2; the two existing copies carry the marker).
- Colocated `node:test` tests (`scripts/*.test.cjs`).
- `documentation/DOC_AGENT_WORKFLOW_LAYERS.md` row for the new hooks.
- Removal-first edits of rule/skill text the hooks make redundant (owner consent).

## Out of scope
- Will NOT do: Cursor `hooks.json` port — deferred (backlog follow-up; Cursor's afterFileEdit is observe-only, its `stop` hook can only send a follow-up message — unverified against current Cursor docs).
- Will NOT touch: `permissions.deny` (thread secrets-deny), `.husky/**`, lint-staged config, CI.

## Edges
| Feature area | Loop today | Hook point | Ride / new |
|---|---|---|---|
| `.claude/settings.json` hooks | SessionStart deps, PreToolUse main guard | `hooks.PostToolUse`, `hooks.Stop` | ride — same shape as existing hooks |
| `scripts/` hook scripts | `ensure-deps-installed.cjs`, `deny-git-write-on-main.cjs` | new `scripts/*-hook*.cjs` + shared input reader | new |
| Harness docs/skills | `loop-ship/references/push-safety.md` lint paragraph | removal candidates | ride |

## Size
S — two small scripts + one extraction + tests + settings entries.
Cut into laps: none (Cursor port → backlog follow-up).

## Decisions
DECISIONS.md D1–D3.
