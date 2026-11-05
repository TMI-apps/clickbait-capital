import { describe, expect, it } from "vitest";
import {
  createGame,
  type CardType,
  type EventOptionKind,
  type PhaseId,
} from "@/features/game-engine/api";
import {
  buildEndReport,
  CRISES_FROM_EVENTS,
  fillTemplate,
  GAME_OVER_TEXTS,
  NO_INCOME_BELOW_AD_SHARE,
  selectGameOverText,
  TOXIC_FROM_VIRAL_SHARE,
} from "@/features/game-content/services/endings";
import { EVENT_CARDS } from "@/features/game-content/services/eventCards";
import {
  GAME_CONTENT,
  getContentCard,
  getContentEvent,
} from "@/features/game-content/services/gameContent";
import { PHASE_INTROS } from "@/features/game-content/services/phases";

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

  it("should size every phase market above its users goal when the goal is read off the meter", () => {
    for (const phase of GAME_CONTENT.phases) {
      for (const condition of phase.goal.conditions) {
        if (condition.kind === "stat" && condition.stat === "users") {
          expect(phase.usersAtFullMeter).toBeGreaterThan(condition.atLeast);
        }
      }
    }
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

  it("should include the design's election event when Toxicity runs high in phase 3", () => {
    const event = GAME_CONTENT.events.find((candidate) => candidate.id === "event-verkiezingen");
    expect(event?.trigger).toEqual({ kind: "toxicity", threshold: 60, phases: [3] });
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
      stats: { users: 25_000_000, revenue: 12_000_000 },
      playedTypes: ["viral", "viral", "ad", "news"],
      firedEventIds: ["event-investeerders", "event-roadshow"],
    });
    const values = Object.fromEntries(report.lines.map((line) => [line.id, line.value]));
    expect(report.intro).toContain("60 beurten");
    expect(report.intro).toContain("25.000.000 gebruikers");
    expect(values.viralPosts).toBe("2");
    expect(values.factchecksRead).toBe("37");
    expect(values.crises).toBe("2");
    expect(values.valuation).toMatch(/480\.000\.000/);
  });

  it("should leave unknown placeholders visible when a value is missing", () => {
    expect(fillTemplate("{a} en {b}", { a: "x" })).toBe("x en {b}");
  });
});

/** Crisis events (toxicity triggers) and milestone events from the deck. */
const CRISIS_IDS = EVENT_CARDS.filter((event) => event.trigger.kind === "toxicity").map(
  (event) => event.id
);
const MILESTONE_IDS = EVENT_CARDS.filter((event) => event.trigger.kind === "milestone").map(
  (event) => event.id
);

/** A lost run: `playedTypes` as a compact string, e.g. "nnnv" = news, news, news, viral. */
const lostRun = (played: string, firedEventIds: string[] = []) => ({
  turn: played.length,
  phaseId: 2 as const,
  stats: { users: 50_000, revenue: 10_000 },
  playedTypes: [...played].map((letter) =>
    letter === "v" ? "viral" : letter === "a" ? "ad" : "news"
  ) as CardType[],
  firedEventIds,
});

/** A run of `total` cards with `count` of one type and news for the rest. */
const withShare = (letter: string, count: number, total: number): string =>
  letter.repeat(count) + "n".repeat(total - count);

describe("selectGameOverText", () => {
  it("should tell a dull-feed story when a news-only run ends in Verlaten Platform", () => {
    const text = selectGameOverText("abandoned", lostRun("nnnnnnnn"));
    expect(text.variant).toBe("dullFeed");
    expect(text.title).toBe("Verlaten Platform");
    expect(text.body).not.toMatch(/reclame/i);
  });

  it("should blame the ads when an ad-heavy run ends in Verlaten Platform", () => {
    expect(selectGameOverText("abandoned", lostRun("aaavaan")).variant).toBe("adOverload");
  });

  it("should tell a burnout story when a viral-heavy run ends in Verlaten Platform", () => {
    expect(selectGameOverText("abandoned", lostRun("vvvanvv")).variant).toBe("viralBurnout");
  });

  it("should say nobody paid when a run with few ads goes bankrupt", () => {
    expect(selectGameOverText("bankrupt", lostRun("nnvnnvnnna")).variant).toBe("noIncome");
  });

  it("should blame the costs when a run with plenty of ads still goes bankrupt", () => {
    expect(selectGameOverText("bankrupt", lostRun("aanvanav")).variant).toBe("costsOutgrew");
  });

  it("should blame the outrage when a viral-heavy run is banned", () => {
    expect(selectGameOverText("banned", lostRun("vvvvavn", CRISIS_IDS.slice(0, 3))).variant).toBe(
      "viralToxicity"
    );
  });

  it("should blame the piled-up crises when a run is banned after several crises without a viral majority", () => {
    expect(selectGameOverText("banned", lostRun("vavanvan", CRISIS_IDS.slice(0, 3))).variant).toBe(
      "crises"
    );
  });

  it("should not count milestone events as crises when a run is banned", () => {
    const run = lostRun("vavaavna", MILESTONE_IDS);
    expect(MILESTONE_IDS.length).toBeGreaterThanOrEqual(CRISES_FROM_EVENTS);
    expect(selectGameOverText("banned", run).variant).toBe("scamAds");
  });

  it("should blame the scam ads when an ad-heavy run is banned after few events", () => {
    expect(selectGameOverText("banned", lostRun("aavaavna", CRISIS_IDS.slice(0, 1))).variant).toBe(
      "scamAds"
    );
  });

  it("should switch stories exactly at the thresholds when shares and crises reach them", () => {
    const total = 20;
    const adsAtLimit = Math.round(NO_INCOME_BELOW_AD_SHARE * total);
    expect(
      selectGameOverText("bankrupt", lostRun(withShare("a", adsAtLimit - 1, total))).variant
    ).toBe("noIncome");
    expect(selectGameOverText("bankrupt", lostRun(withShare("a", adsAtLimit, total))).variant).toBe(
      "costsOutgrew"
    );
    const viralAtLimit = Math.round(TOXIC_FROM_VIRAL_SHARE * total);
    expect(selectGameOverText("banned", lostRun(withShare("v", viralAtLimit, total))).variant).toBe(
      "viralToxicity"
    );
    const almostCrises = CRISIS_IDS.slice(0, CRISES_FROM_EVENTS - 1);
    const crises = CRISIS_IDS.slice(0, CRISES_FROM_EVENTS);
    expect(selectGameOverText("banned", lostRun("vaaannnn", almostCrises)).variant).toBe("scamAds");
    expect(selectGameOverText("banned", lostRun("vaaannnn", crises)).variant).toBe("crises");
  });

  it("should fall back to a variant of the reason when no card was played", () => {
    for (const reason of ["bankrupt", "abandoned", "banned"] as const) {
      const text = selectGameOverText(reason, lostRun(""));
      expect(Object.keys(GAME_OVER_TEXTS[reason].variants)).toContain(text.variant);
    }
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
