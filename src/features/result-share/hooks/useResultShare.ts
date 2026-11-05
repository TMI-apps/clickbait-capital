import { useCallback, useEffect, useRef, useState } from "react";
import {
  createBrowserShareEnvironment,
  shareResult,
} from "@/features/result-share/services/shareResult";
import type {
  ShareCardContent,
  ShareOutcome,
} from "@/features/result-share/types/resultShare.types";

export interface ResultShareState {
  share: () => Promise<void>;
  /** Last outcome, `null` before the first share. */
  outcome: ShareOutcome | null;
  busy: boolean;
}

/**
 * Pre-renders the share card as soon as the results open (result-share D3), so the click can
 * call `navigator.share` right away: browsers refuse a share that starts long after the tap.
 * The renderer is loaded with `import()` here, keeping it out of the main and board chunks.
 */
export function useResultShare(content: ShareCardContent): ResultShareState {
  const imageRef = useRef<Blob | null>(null);
  const [outcome, setOutcome] = useState<ShareOutcome | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    imageRef.current = null;
    import("@/features/result-share/services/shareCardImage")
      .then(({ renderShareCard }) => renderShareCard(content))
      .then((image) => {
        if (active) imageRef.current = image;
      })
      // Without an image the share still sends text and link (result-share D2).
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [content]);

  const busyRef = useRef(false);

  const share = useCallback(async (): Promise<void> => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setOutcome(null);
    const result = await shareResult({
      content,
      image: imageRef.current,
      env: createBrowserShareEnvironment(),
    });
    setOutcome(result);
    busyRef.current = false;
    setBusy(false);
  }, [content]);

  return { share, outcome, busy };
}
