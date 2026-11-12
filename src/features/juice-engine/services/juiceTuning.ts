import type {
  JuiceOverrides,
  JuiceRecipe,
  JuiceRecipeBook,
  JuiceStepData,
  JuiceTuning,
} from "@/features/juice-engine/types/juiceEngine.types";
import { clampJuice } from "@/features/juice-engine/services/juiceEffect";

/** Slider ranges of the numeric global knobs. */
export const JUICE_TUNING_RANGES = {
  intensity: { min: 0, max: 2, step: 0.05 },
  motionScale: { min: 0.25, max: 3, step: 0.05 },
  volume: { min: 0, max: 1, step: 0.05 },
} as const;

export const DEFAULT_JUICE_TUNING: JuiceTuning = {
  intensity: 1,
  motionScale: 1,
  volume: 1,
  haptics: true,
};

/** Where overrides persist; both calls may throw (blocked storage) and are guarded. */
export interface JuiceTuningStorage {
  read: () => string | null;
  write: (value: string | null) => void;
}

export interface JuiceTuningStore {
  getTuning: () => JuiceTuning;
  /** The recipes with every step override applied (same object until something changes). */
  getBook: () => JuiceRecipeBook;
  getOverrides: () => JuiceOverrides;
  setGlobal: <K extends keyof JuiceTuning>(key: K, value: JuiceTuning[K]) => void;
  /** `branch` is `"steps"` or a variant name; `index` is the step's position in that list. */
  setStepValue: (
    target: { event: string; branch: string; index: number },
    param: string,
    value: number | string | boolean
  ) => void;
  /** Drops every override (back to the shipped recipes and defaults). */
  reset: () => void;
  /** Re-reads storage, e.g. after another tab changed it. */
  reload: () => void;
  /** Overrides as pretty JSON, to paste into a recipe change. */
  exportOverrides: () => string;
  subscribe: (listener: () => void) => () => void;
}

export interface JuiceTuningOptions {
  book: JuiceRecipeBook;
  defaults?: JuiceTuning;
  storage?: JuiceTuningStorage;
  /** Delay before writing to storage after a change (slider drags write once). */
  writeDelayMs?: number;
}

/** Key of one step's overrides. */
export const juiceStepKey = (event: string, branch: string, index: number): string =>
  `${event}/${branch}/${index}`;

/** Second copy: game-save `savedRunStorage.ts` has the same guard; extract to `src/shared/utils/` at a third. */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isParamValue = (value: unknown): value is number | string | boolean =>
  typeof value === "string" ||
  typeof value === "boolean" ||
  (typeof value === "number" && Number.isFinite(value));

function parseGlobal(value: unknown): Partial<JuiceTuning> {
  if (!isRecord(value)) return {};
  const global: Partial<JuiceTuning> = {};
  for (const key of ["intensity", "motionScale", "volume"] as const) {
    const raw = value[key];
    if (typeof raw === "number" && Number.isFinite(raw)) global[key] = raw;
  }
  if (typeof value.haptics === "boolean") global.haptics = value.haptics;
  return global;
}

function parseSteps(value: unknown): NonNullable<JuiceOverrides["steps"]> {
  const steps: NonNullable<JuiceOverrides["steps"]> = {};
  if (!isRecord(value)) return steps;
  for (const [key, params] of Object.entries(value)) {
    if (!isRecord(params)) continue;
    const kept = Object.entries(params).filter(([, param]) => isParamValue(param));
    if (kept.length > 0)
      steps[key] = Object.fromEntries(kept) as Record<string, number | string | boolean>;
  }
  return steps;
}

/** Parses stored overrides defensively: unknown keys and non-finite numbers are dropped. */
export function parseJuiceOverrides(raw: string | null): JuiceOverrides {
  if (!raw) return {};
  try {
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data)) return {};
    return { global: parseGlobal(data.global), steps: parseSteps(data.steps) };
  } catch {
    return {};
  }
}

function clampTuning(tuning: JuiceTuning): JuiceTuning {
  const { intensity, motionScale, volume } = JUICE_TUNING_RANGES;
  return {
    intensity: clampJuice(tuning.intensity, intensity.min, intensity.max),
    motionScale: clampJuice(tuning.motionScale, motionScale.min, motionScale.max),
    volume: clampJuice(tuning.volume, volume.min, volume.max),
    haptics: tuning.haptics,
  };
}

function applyBranch(
  { event, branch, steps }: { event: string; branch: string; steps: JuiceStepData[] },
  overrides: NonNullable<JuiceOverrides["steps"]>
): JuiceStepData[] {
  return steps.map((step, index) => {
    const patch = overrides[juiceStepKey(event, branch, index)];
    return patch ? { ...step, ...patch, effect: step.effect } : step;
  });
}

function applyRecipe(
  event: string,
  recipe: JuiceRecipe,
  overrides: NonNullable<JuiceOverrides["steps"]>
): JuiceRecipe {
  const variants = recipe.variants
    ? Object.fromEntries(
        Object.entries(recipe.variants).map(([name, steps]) => [
          name,
          applyBranch({ event, branch: name, steps }, overrides),
        ])
      )
    : undefined;
  return {
    ...recipe,
    steps: recipe.steps
      ? applyBranch({ event, branch: "steps", steps: recipe.steps }, overrides)
      : undefined,
    variants,
  };
}

/** Applies step overrides to a recipe book (pure). */
export function applyJuiceOverrides(
  book: JuiceRecipeBook,
  overrides: JuiceOverrides
): JuiceRecipeBook {
  const steps = overrides.steps ?? {};
  if (Object.keys(steps).length === 0) return book;
  return Object.fromEntries(
    Object.entries(book).map(([event, recipe]) => [event, applyRecipe(event, recipe, steps)])
  );
}

/**
 * The one place juice is adjusted (juice-core D6): shipped recipes and defaults plus the
 * inspector's overrides, persisted (debounced) so they also apply in the game. Mirrors the
 * game-settings motion store (external store + subscribe).
 */
export function createJuiceTuning({
  book,
  defaults = DEFAULT_JUICE_TUNING,
  storage,
  writeDelayMs = 250,
}: JuiceTuningOptions): JuiceTuningStore {
  const safeRead = (): string | null => {
    try {
      return storage?.read() ?? null;
    } catch {
      return null;
    }
  };
  let overrides = parseJuiceOverrides(safeRead());
  let tuning = clampTuning({ ...defaults, ...overrides.global });
  let resolvedBook = applyJuiceOverrides(book, overrides);
  let writeTimer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<() => void>();

  const persist = (): void => {
    if (!storage) return;
    if (writeTimer) clearTimeout(writeTimer);
    const empty =
      Object.keys(overrides.global ?? {}).length === 0 &&
      Object.keys(overrides.steps ?? {}).length === 0;
    const value = empty ? null : JSON.stringify(overrides);
    writeTimer = setTimeout(() => {
      writeTimer = null;
      try {
        storage.write(value);
      } catch {
        // Storage blocked: the overrides hold for this page only.
      }
    }, writeDelayMs);
  };

  const update = (next: JuiceOverrides, write = true): void => {
    overrides = next;
    tuning = clampTuning({ ...defaults, ...overrides.global });
    resolvedBook = applyJuiceOverrides(book, overrides);
    if (write) persist();
    listeners.forEach((listener) => listener());
  };

  return {
    getTuning: () => tuning,
    getBook: () => resolvedBook,
    getOverrides: () => overrides,
    setGlobal: (key, value) =>
      update({ ...overrides, global: { ...overrides.global, [key]: value } }),
    setStepValue: ({ event, branch, index }, param, value) => {
      const key = juiceStepKey(event, branch, index);
      const steps = overrides.steps ?? {};
      update({ ...overrides, steps: { ...steps, [key]: { ...steps[key], [param]: value } } });
    },
    reset: () => update({}),
    reload: () => update(parseJuiceOverrides(safeRead()), false),
    exportOverrides: () => JSON.stringify(overrides, null, 2),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
