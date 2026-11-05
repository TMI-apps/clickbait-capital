const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { findInitialScripts, checkBudget, parseArgs } = require("./check-bundle-size.cjs");

describe("check-bundle-size", () => {
  test("should list the module entry and modulepreloads when index.html has them", () => {
    const html = `
      <script>/* color mode */</script>
      <script type="module" crossorigin src="/assets/index-abc.js"></script>
      <link rel="modulepreload" crossorigin href="/assets/vendor-def.js">
      <link rel="stylesheet" crossorigin href="/assets/index-xyz.css">
      <link rel="preload" href="/fonts/a.woff2" as="font">`;
    assert.deepEqual(findInitialScripts(html), ["/assets/index-abc.js", "/assets/vendor-def.js"]);
  });

  test("should pass when the gzip total is within the budget", () => {
    const result = checkBudget({
      files: [
        { path: "/assets/index.js", gzipBytes: 100 * 1024 },
        { path: "/assets/vendor.js", gzipBytes: 40 * 1024 },
      ],
      maxKib: 150,
    });
    assert.equal(result.ok, true);
    assert.equal(result.totalKib, 140);
  });

  test("should fail with a fix hint when the gzip total is over the budget", () => {
    const result = checkBudget({
      files: [{ path: "/assets/index.js", gzipBytes: 191 * 1024 }],
      maxKib: 150,
    });
    assert.equal(result.ok, false);
    assert.match(result.report, /over the 150 KiB budget/);
    assert.match(result.report, /lazy-load/);
  });

  test("should fail when no entry script was found", () => {
    const result = checkBudget({ files: [], maxKib: 150 });
    assert.equal(result.ok, false);
    assert.match(result.report, /pnpm build/);
  });

  test("should read the dist folder and budget when flags are given", () => {
    assert.deepEqual(parseArgs(["--dist", "out", "--max-kib", "120"]), {
      dist: "out",
      maxKib: 120,
    });
  });
});
