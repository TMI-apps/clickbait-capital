import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EndJuice } from "@/features/game-juice/components/EndJuice";

describe("EndJuice", () => {
  it("should throw confetti over the end screen when the run is won", () => {
    render(
      <EndJuice outcome="won">
        <h1>Beursgang</h1>
      </EndJuice>
    );
    expect(screen.getByRole("heading", { name: "Beursgang" })).toBeInTheDocument();
    expect(document.querySelectorAll('[data-juice-particle="confetti"]').length).toBe(14);
  });

  it("should show the end screen without particles when the run is lost", () => {
    render(
      <EndJuice outcome="lost">
        <h1>Bankroet</h1>
      </EndJuice>
    );
    expect(screen.getByRole("heading", { name: "Bankroet" })).toBeInTheDocument();
    expect(document.querySelectorAll("[data-juice-particle]")).toHaveLength(0);
  });
});
