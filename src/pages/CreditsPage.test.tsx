import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AUDIO_CREDIT_LINE } from "@/features/game-audio/api";
import { listCardImageCredits, listPhaseImageCredits } from "@/features/card-imagery/api";
import { CreditsPage } from "@/pages/CreditsPage";
import { renderWithProviders } from "tests/test-utils";

describe("CreditsPage", () => {
  it("should list every image credit and the audio credit when rendered", () => {
    renderWithProviders(<CreditsPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Over dit spel" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(
      listCardImageCredits().length + listPhaseImageCredits().length
    );
    expect(screen.getByText(AUDIO_CREDIT_LINE)).toBeInTheDocument();
  });

  it("should link to the privacy note when rendered", () => {
    renderWithProviders(<CreditsPage />);
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
  });

  it("should lazy-load thumbnails with a fixed size when rendered", () => {
    const { container } = renderWithProviders(<CreditsPage />);
    const images = container.querySelectorAll("img");
    expect(images.length).toBeGreaterThan(0);
    for (const image of images) {
      expect(image).toHaveAttribute("loading", "lazy");
      expect(image).toHaveAttribute("width", "64");
      expect(image).toHaveAttribute("height", "48");
    }
  });
});
