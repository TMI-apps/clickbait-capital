import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { createGame } from "@/features/game-engine/api";
import { GAME_CONTENT } from "@/features/game-content/api";
import { readSavedRun, writeSavedRun } from "@/features/game-save/api";
import type { RunStartState, SavedRun } from "@/features/game-save/api";
import { GamePage } from "@/pages/GamePage";
import { renderWithProviders } from "tests/test-utils";

const SEED = 1;

/** A one-card run on the real content, so it replays. */
const savedRun = (): SavedRun => {
  const hand = createGame({ content: GAME_CONTENT, seed: SEED }).hand;
  return { version: 8, seed: SEED, actions: [{ kind: "card", cardId: hand?.[0] ?? "" }] };
};

type User = ReturnType<typeof userEvent.setup>;

/** Types a name over the suggestion and presses Start. */
const nameApp = async (user: User, name: string): Promise<void> => {
  const field = screen.getByRole("textbox", { name: "Naam van je app" });
  await user.clear(field);
  if (name !== "") await user.type(field, name);
  await user.click(screen.getByRole("button", { name: "Start" }));
};

const renderGame = (state?: RunStartState) =>
  renderWithProviders(
    <MemoryRouter initialEntries={[{ pathname: "/spel", state }]}>
      <Routes>
        <Route path="/spel" element={<GamePage />} />
      </Routes>
    </MemoryRouter>,
    { withRouter: false }
  );

describe("GamePage", () => {
  it("should ask to continue when a run is saved and the player came straight to /spel", async () => {
    writeSavedRun(savedRun());
    renderGame();

    expect(screen.getByRole("heading", { name: /Verder waar je was\?/ })).toHaveFocus();

    await userEvent.setup().click(screen.getByRole("button", { name: "Verder spelen" }));

    expect(screen.getByText("Beurt 1")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aan de slag" })).not.toBeInTheDocument();
    expect(await screen.findByText(/Spel hervat\. Fase 1 van 4/)).toBeInTheDocument();
  });

  it("should resume without asking when the start screen chose to continue", () => {
    writeSavedRun(savedRun());
    renderGame({ run: "resume" });

    expect(screen.queryByRole("heading", { name: /Verder waar je was\?/ })).not.toBeInTheDocument();
    expect(screen.getByText("Beurt 1")).toBeInTheDocument();
  });

  it("should name the app, then start a new run and drop the save when the player picks a new game", async () => {
    writeSavedRun(savedRun());
    renderGame();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Nieuw spel" }));
    expect(screen.getByRole("heading", { name: /Hoe heet jouw app\?/ })).toHaveFocus();

    await nameApp(user, "Pixelplein");

    expect(screen.getByRole("button", { name: "Aan de slag" })).toBeInTheDocument();
    expect(screen.getByText(/lanceer je je eigen app: Pixelplein\./)).toBeInTheDocument();
    expect(readSavedRun()).toBeNull();
  });

  it("should ask for the app name without asking to resume when nothing is saved", () => {
    renderGame();

    expect(screen.getByRole("heading", { name: /Hoe heet jouw app\?/ })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Naam van je app" })).not.toHaveValue("");
  });

  it("should keep the player on the naming step with the reason when the name is refused", async () => {
    renderGame();
    const user = userEvent.setup();

    await nameApp(user, "   ");
    expect(screen.getByRole("alert")).toHaveTextContent("Geef je app een naam.");
    expect(screen.getByRole("textbox", { name: "Naam van je app" })).toHaveAttribute(
      "aria-invalid",
      "true"
    );

    await nameApp(user, "K4nker");
    expect(screen.getByRole("alert")).toHaveTextContent("Kies een andere naam.");
    expect(screen.queryByRole("button", { name: "Aan de slag" })).not.toBeInTheDocument();
  });

  it("should offer another invented name when the player rolls the dice", async () => {
    renderGame();
    const user = userEvent.setup();
    const field = screen.getByRole("textbox", { name: "Naam van je app" });
    const first = (field as HTMLInputElement).value;

    await user.click(screen.getByRole("button", { name: "Andere naam" }));

    expect((field as HTMLInputElement).value).not.toBe(first);
  });

  it("should save the app name with the run and show it in the feed when a card is played", async () => {
    renderGame();
    const user = userEvent.setup();
    await nameApp(user, "Pixelplein");
    await user.click(screen.getByRole("button", { name: "Aan de slag" }));

    expect(screen.getByRole("region", { name: "Feed van Pixelplein" })).toBeInTheDocument();
    const [first] = within(screen.getByRole("region", { name: /kies een post/i }))
      .getAllByRole("button")
      .filter((button) => button.dataset.slot === "game-card");
    await user.click(first);
    await user.click(screen.getByRole("button", { name: "In de feed" }));

    await waitFor(() => expect(readSavedRun()).not.toBeNull());
    expect(readSavedRun()?.appName).toBe("Pixelplein");
  });

  it("should show the saved app name when the player is asked to continue", () => {
    writeSavedRun({ ...savedRun(), appName: "Memewolk" });
    renderGame();

    expect(screen.getByText(/Je vorige spel met Memewolk staat nog klaar/)).toBeInTheDocument();
  });
});
