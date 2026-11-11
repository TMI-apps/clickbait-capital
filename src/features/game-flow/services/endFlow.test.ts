import { describe, expect, it } from "vitest";
import { SITE_ORIGIN } from "@/config/site";
import { buildEndReport, GAME_OVER_TEXTS, UI_COPY } from "@/features/game-content/api";
import {
  toEndingView,
  toResultsView,
  toShareCardContent,
} from "@/features/game-flow/services/endFlow";
import type { RunSummary } from "@/features/game-flow/types/gameFlow.types";

const run = (overrides: Partial<RunSummary> = {}): RunSummary => ({
  outcome: "lost",
  reason: "bankrupt",
  turn: 12,
  phaseId: 2,
  phaseName: "De Scale-Up",
  score: { users: 2_000_000, money: 150_000 },
  statTexts: { users: "2.000.000", money: "€ 150.000" },
  playedTypes: ["viral", "viral", "ad", "news", "viral"],
  firedEventIds: ["event-a"],
  ...overrides,
});

describe("toEndingView", () => {
  it("should tell the no-income story when a run with few ads goes bankrupt", () => {
    const ending = toEndingView(run({ playedTypes: ["news", "news", "viral", "news"] }));
    const { title, variants } = GAME_OVER_TEXTS.bankrupt;
    expect(ending).toMatchObject({
      outcome: "lost",
      reason: "bankrupt",
      kicker: UI_COPY.results.lostKicker,
      title,
      ...variants.noIncome,
    });
  });

  it("should tell the missing-audience story when an ad-heavy run goes bankrupt", () => {
    const ending = toEndingView(run({ playedTypes: ["ad", "ad", "news"] }));
    expect(ending.headline).toBe(GAME_OVER_TEXTS.bankrupt.variants.noAudience.headline);
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
    expect(results.title).toBe(`${UI_COPY.results.lostKicker}: Bankroet`);
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

describe("toShareCardContent", () => {
  it("should show the ending, phase, users and money when a run is lost", () => {
    const summary = run();
    const ending = toEndingView(summary);
    const card = toShareCardContent(summary);
    expect(card).toMatchObject({
      kicker: UI_COPY.results.lostKicker,
      title: GAME_OVER_TEXTS.bankrupt.title,
      line: ending.headline,
      url: `${SITE_ORIGIN}/`,
      fileName: UI_COPY.results.shareFileName,
    });
    expect(card.stats).toEqual([
      { label: UI_COPY.results.phaseReachedLabel, value: "2: De Scale-Up" },
      { label: UI_COPY.results.usersLabel, value: "2.000.000" },
      { label: UI_COPY.results.moneyLabel, value: "€ 150.000" },
    ]);
    expect(card.text).toContain(
      "fase 2 in 12 beurten, met 2.000.000 gebruikers op mijn hoogtepunt"
    );
  });

  it("should use the report title and closing question when the IPO is won", () => {
    const summary = run({ outcome: "won", reason: null, phaseId: 4, phaseName: "De Beursgang" });
    const report = buildEndReport(summary);
    expect(toShareCardContent(summary)).toMatchObject({
      kicker: UI_COPY.results.wonKicker,
      title: report.title,
      line: report.closing,
    });
  });
});
