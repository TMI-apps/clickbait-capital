import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MeterPanel, ScandalWarning } from "@/features/game-board/components/MeterPanel";
import type { MeterView } from "@/features/game-board/types/gameBoard.types";

const meters: MeterView[] = [
  {
    key: "users",
    value: 100,
    history: [0.5, 0.8],
    phaseStarts: [],
    amount: 120_000,
    amountText: "120.000",
    delta: 18_000,
    deltaText: "+18.000",
    goalText: "Doel: 100.000",
    goalAmountText: "100.000",
    full: true,
    danger: false,
    valueText: "Gebruikers 120.000, +18.000, Doel: 100.000, doel gehaald",
  },
  {
    key: "revenue",
    value: 3,
    history: [0.5, 0.8],
    phaseStarts: [],
    amount: 4_000,
    amountText: "€ 4.000",
    delta: -2_000,
    deltaText: "−€ 2.000",
    goalText: "Doel: € 150.000",
    goalAmountText: "€ 150.000",
    full: false,
    danger: true,
    valueText: "Geld € 4.000, −€ 2.000, Doel: € 150.000, bijna bankroet",
  },
];

describe("MeterPanel", () => {
  it("should show the amount and change, label each goal line on the chart and speak the goal when the goal is reached", () => {
    render(<MeterPanel meters={meters} version={1} />);
    const users = screen.getByRole("meter", { name: "Gebruikers" });
    expect(users).toHaveAttribute("aria-valuetext", meters[0]!.valueText);
    const tiles = within(screen.getByRole("list", { name: "Gebruikers en geld" })).getAllByRole(
      "listitem"
    );
    expect(tiles[0]!.textContent).toContain("120.000");
    expect(tiles[0]!.textContent).toContain("+18.000");
    // The goal is shown only on the chart (score-redesign D30), labelled in the line's colour.
    expect(tiles[0]!.textContent).not.toContain("Doel");
    expect(screen.getByText("100.000")).toHaveClass("text-meter-users");
    expect(screen.getByText("€ 150.000")).toHaveClass("text-meter-revenue");
  });

  it("should speak the danger text when money is nearly gone", () => {
    render(<MeterPanel meters={meters} version={1} />);
    expect(screen.getByRole("meter", { name: "Geld" })).toHaveAttribute(
      "aria-valuetext",
      meters[1]!.valueText
    );
  });

  it("should show the scandal chance as a status when the warning renders", () => {
    render(<ScandalWarning text="Schandaal dreigt: 35% kans per beurt" />);
    expect(screen.getByRole("status")).toHaveTextContent("Schandaal dreigt: 35% kans per beurt");
  });
});
