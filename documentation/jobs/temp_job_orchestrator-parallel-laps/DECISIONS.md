# Decisions — orchestrator-parallel-laps

Job: `temp_job_orchestrator-parallel-laps`
Updated: 2026-11-03

## Closed

| id | topic | status | choice | source | notes |
|----|-------|--------|--------|--------|-------|
| D1 | D45 conflict (one lap in build at a time) | closed | Amend: one lap per thread; the orchestrator sets how many run at once. Without the orchestrator, D45 stands | loop-refine | owner-directed: the request is "complete many tasks at once". Rejected: keep D45 and only parallelize planning |
| D2 | When the orchestrator runs | closed | Router offers it at Stop 1 when two or more independent tasks are ready; one task, or a task the owner names alone, runs the plain loop | loop-refine | owner (asked after clear-winner). Rejected: only when asked; automatic; always the front door |
| D3 | Who writes task state | closed | The orchestrator, when it runs; threads never edit `app-tasks.json` | loop-refine | clear-winner: parallel PRs editing the same JSON conflict; one writer avoids it |
| D4 | Owner contact | closed | The owner talks only to the orchestrator; threads route stop-list questions through it, it batches them one at a time | loop-refine | clear-winner: matches "the orchestrator I interact with" |
| D6 | Stop 2 granularity | closed | One PR + preview per thread; the orchestrator verifies, sends one handoff listing every preview, merges each one the owner passes, resolving conflicts in order | owner | Keeps D44 (bounded cost per slice) and per-task Drop. Rejected: one combined PR per batch; no parallel build |
| D7 | Which stages lift to the orchestrator | closed | Backlog (catch-up, ranking, task status), the Stop 2 handoff and merging. Threads run refine → plan → build → check → PR | owner | Rejected: also lift refine; backlog only; no split (thin dispatcher) |
| D8 | Orchestrator duties (beyond the obvious) | closed | Yes: propose tasks from vision gaps (owner confirms new tasks); reorder the backlog without asking, reporting the change (amends skill-loop D14 while it runs); turn owner remarks into tasks; answer thread questions it can settle; pass info between threads; pause or re-scope drifting or overlapping threads; resolve merge conflicts itself; learn across threads (proposes rule/skill fixes, consent still asked); keep starting ready tasks while the owner is away. No: split vague tasks before dispatch (threads refine, D7); pick the thread count itself; a second diff review on top of the thread's loop-check | owner | multi-select. Supersedes the 'verify the PR against its brief' part of D6 |
| D9 | Thread cap | closed | No cap: every independent ready task starts at once; overlapping tasks still queue (edge rule) | owner | Rejected: default 3, owner sets per run, cap by waiting previews |
| D10 | Thread → orchestrator channel | closed | Surface-dependent: the skill says threads report questions and results; the model uses messages where the surface supports them, otherwise a channel it can read (branch, PR, transcript) | owner | Review hole 1: cloud child sessions can't message back. Rejected: park on branch + checks; read transcripts; reopen D5 (subagents) |
| D11 | How backlog changes land | closed | Before each Stop 2 handoff the orchestrator commits that task's archive plus pending backlog edits (reorders, new tasks) onto the thread's branch; merging stays the Pass. `in-progress` lives only in the status line during a run | owner | Review hole 2. Rejected: threads archive themselves; a standing backlog PR; state outside git |
| D12 | Finding a run after a restart | closed | Sessions are the record: thread sessions are tagged with the run and the lap slug and carry the orchestrator as parent; a fresh chat lists active sessions to see whether a run is in flight and rebuilds status from them plus open lap PRs. No run file | owner | Review hole 5. Verified: this surface can list sessions with tags and parent ids. Rejected: run file on a branch; ask on every restart; no resume |
| D13 | Overlap check timing | closed | Guess overlap from the task text at dispatch; re-check when each thread reports its brief edges, and hold or re-scope then | critical review | clear-winner: edges exist only after refine |
| D14 | Expected conflicts | closed | Append-only files every lap touches (`DOC_DECISION_LOG.md`, backlog JSON) conflict by design; the orchestrator resolves them at merge and does not treat them as overlap | critical review | clear-winner |
| D15 | Stop 1 restatement under the orchestrator | closed | Each thread's 'Building: X. Not: Y. Size: S.' line appears in the orchestrator's status until the owner has seen it | critical review | clear-winner: keeps skill-loop D43's cheap misunderstanding catch |
| D5 | Thread mechanism | closed | Separate sessions: each thread is its own session the owner can open and watch, pushing its own branch and PR (survives the orchestrator chat restarting). Name the role, not one product's tool | owner | Reopened from clear-winner 'mechanism-agnostic'. Rejected: subagents in worktrees, leave it to the surface, mix by size |

## Open

| id | topic | status | options briefly | blocked phase |
|----|-------|--------|-----------------|---------------|

## Log

- 2026-11-03 — D12 closed via critical review (owner); D13–D15 clear-winner
- 2026-11-03 — D11 closed via critical review (asked)
- 2026-11-03 — D10 closed via critical review (asked)
- 2026-11-03 — D2 confirmed via loop-refine (asked)
- 2026-11-03 — D5 reopened and closed via loop-refine (asked)
- 2026-11-03 — D9 closed via loop-refine (asked)
- 2026-11-03 — D8 closed via loop-refine (asked, multi-select)
- 2026-11-03 — D7 closed via loop-refine (asked)
- 2026-11-03 — D6 closed via loop-refine (asked)
- 2026-11-03 — D1–D5 closed via loop-refine (owner-directed / clear-winner)
