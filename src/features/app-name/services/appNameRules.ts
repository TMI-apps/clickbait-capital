import { REAL_BRAND_NAMES } from "@/features/game-content/api";
import { APP_NAME_SUGGESTIONS } from "@/features/app-name/services/appNameSuggestions";

import { APP_NAME_MAX_LENGTH, APP_NAME_MIN_LENGTH } from "@/features/app-name/types/appName.types";
import type { AppNameCheck } from "@/features/app-name/types/appName.types";

/** Letters (accents included), digits, spaces, `-` and `_`. */
const ALLOWED = /^[\p{L}\p{N} _-]+$/u;

/** Letter swaps players use to slip a word past a filter (AN3). */
const LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "!": "i",
  "3": "e",
  "4": "a",
  "@": "a",
  "5": "s",
  $: "s",
  "7": "t",
};

/**
 * Words refused anywhere in a name (AN3): unambiguous, so a substring match is safe. Dutch and
 * English, the ones pupils of about 11 try first. Kept short on purpose: a basic filter, not a
 * moderation system.
 */
const BLOCKED_ANYWHERE: readonly string[] = [
  "kanker",
  "tyfus",
  "klootzak",
  "hoer",
  "slet",
  "neuk",
  "mongool",
  "nazi",
  "hitler",
  "neger",
  "nigg",
  "fuck",
  "shit",
  "bitch",
  "cunt",
  "pussy",
  "slut",
  "whore",
  "porn",
  "penis",
  "vagina",
];

/**
 * Words refused only as a whole word (split on spaces, `-` and `_`, or the whole name): as
 * substrings they sit inside ordinary words ("catering", "grape", "massa"). A glued-on
 * compound ("Scrollkut") passes; accepted for a basic filter.
 */
const BLOCKED_WORDS: readonly string[] = [
  "kut",
  "lul",
  "pik",
  "tering",
  "kkr",
  "homo",
  "sex",
  "seks",
  "dick",
  "cock",
  "fag",
  "ass",
  "rape",
];

/**
 * Real platforms the deck's brand list (game-content `REAL_BRAND_NAMES`) does not cover, because
 * they are too short or too common to scan the copy for. Whole words only (AN4).
 */
const BLOCKED_PLATFORM_WORDS: readonly string[] = [
  "meta",
  "threads",
  "reddit",
  "kick",
  "pinterest",
  "linkedin",
  "telegram",
  "bereal",
  "x",
];

/** Lowercase, letter swaps undone, every character that is not a letter a–z removed. */
const squash = (text: string): string =>
  [...text.toLowerCase().normalize("NFD")]
    .map((char) => LEET[char] ?? char)
    .join("")
    .replace(/[^a-z]/g, "");

/** The name's words, squashed, plus the whole name squashed (so "k u t" is one word "kut"). */
const wordsOf = (name: string): string[] => {
  const words = name
    .split(/[\s_-]+/)
    .map(squash)
    .filter(Boolean);
  return [...words, squash(name)];
};

const brandsSquashed = REAL_BRAND_NAMES.map(squash);

/** The name contains a swear word or a real platform or brand name (AN3, AN4). */
export const isBlockedAppName = (name: string): boolean => {
  const whole = squash(name);
  if (BLOCKED_ANYWHERE.some((word) => whole.includes(word))) return true;
  if (brandsSquashed.some((brand) => whole.includes(brand))) return true;
  const words = wordsOf(name);
  return [...BLOCKED_WORDS, ...BLOCKED_PLATFORM_WORDS].some((word) => words.includes(word));
};

/** Trims and collapses inner whitespace, so "  Pixel   plein " is stored as "Pixel plein". */
export const normalizeAppName = (raw: string): string => raw.trim().replace(/\s+/g, " ");

/**
 * Checks a typed app name (app-name lap): 2–16 characters of letters, digits, spaces, `-` or
 * `_`, no swear word and no real platform or brand. Returns the cleaned name to store.
 */
export const checkAppName = (raw: string): AppNameCheck => {
  const name = normalizeAppName(raw);
  const length = [...name].length;
  if (length === 0) return { ok: false, error: "empty" };
  if (length < APP_NAME_MIN_LENGTH) return { ok: false, error: "short" };
  if (length > APP_NAME_MAX_LENGTH) return { ok: false, error: "long" };
  if (!ALLOWED.test(name)) return { ok: false, error: "chars" };
  if (isBlockedAppName(name)) return { ok: false, error: "blocked" };
  return { ok: true, name };
};

/**
 * A suggested name from the invented list, different from `current` (the 🎲 button). `random`
 * returns a number in [0, 1); tests pass a fixed one.
 */
export const suggestAppName = (current?: string, random: () => number = Math.random): string => {
  const pool = APP_NAME_SUGGESTIONS.filter((name) => name !== current);
  return pool[Math.floor(random() * pool.length)] ?? APP_NAME_SUGGESTIONS[0];
};
