import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

/** Hero photo of a flow screen; the focal point stays in view when the frame crops it. */
export interface FlowHeroImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  focalPoint: { x: number; y: number };
}

/**
 * Photo filling the heading block, faded into the page background towards the bottom so the
 * kicker and title on top stay readable (phase-images D2). A broken photo leaves the plain block.
 */
const HeroBackdrop = ({ image }: { image: FlowHeroImage }) => {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <>
      <img
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        decoding="async"
        fetchPriority="high"
        draggable={false}
        onError={() => setFailed(true)}
        className="absolute inset-0 size-full object-cover"
        style={{ objectPosition: `${image.focalPoint.x}% ${image.focalPoint.y}%` }}
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-b from-background/0 via-background/60 to-background"
      />
    </>
  );
};

export interface FlowScreenProps {
  /** Heading of the screen; it receives focus when the screen opens (game-flow D1). */
  title: ReactNode;
  /** Small label above the title; screen readers hear it as the start of the heading. */
  kicker?: ReactNode;
  icon?: ReactNode;
  /** Photo behind the heading block (phase intro); the heading sits on its faded lower edge. */
  heroImage?: FlowHeroImage;
  /** Bigger, louder heading for the endings; the results stay sober. */
  tone?: "dramatic" | "calm";
  children?: ReactNode;
  actions: ReactNode;
}

/**
 * Full-screen step between board turns (phase transition, ending, results): a centred
 * column with a focused heading and 44px actions at the bottom. Entrance motion runs on the
 * motion tokens, so prefers-reduced-motion turns it off.
 */
export const FlowScreen = ({
  title,
  kicker,
  icon,
  heroImage,
  tone = "calm",
  children,
  actions,
}: FlowScreenProps) => {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const heading = (
    <>
      {icon}
      {kicker && (
        // Spoken inside the heading instead: focus lands on the heading, so a kicker before it
        // would be skipped (screen-reader lap).
        <p
          aria-hidden="true"
          className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
        >
          {kicker}
        </p>
      )}
      <h1
        ref={headingRef}
        tabIndex={-1}
        className={cn(
          "font-heading leading-tight font-bold outline-none",
          tone === "dramatic" ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl"
        )}
      >
        {kicker && (
          <>
            <span className="sr-only">{kicker}:</span>{" "}
          </>
        )}
        {title}
      </h1>
    </>
  );

  return (
    <main
      // Short landscape phones (844×390) get tighter spacing so the screen fits without scrolling.
      className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center gap-6 overflow-x-hidden px-4 py-8 sm:px-6 [@media(max-height:480px)]:gap-3 [@media(max-height:480px)]:py-3"
    >
      <div className="flex animate-in flex-col gap-4 duration-(--duration-slow) ease-(--ease-standard) fade-in-0 slide-in-from-bottom-4 [@media(max-height:480px)]:gap-3">
        {heroImage ? (
          <div className="relative -mx-4 flex min-h-[clamp(7rem,28dvh,15rem)] flex-col justify-end overflow-hidden px-4 pt-6 sm:-mx-6 sm:rounded-xl sm:px-6 [@media(max-height:480px)]:min-h-0 [@media(max-height:480px)]:pt-10">
            <HeroBackdrop image={heroImage} />
            <div className="relative flex flex-col gap-4 [@media(max-height:480px)]:gap-3">
              {heading}
            </div>
          </div>
        ) : (
          heading
        )}
        {children}
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{actions}</div>
    </main>
  );
};
