import { UI_COPY, fillTemplate } from "@/features/game-content/api";
import type {
  FeedEntry,
  MeterView,
  PhaseProgressView,
} from "@/features/game-board/types/gameBoard.types";

/**
 * What a screen reader hears after one action (screen-reader D1): one polite sentence group
 * per card play or event answer, never one per meter. Pure, so the wording is unit-tested.
 */
export interface TurnSnapshot {
  /** The newest feed post (the action just taken), or null before the first play. */
  latest: Pick<FeedEntry, "type" | "title" | "body"> | null;
  meters: MeterView[];
  goalStats: PhaseProgressView["goalStats"];
  /** The scandal warning text, or null while reputation is safe (score-redesign D13). */
  scandal: string | null;
}

/** "omhoog 8" / "omlaag 5": the same words the cards' effects use (GameCardEffects). */
export function describeMeterChange(delta: number): string {
  return `${delta > 0 ? "omhoog" : "omlaag"} ${Math.abs(delta)}`;
}

const meterLabel = (meter: MeterView): string => UI_COPY.meters[meter.key].label;

function actionSentence(latest: NonNullable<TurnSnapshot["latest"]>): string {
  return latest.type === "event"
    ? `${latest.title}. Gekozen: ${latest.body}`
    : `Geplaatst: ${latest.title}`;
}

function meterSentences(meters: MeterView[]): string[] {
  const changed = meters.filter((meter) => meter.delta !== 0);
  if (changed.length === 0) return ["Gebruikers en geld onveranderd"];
  return changed.map((meter) => `${meterLabel(meter)} ${meter.deltaText}, nu ${meter.amountText}`);
}

function goalSentences(turn: TurnSnapshot): string[] {
  return turn.goalStats;
}

function warningSentences(turn: TurnSnapshot): string[] {
  const danger = turn.meters
    .filter((meter) => meter.danger)
    .map((meter) => `Let op: ${meterLabel(meter)} bijna op`);
  const scandal = turn.scandal ? [`Let op: ${turn.scandal}`] : [];
  return [...danger, ...scandal];
}

const sentence = (text: string): string => (/[.!?]$/.test(text) ? text : `${text}.`);

/**
 * The announcement for the action that produced `turn`: post or chosen policy, each changed
 * number with its new amount, the goal lines, then warnings (money nearly gone, the scandal risk
 * on every turn it shows).
 */
export function describeTurn(turn: TurnSnapshot): string {
  if (!turn.latest) return "";
  return [
    actionSentence(turn.latest),
    ...meterSentences(turn.meters),
    ...goalSentences(turn),
    ...warningSentences(turn),
  ]
    .map(sentence)
    .join(" ");
}

/**
 * Spoken once when a saved run reopens (local-save D5): where the player is, then the meters,
 * because the board heading names the phase but not the turn or the values.
 */
export function describeResume(phase: PhaseProgressView, meters: MeterView[]): string {
  const where = fillTemplate(UI_COPY.board.resumedAnnouncement, {
    phase: String(phase.phaseId),
    name: phase.phaseName,
    turn: String(phase.turn),
  });
  const values = meters.map((meter) => `${meterLabel(meter)} ${meter.amountText}`).join(", ");
  return `${where} ${sentence(values)}`;
}
