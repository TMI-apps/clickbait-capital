# Brief — Policy cards: research and design

Task: Orchestrator request (owner's words below) · Lap: temp_job_policy-cards · Branch: docs/policy-cards-research · Size: S (docs only)

## Owner request (recorded)

> "Expand the content and lean more into: you drag policy to the feed. The feed would be like the official Meta account on Facebook. I like the current posts, we don't have to change those, but as we move on (later phases), I would like the card chooser and drag-to-feed to more mimic what policy you choose as a company. And I want a thread to investigate what social media malpractice is still missing from our cards, and what decisions that were made by, for instance, Meta or TikTok could be dragged into the game."

## Problem

Every card in the deck is a post that shows up in the feed. The player is "the algorithm", but never makes the decisions a social media company makes about how its platform works: autoplay, streaks, default settings, which ads are allowed, who checks the content. Those decisions are where the real harm and the real lesson come from. The deck also misses well-documented malpractice (see RESEARCH.md § 1, "The gap").

## Success check (for this lap)

- RESEARCH.md: an inventory of what the deck covers, and a sourced, dated list of real platform decisions not yet covered, each with incentive, harm, phase fit and age-11 fit; a ranked top 10.
- PROPOSAL.md: how hand and feed shift from posts (phases 1–2) to company policy announced on an official company account (phases 3–4); card face, mechanics, interaction with scandals, regulators and followers, balance impact, fictional framing without brand names, the "Echt gebeurd" credit; 15–25 draft policy cards and 5–10 event ideas; build laps of size M or smaller; owner questions with a recommendation.
- No code, no protected files, no new dependencies.

## In scope

- `documentation/jobs/temp_job_policy-cards/` — BRIEF.md, RESEARCH.md, PROPOSAL.md.

## Out of scope

- Will NOT do: engine, content, board or imagery changes (proposed build laps, PROPOSAL § 9); changes to the existing 71 posts (owner: "we don't have to change those"); `DOC_GAME_DESIGN.md` and feature READMEs (updated by the build laps once the owner has answered PROPOSAL § 10).

## Edges (for the build laps, not this lap)

| Feature area      | Hook point                                                                |
| ----------------- | ------------------------------------------------------------------------- |
| game-engine       | card schema, hand slots, active-policy state, event trigger               |
| game-content      | policy pool, events, glossary, followers, balance simulation              |
| game-board        | draft card face, official post in the feed, active-policy strip, forecast |
| follower-comments | policy cue lines                                                          |
| game-save         | saved `GameState` gains active policies (format version)                  |
| card-imagery      | policy images, company avatar                                             |
| game-flow         | phase 3 intro, end report, sources page                                   |
