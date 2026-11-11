import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
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
  return { version: 7, seed: SEED, actions: [{ kind: "card", cardId: hand?.[0] ?? "" }] };
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

  it("should start a new run and drop the save when the player picks a new game", async () => {
    writeSavedRun(savedRun());
    renderGame();

    await userEvent.setup().click(screen.getByRole("button", { name: "Nieuw spel" }));

    expect(screen.getByRole("button", { name: "Aan de slag" })).toBeInTheDocument();
    expect(readSavedRun()).toBeNull();
  });

  it("should start a new run without asking when nothing is saved", () => {
    renderGame();

    expect(screen.getByRole("button", { name: "Aan de slag" })).toBeInTheDocument();
  });
});
