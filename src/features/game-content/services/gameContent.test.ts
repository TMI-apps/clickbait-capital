import { describe, expect, it } from "vitest";
import { glossaryTermsIn, stripGlossaryMarkup } from "@/shared/utils/glossaryMarkup";
import {
  createGame,
  type CardType,
  type EventOptionKind,
  type PhaseId,
} from "@/features/game-engine/api";
import {
  AD_HEAVY_SHARE,
  buildEndReport,
  END_REPORT_TEMPLATE,
  fillTemplate,
  GAME_OVER_TEXTS,
  NO_INCOME_BELOW_AD_SHARE,
  SCANDALS_FROM_EVENTS,
  selectGameOverText,
} from "@/features/game-content/services/endings";
import { EVENT_CARDS } from "@/features/game-content/services/eventCards";
import {
  GAME_CONTENT,
  getContentCard,
  getContentEvent,
} from "@/features/game-content/services/gameContent";
import { PHASE_INTROS } from "@/features/game-content/services/phases";
import { GLOSSARY, UI_COPY } from "@/features/game-content/services/uiCopy";

const TYPES: CardType[] = ["viral", "ad", "news"];
const PHASES: PhaseId[] = [1, 2, 3, 4];

describe("GAME_CONTENT integrity", () => {
  it("should hold at least 15 cards per type when the deck is assembled", () => {
    for (const type of TYPES) {
      expect(GAME_CONTENT.cards.filter((card) => card.type === type).length).toBeGreaterThanOrEqual(
        15
      );
    }
  });

  it("should offer at least 8 cards per type in every phase when drafts are drawn", () => {
    for (const phase of PHASES) {
      for (const type of TYPES) {
        const pool = GAME_CONTENT.cards.filter(
          (card) => card.type === type && (card.phases?.includes(phase) ?? true)
        );
        expect(pool.length, `${type} in phase ${phase}`).toBeGreaterThanOrEqual(8);
      }
    }
  });

  it("should raise both goal lines every phase when the phases are read in order", () => {
    GAME_CONTENT.phases.slice(1).forEach((phase, index) => {
      const previous = GAME_CONTENT.phases[index]!;
      expect(phase.goal.users, `users phase ${phase.id}`).toBeGreaterThan(previous.goal.users);
      expect(phase.goal.money, `money phase ${phase.id}`).toBeGreaterThan(previous.goal.money);
    });
  });

  it("should start below both goal lines of phase 1 when a run begins", () => {
    const { balance, phases } = GAME_CONTENT;
    expect(balance.startUsers).toBeLessThan(phases[0]!.goal.users);
    expect(balance.startMoney).toBeLessThan(phases[0]!.goal.money);
  });

  it("should use unique ids when cards and events are looked up by id", () => {
    const ids = [...GAME_CONTENT.cards, ...GAME_CONTENT.events].map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should follow the design's card profile when effects are read per type", () => {
    for (const card of GAME_CONTENT.cards) {
      const { revenue = 0, users = 0, reputation = 0, toxicity = 0 } = card.effects;
      if (card.type === "viral") {
        expect([users > 0, toxicity > 0, revenue === 0], card.id).toEqual([true, true, true]);
      } else if (card.type === "ad") {
        expect([revenue > 0, users < 0, reputation <= 0], card.id).toEqual([true, true, true]);
      } else {
        expect([reputation > 0, toxicity < 0, users < 0, revenue === 0], card.id).toEqual([
          true,
          true,
          true,
          true,
        ]);
      }
    }
  });

  it("should give every event options A commercial, B engagement, C journalism when it fires", () => {
    const kinds: EventOptionKind[] = ["commercial", "engagement", "journalism"];
    for (const event of GAME_CONTENT.events) {
      expect(event.options.map((option) => [option.id, option.kind])).toEqual([
        ["a", kinds[0]],
        ["b", kinds[1]],
        ["c", kinds[2]],
      ]);
    }
  });

  it("should include the design's election event as a phase-3 scandal", () => {
    const event = GAME_CONTENT.events.find((candidate) => candidate.id === "event-verkiezingen");
    expect(event?.trigger).toEqual({ kind: "scandal", phases: [3] });
  });

  it("should offer at least two scandals in every phase when reputation runs low", () => {
    for (const phase of PHASES) {
      const scandals = GAME_CONTENT.events.filter(
        (event) =>
          event.trigger.kind === "scandal" && (event.trigger.phases?.includes(phase) ?? true)
      );
      expect(scandals.length, `phase ${phase}`).toBeGreaterThanOrEqual(2);
    }
  });

  it("should fill every presentation field when a card or event is shown", () => {
    for (const card of GAME_CONTENT.cards) {
      const content = getContentCard(card.id);
      expect(content?.flavor, card.id).toBeTruthy();
      expect(content?.imageTheme, card.id).toBeTruthy();
      expect(content?.imageAlt, card.id).toBeTruthy();
    }
    for (const event of GAME_CONTENT.events) {
      expect(getContentEvent(event.id)?.imageAlt, event.id).toBeTruthy();
    }
    expect(getContentCard("missing")).toBeNull();
    expect(Object.keys(PHASE_INTROS)).toEqual(["1", "2", "3", "4"]);
  });

  it("should start a playable game when the engine receives the content", () => {
    const state = createGame({ content: GAME_CONTENT, seed: 1 });
    expect(state.status).toBe("playing");
    expect(state.hand).not.toBeNull();
  });
});

describe("buildEndReport", () => {
  it("should derive the damage lines from the run when a game is won", () => {
    const report = buildEndReport({
      turn: 60,
      score: { users: 25_000_000, money: 12_000_000 },
      playedTypes: ["viral", "viral", "ad", "news"],
      firedEventIds: ["event-investeerders", "event-roadshow"],
    });
    const values = Object.fromEntries(report.lines.map((line) => [line.id, line.value]));
    expect(report.intro).toContain("60 beurten");
    expect(report.intro).toContain("25.000.000 gebruikers");
    expect(values.viralPosts).toBe("2");
    expect(values.factchecksRead).toBe("37");
    expect(values.crises).toBe("2");
    expect(values.valuation).toMatch(/245\.000\.000/);
  });

  it("should leave unknown placeholders visible when a value is missing", () => {
    expect(fillTemplate("{a} en {b}", { a: "x" })).toBe("x en {b}");
  });
});

/** Scandal events and milestone events from the deck. */
const SCANDAL_IDS = EVENT_CARDS.filter((event) => event.trigger.kind === "scandal").map(
  (event) => event.id
);
const MILESTONE_IDS = EVENT_CARDS.filter((event) => event.trigger.kind === "milestone").map(
  (event) => event.id
);

/** A lost run: `playedTypes` as a compact string, e.g. "nnnv" = news, news, news, viral. */
const lostRun = (played: string, firedEventIds: string[] = []) => ({
  turn: played.length,
  phaseId: 2 as const,
  score: { users: 50_000, money: -1_000 },
  playedTypes: [...played].map((letter) =>
    letter === "v" ? "viral" : letter === "a" ? "ad" : "news"
  ) as CardType[],
  firedEventIds,
});

/** A run of `total` cards with `count` of one type and news for the rest. */
const withShare = (letter: string, count: number, total: number): string =>
  letter.repeat(count) + "n".repeat(total - count);

describe("selectGameOverText", () => {
  it("should say nobody paid when a run with few ads goes bankrupt", () => {
    const text = selectGameOverText("bankrupt", lostRun("nnvnnvnnna"));
    expect(text.variant).toBe("noIncome");
    expect(text.title).toBe("Bankroet");
  });

  it("should blame the costs when a run with some ads still goes bankrupt", () => {
    expect(selectGameOverText("bankrupt", lostRun("aanvvnnv")).variant).toBe("costsOutgrew");
  });

  it("should blame the missing audience when an ad-heavy run goes bankrupt", () => {
    expect(selectGameOverText("bankrupt", lostRun("aavaaana")).variant).toBe("noAudience");
  });

  it("should blame the scandals when a run goes bankrupt after several scandals", () => {
    const run = lostRun("vvvavn", SCANDAL_IDS.slice(0, SCANDALS_FROM_EVENTS));
    expect(selectGameOverText("bankrupt", run).variant).toBe("scandals");
  });

  it("should not count milestone events as scandals when a run goes bankrupt", () => {
    const run = lostRun("nnvnnvnnna", MILESTONE_IDS);
    expect(MILESTONE_IDS.length).toBeGreaterThanOrEqual(SCANDALS_FROM_EVENTS);
    expect(selectGameOverText("bankrupt", run).variant).toBe("noIncome");
  });

  it("should switch stories exactly at the thresholds when shares and scandals reach them", () => {
    const total = 20;
    const adsAtLimit = Math.round(NO_INCOME_BELOW_AD_SHARE * total);
    expect(
      selectGameOverText("bankrupt", lostRun(withShare("a", adsAtLimit - 1, total))).variant
    ).toBe("noIncome");
    expect(selectGameOverText("bankrupt", lostRun(withShare("a", adsAtLimit, total))).variant).toBe(
      "costsOutgrew"
    );
    const heavy = Math.round(AD_HEAVY_SHARE * total);
    expect(selectGameOverText("bankrupt", lostRun(withShare("a", heavy, total))).variant).toBe(
      "noAudience"
    );
    const almost = SCANDAL_IDS.slice(0, SCANDALS_FROM_EVENTS - 1);
    expect(selectGameOverText("bankrupt", lostRun("nnvnnvnnna", almost)).variant).toBe("noIncome");
  });

  it("should fall back to a variant of the reason when no card was played", () => {
    const text = selectGameOverText("bankrupt", lostRun(""));
    expect(Object.keys(GAME_OVER_TEXTS.bankrupt.variants)).toContain(text.variant);
  });

  it("should give every variant a Dutch headline, body and lesson when the texts are written", () => {
    for (const ending of Object.values(GAME_OVER_TEXTS)) {
      const variants = Object.values(ending.variants);
      expect(variants.length).toBeGreaterThanOrEqual(2);
      for (const story of variants) {
        expect(story.headline.length).toBeGreaterThan(10);
        expect(story.body.length).toBeGreaterThan(40);
        expect(story.lesson.length).toBeGreaterThan(20);
      }
    }
  });
});

/** Every string in a value with its path, e.g. `cards.3.body`. */
function collectStrings(value: unknown, path: string): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((item, i) => collectStrings(item, `${path}.${i}`));
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => collectStrings(item, `${path}.${key}`));
  }
  return [];
}

const ALL_STRINGS = [
  ...collectStrings(GAME_CONTENT.cards, "cards"),
  ...collectStrings(GAME_CONTENT.events, "events"),
  ...collectStrings(GAME_CONTENT.phases, "phases"),
  ...collectStrings(PHASE_INTROS, "phaseIntros"),
  ...collectStrings(GAME_OVER_TEXTS, "gameOver"),
  ...collectStrings(END_REPORT_TEMPLATE, "endReport"),
  ...collectStrings(UI_COPY, "ui"),
];

/** Player-facing strings: not the image hints, which are art direction for the image lap. */
const PLAYER_STRINGS = ALL_STRINGS.filter(([path]) => !/\.imageTheme$/.test(path));

/**
 * Fields rendered through `GlossaryText` (kids-content D3). Everything else is plain text:
 * titles, labels and button texts must not hold a tappable term.
 */
const RICH_FIELDS = [
  /^cards\.\d+\.(body|flavor)$/,
  /^events\.\d+\.body$/,
  /^phaseIntros\.\d\.(body|tip)$/,
  /^gameOver\.\w+\.variants\.\w+\.(body|lesson)$/,
  /^endReport\.intro$/,
  /^ui\.howToPlay\.(intro|phases|score|events|scandal|win)$/,
  /^ui\.tutorial\.\d+$/,
  /^ui\.privacy\.(intro|points\.\d+|clearHint)$/,
  /^ui\.credits\.body$/,
];

/** Real game, platform and brand names the copy must not use (kids-content D6). */
const TRADEMARKS = [
  "fortnite",
  "brawl stars",
  "roblox",
  "minecraft",
  "youtube",
  "tiktok",
  "instagram",
  "snapchat",
  "whatsapp",
  "twitch",
  "discord",
  "facebook",
  "twitter",
  "pubg",
  "call of duty",
  "clash",
  "v-bucks",
  "robux",
  "playstation",
  "xbox",
  "nintendo",
  "super73",
];

describe("glossary", () => {
  it("should explain every marked word when a string marks a hard word", () => {
    const missing = PLAYER_STRINGS.flatMap(([path, text]) =>
      glossaryTermsIn(text)
        .filter((term) => GLOSSARY[term] === undefined)
        .map((term) => `${path}: ${term}`)
    );
    expect(missing).toEqual([]);
  });

  it("should use every glossary entry when the copy is scanned", () => {
    const used = new Set(PLAYER_STRINGS.flatMap(([, text]) => glossaryTermsIn(text)));
    expect(Object.keys(GLOSSARY).filter((term) => !used.has(term))).toEqual([]);
  });

  it("should keep markup out of titles, labels and buttons when a field is plain text", () => {
    const misplaced = PLAYER_STRINGS.filter(
      ([path, text]) => text.includes("[[") && !RICH_FIELDS.some((field) => field.test(path))
    ).map(([path]) => path);
    expect(misplaced).toEqual([]);
  });

  it("should leave no stray brackets when markup is stripped for screen readers", () => {
    const broken = PLAYER_STRINGS.filter(([, text]) => /\[\[|\]\]/.test(stripGlossaryMarkup(text)));
    expect(broken.map(([path]) => path)).toEqual([]);
  });

  it("should give every term a short meaning when a pupil taps it", () => {
    for (const [term, meaning] of Object.entries(GLOSSARY)) {
      expect(term, term).toBe(term.toLowerCase());
      expect(meaning.length, term).toBeGreaterThan(10);
      expect(meaning.length, term).toBeLessThanOrEqual(120);
    }
  });

  it("should not name real games, platforms or brands when copy describes the pupils' world", () => {
    const named = PLAYER_STRINGS.flatMap(([path, text]) =>
      TRADEMARKS.filter((name) => text.toLowerCase().includes(name)).map(
        (name) => `${path}: ${name}`
      )
    );
    expect(named).toEqual([]);
  });
});
