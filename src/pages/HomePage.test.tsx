import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
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
});
