import {
  JUICE_LIMITS,
  clampJuice,
  defineJuiceEffect,
  type JuiceCancel,
  type JuiceEffectContext,
  type JuiceRect,
  type JuiceResolvedTarget,
} from "@/features/juice-engine/api";
import type {
  BadgeStep,
  FlashStep,
  GlowStep,
  TintStep,
} from "@/features/juice-effects/types/juiceEffects.types";

/** A theme token name as a CSS colour (`"success"` → `var(--success)`); anything else → currentColor. */
export function tokenColor(name: string | undefined): string {
  return name && /^[a-z0-9-]+$/.test(name) ? `var(--${name})` : "currentColor";
}

/** Starts a Web Animation the juice owns (time warp can reach it); null where WAAPI is missing. */
/** An element, its keyframes and timing: one Web Animation request. */
export interface JuiceAnimationRequest {
  element: Element;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
}

export function animateJuice(
  { element, keyframes, options }: JuiceAnimationRequest,
  context: JuiceEffectContext
): Animation | null {
  if (typeof element.animate !== "function") return null;
  const animation = element.animate(keyframes, options);
  context.track(animation);
  return animation;
}

/** Ms after the motion scale, at least 1. */
export const scaledMs = (ms: number, context: JuiceEffectContext): number =>
  Math.max(1, ms * context.motionScale);

/** A positioned node on the stage over `rect`; null when no stage is mounted. */
export function createStageNode(context: JuiceEffectContext, rect: JuiceRect): HTMLElement | null {
  if (!context.stage) return null;
  const node = document.createElement("span");
  Object.assign(node.style, {
    position: "absolute",
    left: `${rect.x}px`,
    top: `${rect.y}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    pointerEvents: "none",
    willChange: "opacity, transform",
  });
  context.stage.appendChild(node);
  return node;
}

/**
 * Plays `keyframes` on a node and removes it when the animation finishes or the step is
 * cancelled. Without WAAPI the node is removed right away (nothing would animate it).
 */
export function playNode(
  request: JuiceAnimationRequest & { element: HTMLElement },
  context: JuiceEffectContext
): JuiceCancel {
  const animation = animateJuice(request, context);
  const remove = (): void => request.element.remove();
  if (!animation) {
    remove();
    return remove;
  }
  animation.onfinish = remove;
  // A cancel from outside (director cancelAll, time-warp teardown) cleans up too.
  animation.oncancel = remove;
  return () => {
    animation.cancel();
    remove();
  };
}

/** Copies the target's corner radius so a wash or ring hugs a rounded tile. */
function hugCorners(node: HTMLElement, target: JuiceResolvedTarget): void {
  if (!target.element || typeof getComputedStyle !== "function") return;
  node.style.borderRadius = getComputedStyle(target.element).borderRadius;
}

/** True when the overlay covers enough of the screen to count as a screen flash (WCAG 2.3.1). */
function isScreenLevel(target: JuiceResolvedTarget, context: JuiceEffectContext): boolean {
  if (target.isScreen) return true;
  const screen = context.resolve("screen")?.rect;
  if (!screen || screen.width * screen.height === 0) return false;
  const share = (target.rect.width * target.rect.height) / (screen.width * screen.height);
  return share >= JUICE_LIMITS.screenAreaShare;
}

/**
 * The overlay's target, or null when it should not play: a large non-screen target spends a
 * screen-flash token like a `screen` step (the director already spent one for `screen` steps).
 */
function overlayTarget(ref: string, context: JuiceEffectContext): JuiceResolvedTarget | null {
  const target = context.resolve(ref);
  if (!target) return null;
  if (!target.isScreen && isScreenLevel(target, context) && !context.claimScreenFlash())
    return null;
  return target;
}

/** Peak opacity: screen-level overlays never pass the WCAG margin, local ones stay soft. */
function overlayOpacity(
  opacity: number,
  { target, context }: { target: JuiceResolvedTarget; context: JuiceEffectContext }
): number {
  const ceiling = isScreenLevel(target, context) ? JUICE_LIMITS.screenOpacity : 0.6;
  return clampJuice(opacity * context.intensity, 0, ceiling);
}

const COLOR_PARAMS = {
  duration: { unit: "ms", min: 50, max: 3000, step: 10, label: "Duur" },
};

/** A colour wash that fades in and out (gain / loss on a tile, a win or loss on the screen). */
export const flashEffect = defineJuiceEffect<FlashStep>({
  id: "flash",
  channel: "motion",
  reducedMotion: "skip",
  params: { ...COLOR_PARAMS, opacity: { unit: "", min: 0, max: 1, step: 0.05, label: "Dekking" } },
  flashes: (step) => step.target === "screen",
  run: (step, context) => {
    const target = overlayTarget(step.target, context);
    if (!target) return;
    const node = createStageNode(context, target.rect);
    if (!node) return;
    hugCorners(node, target);
    node.style.background = tokenColor(step.color);
    const peak = overlayOpacity(step.opacity, { target, context });
    return playNode(
      {
        element: node,
        keyframes: [{ opacity: 0 }, { opacity: peak, offset: 0.25 }, { opacity: 0 }],
        options: { duration: scaledMs(step.duration, context), easing: "ease-out", fill: "both" },
      },
      context
    );
  },
});

/** A glowing ring around the target that beats a few times (flames on users, gold on money). */
export const glowEffect = defineJuiceEffect<GlowStep>({
  id: "glow",
  channel: "motion",
  reducedMotion: "skip",
  params: { ...COLOR_PARAMS, times: { unit: "×", min: 1, max: 6, step: 1, label: "Keer" } },
  flashes: (step) => step.target === "screen",
  run: (step, context) => {
    const target = overlayTarget(step.target, context);
    if (!target) return;
    const node = createStageNode(context, target.rect);
    if (!node) return;
    hugCorners(node, target);
    const color = tokenColor(step.color);
    node.style.boxShadow = `0 0 18px 4px ${color}, inset 0 0 0 2px ${color}`;
    const screenLevel = isScreenLevel(target, context);
    const peak = clampJuice(context.intensity, 0, screenLevel ? JUICE_LIMITS.screenOpacity : 1);
    // A screen-level glow beats once and slowly: one flash per guard token.
    const beats = screenLevel ? 1 : clampJuice(Math.round(step.times), 1, 6);
    const beatMs = scaledMs(step.duration, context);
    return playNode(
      {
        element: node,
        keyframes: [{ opacity: 0 }, { opacity: peak, offset: 0.4 }, { opacity: 0 }],
        options: {
          duration: screenLevel ? Math.max(JUICE_LIMITS.screenBeatMs, beatMs) : beatMs,
          iterations: beats,
          easing: "ease-in-out",
        },
      },
      context
    );
  },
});

/** A coloured vignette that holds and fades (mood: danger, celebration). */
export const tintEffect = defineJuiceEffect<TintStep>({
  id: "tint",
  channel: "motion",
  reducedMotion: "skip",
  params: { ...COLOR_PARAMS, opacity: { unit: "", min: 0, max: 1, step: 0.05, label: "Dekking" } },
  flashes: (step) => step.target === "screen",
  run: (step, context) => {
    const target = overlayTarget(step.target, context);
    if (!target) return;
    const node = createStageNode(context, target.rect);
    if (!node) return;
    hugCorners(node, target);
    const color = tokenColor(step.color);
    node.style.background = `radial-gradient(ellipse at center, transparent 45%, ${color} 100%)`;
    const peak = overlayOpacity(step.opacity, { target, context });
    return playNode(
      {
        element: node,
        keyframes: [
          { opacity: 0 },
          { opacity: peak, offset: 0.2 },
          { opacity: peak, offset: 0.7 },
          { opacity: 0 },
        ],
        options: {
          duration: scaledMs(step.duration, context),
          easing: "ease-in-out",
          fill: "both",
        },
      },
      context
    );
  },
});

/** A small glyph that pops onto the target's top-right corner; static under reduced motion. */
export const badgeEffect = defineJuiceEffect<BadgeStep>({
  id: "badge",
  channel: "motion",
  reducedMotion: "static",
  params: { duration: { unit: "ms", min: 300, max: 5000, step: 50, label: "Duur" } },
  run: (step, context) => {
    const target = context.resolve(step.target);
    if (!target || target.isScreen) return;
    const { x, y, width } = target.rect;
    const node = createStageNode(context, { x: x + width - 18, y: y - 14, width: 28, height: 28 });
    if (!node) return;
    node.textContent = step.glyph;
    node.dataset.juiceBadge = step.glyph;
    Object.assign(node.style, { fontSize: "1.25rem", lineHeight: "28px", textAlign: "center" });
    const keyframes: Keyframe[] = context.reduced
      ? [{ opacity: 1 }, { opacity: 1, offset: 0.9 }, { opacity: 0 }]
      : [
          { opacity: 0, transform: "scale(0.3)" },
          { opacity: 1, transform: "scale(1.25)", offset: 0.12 },
          { opacity: 1, transform: "scale(1)", offset: 0.22 },
          { opacity: 1, transform: "scale(1)", offset: 0.85 },
          { opacity: 0, transform: "scale(0.9)" },
        ];
    return playNode(
      {
        element: node,
        keyframes: keyframes,
        options: { duration: scaledMs(step.duration, context), easing: "ease-out", fill: "both" },
      },
      context
    );
  },
});
