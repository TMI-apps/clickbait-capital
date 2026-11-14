import type { CardType, EventOptionKind, GameContent, GameState } from "@/features/game-engine/api";
import { nextRandom } from "@/shared/utils/seededRandom";
import { DEFAULT_APP_NAME, fillTemplate, FOLLOWERS, UI_COPY } from "@/features/game-content/api";
import type { FollowerCue, FollowerPersona } from "@/features/game-content/api";
import type { SessionState } from "@/features/game-session/api";
import type {
  CommentBatch,
  CommentPace,
  FollowerComment,
} from "@/features/follower-comments/types/followerComments.types";

/** Toxicity from which the comments get busy (3) and wild (4, mean ones first). */
export const BUSY_FROM_TOXICITY = 35;
export const WILD_FROM_TOXICITY = 65;
/** Reputation below which critical followers complain, and below which they leave. */
export const COMPLAIN_BELOW_REPUTATION = 45;
export const LEAVE_BELOW_REPUTATION = 25;
/** Users gain in one turn that makes the followers hype the post: the bigger viral hits only (viral cards give 9–16). */
export const HYPE_FROM_USERS_GAIN = 14;

const COMMENTS_PER_PACE: Record<CommentPace, number> = { calm: 2, busy: 3, wild: 4 };

/** An event option reacts like the card type it plays as (event-juice-drop D1). */
const OPTION_TOPIC: Record<EventOptionKind, CardType> = {
  engagement: "viral",
  commercial: "ad",
  journalism: "news",
};

/** What the followers react to after one action: the post's topic and the run's state. */
export interface CommentContext {
  topic: CardType;
  /** State cues, most telling first. */
  cues: FollowerCue[];
  pace: CommentPace;
  /** Critical followers have left: they post a leave comment instead of talking. */
  criticsLeft: boolean;
}

function topicOf(game: GameState, content: GameContent): CardType | null {
  const source = game.lastTurn?.source;
  if (!source) return null;
  if (source.kind === "card") {
    return content.cards.find((card) => card.id === source.cardId)?.type ?? null;
  }
  const event = content.events.find((candidate) => candidate.id === source.eventId);
  const option = event?.options.find((candidate) => candidate.id === source.optionId);
  return option ? OPTION_TOPIC[option.kind] : null;
}

function paceOf(toxicity: number): CommentPace {
  if (toxicity >= WILD_FROM_TOXICITY) return "wild";
  return toxicity >= BUSY_FROM_TOXICITY ? "busy" : "calm";
}

function stateCues(game: GameState): FollowerCue[] {
  const report = game.lastTurn;
  const cues: Array<[boolean, FollowerCue]> = [
    [game.toxicity >= WILD_FROM_TOXICITY, "toxic"],
    [report?.modifiers.adFatigue ?? false, "adFatigue"],
    [report?.modifiers.echoChamber ?? false, "echoChamber"],
    [game.reputation < COMPLAIN_BELOW_REPUTATION, "complain"],
    [(report?.effects.users ?? 0) >= HYPE_FROM_USERS_GAIN, "hype"],
  ];
  return cues.filter(([active]) => active).map(([, cue]) => cue);
}

/** The followers' reading of the state after an action; null when there was no action. */
export function commentContext(game: GameState, content: GameContent): CommentContext | null {
  const topic = topicOf(game, content);
  if (!topic) return null;
  return {
    topic,
    cues: stateCues(game),
    pace: paceOf(game.toxicity),
    criticsLeft: game.reputation < LEAVE_BELOW_REPUTATION,
  };
}

/** Seeded picks for one step: the same run and step always give the same comments (feed-comments D3). */
class StepRandom {
  private state: number;

  constructor(seed: number, step: number) {
    this.state = (seed ^ Math.imul(step + 1, 0x9e3779b9)) | 0;
  }

  pick<T>(items: readonly T[]): T | undefined {
    if (items.length === 0) return undefined;
    const step = nextRandom(this.state);
    this.state = step.state;
    return items[Math.floor(step.value * items.length)];
  }
}

interface Pick {
  follower: FollowerPersona;
  cue: FollowerCue;
}

interface SpeakerPool {
  present: readonly FollowerPersona[];
  used: ReadonlySet<string>;
  random: StepRandom;
}

function pickSpeaker(cue: FollowerCue, { present, used, random }: SpeakerPool): Pick | null {
  const speakers = present.filter(
    (follower) => !used.has(follower.id) && (follower.lines[cue]?.length ?? 0) > 0
  );
  const follower = random.pick(speakers);
  return follower ? { follower, cue } : null;
}

/** Who speaks on which cue: the topic first, then the state cues, then more topic voices. */
function pickSpeakers(context: CommentContext, slots: number, random: StepRandom): Pick[] {
  const present = FOLLOWERS.filter((follower) => !(context.criticsLeft && follower.critical));
  // Wild comments: the mean ones come first, before anyone talks about the post.
  const order: FollowerCue[] =
    context.pace === "wild" ? [...context.cues, context.topic] : [context.topic, ...context.cues];
  const picks: Pick[] = [];
  const used = new Set<string>();
  for (const cue of [...order, ...Array<FollowerCue>(slots).fill(context.topic)]) {
    if (picks.length >= slots) break;
    const picked = pickSpeaker(cue, { present, used, random });
    if (!picked) continue;
    picks.push(picked);
    used.add(picked.follower.id);
  }
  return picks;
}

function toComment({ follower, cue }: Pick, key: string, random: StepRandom): FollowerComment {
  return {
    key,
    kind: "line",
    followerId: follower.id,
    name: follower.name,
    face: follower.face,
    tone: follower.tone,
    text: random.pick(follower.lines[cue] ?? []) ?? "",
  };
}

function leaveComment(follower: FollowerPersona, key: string): FollowerComment {
  return {
    key,
    kind: "leave",
    followerId: follower.id,
    name: follower.name,
    face: follower.face,
    tone: follower.tone,
    text: fillTemplate(UI_COPY.comments.leftLine, { name: follower.name }),
  };
}

/** Critics leave once, on the action that drops reputation below the line; after that they are gone. */
function leaveComments(
  context: CommentContext,
  previousReputation: number | null,
  step: number
): FollowerComment[] {
  const crossed = previousReputation === null || previousReputation >= LEAVE_BELOW_REPUTATION;
  if (!context.criticsLeft || !crossed) return [];
  return FOLLOWERS.filter((follower) => follower.critical).map((follower) =>
    leaveComment(follower, `${step}-leave-${follower.id}`)
  );
}

export interface CommentsForStepOptions {
  /** The run's seed. */
  seed: number;
  /** Index of the action in the run (0 = first). */
  step: number;
  /** Engine state right after the action. */
  game: GameState;
  content: GameContent;
  /** Reputation before the action; null when unknown (counts as a crossing). */
  previousReputation?: number | null;
  /** The player's app name for `{app}` in a line (app-name AN1); "Jouw app" when absent. */
  appName?: string;
}

/**
 * The followers' comments on one action (follower-chat D2, D3): 2–4 by Toxicity, from
 * different followers, on the post's topic and the run's state; the critical followers leave on
 * the action that drops reputation very low and stay quiet while it stays there. Pure and seeded
 * on run seed + step, so a replay or resume gives the same comments and nothing is saved
 * (feed-comments D3).
 */
export function commentsForStep(options: CommentsForStepOptions): CommentBatch | null {
  const { seed, step, game, content, previousReputation = null } = options;
  const app = options.appName ?? DEFAULT_APP_NAME;
  const context = commentContext(game, content);
  if (!context) return null;
  const random = new StepRandom(seed, step);
  const leaves = leaveComments(context, previousReputation, step);
  const slots = Math.max(1, COMMENTS_PER_PACE[context.pace] - leaves.length);
  const picks = pickSpeakers(context, slots, random);
  const lines = picks
    .map((pick, index) => toComment(pick, `${step}-${index}`, random))
    .map((comment) => ({ ...comment, text: fillTemplate(comment.text, { app }) }));
  return { key: step + 1, pace: context.pace, comments: [...lines, ...leaves] };
}

/**
 * The comments under every post of the session, indexed by step (feed-comments D3). Each step
 * keeps the engine state right after it, so posts rebuilt from a save get the same comments.
 */
export function commentsForSession(
  session: SessionState,
  content: GameContent
): Array<CommentBatch | null> {
  const { steps, game, appName } = session;
  return steps.map((step, index) =>
    commentsForStep({
      appName,
      seed: game.seed,
      step: index,
      game: step.state,
      content,
      previousReputation: index > 0 ? steps[index - 1].state.reputation : null,
    })
  );
}
