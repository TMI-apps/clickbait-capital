import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MuteToggle } from "./MuteToggle";

/** Mirrors `MUTE_STORAGE_KEY` in services/muteStorage.ts (components may not import services). */
const MUTE_STORAGE_KEY = "clickbait-capital:audio-muted";

describe("MuteToggle", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("should switch sound off and remember it when pressed", () => {
    render(<MuteToggle />);
    const toggle = screen.getByRole("button", { name: "Geluid" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle).toHaveTextContent("Geluid uit");
    expect(window.localStorage.getItem(MUTE_STORAGE_KEY)).toBe("true");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });
});
