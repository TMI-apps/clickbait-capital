import {
  JUICE_LIMITS,
  clampJuice,
  defineJuiceEffect,
  type JuiceCancel,
  type JuiceEffectContext,
  type JuicePoint,
  type JuiceRect,
} from "@/features/juice-engine/api";
import {
  animateJuice,
  createStageNode,
  playNode,
  scaledMs,
  tokenColor,
} from "@/features/juice-effects/services/overlayEffects";
import { particlePaths, splitGlyphs } from "@/features/juice-effects/services/particlePaths";
import type {
  CalloutStep,
  FloaterStep,
  ParticlesStep,
} from "@/features/juice-effects/types/juiceEffects.types";

/** Particle nodes alive right now (all bursts together), counted until released. */
const liveNodes = new Set<HTMLElement>();
/** Released particle nodes kept for reuse, so bursts don't churn the DOM. */
const pool: HTMLElement[] = [];

/** Particles a new burst may add without passing the live cap. */
export const particleRoom = (): number => Math.max(0, JUICE_LIMITS.liveParticles - liveNodes.size);

const centerOf = (rect: JuiceRect): JuicePoint => ({
  x: rect.x + rect.width / 2,
  y: rect.y + rect.height / 2,
});

function takeParticleNode(stage: HTMLElement): HTMLElement {
  const node = pool.pop() ?? document.createElement("span");
  node.removeAttribute("style");
  stage.appendChild(node);
  liveNodes.add(node);
  return node;
}

function releaseParticleNode(node: HTMLElement): void {
  // Counted even when the stage already left the page (route change mid-burst).
  if (!liveNodes.delete(node)) return;
  node.remove();
  if (pool.length < JUICE_LIMITS.liveParticles) pool.push(node);
}

/** Start point: the step's `from`, else the lower middle of the screen. */
function burstOrigin(step: ParticlesStep, context: JuiceEffectContext): JuicePoint {
  const from = context.resolve(step.from ?? "origin");
  if (from && !from.isScreen) return centerOf(from.rect);
  const screen = context.resolve("screen");
  const { width, height } = screen?.rect ?? { width: 0, height: 0 };
  return { x: width / 2, y: height * 0.6 };
}

/** The soft explosion behind a burst (design § 5: "neon explosie"). */
function burstGlow(
  step: ParticlesStep,
  origin: JuicePoint,
  context: JuiceEffectContext
): JuiceCancel | null {
  if (!step.glow) return null;
  const node = createStageNode(context, { x: origin.x, y: origin.y, width: 0, height: 0 });
  if (!node) return null;
  Object.assign(node.style, {
    width: "60vmin",
    height: "60vmin",
    borderRadius: "9999px",
    background: `radial-gradient(circle, ${tokenColor(step.glow)} 0%, transparent 65%)`,
  });
  return playNode(
    {
      element: node,
      keyframes: [
        { opacity: 0.7, transform: "translate(-50%, -50%) scale(0.2)" },
        { opacity: 0, transform: "translate(-50%, -50%) scale(1)" },
      ],
      options: {
        duration: scaledMs(step.duration * 0.6, context),
        easing: "ease-out",
        fill: "both",
      },
    },
    context
  );
}

interface FlightOptions {
  node: HTMLElement;
  path: ReturnType<typeof particlePaths>[number];
  duration: number;
}

function flyParticle(
  { node, path, duration }: FlightOptions,
  context: JuiceEffectContext
): JuiceCancel {
  const end = `translate(calc(-50% + ${path.dx}px), calc(-50% + ${path.dy}px)) rotate(${path.rotate}deg) scale(0.75)`;
  const animation = animateJuice(
    {
      element: node,
      keyframes: [
        { opacity: 0, transform: "translate(-50%, -50%) scale(0.6)" },
        { opacity: 1, transform: "translate(-50%, -50%) scale(1.1)", offset: 0.15 },
        { opacity: 0, transform: end },
      ],
      options: {
        duration: duration * path.durationScale,
        delay: path.delayMs,
        easing: "cubic-bezier(0.2, 0.7, 0.3, 1)",
        fill: "both",
      },
    },
    context
  );
  const release = (): void => releaseParticleNode(node);
  if (!animation) {
    release();
    return release;
  }
  animation.onfinish = release;
  return () => {
    animation.cancel();
    release();
  };
}

/** Glyphs that burst out or fly to a target (emoji, coins, confetti); never past the live cap. */
export const particlesEffect = defineJuiceEffect<ParticlesStep>({
  id: "particles",
  channel: "motion",
  reducedMotion: "skip",
  params: {
    count: { unit: "", min: 0, max: JUICE_LIMITS.liveParticles, step: 1, label: "Aantal" },
    duration: { unit: "ms", min: 200, max: 3000, step: 10, label: "Duur" },
    reach: { unit: "", min: 0.1, max: 1, step: 0.05, label: "Bereik", default: 0.45 },
    size: { unit: "rem", min: 0.75, max: 4, step: 0.25, label: "Grootte", default: 1.75 },
  },
  run: (step, context) => {
    const stage = context.stage;
    const count = Math.min(Math.round(step.count * context.intensity), particleRoom());
    if (!stage || count <= 0) return;
    const origin = burstOrigin(step, context);
    const to = step.to ? context.resolve(step.to) : null;
    const viewport = context.resolve("screen")?.rect ?? { width: 0, height: 0 };
    const paths = particlePaths({
      glyphs: splitGlyphs(step.glyphs),
      count,
      origin,
      target: to && !to.isScreen ? centerOf(to.rect) : null,
      viewport: { x: viewport.width, y: viewport.height },
      reach: step.reach,
    });
    const glow = burstGlow(step, origin, context);
    const duration = scaledMs(step.duration, context);
    const cancels = paths.map((path) => {
      const node = takeParticleNode(stage);
      node.textContent = path.glyph;
      node.dataset.juiceParticle = path.glyph;
      Object.assign(node.style, {
        position: "absolute",
        left: `${origin.x}px`,
        top: `${origin.y}px`,
        fontSize: `${clampJuice(step.size ?? 1.75, 0.75, 4)}rem`,
        lineHeight: "1",
        willChange: "transform, opacity",
      });
      return flyParticle({ node, path, duration }, context);
    });
    return () => {
      glow?.();
      cancels.forEach((cancel) => cancel());
    };
  },
});

/** Shared look of text nodes (floaters, callouts): bold, tabular, readable on any backdrop. */
function styleText(node: HTMLElement, color: string): void {
  Object.assign(node.style, {
    color: tokenColor(color),
    fontWeight: "800",
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
    textShadow: "0 1px 0 var(--card), 0 0 6px var(--card)",
    transform: "translate(-50%, -50%)",
  });
}

/** A number or word that rises from the target and fades ("+€ 2.000"); static under reduced motion. */
export const floaterEffect = defineJuiceEffect<FloaterStep>({
  id: "floater",
  channel: "motion",
  reducedMotion: "static",
  params: {
    rise: { unit: "px", min: 0, max: 120, step: 2, label: "Stijgen" },
    duration: { unit: "ms", min: 200, max: 4000, step: 10, label: "Duur" },
  },
  run: (step, context) => {
    const target = context.resolve(step.target);
    const text = context.fill(step.text);
    if (!target || !text) return;
    const center = centerOf(target.rect);
    const node = createStageNode(context, { x: center.x, y: target.rect.y, width: 0, height: 0 });
    if (!node) return;
    node.textContent = text;
    node.dataset.juiceFloater = text;
    styleText(node, step.color);
    const rise = context.reduced ? 0 : clampJuice(step.rise, 0, 120);
    return playNode(
      {
        element: node,
        keyframes: [
          { opacity: context.reduced ? 1 : 0, transform: "translate(-50%, -50%)" },
          { opacity: 1, transform: `translate(-50%, calc(-50% - ${rise * 0.4}px))`, offset: 0.2 },
          { opacity: 0, transform: `translate(-50%, calc(-50% - ${rise}px))` },
        ],
        options: { duration: scaledMs(step.duration, context), easing: "ease-out", fill: "both" },
      },
      context
    );
  },
});

/** A pill of text that pops at the target or screen centre and stays readable (≥ minReadMs). */
export const calloutEffect = defineJuiceEffect<CalloutStep>({
  id: "callout",
  channel: "motion",
  reducedMotion: "static",
  params: {
    duration: { unit: "ms", min: JUICE_LIMITS.minReadMs, max: 5000, step: 50, label: "Duur" },
  },
  run: (step, context) => {
    const target = context.resolve(step.target);
    const text = context.fill(step.text);
    if (!target || !text) return;
    const center = centerOf(target.rect);
    const y = target.isScreen ? target.rect.height * 0.38 : center.y;
    const node = createStageNode(context, { x: center.x, y, width: 0, height: 0 });
    if (!node) return;
    node.textContent = text;
    node.dataset.juiceCallout = text;
    styleText(node, step.color);
    Object.assign(node.style, {
      width: "auto",
      height: "auto",
      padding: "0.35rem 0.9rem",
      borderRadius: "9999px",
      background: "var(--card)",
      border: `2px solid ${tokenColor(step.color)}`,
      fontSize: "1.125rem",
    });
    const pop = context.reduced
      ? [{ opacity: 1, transform: "translate(-50%, -50%)" }]
      : [
          { opacity: 0, transform: "translate(-50%, -50%) scale(0.6)" },
          { opacity: 1, transform: "translate(-50%, -50%) scale(1.08)", offset: 0.08 },
        ];
    const duration = Math.max(JUICE_LIMITS.minReadMs, scaledMs(step.duration, context));
    return playNode(
      {
        element: node,
        keyframes: [
          ...pop,
          { opacity: 1, transform: "translate(-50%, -50%) scale(1)", offset: 0.15 },
          { opacity: 1, transform: "translate(-50%, -50%) scale(1)", offset: 0.85 },
          { opacity: 0, transform: "translate(-50%, -50%) scale(1)" },
        ],
        options: { duration, easing: "ease-out", fill: "both" },
      },
      context
    );
  },
});
