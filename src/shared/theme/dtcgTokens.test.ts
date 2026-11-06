import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { afterAll, describe, expect, it } from "vitest";
import { THEME_COLOR_TOKENS, THEME_TOKENS } from "./themeTokens";

/*
 * Contract for the W3C DTCG 2025.10 token source (src/shared/theme/tokens/):
 * spec conformance, generated CSS in sync, and CSS names in sync with THEME_TOKENS.
 * Guide: documentation/DOC_THEMING.md
 */

const repoRoot = resolve(__dirname, "../../..");
const tokensDir = resolve(__dirname, "tokens");
const generatedCss = readFileSync(join(tokensDir, "tokens.generated.css"), "utf8");

/** Tokens `applyTheme` accepts that the DTCG files leave out on purpose (derived in index.css). */
const OPTIONAL_TOKENS = ["card-radius", "input-radius"];
/** Elevations whose colour follows the mode (light/dark.tokens.json). */
const MODE_ELEVATIONS = ["elevation-brand", "elevation-brand-active", "elevation-glow"];
const MOTION_DURATIONS = [
  "duration-fast",
  "duration-normal",
  "duration-slow",
  "duration-card-draw",
  "duration-card-play",
  "duration-juice",
  "duration-juice-shake",
  "duration-count",
];

type ColorValue = { colorSpace: string; components: number[]; hex?: string };

const FORMAT_SCHEMA = "https://www.designtokens.org/schemas/2025.10/format.json";
const RESOLVER_SCHEMA = "https://www.designtokens.org/schemas/2025.10/resolver.json";

const createSpecValidator = () => {
  const bundle = JSON.parse(
    readFileSync(join(repoRoot, "scripts/dtcg-schemas-2025.10.json"), "utf8")
  ) as { schemas: Record<string, object> };
  const ajv = new Ajv({ strict: false, allErrors: true });
  addFormats(ajv);
  for (const schema of Object.values(bundle.schemas)) ajv.addSchema(schema);
  return (schemaId: string, document: unknown) => {
    const validate = ajv.getSchema(schemaId);
    if (!validate) throw new Error(`Missing vendored schema ${schemaId}`);
    return validate(document) ? [] : (validate.errors ?? []);
  };
};

/** Custom property names declared in the block that starts with `prelude {`. */
const declaredIn = (prelude: string): string[] => {
  const start = generatedCss.indexOf(`${prelude} {`);
  if (start === -1) return [];
  const end = generatedCss.indexOf("\n}", start);
  return [...generatedCss.slice(start, end).matchAll(/^\s*--([a-z0-9-]+):/gm)].map((m) => m[1]);
};

describe("DTCG token files", () => {
  const validate = createSpecValidator();
  const files = readdirSync(tokensDir).filter((file) => file.endsWith(".json"));

  it.each(files)("should conform to the DTCG 2025.10 schema: %s", (file) => {
    const document = JSON.parse(readFileSync(join(tokensDir, file), "utf8"));
    const schemaId = file.endsWith(".resolver.json") ? RESOLVER_SCHEMA : FORMAT_SCHEMA;

    expect(validate(schemaId, document)).toEqual([]);
  });

  it("should keep every hex fallback equal to its sRGB components", () => {
    const mismatches: string[] = [];
    const visit = (node: unknown, path: string): void => {
      if (!node || typeof node !== "object") return;
      const value = (node as { $value?: unknown }).$value as ColorValue | undefined;
      if (value?.colorSpace === "srgb" && value.hex) {
        const hex = `#${value.components
          .map((c) =>
            Math.round(c * 255)
              .toString(16)
              .padStart(2, "0")
          )
          .join("")}`;
        if (hex !== value.hex.toLowerCase()) mismatches.push(`${path}: ${value.hex} vs ${hex}`);
      }
      for (const [key, child] of Object.entries(node)) visit(child, `${path}/${key}`);
    };
    for (const file of files) visit(JSON.parse(readFileSync(join(tokensDir, file), "utf8")), file);

    expect(mismatches).toEqual([]);
  });

  it("should reject tokens that break the spec", () => {
    const notASpecType = { label: { $type: "string", $value: "x" } };
    const colorWithoutSpace = { brand: { $type: "color", $value: { components: [1, 0, 0] } } };

    expect(validate(FORMAT_SCHEMA, notASpecType)).not.toEqual([]);
    expect(validate(FORMAT_SCHEMA, colorWithoutSpace)).not.toEqual([]);
  });
});

describe("generated token CSS", () => {
  const outDir = mkdtempSync(join(tmpdir(), "dtcg-tokens-"));
  afterAll(() => rmSync(outDir, { recursive: true, force: true }));

  it("should match a fresh build (run pnpm tokens:build after editing token files)", () => {
    // Run the CLI's JS entry through node: .bin/tz is a shell script that Windows can't execute.
    execFileSync(
      process.execPath,
      [
        join(repoRoot, "node_modules/@terrazzo/cli/bin/cli.js"),
        "build",
        "-c",
        "scripts/terrazzo.config.js",
        "--quiet",
      ],
      { cwd: repoRoot, env: { ...process.env, TOKENS_OUT_DIR: `${outDir}/` }, stdio: "pipe" }
    );
    const fresh = readFileSync(join(outDir, "tokens.generated.css"), "utf8");

    expect(fresh).toBe(generatedCss);
  }, 30_000);

  it("should declare every theme token in :root except the optional ones", () => {
    const expected = THEME_TOKENS.filter((token) => !OPTIONAL_TOKENS.includes(token));

    expect([...declaredIn(":root")].sort()).toEqual([...expected].sort());
  });

  it("should override only mode-dependent tokens in .dark", () => {
    const expected = [...THEME_COLOR_TOKENS, ...MODE_ELEVATIONS];

    expect([...declaredIn(".dark")].sort()).toEqual([...expected].sort());
  });

  it("should override only durations for reduced motion", () => {
    const reduced = declaredIn("@media (prefers-reduced-motion: reduce)");

    expect([...reduced].sort()).toEqual([...MOTION_DURATIONS].sort());
  });
});

describe("game colour contrast (WCAG AA)", () => {
  const relativeLuminance = (hex: string): number => {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a: string, b: string): number => {
    const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const colorsOf = (mode: "light" | "dark"): Record<string, string> => {
    const doc = JSON.parse(readFileSync(join(tokensDir, `${mode}.tokens.json`), "utf8")) as Record<
      string,
      Record<string, { $value?: ColorValue }>
    >;
    const out: Record<string, string> = {};
    for (const group of Object.values(doc)) {
      for (const [name, token] of Object.entries(group)) {
        if (token?.$value?.hex) out[name] = token.$value.hex;
      }
    }
    return out;
  };
  const CARD_TYPES = ["type-viral", "type-ad", "type-news", "type-event"];
  const METERS = ["meter-revenue", "meter-users", "meter-reputation"];

  it.each(["light", "dark"] as const)(
    "should keep type chip text at 4.5:1 and type frames at 3:1 when mode is %s",
    (mode) => {
      const c = colorsOf(mode);
      for (const type of CARD_TYPES) {
        expect(contrast(c[type], c[`${type}-foreground`]), type).toBeGreaterThanOrEqual(4.5);
        expect(contrast(c[type], c.card), `${type} frame`).toBeGreaterThanOrEqual(3);
      }
    }
  );

  it.each(["light", "dark"] as const)(
    "should keep meter and delta colours at 4.5:1 on the card surface when mode is %s",
    (mode) => {
      const c = colorsOf(mode);
      for (const name of [...METERS, "success", "destructive"]) {
        expect(contrast(c[name], c.card), name).toBeGreaterThanOrEqual(4.5);
      }
    }
  );

  /** `top` (with alpha) laid over the opaque `base`, as the browser composites the wash. */
  const over = (base: string, top: string, alpha: number): string =>
    "#" +
    [1, 3, 5]
      .map((i) => {
        const value =
          (1 - alpha) * parseInt(base.slice(i, i + 2), 16) +
          alpha * parseInt(top.slice(i, i + 2), 16);
        return Math.round(value).toString(16).padStart(2, "0");
      })
      .join("");
  const alphaOf = (mode: "light" | "dark", name: string): number => {
    const doc = JSON.parse(readFileSync(join(tokensDir, `${mode}.tokens.json`), "utf8")) as {
      color: Record<string, { $value: ColorValue & { alpha?: number } }>;
    };
    return doc.color[name].$value.alpha ?? 1;
  };

  it.each(["light", "dark"] as const)(
    "should keep choice and outline content at 4.5:1 on the hover and press washes when mode is %s",
    (mode) => {
      const c = colorsOf(mode);
      const content = ["card-foreground", "muted-foreground", ...METERS, "success", "destructive"];
      for (const wash of ["interactive-tint", "interactive-tint-strong"]) {
        const surface = over(c.card, c[wash], alphaOf(mode, wash));
        for (const name of content) {
          expect(contrast(c[name], surface), `${name} on ${wash}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  );
});
