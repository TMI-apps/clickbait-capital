/**
 * Feature size budgets — SSOT for anti-monolith enforcement.
 *
 * @relatedFiles
 * - scripts/validate-feature-size.js
 * - scripts/generate-feature-baseline.js
 * - .claude/rules/architecture.md § Feature granularity
 */
/** @type {import('./scripts/feature-size-lib').FeatureBudgetsConfig} */
module.exports = {
  defaults: {
    maxFilesPerLayer: 10,
    maxFilesPerFeature: 25,
  },
  /** Per-feature waivers — `reason` is required (non-empty). */
  overrides: {
    "game-content": {
      maxFilesPerLayer: 12,
      reason:
        "Content data: one services file per content kind (viral, ad, news, events, phases, endings, UI copy, followers) plus the assembly and tests; splitting the deck across features would scatter one content set (follower-chat D2).",
    },
  },
  /**
   * Grandfathered snapshots for features that exceeded defaults at baseline time.
   * Regenerate: pnpm validate:feature-size:baseline
   * New files in a baseline feature fail once counts exceed the snapshot.
   */
  baseline: {
    auth: {
      totalFiles: 28,
      layers: {
        components: 5,
        hooks: 13,
        services: 8,
        types: 2,
      },
    },
  },
};
