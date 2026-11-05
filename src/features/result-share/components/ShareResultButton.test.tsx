import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShareResultButton } from "@/features/result-share/components/ShareResultButton";
import type {
  ShareCardContent,
  ShareResultCopy,
} from "@/features/result-share/types/resultShare.types";

vi.mock("@/features/result-share/services/shareCardImage", () => ({
  renderShareCard: vi.fn().mockResolvedValue(new Blob(["png"], { type: "image/png" })),
}));

const content: ShareCardContent = {
  appName: "Clickbait Capital",
  kicker: "Game over",
  title: "Bankroet",
  line: "Servers op zwart",
  stats: [],
  footerLabel: "Speel gratis op",
  shareTitle: "Clickbait Capital",
  text: "Ik haalde fase 2.",
  url: "https://example.test/",
  fileName: "resultaat.png",
};

const copy: ShareResultCopy = {
  buttonLabel: "Deel je resultaat",
  statuses: {
    shared: "Gedeeld.",
    "shared-link": "Gedeeld.",
    "downloaded-and-copied": "Afbeelding opgeslagen en link gekopieerd.",
    downloaded: "Afbeelding opgeslagen.",
    copied: "Link gekopieerd.",
    cancelled: "",
    failed: "Delen lukte niet.",
  },
};

describe("ShareResultButton", () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    URL.createObjectURL = vi.fn(() => "blob:card");
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, "share");
    Reflect.deleteProperty(navigator, "canShare");
  });

  it("should save the image and announce the copied link when the browser has no share sheet", async () => {
    render(<ShareResultButton content={content} copy={copy} />);
    // Let the pre-render settle before the tap, as a player would.
    await new Promise((resolve) => setTimeout(resolve, 0));
    await userEvent.click(screen.getByRole("button", { name: "Deel je resultaat" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Afbeelding opgeslagen en link gekopieerd."
    );
    expect(writeText).toHaveBeenCalledWith("Ik haalde fase 2. https://example.test/");
  });

  it("should open the share sheet with the image when the browser can share files", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    Object.defineProperty(navigator, "canShare", { value: () => true, configurable: true });
    render(<ShareResultButton content={content} copy={copy} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await userEvent.click(screen.getByRole("button", { name: "Deel je resultaat" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Gedeeld."));
    expect((share.mock.calls[0][0] as ShareData).files).toHaveLength(1);
  });
});
