import { useState, type CSSProperties } from "react";
import type { ParticleBurst } from "@/features/game-juice/hooks/useActionJuice";
import { cn } from "@/shared/utils/cn";

export interface JuiceLayerProps {
  burst: ParticleBurst | null;
  /** Full-screen colour flash behind the particles (win / loss); plays once per mount. */
  flash?: "win" | "loss";
}

/** Explosion behind the particles (design § 5: "neon paars/roze explosie"; gold for a win). */
const BURST_GLOW: Partial<Record<ParticleBurst["kind"], string>> = {
  emoji: "bg-[radial-gradient(circle,var(--type-viral)_0%,transparent_65%)]",
  confetti: "bg-[radial-gradient(circle,var(--type-ad)_0%,transparent_65%)]",
};

const particleStyle = (
  origin: ParticleBurst["origin"],
  path: ParticleBurst["paths"][number]
): CSSProperties =>
  ({
    left: origin.x,
    top: origin.y,
    "--juice-dx": `${path.dx}px`,
    "--juice-dy": `${path.dy}px`,
    "--juice-rotate": `${path.rotate}deg`,
    animationDelay: `${path.delayMs}ms`,
    animationDuration: `calc(var(--duration-juice) * ${path.durationScale})`,
  }) as CSSProperties;

const Burst = ({ burst, onParticleEnd }: { burst: ParticleBurst; onParticleEnd: () => void }) => {
  const glow = BURST_GLOW[burst.kind];
  return (
    <>
      {glow && (
        <span
          className={cn("absolute size-[60vmin] animate-juice-burst rounded-full", glow)}
          style={{ left: burst.origin.x, top: burst.origin.y }}
        />
      )}
      {burst.paths.map((path, index) => (
        <span
          key={index}
          data-juice-particle={burst.kind}
          onAnimationEnd={onParticleEnd}
          className="absolute animate-juice-particle text-2xl leading-none will-change-transform select-none sm:text-3xl"
          style={particleStyle(burst.origin, path)}
        >
          {path.glyph}
        </span>
      ))}
    </>
  );
};

/** Full-screen colour flash (win / loss) that unmounts once it has played. */
const ScreenFlash = ({ flash }: { flash: "win" | "loss" }) => {
  const [done, setDone] = useState(false);
  if (done) return null;
  return (
    <div
      aria-hidden="true"
      onAnimationEnd={() => setDone(true)}
      className={cn(
        "pointer-events-none fixed inset-0 z-[60] animate-juice-flash",
        flash === "win" ? "bg-type-ad/25" : "bg-destructive/25"
      )}
    />
  );
};

/**
 * Full-screen, click-through overlay for one particle burst: glyphs fly on transform/opacity
 * only and the layer unmounts when the last one lands; the optional flash unmounts after it
 * plays. Decorative (aria-hidden): the meters and the feed carry the state change.
 */
export const JuiceLayer = ({ burst, flash }: JuiceLayerProps) => {
  const [landed, setLanded] = useState({ key: -1, count: 0 });
  const done = burst !== null && landed.key === burst.key && landed.count >= burst.paths.length;
  const live = burst !== null && !done ? burst : null;

  const onParticleEnd = (): void => {
    if (!live) return;
    setLanded((current) => ({
      key: live.key,
      count: current.key === live.key ? current.count + 1 : 1,
    }));
  };

  return (
    <>
      {flash && <ScreenFlash flash={flash} />}
      {live && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
        >
          <Burst key={live.key} burst={live} onParticleEnd={onParticleEnd} />
        </div>
      )}
    </>
  );
};
