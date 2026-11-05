import { SITE_ORIGIN } from "@/config/site";
import {
  buildEndReport,
  fillTemplate,
  GAME_OVER_TEXTS,
  selectGameOverText,
  UI_COPY,
} from "@/features/game-content/api";
import type { ShareCardContent, ShareResultCopy } from "@/features/result-share/api";
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
 * The dramatic ending: the game-over text that matches the run (`selectGameOverText`), or the
 * report title and closing question for the IPO. Texts and the choice of story come from
 * game-content; this only labels them.
 */
export function toEndingView(summary: RunSummary): EndingView {
  if (summary.outcome === "lost" && summary.reason) {
    const { title, headline, body, lesson } = selectGameOverText(summary.reason, summary);
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

/** Stat rows the share card repeats from the results (task: phase, reach, revenue). */
const SHARE_STAT_IDS = new Set(["phase", "users", "revenue"]);

/**
 * The share card of a run: the ending's title and headline (the punchy line), phase reached,
 * Hoogste bereik and Totale omzet, and the production link (result-share D5).
 */
export function toShareCardContent(summary: RunSummary): ShareCardContent {
  const copy = UI_COPY.results;
  const ending = toEndingView(summary);
  return {
    appName: UI_COPY.app.name,
    kicker: ending.kicker,
    title: ending.title,
    line: ending.headline,
    stats: statRows(summary)
      .filter((row) => SHARE_STAT_IDS.has(row.id))
      .map(({ label, value }) => ({ label, value })),
    footerLabel: copy.shareCardFooter,
    shareTitle: UI_COPY.app.name,
    text: fillTemplate(copy.shareText, {
      phase: String(summary.phaseId),
      turns: countFormat(summary.turn),
    }),
    url: `${SITE_ORIGIN}/`,
    fileName: copy.shareFileName,
  };
}

/** Button label and status lines of the share button (closing the sheet stays silent). */
export const SHARE_RESULT_COPY: ShareResultCopy = {
  buttonLabel: UI_COPY.results.shareButton,
  statuses: {
    shared: UI_COPY.results.shareDoneStatus,
    "shared-link": UI_COPY.results.shareDoneStatus,
    "downloaded-and-copied": UI_COPY.results.shareSavedAndCopiedStatus,
    downloaded: UI_COPY.results.shareSavedStatus,
    copied: UI_COPY.results.shareCopied,
    cancelled: "",
    failed: UI_COPY.results.shareFailedStatus,
  },
};
