import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export interface FlowScreenProps {
  /** Heading of the screen; it receives focus when the screen opens (game-flow D1). */
  title: ReactNode;
  /** Small label above the title; screen readers hear it as the start of the heading. */
  kicker?: ReactNode;
  icon?: ReactNode;
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
  tone = "calm",
  children,
  actions,
}: FlowScreenProps) => {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center gap-6 overflow-x-hidden px-4 py-8 sm:px-6">
      <div className="flex animate-in flex-col gap-4 duration-(--duration-slow) ease-(--ease-standard) fade-in-0 slide-in-from-bottom-4">
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
          {kicker && <span className="sr-only">{kicker}:</span>} {title}
        </h1>
        {children}
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{actions}</div>
    </main>
  );
};
