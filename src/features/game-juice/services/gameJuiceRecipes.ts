import type { JuiceEffectStep } from "@/features/juice-effects/api";
import type {
  GameJuiceCatalog,
  GameJuiceEventName,
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

/**
 * The game's recipe table: what every catalog event looks, sounds and feels like. Tune values
 * live in the inspector (`/juice`), then copy the exported JSON into the matching steps here.
 */
export const GAME_JUICE_RECIPES: GameJuiceRecipeBook = {
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
  "meter.changed": {
    variants: {
      gain: [
        { effect: "flash", target: "meter:{meter}", color: "success", opacity: 0.2, duration: 760 },
      ],
      loss: [
        {
          effect: "flash",
          target: "meter:{meter}",
          color: "destructive",
          opacity: 0.2,
          duration: 760,
        },
      ],
      "gain-big": [
        { effect: "flash", target: "meter:{meter}", color: "success", opacity: 0.2, duration: 760 },
        { effect: "sound", at: 250, id: "meter-gain" },
      ],
      "loss-big": [
        {
          effect: "flash",
          target: "meter:{meter}",
          color: "destructive",
          opacity: 0.2,
          duration: 760,
        },
        { effect: "sound", at: 250, id: "meter-loss" },
      ],
      dull: [],
    },
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
    ],
  },
  "event.choice": { steps: [{ effect: "sound", id: "event-choice" }] },
  "phase.up": { steps: [{ effect: "sound", at: 250, id: "phase-up" }] },
  "run.won": {
    steps: [
      { effect: "sound", at: 250, id: "ipo-win" },
      { effect: "enter", target: "end-screen", dy: 0, scale: 0.92, duration: 760 },
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
      { effect: "haptic", pattern: "60 40 60" },
      { effect: "flash", target: "screen", color: "destructive", opacity: 0.25, duration: 760 },
    ],
  },
  "ui.press": {
    cooldownMs: 60,
    steps: [
      { effect: "sound", id: "ui-tap" },
      { effect: "haptic", pattern: "6" },
    ],
  },
};
