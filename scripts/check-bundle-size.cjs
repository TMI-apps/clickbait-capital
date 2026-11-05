#!/usr/bin/env node
/**
 * Main-chunk bundle budget: fails when the JavaScript that `dist/index.html` loads before the app
 * can render (the entry module plus its modulepreloads) grows past the gzip budget.
 *
 * Why: the first load on phones is the game's front door (Lighthouse mobile >= 90). Route pages and
 * supabase-js are lazy chunks; this catches a static import that pulls them back into the main chunk.
 * Run after `pnpm build`: `pnpm validate:bundle-size` (optional `--max-kib <n>`, `--dist <dir>`).
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

/** Gzip budget for the initial JS, in KiB. Main chunk was ~136 KiB at v0.44.0 (supabase-js lazy). */
const DEFAULT_MAX_KIB = 150;

/**
 * Paths of the JS that index.html loads up front: `<script type="module" src>` and
 * `<link rel="modulepreload" href>`. Inline scripts have no src and are ignored.
 * @param {string} html
 * @returns {string[]}
 */
function findInitialScripts(html) {
  const found = new Set();
  for (const tag of html.match(/<script\b[^>]*>/g) ?? []) {
    const src = tag.match(/\bsrc="([^"]+)"/);
    if (/\btype="module"/.test(tag) && src) found.add(src[1]);
  }
  for (const tag of html.match(/<link\b[^>]*>/g) ?? []) {
    const href = tag.match(/\bhref="([^"]+)"/);
    if (/\brel="modulepreload"/.test(tag) && href) found.add(href[1]);
  }
  return [...found];
}

/**
 * @param {{ files: { path: string, gzipBytes: number }[], maxKib: number }} input
 * @returns {{ ok: boolean, totalKib: number, report: string }}
 */
function checkBudget({ files, maxKib }) {
  const totalBytes = files.reduce((sum, file) => sum + file.gzipBytes, 0);
  const totalKib = Math.round((totalBytes / 1024) * 10) / 10;
  const lines = files.map((file) => `  ${(file.gzipBytes / 1024).toFixed(1)} KiB  ${file.path}`);
  const ok = files.length > 0 && totalKib <= maxKib;
  const verdict = ok
    ? `OK: initial JS ${totalKib} KiB gzip (budget ${maxKib} KiB).`
    : files.length === 0
      ? "FAIL: no entry script found in index.html (run `pnpm build` first)."
      : `FAIL: initial JS ${totalKib} KiB gzip is over the ${maxKib} KiB budget. ` +
        "Find the static import that pulled a heavy module into the main chunk and lazy-load it " +
        "(React.lazy / import()); raise the budget only for a deliberate, recorded trade-off.";
  return { ok, totalKib, report: [...lines, verdict].join("\n") };
}

/** @param {string[]} argv */
function parseArgs(argv) {
  const options = { dist: "dist", maxKib: DEFAULT_MAX_KIB };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--dist") options.dist = argv[(i += 1)];
    else if (argv[i] === "--max-kib") options.maxKib = Number(argv[(i += 1)]);
  }
  return options;
}

function main() {
  const { dist, maxKib } = parseArgs(process.argv.slice(2));
  const indexPath = path.resolve(dist, "index.html");
  if (!fs.existsSync(indexPath)) {
    console.error(`FAIL: ${indexPath} not found (run \`pnpm build\` first).`);
    process.exit(1);
  }
  const files = findInitialScripts(fs.readFileSync(indexPath, "utf8")).map((src) => ({
    path: src,
    gzipBytes: zlib.gzipSync(fs.readFileSync(path.join(dist, src.replace(/^\//, "")))).length,
  }));
  const { ok, report } = checkBudget({ files, maxKib });
  (ok ? console.log : console.error)(report);
  if (!ok) process.exit(1);
}

if (require.main === module) main();

module.exports = { DEFAULT_MAX_KIB, findInitialScripts, checkBudget, parseArgs };
