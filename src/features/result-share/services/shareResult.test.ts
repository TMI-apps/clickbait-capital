import { describe, expect, it, vi } from "vitest";
import { shareResult } from "@/features/result-share/services/shareResult";
import type {
  ShareCardContent,
  ShareEnvironment,
} from "@/features/result-share/types/resultShare.types";

const content: ShareCardContent = {
  appName: "Clickbait Capital",
  kicker: "Game over",
  title: "Bankroet",
  line: "Servers op zwart",
  stats: [{ label: "Fase bereikt", value: "2: De Scale-Up" }],
  footerLabel: "Speel gratis op",
  shareTitle: "Clickbait Capital",
  text: "Ik haalde fase 2.",
  url: "https://example.test/",
  fileName: "resultaat.png",
};
const image = new Blob(["png"], { type: "image/png" });

const env = (overrides: Partial<ShareEnvironment> = {}): ShareEnvironment => ({
  download: vi.fn(),
  writeText: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const abortError = (): DOMException => new DOMException("closed", "AbortError");

describe("shareResult", () => {
  it("should share the image file when the browser can share files", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const outcome = await shareResult({
      content,
      image,
      env: env({ share, canShare: () => true }),
    });
    expect(outcome).toBe("shared");
    const data = share.mock.calls[0][0] as ShareData;
    expect(data.files?.[0].name).toBe("resultaat.png");
    expect(data.files?.[0].type).toBe("image/png");
    expect(data).toMatchObject({ title: content.shareTitle, text: content.text, url: content.url });
  });

  it("should share text and link when files are not supported", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const outcome = await shareResult({
      content,
      image,
      env: env({ share, canShare: () => false }),
    });
    expect(outcome).toBe("shared-link");
    expect(share).toHaveBeenCalledWith({
      title: content.shareTitle,
      text: content.text,
      url: content.url,
    });
  });

  it("should share text and link when the image is not ready", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const outcome = await shareResult({
      content,
      image: null,
      env: env({ share, canShare: () => true }),
    });
    expect(outcome).toBe("shared-link");
  });

  it("should download the image and copy the link when navigator.share is missing", async () => {
    const shareEnv = env();
    const outcome = await shareResult({ content, image, env: shareEnv });
    expect(outcome).toBe("downloaded-and-copied");
    expect(shareEnv.download).toHaveBeenCalledWith(image, "resultaat.png");
    expect(shareEnv.writeText).toHaveBeenCalledWith("Ik haalde fase 2. https://example.test/");
  });

  it("should stay silent when the player closes the share sheet", async () => {
    const shareEnv = env({ share: vi.fn().mockRejectedValue(abortError()), canShare: () => true });
    expect(await shareResult({ content, image, env: shareEnv })).toBe("cancelled");
    expect(shareEnv.download).not.toHaveBeenCalled();
  });

  it("should fall back to download and copy when share is refused", async () => {
    const refused = new DOMException("no activation", "NotAllowedError");
    const shareEnv = env({ share: vi.fn().mockRejectedValue(refused), canShare: () => true });
    expect(await shareResult({ content, image, env: shareEnv })).toBe("downloaded-and-copied");
  });

  it("should report only the download when the clipboard is unavailable", async () => {
    const outcome = await shareResult({ content, image, env: env({ writeText: undefined }) });
    expect(outcome).toBe("downloaded");
  });

  it("should report only the copy when there is no image", async () => {
    const shareEnv = env();
    expect(await shareResult({ content, image: null, env: shareEnv })).toBe("copied");
    expect(shareEnv.download).not.toHaveBeenCalled();
  });

  it("should fail when neither download nor copy is possible", async () => {
    const shareEnv = env({ writeText: vi.fn().mockRejectedValue(new Error("denied")) });
    expect(await shareResult({ content, image: null, env: shareEnv })).toBe("failed");
  });
});
