import { describe, expect, it } from "vitest";
import {
  describeMeterChange,
  describeTurn,
  type TurnSnapshot,
} from "@/features/game-board/services/boardSpeech";
import type { MeterView } from "@/features/game-board/types/gameBoard.types";

/** The two score tiles in board order (users, money) with their amount and change texts. */
const tiles = (users: [string, string], money: [string, string], danger = false): MeterView[] => [
  {
    key: "users",
    value: 50,
    history: [0.5, 0.8],
    amount: 0,
    amountText: users[0],
    delta: users[1] === "" ? 0 : users[1].startsWith("−") ? -1 : 1,
    deltaText: users[1],
    goalText: "Doel: 100.000",
    goalAmountText: "100.000",
    full: false,
    danger: false,
    streak: 0,
    valueText: "",
  },
  {
    key: "revenue",
    value: 10,
    history: [0.5, 0.8],
    amount: 0,
    amountText: money[0],
    delta: money[1] === "" ? 0 : money[1].startsWith("−") ? -1 : 1,
    deltaText: money[1],
    goalText: "Doel: € 150.000",
    goalAmountText: "€ 150.000",
    full: false,
    danger,
    streak: 0,
    valueText: "",
  },
];

const snapshot = (overrides: Partial<TurnSnapshot> = {}): TurnSnapshot => ({
  latest: { type: "ad", title: "Pizzeria om de hoek", body: "Korting!" },
  meters: tiles(["45.500", "−4.500"], ["€ 114.000", "+€ 14.000"]),
  goalStats: ["Gebruikers: 45.500 / 100.000", "Geld: € 114.000 / € 150.000"],
  scandal: null,
  ...overrides,
});

describe("boardSpeech", () => {
  it("should name the post, each changed number with its new amount and the goal lines when a card is played", () => {
    expect(describeTurn(snapshot())).toBe(
      "Geplaatst: Pizzeria om de hoek. Gebruikers −4.500, nu 45.500. Geld +€ 14.000, nu € 114.000. Gebruikers: 45.500 / 100.000. Geld: € 114.000 / € 150.000."
    );
  });

  it("should name the chosen policy when an event was answered", () => {
    const text = describeTurn(
      snapshot({
        latest: { type: "event", title: "Je eerste ophef", body: "Haal het weg." },
        meters: tiles(["40.000", "−6.000"], ["€ 100.000", ""]),
      })
    );
    expect(text).toMatch(
      /^Je eerste ophef. Gekozen: Haal het weg\. Gebruikers −6.000, nu 40.000\./
    );
  });

  it("should say the numbers stayed the same when nothing changed", () => {
    expect(
      describeTurn(snapshot({ meters: tiles(["50.000", ""], ["€ 100.000", ""]), goalStats: [] }))
    ).toBe("Geplaatst: Pizzeria om de hoek. Gebruikers en geld onveranderd.");
  });

  it("should warn about low money and the scandal risk when they apply", () => {
    const text = describeTurn(
      snapshot({
        meters: tiles(["50.000", ""], ["€ 4.000", "−€ 2.000"], true),
        scandal: "Schandaal dreigt: 35% kans per beurt",
      })
    );
    expect(text).toContain("Let op: Geld bijna op.");
    expect(text).toMatch(/Let op: Schandaal dreigt: 35% kans per beurt\.$/);
  });

  it("should return no text when nothing has been played yet", () => {
    expect(describeTurn(snapshot({ latest: null }))).toBe("");
  });

  it("should phrase a change in the words the cards use", () => {
    expect(describeMeterChange(-5)).toBe("omlaag 5");
    expect(describeMeterChange(8)).toBe("omhoog 8");
  });
});
