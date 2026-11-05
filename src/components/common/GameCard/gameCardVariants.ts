import { cva } from "class-variance-authority";
import {
  ArrowDown,
  ArrowUp,
  Coins,
  Crown,
  Gem,
  Megaphone,
  Minus,
  Newspaper,
  ShieldCheck,
  Siren,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { GameCardMeter, GameCardRarity, GameCardType } from "./gameCard.types";

/**
 * Visual vocabulary of the GameCard: every colour ships with an icon and a Dutch text
 * label so colour is never the only signal (WCAG 1.4.1). Tokens: DOC_THEMING.md § Game card.
 */
export const GAME_CARD_TYPES: Record<
  GameCardType,
  {
    label: string;
    /** Visible label on compact cards; `label` stays the accessible name. */
    shortLabel: string;
    icon: LucideIcon;
    chip: string;
    frame: string;
    fallback: string;
    /** Draw the photo in a ThumbnailFrame (clickbait look); off for news, which stays plain. */
    thumbnail: boolean;
  }
> = {
  viral: {
    label: "Viraal",
    shortLabel: "Viraal",
    icon: Zap,
    chip: "bg-type-viral text-type-viral-foreground",
    frame: "border-type-viral",
    fallback: "bg-type-viral/20 text-type-viral",
    thumbnail: true,
  },
  ad: {
    label: "Advertentie",
    shortLabel: "Reclame",
    icon: Megaphone,
    chip: "bg-type-ad text-type-ad-foreground",
    frame: "border-type-ad",
    fallback: "bg-type-ad/20 text-type-ad",
    thumbnail: true,
  },
  news: {
    label: "Nieuws",
    shortLabel: "Nieuws",
    icon: Newspaper,
    chip: "bg-type-news text-type-news-foreground",
    frame: "border-type-news",
    fallback: "bg-type-news/20 text-type-news",
    thumbnail: false,
  },
  event: {
    label: "Gebeurtenis",
    shortLabel: "Event",
    icon: Siren,
    chip: "bg-type-event text-type-event-foreground",
    frame: "border-type-event",
    fallback: "bg-type-event/20 text-type-event",
    thumbnail: true,
  },
};

export const GAME_CARD_METERS: Record<
  GameCardMeter,
  { label: string; icon: LucideIcon; text: string }
> = {
  revenue: { label: "Inkomsten", icon: Coins, text: "text-meter-revenue" },
  users: { label: "Gebruikers", icon: TrendingUp, text: "text-meter-users" },
  reputation: { label: "Reputatie", icon: ShieldCheck, text: "text-meter-reputation" },
};

export const GAME_CARD_RARITIES: Record<
  Exclude<GameCardRarity, "common">,
  { label: string; icon: LucideIcon }
> = {
  rare: { label: "Zeldzaam", icon: Gem },
  legendary: { label: "Legendarisch", icon: Crown },
};

/** Direction of a meter change: arrow icon, sign, colour and spoken word. */
export const deltaDirection = (
  delta: number
): { icon: LucideIcon; sign: string; text: string; spoken: string } => {
  if (delta > 0) return { icon: ArrowUp, sign: "+", text: "text-success", spoken: "omhoog" };
  if (delta < 0) return { icon: ArrowDown, sign: "−", text: "text-destructive", spoken: "omlaag" };
  return { icon: Minus, sign: "±", text: "text-muted-foreground", spoken: "gelijk" };
};

/**
 * Card frame. The juice is asymmetric on purpose (DOC_GAME_DESIGN.md § 5): viral and ad
 * cards lift and glow on hover, news stays flat and still.
 */
export const gameCardVariants = cva(
  [
    "group/game-card relative flex w-full min-h-11 flex-col overflow-hidden text-left",
    "rounded-game-card game-card-frame bg-card text-card-foreground elevation-md",
    "transition-[transform,box-shadow,opacity] duration-(--duration-card-play) ease-(--ease-card)",
    "outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-4 focus-visible:outline-foreground",
  ],
  {
    variants: {
      type: {
        viral: GAME_CARD_TYPES.viral.frame,
        ad: GAME_CARD_TYPES.ad.frame,
        news: GAME_CARD_TYPES.news.frame,
        event: GAME_CARD_TYPES.event.frame,
      },
      size: {
        default: "min-w-44",
        compact: "min-w-0",
      },
      rarity: {
        common: "",
        rare: "elevation-lg",
        legendary: "shadow-(--elevation-brand)",
      },
      interactive: {
        true: "cursor-pointer",
        false: "",
      },
      selected: {
        true: "-translate-y-2 ring-4 ring-primary ring-offset-2 ring-offset-background",
        false: "",
      },
      disabled: {
        true: "cursor-not-allowed opacity-55 grayscale",
        false: "",
      },
      animation: {
        none: "",
        draw: "animate-card-draw",
        play: "animate-card-play",
      },
    },
    compoundVariants: [
      {
        interactive: true,
        disabled: false,
        type: "viral",
        class: "hover:-translate-y-1 hover:elevation-xl",
      },
      {
        interactive: true,
        disabled: false,
        type: "ad",
        class: "hover:-translate-y-1 hover:elevation-xl",
      },
      { interactive: true, disabled: false, type: "event", class: "hover:-translate-y-0.5" },
    ],
    defaultVariants: {
      size: "default",
      rarity: "common",
      interactive: false,
      selected: false,
      disabled: false,
      animation: "none",
    },
  }
);
