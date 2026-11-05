import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getCanonicalUrl, PUBLIC_PATHS, SITE_ORIGIN } from "@/config/site";

const readPublic = (name: string): string =>
  readFileSync(resolve(__dirname, "../../public", name), "utf8");

describe("site config", () => {
  it("should list exactly the public routes when the sitemap is read", () => {
    const urls = readPublic("sitemap.txt").split("\n").filter(Boolean);
    expect(urls).toEqual(PUBLIC_PATHS.map((path) => `${SITE_ORIGIN}${path}`));
  });

  it("should point crawlers at the sitemap when robots.txt is read", () => {
    expect(readPublic("robots.txt")).toContain(`Sitemap: ${SITE_ORIGIN}/sitemap.txt`);
  });

  it("should return no canonical url when the route is hidden", () => {
    expect(getCanonicalUrl("/login")).toBeNull();
    expect(getCanonicalUrl("/tasks")).toBeNull();
    expect(getCanonicalUrl("/privacy")).toBe(`${SITE_ORIGIN}/privacy`);
  });
});
