import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { renderWithProviders } from "tests/test-utils";
import { SettingsPanel } from "./SettingsPanel";

/** Mirrors the stored keys (components may not import services). */
const MUTE_KEY = "clickbait-capital:audio-muted";
const MOTION_KEY = "clickbait-capital:motion";

const group = (name: string): HTMLElement => screen.getByRole("group", { name });

describe("SettingsPanel", () => {
  afterEach(() => window.localStorage.clear());

  it("should switch sound off through the shared mute state when Uit is pressed", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPanel />);

    await user.click(within(group("Geluid")).getByRole("button", { name: "Uit" }));

    expect(window.localStorage.getItem(MUTE_KEY)).toBe("true");
    expect(within(group("Geluid")).getByRole("button", { name: "Uit" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("should store the motion choice and set data-motion when Verminderd is pressed", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPanel />);

    await user.click(within(group("Beweging")).getByRole("button", { name: "Verminderd" }));

    expect(window.localStorage.getItem(MOTION_KEY)).toBe("reduced");
    expect(document.documentElement.dataset.motion).toBe("reduced");
  });

  it("should switch the colour mode when Licht is pressed", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPanel />);

    await user.click(within(group("Weergave")).getByRole("button", { name: "Licht" }));

    expect(window.localStorage.getItem("color-mode")).toBe("light");
  });

  it("should clear game keys and reset sound and motion when the wipe is confirmed", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPanel />);
    await user.click(within(group("Geluid")).getByRole("button", { name: "Uit" }));
    await user.click(within(group("Beweging")).getByRole("button", { name: "Volledig" }));

    await user.click(screen.getByRole("button", { name: "Voortgang wissen" }));
    await user.click(screen.getByRole("button", { name: "Ja, wissen" }));

    expect(window.localStorage.getItem(MUTE_KEY)).toBeNull();
    expect(window.localStorage.getItem(MOTION_KEY)).toBeNull();
    expect(within(group("Beweging")).getByRole("button", { name: "Systeem" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("status")).toHaveTextContent("Voortgang gewist.");
  });

  it("should keep the stored data when the wipe is cancelled", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPanel />);
    await user.click(within(group("Geluid")).getByRole("button", { name: "Uit" }));

    await user.click(screen.getByRole("button", { name: "Voortgang wissen" }));
    await user.click(screen.getByRole("button", { name: "Annuleren" }));

    expect(window.localStorage.getItem(MUTE_KEY)).toBe("true");
  });
});
