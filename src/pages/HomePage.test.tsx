import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { writeSavedRun } from "@/features/game-save/api";
import { HomePage } from "./HomePage";
import { useAuthContext } from "@/shared/context/AuthContext";
import { createDefaultAuthContextValue, renderWithProviders } from "tests/test-utils";

vi.mock("@/shared/context/AuthContext");
vi.mock("@/features/auth/hooks/useAuthCallbackHandler", () => ({
  useAuthCallbackHandler: () => ({ isProcessing: false }),
}));

describe("HomePage", () => {
  beforeEach(() => {
    vi.mocked(useAuthContext).mockReturnValue(createDefaultAuthContextValue());
  });

  it("should show the start screen without sign-in when the visitor is signed out", () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByRole("heading", { name: "Clickbait Capital" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start spel" })).toHaveAttribute("href", "/spel");
    expect(screen.queryByText(/inloggen|sign in/i)).not.toBeInTheDocument();
  });

  it("should link to rules, settings, credits and privacy when the start screen shows", () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByRole("link", { name: "Hoe speel je?" })).toHaveAttribute(
      "href",
      "/hoe-speel-je"
    );
    expect(screen.getByRole("link", { name: "Instellingen" })).toHaveAttribute(
      "href",
      "/instellingen"
    );
    expect(screen.getByRole("link", { name: "Credits" })).toHaveAttribute("href", "/credits");
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
  });

  it("should show the auth error when a sign-in return failed", () => {
    vi.mocked(useAuthContext).mockReturnValue(
      createDefaultAuthContextValue({ error: "Sign-in failed" })
    );

    renderWithProviders(<HomePage />);

    expect(screen.getByText("Sign-in failed")).toBeInTheDocument();
  });

  it("should offer to continue or start a new game when a run is saved", () => {
    writeSavedRun({ version: 5, seed: 1, actions: [{ kind: "card", cardId: "x" }] });

    renderWithProviders(<HomePage />);

    expect(screen.getByRole("link", { name: "Verder spelen" })).toHaveAttribute("href", "/spel");
    expect(screen.getByRole("link", { name: "Nieuw spel" })).toHaveAttribute("href", "/spel");
    expect(screen.queryByRole("link", { name: "Start spel" })).not.toBeInTheDocument();
  });

  it("should only offer to start when the saved run is corrupt", () => {
    window.localStorage.setItem("clickbait-capital:run:v2", "{broken");

    renderWithProviders(<HomePage />);

    expect(screen.getByRole("link", { name: "Start spel" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Verder spelen" })).not.toBeInTheDocument();
  });
});
