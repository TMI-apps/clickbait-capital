import { useSearchParams } from "react-router-dom";
import { ScoreMockup, type ScoreHudVariant } from "@/features/score-mockup/api";

const VARIANTS: readonly ScoreHudVariant[] = ["a", "b", "c"];

/** Unlinked prototype route `/mockup/score?v=a|b|c` (score-redesign D7); not indexed. */
export const ScoreMockupPage = () => {
  const [params, setParams] = useSearchParams();
  const requested = params.get("v");
  const variant = VARIANTS.find((id) => id === requested) ?? "a";
  return (
    <>
      <meta name="robots" content="noindex" />
      <ScoreMockup variant={variant} onVariantChange={(next) => setParams({ v: next })} />
    </>
  );
};
