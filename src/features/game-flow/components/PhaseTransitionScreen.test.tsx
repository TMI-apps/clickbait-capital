import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getPhaseImage } from "@/features/card-imagery/api";
import { PhaseTransitionScreen } from "@/features/game-flow/components/PhaseTransitionScreen";
import { renderWithProviders } from "tests/test-utils";

const phase = {
  phaseId: 2,
  phaseCount: 4,
  goalDescription: "Haal 300.000 gebruikers en € 600.000.",
} as const;

describe("PhaseTransitionScreen", () => {
  it("should show the phase photo with its Dutch alt when the phase has one", () => {
    renderWithProviders(<PhaseTransitionScreen phase={phase} onContinue={vi.fn()} />);
    const expected = getPhaseImage(2);
    const image = screen.getByRole("img", { name: expected?.alt });
    expect(image).toHaveAttribute("src", expected?.src);
    expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
  });

  it("should drop the photo and keep the heading when the photo fails to load", () => {
    renderWithProviders(<PhaseTransitionScreen phase={phase} onContinue={vi.fn()} />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });
});
