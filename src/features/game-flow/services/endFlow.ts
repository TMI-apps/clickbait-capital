import { buildEndReport, GAME_OVER_TEXTS, UI_COPY } from "@/features/game-content/api";
import type {
  EndingView,
  ResultRow,
  ResultsView,
  RunSummary,
} from "@/features/game-flow/types/gameFlow.types";

/** Report line that only makes sense after an IPO (game-flow D3). */
const IPO_ONLY_LINES = new Set(["valuation"]);

const PLAYED_ORDER = ["viral", "ad", "news"] as const;

const countFormat = (value: number): string => value.toLocaleString("nl-NL");

/**
 * The dramatic ending: the game-over text of the reason, or the report title and closing
 * question for the IPO. Texts come from
 * game-content (`GAME_OVER_TEXTS`, the report title); this only picks and labels them.
 */
export function toEndingView(summary: RunSummary): EndingView {
  if (summary.outcome === "lost" && summary.reason) {
    const { title, headline, body, lesson } = GAME_OVER_TEXTS[summary.reason];
    return {
      outcome: "lost",
      reason: summary.reason,
      kicker: UI_COPY.results.lostKicker,
      title,
      headline,
      body,
      lesson,
    };
  }
  const report = buildEndReport(summary);
  return {
    outcome: "won",
    reason: null,
    kicker: UI_COPY.results.wonKicker,
    title: report.title,
    headline: report.closing,
    body: "",
    lesson: "",
  };
}

function statRows(summary: RunSummary): ResultRow[] {
  const copy = UI_COPY.results;
  return [
    { id: "turns", label: copy.turnsLabel, value: countFormat(summary.turn) },
    {
      id: "phase",
      label: copy.phaseReachedLabel,
      value: `${summary.phaseId}: ${summary.phaseName}`,
    },
    { id: "users", label: copy.usersLabel, value: summary.statTexts.users },
    { id: "revenue", label: copy.revenueLabel, value: summary.statTexts.revenue },
  ];
}

function playedRows(summary: RunSummary): ResultRow[] {
  return PLAYED_ORDER.map((type) => ({
    id: type,
    label: UI_COPY.cardTypes[type].label,
    value: countFormat(summary.playedTypes.filter((played) => played === type).length),
  }));
}

/**
 * The sober results: run stats, what went into the feed, and the end report lines built
 * from the run (`buildEndReport`). The report intro only on a win; its title and closing
 * question are the IPO ending screen.
 */
export function toResultsView(summary: RunSummary): ResultsView {
  const report = buildEndReport(summary);
  const won = summary.outcome === "won";
  const lines = won ? report.lines : report.lines.filter((line) => !IPO_ONLY_LINES.has(line.id));
  const lostTitle = summary.reason ? GAME_OVER_TEXTS[summary.reason].title : "";
  return {
    title: won ? UI_COPY.results.wonKicker : `${UI_COPY.results.lostKicker}: ${lostTitle}`,
    intro: won ? report.intro : "",
    stats: statRows(summary),
    played: playedRows(summary),
    report: lines.map(({ id, label, value }) => ({ id, label, value })),
  };
}
