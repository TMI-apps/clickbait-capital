import type { JuiceEffectStep } from "@/features/juice-effects/api";
import type {
  GameJuiceCatalog,
  GameJuiceEventName,
  JuiceChartMoveVariant,
  JuiceScandalLevel,
  JuiceStreakStep,
} from "@/features/game-juice/types/gameJuiceEvents.types";

/** The variant names an event's catalog entry allows. */
type VariantOf<K extends GameJuiceEventName> = GameJuiceCatalog[K] extends { variant: infer V }
  ? V & string
  : never;

/** A recipe whose variant keys must match the catalog (a typo fails type-check). */
export interface GameJuiceRecipe<K extends GameJuiceEventName> {
  steps?: JuiceEffectStep[];
  variants?: Record<VariantOf<K>, JuiceEffectStep[]>;
  cooldownMs?: number;
  tag?: string;
}

/** Tag of the outcome recipes: their marks sit on the dialog's rows and end when it closes. */
export const EVENT_OUTCOME_TAG = "event-outcome";

/** Tag of the phase intro: its delayed sparkles end with the screen, never on the board. */
export const PHASE_INTRO_TAG = "phase-intro";

/** Tag of the scandal warning's ramp: it ends when the warning goes away. */
export const SCANDAL_WARNING_TAG = "scandal-warning";

export type GameJuiceRecipeBook = { [K in GameJuiceEventName]: GameJuiceRecipe<K> };

/*
 * Durations mirror the motion tokens in `src/shared/theme/tokens/base.tokens.json`:
 * juice 760 ms (particles, flash, glow), shake 360 ms, card draw 420 ms.
 * Colours are theme tokens: type-viral (neon pink), type-ad (gold), success, destructive.
 */

/** Viral (design § 5): light shake, neon explosion of 🔥😱😡, flames on Gebruikers. Loudest. */
const VIRAL_VISUALS: JuiceEffectStep[] = [
  { effect: "shake", target: "board", strength: 5, duration: 360 },
  {
    effect: "particles",
    from: "origin",
    glyphs: "🔥😱😡",
    count: 12,
    duration: 760,
    glow: "type-viral",
  },
  { effect: "glow", target: "meter:users", color: "type-viral", times: 2, duration: 760 },
  { effect: "badge", target: "meter:users", glyph: "🔥", duration: 1600 },
];

/** Ad: coins fly from the card to Inkomsten, which glows gold. */
const AD_VISUALS: JuiceEffectStep[] = [
  {
    effect: "particles",
    from: "origin",
    to: "meter:revenue",
    glyphs: "🪙💰💶",
    count: 10,
    duration: 760,
  },
  { effect: "glow", at: 450, target: "meter:revenue", color: "type-ad", times: 2, duration: 760 },
  { effect: "badge", at: 450, target: "meter:revenue", glyph: "💰", duration: 1600 },
];

/**
 * News stays dull on purpose (design § 5, game-juice D8): no visuals with the play. Its one mark,
 * a small shield, sits on the news post once it has landed (`feed.landed` news).
 */
const NEWS_VISUALS: JuiceEffectStep[] = [];

/** The tile's change text rises off it ("+12.000"); a `-big` move rises further (lap-3 D5). */
const METER_FLOATER = {
  gain: {
    effect: "floater",
    target: "meter:{meter}",
    text: "{text}",
    color: "success",
    rise: 28,
    duration: 900,
  },
  loss: {
    effect: "floater",
    target: "meter:{meter}",
    text: "{text}",
    color: "destructive",
    rise: 28,
    duration: 900,
  },
} satisfies Record<string, JuiceEffectStep>;

/** The scandal warning's ramp: louder and busier per level, never a loop (lap-3 D3). */
const SCANDAL_WARNING: Record<JuiceScandalLevel, JuiceEffectStep[]> = {
  "1": [
    { effect: "sound", id: "scandal-warning", volume: 0.7 },
    { effect: "glow", target: "scandal", color: "destructive", times: 1, duration: 760 },
  ],
  "2": [
    { effect: "sound", id: "scandal-warning" },
    { effect: "pulse", target: "scandal", scale: 1.04, times: 2, duration: 760 },
    { effect: "glow", target: "scandal", color: "destructive", times: 2, duration: 760 },
  ],
  "3": [
    { effect: "sound", id: "scandal-warning", rate: 1.08 },
    { effect: "haptic", pattern: "20 40 20" },
    { effect: "shake", target: "scandal", strength: 3, duration: 360 },
    { effect: "pulse", target: "scandal", scale: 1.06, times: 3, duration: 900 },
    { effect: "glow", target: "scandal", color: "destructive", times: 3, duration: 900 },
    { effect: "badge", target: "scandal", glyph: "🚨", duration: 1600 },
  ],
};

/** The line's newest stretch draws in; its end dot and the chart react after it. */
const TAIL = "chart-tail:{meter}";
const DOT = "chart-dot:{meter}";

/**
 * A chart line's move (chart-juice D1, D2): the newest stretch draws in, longer for a bigger
 * move, then its end dot reacts. Up: the dot pops and glows, sparks fly from a big move, a huge
 * one punches the chart. Down: the dot shudders red, a big drop shakes the chart, a huge one tints
 * it. No sound: the meter blip and the streak tones already speak. News stays dull: a dry draw-in.
 */
const CHART_MOVED: Record<JuiceChartMoveVariant, JuiceEffectStep[]> = {
  "up-small": [
    { effect: "trace", target: TAIL, duration: 320 },
    { effect: "pop", at: 260, target: DOT, scale: 1.25, duration: 260 },
  ],
  "up-medium": [
    { effect: "trace", target: TAIL, duration: 420 },
    { effect: "pop", at: 340, target: DOT, scale: 1.4, duration: 320 },
    { effect: "glow", at: 340, target: DOT, color: "success", times: 1, duration: 600 },
  ],
  "up-big": [
    { effect: "trace", target: TAIL, duration: 520 },
    { effect: "pop", at: 420, target: DOT, scale: 1.5, duration: 380 },
    { effect: "glow", at: 420, target: DOT, color: "success", times: 2, duration: 600 },
    {
      effect: "particles",
      at: 420,
      from: DOT,
      glyphs: "✨⭐",
      count: 6,
      reach: 0.12,
      duration: 700,
    },
  ],
  "up-huge": [
    { effect: "trace", target: TAIL, duration: 600 },
    { effect: "zoom", at: 480, target: "chart", scale: 1.03, duration: 520 },
    { effect: "pop", at: 480, target: DOT, scale: 1.5, duration: 420 },
    { effect: "glow", at: 480, target: DOT, color: "success", times: 3, duration: 600 },
    {
      effect: "particles",
      at: 480,
      from: DOT,
      glyphs: "🚀✨⭐",
      count: 10,
      reach: 0.18,
      duration: 760,
      glow: "success",
    },
  ],
  "down-small": [
    { effect: "trace", target: TAIL, duration: 320 },
    { effect: "shake", at: 260, target: DOT, strength: 2, duration: 280 },
  ],
  "down-medium": [
    { effect: "trace", target: TAIL, duration: 420 },
    { effect: "shake", at: 340, target: DOT, strength: 3, duration: 320 },
    { effect: "glow", at: 340, target: DOT, color: "destructive", times: 1, duration: 600 },
  ],
  "down-big": [
    { effect: "trace", target: TAIL, duration: 520 },
    { effect: "shake", at: 420, target: "chart", strength: 3, duration: 360 },
    { effect: "glow", at: 420, target: DOT, color: "destructive", times: 2, duration: 600 },
  ],
  "down-huge": [
    { effect: "trace", target: TAIL, duration: 600 },
    { effect: "shake", at: 480, target: "chart", strength: 5, duration: 360 },
    { effect: "tint", at: 480, target: "chart", color: "destructive", opacity: 0.2, duration: 900 },
    { effect: "glow", at: 480, target: DOT, color: "destructive", times: 3, duration: 600 },
    {
      effect: "particles",
      at: 480,
      from: DOT,
      glyphs: "📉💸",
      count: 6,
      reach: 0.12,
      duration: 700,
    },
  ],
  dull: [{ effect: "trace", target: TAIL, duration: 320, easing: "linear" }],
};

/** The streak chip on a counter (`streak:<meter>`): it only exists from the first level. */
const CHIP = "streak:{meter}";

/** One step of a streak: the meter blip's sound one tone higher per step (rate). */
const streakTone = (rate: number): JuiceEffectStep => ({
  effect: "sound",
  at: 500,
  id: "meter-gain",
  volume: 0.45,
  rate,
});

/**
 * A streak of ups (chart-juice D3): each step plays the gain blip a step higher and pops the
 * chip; a level (3, 5, 8+) adds a floater and more: sparks at 5, a buzz and a bigger burst at 8+.
 * The tone follows the chart's draw-in and the big-move blip (250 ms), so it never masks them.
 */
const STREAK_STEP: Record<JuiceStreakStep, JuiceEffectStep[]> = {
  "3": [
    streakTone(1),
    { effect: "pop", at: 500, target: CHIP, scale: 1.3, duration: 320 },
    {
      effect: "floater",
      at: 500,
      target: CHIP,
      text: "🔥 {count}x op rij!",
      color: "type-viral",
      rise: 24,
      duration: 1200,
    },
  ],
  "4": [streakTone(1.06), { effect: "pop", at: 500, target: CHIP, scale: 1.3, duration: 320 }],
  "5": [
    streakTone(1.12),
    { effect: "pop", at: 500, target: CHIP, scale: 1.4, duration: 360 },
    { effect: "glow", at: 500, target: CHIP, color: "type-viral", times: 2, duration: 600 },
    { effect: "particles", at: 500, from: CHIP, glyphs: "🔥", count: 6, reach: 0.1, duration: 700 },
    {
      effect: "floater",
      at: 500,
      target: CHIP,
      text: "🔥 {count}x op rij!",
      color: "type-viral",
      rise: 32,
      duration: 1400,
    },
  ],
  "6": [streakTone(1.18), { effect: "pop", at: 500, target: CHIP, scale: 1.35, duration: 320 }],
  "7": [streakTone(1.24), { effect: "pop", at: 500, target: CHIP, scale: 1.35, duration: 320 }],
  "8": [
    streakTone(1.3),
    { effect: "haptic", at: 500, pattern: "12 30 12" },
    { effect: "pop", at: 500, target: CHIP, scale: 1.5, duration: 400 },
    { effect: "glow", at: 500, target: CHIP, color: "type-viral", times: 3, duration: 600 },
    {
      effect: "particles",
      at: 500,
      from: CHIP,
      glyphs: "🔥💥",
      count: 10,
      reach: 0.14,
      duration: 760,
      glow: "type-viral",
    },
    {
      effect: "floater",
      at: 500,
      target: CHIP,
      text: "🔥 {count}x op rij!",
      color: "type-viral",
      rise: 40,
      duration: 1600,
    },
  ],
};

/**
 * The game's recipe table: what every catalog event looks, sounds and feels like. Tune values
 * live in the inspector (`/juice`), then copy the exported JSON into the matching steps here.
 */
export const GAME_JUICE_RECIPES: GameJuiceRecipeBook = {
  // A hold that turns into a drag lifts once (lap-3 D4). Silent, and no glow: the glow stayed
  // behind at the card's old spot as a frame not shaped like the card (juice-tone-down D1).
  "card.pickup": {
    cooldownMs: 300,
    steps: [
      { effect: "haptic", pattern: "6" },
      { effect: "pop", target: "origin", scale: 1.06, duration: 200 },
    ],
  },
  // Silent: the slot's pulse and a tick of vibration say "let go here" (juice-tone-down D2).
  "card.over-feed": {
    cooldownMs: 250,
    steps: [
      { effect: "haptic", pattern: "4" },
      { effect: "pulse", target: "feed:drop", scale: 1.03, times: 1, duration: 240 },
    ],
  },
  // The card drops back into the draft: nothing plays (juice-tone-down D2).
  "card.cancel": { steps: [] },
  // The chart answers "what if": one soft beat on it, not again for a quick re-hold.
  "forecast.shown": {
    cooldownMs: 400,
    steps: [{ effect: "glow", target: "chart", color: "primary", times: 1, duration: 420 }],
  },
  // Plays 2–4 times in a row: barely there, pitched down, no vibration (juice-tone-down D3).
  // Each pop is ~6 % loud (a quarter of ui-tap), so even overlapping ones stay under one tap. The
  // cooldown merges the pops of a batch revealed at once (reduced motion); the fastest pace is
  // 200 ms apart, so it keeps those.
  "comment.arrived": {
    cooldownMs: 60,
    steps: [
      { effect: "sound", id: "comment-pop", volume: 0.2, rate: 0.75, rateJitter: 0.05 },
      { effect: "pop", target: "comment:latest", scale: 1.04, duration: 200 },
    ],
  },
  "card.played": {
    variants: {
      viral: [
        { effect: "sound", id: "card-viral", rateJitter: 0.04 },
        { effect: "haptic", pattern: "14" },
        ...VIRAL_VISUALS,
      ],
      ad: [
        { effect: "sound", id: "card-ad", rateJitter: 0.04 },
        { effect: "haptic", pattern: "8 40 8" },
        ...AD_VISUALS,
      ],
      news: [{ effect: "sound", id: "card-news" }, ...NEWS_VISUALS],
    },
  },
  // The choice already played its sound; the outcome plays the card juice of its kind
  // (event-juice-drop D1): engagement like viral, commercial like ad, journalism like news.
  "event.resolved": {
    variants: { engagement: VIRAL_VISUALS, commercial: AD_VISUALS, journalism: NEWS_VISUALS },
  },
  // A big move's blip follows the card's sound often and is bright, so it plays softer
  // (juice-tone-down D4).
  "meter.changed": {
    variants: {
      gain: [
        { effect: "flash", target: "meter:{meter}", color: "success", opacity: 0.2, duration: 760 },
        METER_FLOATER.gain,
      ],
      loss: [
        {
          effect: "flash",
          target: "meter:{meter}",
          color: "destructive",
          opacity: 0.2,
          duration: 760,
        },
        METER_FLOATER.loss,
      ],
      "gain-big": [
        { effect: "flash", target: "meter:{meter}", color: "success", opacity: 0.2, duration: 760 },
        { ...METER_FLOATER.gain, rise: 40 },
        { effect: "sound", at: 250, id: "meter-gain", volume: 0.6 },
      ],
      "loss-big": [
        {
          effect: "flash",
          target: "meter:{meter}",
          color: "destructive",
          opacity: 0.2,
          duration: 760,
        },
        { ...METER_FLOATER.loss, rise: 40 },
        { effect: "sound", at: 250, id: "meter-loss", volume: 0.6 },
      ],
      dull: [],
    },
  },
  "chart.moved": { variants: CHART_MOVED },
  "streak.step": { variants: STREAK_STEP },
  // Subtle (chart-juice D4): the counter shrugs and a puff of smoke, the blip low and soft.
  "streak.broken": {
    steps: [
      { effect: "shake", at: 500, target: "meter:{meter}", strength: 2, duration: 300 },
      { effect: "badge", at: 500, target: "meter:{meter}", glyph: "💨", duration: 1200 },
      { effect: "sound", at: 500, id: "meter-loss", volume: 0.25, rate: 0.85 },
    ],
  },
  "event.outcome": {
    tag: EVENT_OUTCOME_TAG,
    variants: {
      engagement: [
        { effect: "glow", target: "outcome:users", color: "type-viral", times: 2, duration: 760 },
        { effect: "badge", target: "outcome:users", glyph: "🔥", duration: 1600 },
      ],
      commercial: [
        { effect: "glow", target: "outcome:revenue", color: "type-ad", times: 2, duration: 760 },
        { effect: "badge", target: "outcome:revenue", glyph: "💰", duration: 1600 },
      ],
      journalism: [],
    },
  },
  // Outcome rows pop in together, so the flash and the count-up stay in step (event-juice-drop D2).
  "outcome.row": {
    tag: EVENT_OUTCOME_TAG,
    variants: {
      gain: [
        { effect: "enter", target: "{row}", dy: -12, scale: 0.9, duration: 420 },
        { effect: "flash", target: "{row}", color: "success", opacity: 0.2, duration: 760 },
      ],
      loss: [
        { effect: "enter", target: "{row}", dy: -12, scale: 0.9, duration: 420 },
        { effect: "flash", target: "{row}", color: "destructive", opacity: 0.2, duration: 760 },
      ],
      dull: [
        { effect: "enter", target: "{row}", dy: -8, scale: 1, duration: 200, easing: "linear" },
      ],
    },
  },
  // Entrances mirror the old CSS: viral / ad pop in with the springy card ease, news slides in
  // short and dry, an event post rises like a drawn card.
  "feed.landed": {
    variants: {
      viral: [{ effect: "enter", target: "feed:newest", dy: -12, scale: 0.9, duration: 420 }],
      ad: [{ effect: "enter", target: "feed:newest", dy: -12, scale: 0.9, duration: 420 }],
      news: [
        {
          effect: "enter",
          target: "feed:newest",
          dy: -8,
          scale: 1,
          duration: 200,
          easing: "linear",
        },
        { effect: "badge", target: "feed:newest", glyph: "🛡️", duration: 1200 },
      ],
      event: [{ effect: "enter", target: "feed:newest", dy: 24, scale: 0.92, duration: 420 }],
    },
  },
  // Milestone sounds follow the action's own sound by 250 ms, so they don't mask it (D2).
  "event.appeared": {
    steps: [
      { effect: "sound", at: 250, id: "event-appear" },
      { effect: "haptic", pattern: "10 30 10" },
      {
        effect: "glow",
        at: 150,
        target: "event-dialog",
        color: "primary",
        times: 1,
        duration: 760,
      },
    ],
  },
  "event.choice": { steps: [{ effect: "sound", id: "event-choice" }] },
  "phase.up": { steps: [{ effect: "sound", at: 250, id: "phase-up" }] },
  "run.won": {
    steps: [
      { effect: "sound", at: 250, id: "ipo-win" },
      { effect: "enter", target: "end-screen", dy: 0, scale: 0.92, duration: 760 },
      // The bell rings: the ending's icon pops and glows gold.
      { effect: "pop", at: 250, target: "ending:icon", scale: 1.3, duration: 420 },
      { effect: "glow", at: 250, target: "ending:icon", color: "type-ad", times: 2, duration: 760 },
      { effect: "haptic", pattern: "30 60 30 60 50" },
      { effect: "flash", target: "screen", color: "type-ad", opacity: 0.25, duration: 760 },
      {
        effect: "particles",
        from: "screen",
        glyphs: "🎉💸🚀✨",
        count: 14,
        duration: 760,
        glow: "type-ad",
      },
    ],
  },
  "run.lost": {
    steps: [
      { effect: "sound", at: 250, id: "game-over" },
      { effect: "enter", target: "end-screen", dy: 0, scale: 0.92, duration: 760 },
      // The server dies: the ending's icon shudders.
      { effect: "shake", at: 250, target: "ending:icon", strength: 6, duration: 360 },
      { effect: "haptic", pattern: "60 40 60" },
      { effect: "flash", target: "screen", color: "destructive", opacity: 0.25, duration: 760 },
    ],
  },
  // Follows the action's own sound by 250 ms (juice-migrate D2).
  "goal.reached": {
    steps: [
      { effect: "sound", at: 250, id: "goal-reached" },
      { effect: "haptic", at: 250, pattern: "20 40 20" },
      { effect: "glow", target: "meter:{meter}", color: "success", times: 2, duration: 760 },
      {
        effect: "particles",
        from: "meter:{meter}",
        glyphs: "🎯⭐✨",
        count: 10,
        duration: 760,
        glow: "success",
      },
      // Over the chart, not the tile: the tile's new amount and its floater stay readable.
      {
        effect: "callout",
        at: 250,
        target: "chart",
        text: "Doel gehaald!",
        color: "success",
        duration: 1600,
      },
    ],
  },
  "money.danger": {
    steps: [
      { effect: "sound", at: 250, id: "money-danger" },
      { effect: "haptic", at: 250, pattern: "40" },
      { effect: "shake", target: "meter:revenue", strength: 3, duration: 360 },
      { effect: "glow", target: "meter:revenue", color: "destructive", times: 3, duration: 900 },
      { effect: "badge", target: "meter:revenue", glyph: "⚠️", duration: 1600 },
    ],
  },
  "scandal.warning": { tag: SCANDAL_WARNING_TAG, variants: SCANDAL_WARNING },
  // Replaces `event.appeared` when the opened event is a scandal (lap-3 D2): the loudest bust.
  "scandal.hit": {
    steps: [
      { effect: "sound", at: 250, id: "scandal-hit" },
      { effect: "haptic", at: 250, pattern: "60 30 60" },
      { effect: "shake", target: "board", strength: 8, duration: 360 },
      { effect: "tint", target: "screen", color: "destructive", opacity: 0.25, duration: 760 },
      { effect: "particles", from: "screen", glyphs: "🚨😡📰", count: 12, duration: 760 },
      {
        effect: "glow",
        at: 150,
        target: "event-dialog",
        color: "destructive",
        times: 2,
        duration: 900,
      },
    ],
  },
  // Every button and link in the app (delegated, game-juice D15): a tap and a tiny squash. The
  // tap sounds on every press, so it sits under the board's sounds (juice-tone-down D4).
  "ui.press": {
    cooldownMs: 60,
    steps: [
      { effect: "sound", id: "ui-tap", volume: 0.7 },
      { effect: "haptic", pattern: "6" },
      { effect: "pop", target: "origin", scale: 1.04, duration: 160 },
    ],
  },
  // Navigation: the new page settles in (the tap already sounded on the link).
  "page.opened": {
    steps: [{ effect: "enter", target: "page", dy: 8, scale: 1, duration: 240 }],
  },
  // The phase's step dot lights up, then the goal box. Phase 1 starts a run, so it also gets
  // the fanfare, softly; later phases heard it with the action that reached them.
  "phase.intro": {
    tag: PHASE_INTRO_TAG,
    steps: [
      { effect: "pop", at: 300, target: "phase:step", scale: 1.4, duration: 420 },
      {
        effect: "particles",
        at: 300,
        from: "phase:step",
        glyphs: "✨🚀",
        count: 8,
        duration: 760,
        glow: "primary",
      },
      { effect: "glow", at: 550, target: "phase:goal", color: "primary", times: 1, duration: 760 },
    ],
    variants: {
      "1": [{ effect: "sound", at: 300, id: "phase-up", volume: 0.5 }],
      "2": [],
      "3": [],
      "4": [],
    },
  },
  "share.done": {
    variants: {
      shared: [
        { effect: "sound", id: "goal-reached", volume: 0.5, rate: 1.15 },
        { effect: "haptic", pattern: "10 30 10" },
        { effect: "pop", target: "origin", scale: 1.1, duration: 300 },
        { effect: "particles", from: "origin", glyphs: "📣💬✨", count: 10, duration: 760 },
      ],
      failed: [{ effect: "shake", target: "origin", strength: 4, duration: 360 }],
    },
  },
};
