/**
 * Production origin and the public, indexable routes. SSOT for the canonical link (`App.tsx`)
 * and `public/sitemap.txt` (`site.test.ts` keeps them equal). Hidden routes (`/login`,
 * `/reset-password`, `/auth/callback`, `/tasks`) stay out on purpose.
 */
export const SITE_ORIGIN = "https://clickbait-capital.tmi-5ba.workers.dev";

export const PUBLIC_PATHS: readonly string[] = [
  "/",
  "/spel",
  "/hoe-speel-je",
  "/instellingen",
  "/credits",
  "/privacy",
];

/** Canonical production URL for a public path; `null` for hidden or unknown routes. */
export const getCanonicalUrl = (pathname: string): string | null =>
  PUBLIC_PATHS.includes(pathname) ? `${SITE_ORIGIN}${pathname}` : null;
