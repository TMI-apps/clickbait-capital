# Brief — Orchestrator for parallel laps

Task: Orchestrator for parallel laps · Lap: temp_job_orchestrator-parallel-laps · Harness: v0.44.0

## Problem
The owner can run only one lap in the build stages at a time (skill-loop D45), so a backlog with several independent tasks gets done one by one, and every lap re-does backlog bookkeeping itself.

## Success check
Given a backlog with two or more independent ready tasks, the router hands control to the orchestrator, which runs them as parallel laps in separate threads, keeps `app-tasks.json` accurate, and brings each result to the owner; given a single task, the router runs the plain loop and the orchestrator never loads.

## In scope
- New skill `loop-orchestrate`: offered at the backlog confirm when ≥2 ready tasks have non-overlapping edges (D2). Owns backlog and task status (D3, may reorder without asking — D8), proposes tasks from vision gaps and turns owner remarks into tasks (D8), starts one separate session per lap with no cap; overlapping tasks queue (D5, D9). Threads run refine → PR (D7). Answers thread questions it can, relays the rest one at a time (D4, D8), passes info between threads, pauses or re-scopes drifting ones, sends one Stop 2 handoff listing each PR, merges each Pass and resolves conflicts itself (D6, D8), learns across threads, keeps going while the owner is away (D8).
- Router / loop-map / loop-backlog / loop-refine / loop-ship / loop-verdict: pointers only; D45 holds without the orchestrator (D1).
- Lean wording: outcomes and guardrails, not procedure.
## Out of scope
- Will NOT do: new tooling, scripts, locks or a task-state schema change (statuses stay `to-do | in-progress | done`) — excluded.
- Will NOT do: a scheduler or always-on background orchestrator — deferred.
- Will NOT touch: the plain single-lap loop's behavior — stays unchanged when the orchestrator is not in use.

## Edges
| Feature area | Loop today | Hook point | Ride / new |
|---|---|---|---|
| `.agents/skills/router` (+ `loop-map.md`, `catalog.md`) | router → loop-map "Where a lap stands" → one stage | new resolution row + Outside/inside entry; catalog row | ride |
| `.agents/skills/loop-backlog` | owns catch-up, ranking, confirm, start | note that under the orchestrator these run there | ride |
| `.agents/skills/loop-ship`, `loop-verdict` | lap archives its task in its PR; owner verdict per lap | thread hands result to orchestrator; orchestrator merges | ride |
| `.agents/skills/loop-orchestrate` | Not found | new skill | new — no parallel-lap owner exists |
| `documentation/DOC_DECISION_LOG.md` | D45 single lap | amendment row via lap ledger | ride |

Overrun rule (skill-loop D51): a diff that touches a feature area **not** in this table stops the lap.

## Size
S — one new lean skill plus pointer edits in four existing skills; no app code.
Cut into laps: none

## Decisions
DECISIONS.md rows D1…

## Plan
Acceptance test: `pnpm validate:skills` passes with `loop-orchestrate` admitted (catalog row, template, evals, Calls ⇄ Called by reciprocity); eval `two-independent-tasks-orchestrate` and `single-task-plain-loop` encode the success check.

1. Write `.agents/skills/loop-orchestrate/SKILL.md` (outcomes + guardrails only; reuse loop-backlog ranking and loop-verdict handoff by link, no restated procedure) and two evals. Gate: `pnpm validate:skills`.
2. Pointer edits: router (Calls + step), loop-map (orchestrator row, D45 amendment note), loop-backlog (confirm offers parallel run; under the orchestrator its stages run there), loop-refine / loop-ship / loop-verdict Called by + one line each on thread behavior, catalog row. Gate: `pnpm validate:skills`, `node scripts/sync-agent-config.mjs --check`, `pnpm validate:docs`.
