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

const draftCards = (): HTMLElement[] =>
  within(screen.getByRole("region", { name: /kies een post/i }))
    .getAllByRole("button")
    .filter((button) => button.dataset.slot === "game-card");

const feed = (): HTMLElement => screen.getByRole("region", { name: "Feed" });

const renderBoard = (content: GameContent = SEED_CONTENT, onQuit = vi.fn()) => {
  renderWithProviders(<GameBoard content={content} onQuit={onQuit} seed={11} />);
  return { onQuit, user: userEvent.setup() };
};

describe("GameBoard", () => {
  it("should show three meters at 50 and a three-card draft when a run starts", () => {
    renderBoard();
    expect(screen.getAllByRole("meter").map((m) => m.getAttribute("aria-valuenow"))).toEqual([
      "50",
      "50",
      "50",
    ]);
    expect(draftCards()).toHaveLength(3);
    expect(screen.getByText("De Zolderkamer")).toBeInTheDocument();
  });

  it("should put the card in the feed when the player taps it", async () => {
    const { user } = renderBoard();
    const [viral] = draftCards();
    const title = within(viral).getAllByText(/./)[1]?.textContent ?? "";

    await user.click(viral);

    expect(within(feed()).getAllByRole("listitem")).toHaveLength(1);
    expect(within(feed()).getByText(title, { exact: false })).toBeInTheDocument();
  });

  it("should play the next card when the player uses an arrow key and Enter", async () => {
    const { user } = renderBoard();
    const [first, second] = draftCards();
    first.focus();

    await user.keyboard("{ArrowRight}");
    expect(second).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(within(feed()).getByText("Advertentie")).toBeInTheDocument();
  });

  it("should open the card details and play from there when the info button is used", async () => {
    const { user } = renderBoard();
    const [infoButton] = screen.getAllByRole("button", { name: /^Details:/ });

    await user.click(infoButton);
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Plaats in feed" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(within(feed()).getAllByRole("listitem")).toHaveLength(1);
  });

  it("should require an option when an event interrupts the draft", async () => {
    const { user } = renderBoard(EVENT_NOW);
    await user.click(draftCards()[0]);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: "Sluiten" })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /moderatie/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(within(feed()).getByText("Investeer in moderatie.")).toBeInTheDocument();
  });

  it("should offer play again and home when the game is over", async () => {
    const { user, onQuit } = renderBoard(BANKRUPT_NOW);
    await user.click(draftCards()[1]);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Game over: Bankroet")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Home" }));
    expect(onQuit).toHaveBeenCalledTimes(1);

    await user.click(within(dialog).getByRole("button", { name: "Opnieuw spelen" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(within(feed()).queryAllByRole("listitem")).toHaveLength(0);
  });

  it("should quit to the start when the player stops from the pause menu", async () => {
    const { user, onQuit } = renderBoard();
    await user.click(screen.getByRole("button", { name: "Pauze" }));
    await user.click(screen.getByRole("button", { name: "Stoppen en naar start" }));
    expect(onQuit).toHaveBeenCalledTimes(1);
  });
});
