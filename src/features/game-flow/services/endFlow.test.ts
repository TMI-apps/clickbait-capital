import { describe, expect, it } from "vitest";
import { buildEndReport, GAME_OVER_TEXTS, UI_COPY } from "@/features/game-content/api";
import { toEndingView, toResultsView } from "@/features/game-flow/services/endFlow";
import type { RunSummary } from "@/features/game-flow/types/gameFlow.types";

const run = (overrides: Partial<RunSummary> = {}): RunSummary => ({
  outcome: "lost",
  reason: "banned",
  turn: 12,
  phaseId: 2,
  phaseName: "De Scale-Up",
  stats: { users: 2_000_000, revenue: 150_000 },
  statTexts: { users: "2.000.000", revenue: "€ 150.000" },
  playedTypes: ["viral", "viral", "ad", "news", "viral"],
  firedEventIds: ["event-a"],
  ...overrides,
});

describe("toEndingView", () => {
  it("should tell the dull-feed story when a news-only run ends in Verlaten Platform", () => {
    const ending = toEndingView(
      run({ reason: "abandoned", playedTypes: ["news", "news", "news", "news"] })
    );
    const { title, variants } = GAME_OVER_TEXTS.abandoned;
    expect(ending).toMatchObject({
      outcome: "lost",
      reason: "abandoned",
      kicker: UI_COPY.results.lostKicker,
      title,
      ...variants.dullFeed,
    });
  });

  it("should tell the ad-overload story when an ad-heavy run ends in Verlaten Platform", () => {
    const ending = toEndingView(run({ reason: "abandoned", playedTypes: ["ad", "ad", "news"] }));
    expect(ending.headline).toBe(GAME_OVER_TEXTS.abandoned.variants.adOverload.headline);
  });

  it("should use the report title and closing when the IPO is won", () => {
    const summary = run({ outcome: "won", reason: null, phaseId: 4 });
    const report = buildEndReport(summary);
    expect(toEndingView(summary)).toMatchObject({
      outcome: "won",
      kicker: UI_COPY.results.wonKicker,
      title: report.title,
      headline: report.closing,
      lesson: "",
    });
  });
});

describe("toResultsView", () => {
  it("should show every report line and the intro when the IPO is won", () => {
    const summary = run({ outcome: "won", reason: null, phaseId: 4 });
    const report = buildEndReport(summary);
    const results = toResultsView(summary);
    expect(results.intro).toBe(report.intro);
    expect(results.report.map((row) => row.id)).toEqual(report.lines.map((line) => line.id));
  });

  it("should leave out the IPO valuation and intro when the run is lost", () => {
    const results = toResultsView(run());
    expect(results.title).toBe(`${UI_COPY.results.lostKicker}: Verbod & Regulering`);
    expect(results.intro).toBe("");
    expect(results.report.map((row) => row.id)).not.toContain("valuation");
    expect(results.report.length).toBeGreaterThan(0);
  });

  it("should count the played card types and show the board's stat texts", () => {
    const results = toResultsView(run());
    expect(results.played.map((row) => row.value)).toEqual(["3", "1", "1"]);
    expect(results.stats.find((row) => row.id === "users")?.value).toBe("2.000.000");
    expect(results.stats.find((row) => row.id === "phase")?.value).toBe("2: De Scale-Up");
  });
});
