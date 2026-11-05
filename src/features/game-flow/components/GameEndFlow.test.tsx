import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "tests/test-utils";
import { GameEndFlow } from "@/features/game-flow/components/GameEndFlow";
import type { RunSummary } from "@/features/game-flow/types/gameFlow.types";

vi.mock("@/features/result-share/services/shareCardImage", () => ({
  renderShareCard: vi.fn().mockResolvedValue(new Blob(["png"], { type: "image/png" })),
}));

const summary = (overrides: Partial<RunSummary>): RunSummary => ({
  outcome: "lost",
  reason: "bankrupt",
  turn: 9,
  phaseId: 1,
  phaseName: "De Zolderkamer",
  stats: { users: 60_000, revenue: 4_000 },
  statTexts: { users: "60.000", revenue: "€ 4.000" },
  playedTypes: ["viral", "news"],
  firedEventIds: [],
  ...overrides,
});

describe("GameEndFlow", () => {
  it.each([
    ["won", summary({ outcome: "won", reason: null, phaseId: 4, phaseName: "De Beursgang" })],
    ["lost", summary({})],
  ])("should offer the share button on the results when the run is %s", async (_label, run) => {
    renderWithProviders(<GameEndFlow summary={run} onRestart={vi.fn()} onQuit={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Deel je resultaat" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Bekijk je rapport" }));
    expect(screen.getByRole("button", { name: "Deel je resultaat" })).toBeVisible();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
