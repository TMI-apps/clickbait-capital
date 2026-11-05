import { describe, expect, it } from "vitest";
import {
  createGame,
  type CardType,
  type EventOptionKind,
  type PhaseId,
} from "@/features/game-engine/api";
import { buildEndReport, fillTemplate } from "@/features/game-content/services/endings";
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
