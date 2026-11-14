# Brief — Policy cards: research and design

Task: Orchestrator request (owner's words below) · Lap: temp_job_policy-cards · Branch: docs/policy-cards-research · Size: S (docs only)

## Owner request (recorded)

> "Expand the content and lean more into: you drag policy to the feed. The feed would be like the official Meta account on Facebook. I like the current posts, we don't have to change those, but as we move on (later phases), I would like the card chooser and drag-to-feed to more mimic what policy you choose as a company. And I want a thread to investigate what social media malpractice is still missing from our cards, and what decisions that were made by, for instance, Meta or TikTok could be dragged into the game."

## Problem

Every card in the deck is a post that shows up in the feed. The player is "the algorithm", but never makes the decisions a social media company makes about how its platform works: autoplay, streaks, default settings, which ads are allowed, who checks the content. Those decisions are where the real harm and the real lesson come from. The deck also misses well-documented malpractice (see RESEARCH.md § 1, "The gap").

## Success check (for this lap)

- RESEARCH.md: an inventory of what the deck covers, and a sourced, dated list of real platform decisions not yet covered, each with incentive, harm, phase fit and age-11 fit; a ranked top 10.
- PROPOSAL.md (revision 2, after the owner's answers): within the three existing types the pools shift from posts to company decisions over the phases, announced on the official account of the app the player names; 15–25 decision cards, 8–12 events (heavy topics fictionalised), the naming flow, follower cues, the balance approach and 2–3 build laps.
- No code, no protected files, no new dependencies.

## In scope

- `documentation/jobs/temp_job_policy-cards/` — BRIEF.md, RESEARCH.md, PROPOSAL.md.

## Out of scope

- Will NOT do: engine, content, board or imagery changes (proposed build laps, PROPOSAL § 10); changes to the existing 71 posts (owner: "we don't have to change those"); `DOC_GAME_DESIGN.md` and feature READMEs (updated by the build laps in the build laps).

## Edges (for the build laps, not this lap)

| Feature area      | Hook point                                                                 |
| ----------------- | -------------------------------------------------------------------------- |
| game-content      | decision cards, events, `announce` field, names, filter, copy, balance sim |
| game-flow         | naming step, `{app}` in intros, endings, report                            |
| game-session      | app name next to the run                                                   |
| game-save         | optional `appName`; version 7 → 8 with the new cards                       |
| game-board        | feed header and official-post variant                                      |
| follower-comments | `official` cue                                                             |
| result-share      | app name in share text and card                                            |
| card-imagery      | optional images for the new cards and events                               |
