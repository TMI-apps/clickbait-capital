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
  streak: PhaseProgressView["streak"];
  /** Journalistieke droogte is active on the new draft. */
  drought: boolean;
}

/** "omhoog 8" / "omlaag 5": the same words the cards' effects use (GameCardEffects). */
export function describeMeterChange(delta: number): string {
  return `${delta > 0 ? "omhoog" : "omlaag"} ${Math.abs(delta)}`;
}

/** `aria-valuetext` of a board meter: value, last change, and danger or maximum. */
export function meterValueText({
  value,
  delta,
  full,
  danger,
}: Omit<MeterView, "key" | "valueText">): string {
  const parts = [`${value} van 100`];
  if (delta !== 0) parts.push(describeMeterChange(delta));
  if (danger) parts.push("gevaarlijk laag");
  else if (full) parts.push("maximum bereikt");
  return parts.join(", ");
}

const meterLabel = (meter: MeterView): string => UI_COPY.meters[meter.key].label;

function actionSentence(latest: NonNullable<TurnSnapshot["latest"]>): string {
  return latest.type === "event"
    ? `${latest.title}. Gekozen: ${latest.body}`
    : `Geplaatst: ${latest.title}`;
}

function meterSentences(meters: MeterView[]): string[] {
  const changed = meters.filter((meter) => meter.delta !== 0);
  if (changed.length === 0) return ["Meters onveranderd"];
  return changed.map(
    (meter) => `${meterLabel(meter)} ${describeMeterChange(meter.delta)}, nu ${meter.value}`
  );
}

function goalSentences(turn: TurnSnapshot): string[] {
  const streak = turn.streak
    ? [
        fillTemplate(UI_COPY.board.goalStreakLabel, {
          streak: String(turn.streak.current),
          needed: String(turn.streak.required),
        }),
      ]
    : [];
  return [...turn.goalStats, ...streak];
}

function warningSentences(turn: TurnSnapshot, previous: TurnSnapshot | null): string[] {
  const drought = UI_COPY.board.modifiers.journalismDrought;
  const droughtStarted = turn.drought && !previous?.drought;
  const danger = turn.meters
    .filter((meter) => meter.danger)
    .map((meter) => `Let op: ${meterLabel(meter)} gevaarlijk laag`);
  return [...(droughtStarted ? [`${drought.label}: ${drought.description}`] : []), ...danger];
}

const sentence = (text: string): string => (/[.!?]$/.test(text) ? text : `${text}.`);

/**
 * The announcement for the action that produced `turn`: post or chosen policy, each changed
 * meter with its new value, the goal line, then warnings (drought only on the turn it starts).
 */
export function describeTurn(turn: TurnSnapshot, previous: TurnSnapshot | null): string {
  if (!turn.latest) return "";
  return [
    actionSentence(turn.latest),
    ...meterSentences(turn.meters),
    ...goalSentences(turn),
    ...warningSentences(turn, previous),
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
  const values = meters.map((meter) => `${meterLabel(meter)} ${meter.value}`).join(", ");
  return `${where} ${sentence(values)}`;
}
