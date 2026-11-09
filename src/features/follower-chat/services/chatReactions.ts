import type { CardType, EventOptionKind, GameContent, GameState } from "@/features/game-engine/api";
import { nextRandom } from "@/features/game-engine/api";
import { fillTemplate, FOLLOWERS, UI_COPY } from "@/features/game-content/api";
import type { FollowerCue, FollowerPersona } from "@/features/game-content/api";
import type { SessionState } from "@/features/game-session/api";
import type {
  ChatBatch,
  ChatMessage,
  ChatPace,
} from "@/features/follower-chat/types/followerChat.types";

/** Toxicity from which the chat gets busy (3 lines) and wild (4 lines, mean lines first). */
export const BUSY_FROM_TOXICITY = 35;
export const WILD_FROM_TOXICITY = 65;
/** Reputation below which critical followers complain, and below which they leave. */
export const COMPLAIN_BELOW_REPUTATION = 45;
export const LEAVE_BELOW_REPUTATION = 25;
/** Users gain in one turn that makes the chat hype the post: the bigger viral hits only (viral cards give 9–16). */
export const HYPE_FROM_USERS_GAIN = 14;

const LINES_PER_PACE: Record<ChatPace, number> = { calm: 2, busy: 3, wild: 4 };

/** An event option reacts like the card type it plays as (event-juice-drop D1). */
const OPTION_TOPIC: Record<EventOptionKind, CardType> = {
  engagement: "viral",
  commercial: "ad",
  journalism: "news",
};

/** What the chat reacts to after one action: the post's topic and the run's state. */
export interface ChatContext {
  topic: CardType;
  /** State cues, most telling first. */
  cues: FollowerCue[];
  pace: ChatPace;
  /** Critical followers have left: they post a leave line instead of talking. */
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

function paceOf(toxicity: number): ChatPace {
  if (toxicity >= WILD_FROM_TOXICITY) return "wild";
  return toxicity >= BUSY_FROM_TOXICITY ? "busy" : "calm";
}

function stateCues(game: GameState): FollowerCue[] {
  const report = game.lastTurn;
  const cues: Array<[boolean, FollowerCue]> = [
    [game.toxicity >= WILD_FROM_TOXICITY, "toxic"],
    [report?.modifiers.adFatigue ?? false, "adFatigue"],
    [report?.modifiers.echoChamber ?? false, "echoChamber"],
    [report?.modifiers.journalismDrought ?? false, "drought"],
    [game.meters.reputation < COMPLAIN_BELOW_REPUTATION, "complain"],
    [(report?.effects.users ?? 0) >= HYPE_FROM_USERS_GAIN, "hype"],
  ];
  return cues.filter(([active]) => active).map(([, cue]) => cue);
}

/** The chat's reading of the state after an action; null when there was no action. */
export function chatContext(game: GameState, content: GameContent): ChatContext | null {
  const topic = topicOf(game, content);
  if (!topic) return null;
  return {
    topic,
    cues: stateCues(game),
    pace: paceOf(game.toxicity),
    criticsLeft: game.meters.reputation < LEAVE_BELOW_REPUTATION,
  };
}

/** Seeded picks for one step: the same run and step always give the same chat (follower-chat D4). */
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
function pickSpeakers(context: ChatContext, slots: number, random: StepRandom): Pick[] {
  const present = FOLLOWERS.filter((follower) => !(context.criticsLeft && follower.critical));
  // Wild chat: the mean lines come first, before anyone talks about the post.
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

function toMessage({ follower, cue }: Pick, key: string, random: StepRandom): ChatMessage {
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

function leaveMessage(follower: FollowerPersona, key: string): ChatMessage {
  return {
    key,
    kind: "leave",
    followerId: follower.id,
    name: follower.name,
    face: follower.face,
    tone: follower.tone,
    text: fillTemplate(UI_COPY.chat.leftLine, { name: follower.name }),
  };
}

/** Critics leave once, on the action that drops reputation below the line; after that they are gone. */
function leaveMessages(
  context: ChatContext,
  previousReputation: number | null,
  step: number
): ChatMessage[] {
  const crossed = previousReputation === null || previousReputation >= LEAVE_BELOW_REPUTATION;
  if (!context.criticsLeft || !crossed) return [];
  return FOLLOWERS.filter((follower) => follower.critical).map((follower) =>
    leaveMessage(follower, `${step}-leave-${follower.id}`)
  );
}

export interface ChatForStepOptions {
  /** The run's seed. */
  seed: number;
  /** Index of the action in the run (0 = first). */
  step: number;
  /** Engine state right after the action. */
  game: GameState;
  content: GameContent;
  /** Reputation before the action; null when unknown (counts as a crossing). */
  previousReputation?: number | null;
}

/**
 * The followers' reaction to one action (follower-chat D2–D4): 2–4 lines by Toxicity, from
 * different followers, on the post's topic and the run's state; the critical followers leave
 * on the action that drops reputation very low and stay quiet while it stays there. Pure and seeded on run seed + step, so a replay or resume gives
 * the same chat and nothing is stored in the save.
 */
export function chatForStep(options: ChatForStepOptions): ChatBatch | null {
  const { seed, step, game, content, previousReputation = null } = options;
  const context = chatContext(game, content);
  if (!context) return null;
  const random = new StepRandom(seed, step);
  const leaves = leaveMessages(context, previousReputation, step);
  const slots = Math.max(1, LINES_PER_PACE[context.pace] - leaves.length);
  const picks = pickSpeakers(context, slots, random);
  const messages = picks.map((pick, index) => toMessage(pick, `${step}-${index}`, random));
  return { key: step + 1, pace: context.pace, messages: [...messages, ...leaves] };
}

/**
 * The chat for the session's last action, or null before the first action and for actions
 * replayed from a save (a resume stays quiet, like the board sounds).
 */
export function chatForSession(session: SessionState, content: GameContent): ChatBatch | null {
  const { steps, replayedStepCount, game, previousGame } = session;
  if (steps.length === 0 || steps.length <= replayedStepCount) return null;
  return chatForStep({
    seed: game.seed,
    step: steps.length - 1,
    game,
    content,
    previousReputation: previousGame?.meters.reputation ?? null,
  });
}
