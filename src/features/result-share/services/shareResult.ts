import type {
  ShareCardContent,
  ShareEnvironment,
  ShareOutcome,
} from "@/features/result-share/types/resultShare.types";

export interface ShareResultOptions {
  content: ShareCardContent;
  /** Pre-rendered PNG; `null` while it is still rendering or when rendering failed. */
  image: Blob | null;
  env: ShareEnvironment;
}

const isAbort = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "AbortError";

async function copyText(env: ShareEnvironment, text: string): Promise<boolean> {
  if (!env.writeText) return false;
  try {
    await env.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Without a share sheet: save the image and put the message plus link on the clipboard. */
async function downloadAndCopy({ content, image, env }: ShareResultOptions): Promise<ShareOutcome> {
  if (image) env.download(image, content.fileName);
  const copied = await copyText(env, `${content.text} ${content.url}`);
  if (image) return copied ? "downloaded-and-copied" : "downloaded";
  return copied ? "copied" : "failed";
}

/** Share data with the image file, or `null` when this browser can't share that file. */
function withImage({ content, image, env }: ShareResultOptions): ShareData | null {
  if (!image || !env.canShare) return null;
  const file = new File([image], content.fileName, { type: "image/png" });
  const data: ShareData = {
    title: content.shareTitle,
    text: content.text,
    url: content.url,
    files: [file],
  };
  return env.canShare(data) ? data : null;
}

/**
 * Shares a run's outcome (result-share D2): the native share sheet with the image when the
 * browser can share files, with only text and link when it can't, and otherwise a download of
 * the image plus the link on the clipboard. Closing the sheet is a silent `"cancelled"`; any
 * other refusal (e.g. lost user activation) falls back to download and copy.
 */
export async function shareResult(options: ShareResultOptions): Promise<ShareOutcome> {
  const { content, env } = options;
  if (env.share) {
    const fileData = withImage(options);
    try {
      if (fileData) {
        await env.share(fileData);
        return "shared";
      }
      await env.share({ title: content.shareTitle, text: content.text, url: content.url });
      return "shared-link";
    } catch (error: unknown) {
      if (isAbort(error)) return "cancelled";
    }
  }
  return downloadAndCopy(options);
}

/** Saves a blob as a file through a temporary object-URL link. */
function downloadBlob(image: Blob, fileName: string): void {
  const href = URL.createObjectURL(image);
  const link = document.createElement("a");
  link.href = href;
  link.download = fileName;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  // Give the browser a tick to start the download before the URL is revoked.
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

/** The real browser capabilities, bound so they can be called detached from `navigator`. */
export function createBrowserShareEnvironment(): ShareEnvironment {
  const nav = typeof navigator === "undefined" ? undefined : navigator;
  return {
    share: typeof nav?.share === "function" ? nav.share.bind(nav) : undefined,
    canShare: typeof nav?.canShare === "function" ? nav.canShare.bind(nav) : undefined,
    writeText: nav?.clipboard ? nav.clipboard.writeText.bind(nav.clipboard) : undefined,
    download: downloadBlob,
  };
}
