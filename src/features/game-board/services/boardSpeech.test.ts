import { describe, expect, it } from "vitest";
import {
  describeMeterChange,
  describeTurn,
  meterValueText,
  type TurnSnapshot,
} from "@/features/game-board/services/boardSpeech";
import type { MeterView } from "@/features/game-board/types/gameBoard.types";

/** Meters in board order: [revenue, users, reputation] values and their deltas. */
const meters = ([revenue, users, reputation]: number[], deltas = [0, 0, 0]): MeterView[] =>
  (
    [
      ["revenue", revenue],
      ["users", users],
      ["reputation", reputation],
    ] as const
  ).map(([key, value], index) => ({
    key,
    value,
    delta: deltas[index],
    full: value >= 100,
    danger: value <= 20,
    valueText: "",
  }));

const snapshot = (overrides: Partial<TurnSnapshot> = {}): TurnSnapshot => ({
  latest: { type: "ad", title: "Pizzeria om de hoek", body: "Korting!" },
  meters: meters([58, 45, 50], [8, -5, 0]),
  goalStats: ["Bereik: 51.750 / 100.000 (Gebruikers ≥ 87)"],
  streak: null,
  drought: false,
  ...overrides,
});

describe("boardSpeech", () => {
  it("should name the post, each changed meter with its new value and the goal line when a card is played", () => {
    expect(describeTurn(snapshot(), null)).toBe(
      "Geplaatst: Pizzeria om de hoek. Inkomsten omhoog 8, nu 58. Gebruikers omlaag 5, nu 45. Bereik: 51.750 / 100.000 (Gebruikers ≥ 87)."
    );
  });

  it("should name the chosen policy when an event was answered", () => {
    const text = describeTurn(
      snapshot({
        latest: { type: "event", title: "Je eerste shitstorm", body: "Haal het weg." },
        meters: meters([50, 40, 56], [0, -5, 6]),
      }),
      null
    );
    expect(text).toMatch(
      /^Je eerste shitstorm. Gekozen: Haal het weg\. Gebruikers omlaag 5, nu 40\. Reputatie omhoog 6, nu 56\./
    );
  });

  it("should say the meters stayed the same when nothing changed", () => {
    expect(describeTurn(snapshot({ meters: meters([50, 50, 50]), goalStats: [] }), null)).toBe(
      "Geplaatst: Pizzeria om de hoek. Meters onveranderd."
    );
  });

  it("should warn about every meter in danger and the goal streak when they apply", () => {
    const text = describeTurn(
      snapshot({ meters: meters([15, 45, 50], [-3, 0, 0]), streak: { current: 1, required: 2 } }),
      null
    );
    expect(text).toContain("Doel gehaald: 1 van 2 beurten op rij.");
    expect(text).toMatch(/Let op: Inkomsten gevaarlijk laag\.$/);
  });

  it("should announce the journalism drought only on the turn it starts", () => {
    const started = describeTurn(snapshot({ drought: true }), snapshot());
    expect(started).toContain("Geen nieuws meer: Al vijf beurten geen nieuws.");
    expect(describeTurn(snapshot({ drought: true }), snapshot({ drought: true }))).not.toContain(
      "droogte"
    );
  });

  it("should return no text when nothing has been played yet", () => {
    expect(describeTurn(snapshot({ latest: null }), null)).toBe("");
  });

  it("should phrase a meter's value with its change and state when read on the board", () => {
    expect(describeMeterChange(-5)).toBe("omlaag 5");
    expect(meterValueText(meters([100, 60, 15], [4, 0, -5])[0])).toBe(
      "100 van 100, omhoog 4, maximum bereikt"
    );
    expect(meterValueText(meters([100, 60, 15], [4, 0, -5])[2])).toBe(
      "15 van 100, omlaag 5, gevaarlijk laag"
    );
    expect(meterValueText(meters([100, 60, 15])[1])).toBe("60 van 100");
  });
});
