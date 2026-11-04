import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { GameContent } from "@/features/game-engine/api";
import { SEED_CONTENT } from "@/features/game-engine/api";
import { GameBoard } from "@/features/game-board/components/GameBoard";
import { renderWithProviders } from "tests/test-utils";

/** Seed content where the first viral card (Toxicity > 0) triggers the first event. */
const EVENT_NOW: GameContent = {
  ...SEED_CONTENT,
  events: [{ ...SEED_CONTENT.events[0], trigger: { kind: "toxicity", threshold: 0 } }],
};

/** Seed content where the passive costs bankrupt the platform on the first card. */
const BANKRUPT_NOW: GameContent = {
  ...SEED_CONTENT,
  events: [],
  phases: SEED_CONTENT.phases.map((phase) => ({ ...phase, passiveCosts: { revenue: -100 } })),
};

/** Seed content where phase 1's goal holds after the first card. */
const MILESTONE_NOW: GameContent = {
  ...SEED_CONTENT,
  events: [],
  phases: SEED_CONTENT.phases.map((phase) =>
    phase.id === 1
      ? { ...phase, goal: { ...phase.goal, conditions: [], consecutiveTurns: 1 } }
      : phase
  ),
};

/** Seed content where every phase goal holds after one card: four cards win the IPO. */
const WIN_FAST: GameContent = {
  ...SEED_CONTENT,
  events: [],
  phases: SEED_CONTENT.phases.map((phase) => ({
    ...phase,
    goal: { ...phase.goal, conditions: [], consecutiveTurns: 1 },
  })),
};

const draftCards = (): HTMLElement[] =>
  within(screen.getByRole("region", { name: /kies een post/i }))
    .getAllByRole("button")
    .filter((button) => button.dataset.slot === "game-card");

const feed = (): HTMLElement => screen.getByRole("region", { name: "Je feed" });

/** Renders the board and continues past the phase 1 intro (game-flow D2). */
const renderBoard = async (content: GameContent = SEED_CONTENT, onQuit = vi.fn()) => {
  renderWithProviders(<GameBoard content={content} onQuit={onQuit} seed={11} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Aan de slag" }));
  return { onQuit, user };
};

describe("GameBoard", () => {
  it("should show three meters at 50 and a three-card draft when a run starts", async () => {
    await renderBoard();
    expect(screen.getAllByRole("meter").map((m) => m.getAttribute("aria-valuenow"))).toEqual([
      "50",
      "50",
      "50",
    ]);
    expect(draftCards()).toHaveLength(3);
    expect(screen.getByText("De Zolderkamer")).toBeInTheDocument();
  });

  it("should put the card in the feed when the player taps it", async () => {
    const { user } = await renderBoard();
    const [viral] = draftCards();
    const title = within(viral).getAllByText(/./)[1]?.textContent ?? "";

    await user.click(viral);

    expect(within(feed()).getAllByRole("listitem")).toHaveLength(1);
    expect(within(feed()).getByText(title, { exact: false })).toBeInTheDocument();
  });

  it("should play the next card when the player uses an arrow key and Enter", async () => {
    const { user } = await renderBoard();
    const [first, second] = draftCards();
    first.focus();

    await user.keyboard("{ArrowRight}");
    expect(second).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(within(feed()).getByText("Advertentie")).toBeInTheDocument();
  });

  it("should open the card details and play from there when the info button is used", async () => {
    const { user } = await renderBoard();
    const [infoButton] = screen.getAllByRole("button", { name: /^Details:/ });

    await user.click(infoButton);
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "In de feed" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(within(feed()).getAllByRole("listitem")).toHaveLength(1);
  });

  it("should require an option when an event interrupts the draft", async () => {
    const { user } = await renderBoard(EVENT_NOW);
    await user.click(draftCards()[0]);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: "Sluiten" })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /moderatie/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(within(feed()).getByText("Investeer in moderatie.")).toBeInTheDocument();
  });

  it("should show the phase 1 intro before the board when a run starts", async () => {
    renderWithProviders(<GameBoard content={SEED_CONTENT} onQuit={vi.fn()} seed={11} />);
    expect(screen.getByRole("heading", { level: 1, name: "De Zolderkamer" })).toHaveFocus();
    expect(screen.queryByRole("region", { name: /kies een post/i })).not.toBeInTheDocument();
  });

  it("should show the next phase intro when a milestone is reached", async () => {
    const { user } = await renderBoard(MILESTONE_NOW);
    await user.click(draftCards()[0]);

    expect(screen.getByRole("heading", { level: 1, name: "De Scale-Up" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Aan de slag" }));
    expect(draftCards()).toHaveLength(3);
  });

  it("should show the IPO ending and then the end report when the run is won", async () => {
    const { user } = await renderBoard(WIN_FAST);
    for (let phase = 1; phase < 4; phase++) {
      await user.click(draftCards()[2]);
      await user.click(screen.getByRole("button", { name: "Aan de slag" }));
    }
    await user.click(draftCards()[2]);

    expect(screen.getByText("Beursgang geslaagd")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Gefeliciteerd met je beursgang!" })
    ).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Bekijk je rapport" }));
    expect(screen.getByText("Beurswaarde op de eerste handelsdag")).toBeInTheDocument();
    expect(screen.getByText("Keer dat desinformatie werd gedeeld")).toBeInTheDocument();
  });

  it("should go from the ending to the results and restart when the game is over", async () => {
    const { user, onQuit } = await renderBoard(BANKRUPT_NOW);
    await user.click(draftCards()[1]);

    expect(screen.getByRole("heading", { level: 1, name: "Bankroet" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Bekijk je rapport" }));
    expect(screen.getByRole("heading", { name: "Game over: Bankroet" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Naar het begin" }));
    expect(onQuit).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Opnieuw spelen" }));
    expect(screen.getByRole("heading", { level: 1, name: "De Zolderkamer" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aan de slag" }));
    expect(within(feed()).queryAllByRole("listitem")).toHaveLength(0);
  });

  it("should quit to the start when the player stops from the pause menu", async () => {
    const { user, onQuit } = await renderBoard();
    await user.click(screen.getByRole("button", { name: "Menu" }));
    await user.click(screen.getByRole("button", { name: "Stoppen" }));
    expect(onQuit).toHaveBeenCalledTimes(1);
  });
});
