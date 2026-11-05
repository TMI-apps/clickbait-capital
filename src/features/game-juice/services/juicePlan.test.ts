import { describe, expect, it } from "vitest";
import {
  PARTICLE_COUNTS,
  WIN_PARTICLE_COUNT,
  planJuice,
} from "@/features/game-juice/services/juicePlan";
import type { JuiceMeterInput } from "@/features/game-juice/types/juice.types";

const meters = (revenue: number, users: number, reputation: number): JuiceMeterInput[] => [
  { key: "revenue", value: 50, delta: revenue },
  { key: "users", value: 50, delta: users },
  { key: "reputation", value: 50, delta: reputation },
];

describe("planJuice", () => {
  it("should shake, throw emoji and put flames on Gebruikers when a viral card is played", () => {
    const plan = planJuice("viral", meters(0, 12, -5));
    expect(plan.shake).toBe(true);
    expect(plan.particles).toEqual({ kind: "emoji", count: PARTICLE_COUNTS.viral, target: null });
    expect(plan.accents).toEqual({ users: "flames" });
    expect(plan.flashes).toEqual({ users: "gain", reputation: "loss" });
  });

  it("should fly coins to Inkomsten with a gold glow when an ad card is played", () => {
    const plan = planJuice("ad", meters(10, 0, -3));
    expect(plan.shake).toBe(false);
    expect(plan.particles).toEqual({ kind: "coin", count: PARTICLE_COUNTS.ad, target: "revenue" });
    expect(plan.accents).toEqual({ revenue: "gold" });
  });

  it("should only show a shield at Reputatie with no particles, flash or count-up when a news card is played", () => {
    const plan = planJuice("news", meters(-4, -2, 8));
    expect(plan.shake).toBe(false);
    expect(plan.particles.count).toBe(0);
    expect(plan.accents).toEqual({ reputation: "shield" });
    expect(plan.flashes).toEqual({});
    expect(plan.countUp).toBe(false);
  });

  it("should only flash the meters that moved when an event is answered", () => {
    const plan = planJuice("event", meters(0, -10, 0));
    expect(plan.particles.count).toBe(0);
    expect(plan.accents).toEqual({});
    expect(plan.flashes).toEqual({ users: "loss" });
  });

  it("should keep the per-action budgets at 12 and the win at 14 when particles are capped", () => {
    expect(Math.max(...Object.values(PARTICLE_COUNTS))).toBeLessThanOrEqual(12);
    expect(WIN_PARTICLE_COUNT).toBe(14);
  });
});
