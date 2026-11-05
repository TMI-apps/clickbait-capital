import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UpdatePrompt } from "@/features/app-update/components/UpdatePrompt";
import type { UseAppUpdateResult } from "@/features/app-update/hooks/useAppUpdate";

const hookState: UseAppUpdateResult = {
  updateReady: false,
  applyUpdate: vi.fn(),
  dismissUpdate: vi.fn(),
};

vi.mock("@/features/app-update/hooks/useAppUpdate", () => ({
  useAppUpdate: () => hookState,
}));

describe("UpdatePrompt", () => {
  beforeEach(() => {
    hookState.updateReady = false;
    hookState.applyUpdate = vi.fn();
    hookState.dismissUpdate = vi.fn();
  });

  it("should render nothing when no new version is waiting", () => {
    const { container } = render(<UpdatePrompt />);
    expect(container).toBeEmptyDOMElement();
  });

  it("should announce the new version and reload when the player taps Nu laden", async () => {
    hookState.updateReady = true;
    render(<UpdatePrompt />);

    expect(screen.getByRole("status")).toHaveTextContent("Nieuwe versie klaar");
    await userEvent.click(screen.getByRole("button", { name: "Nu laden" }));
    expect(hookState.applyUpdate).toHaveBeenCalledOnce();
  });

  it("should hide the prompt when the player taps Later", async () => {
    hookState.updateReady = true;
    render(<UpdatePrompt />);

    await userEvent.click(screen.getByRole("button", { name: "Later" }));
    expect(hookState.dismissUpdate).toHaveBeenCalledOnce();
  });
});
