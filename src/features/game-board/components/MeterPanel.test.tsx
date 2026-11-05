import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MeterPanel } from "@/features/game-board/components/MeterPanel";
import type { MeterView } from "@/features/game-board/types/gameBoard.types";

const meters: MeterView[] = [
  {
    key: "revenue",
    value: 100,
    delta: 4,
    full: true,
    danger: false,
    valueText: "100 van 100, omhoog 4, maximum bereikt",
  },
  { key: "users", value: 60, delta: 0, full: false, danger: false, valueText: "60 van 100" },
  {
    key: "reputation",
    value: 15,
    delta: -5,
    full: false,
    danger: true,
    valueText: "15 van 100, omlaag 5, gevaarlijk laag",
  },
];

describe("MeterPanel", () => {
  it("should show MAX and speak the meter text when a meter is full", () => {
    render(<MeterPanel meters={meters} version={1} />);
    const revenue = screen.getByRole("meter", { name: "Inkomsten" });
    expect(revenue).toHaveAttribute("aria-valuetext", "100 van 100, omhoog 4, maximum bereikt");
    const tiles = within(screen.getByRole("list", { name: "Meters" })).getAllByRole("listitem");
    expect(tiles[0].textContent).toContain("MAX");
    expect(tiles[1].textContent).not.toContain("MAX");
  });

  it("should speak the danger text when a meter is low", () => {
    render(<MeterPanel meters={meters} version={1} />);
    expect(screen.getByRole("meter", { name: "Reputatie" })).toHaveAttribute(
      "aria-valuetext",
      "15 van 100, omlaag 5, gevaarlijk laag"
    );
  });
});
