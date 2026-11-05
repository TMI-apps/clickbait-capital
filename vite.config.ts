import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { devTasksPlugin } from "./vite-plugin-dev-tasks";

/** One year: card images never change under the same URL. */
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Offline play + install (src/features/app-update/README.md). Production builds only:
// the dev server never registers a service worker (devOptions stay off).
const pwaPlugin = VitePWA({
  registerType: "prompt",
  injectRegister: false,
  // public/manifest.json is the manifest SSOT, linked from index.html.
  manifest: false,
  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2,mp3,json}"],
    // Social preview image is never shown in the app; card images use the runtime cache below.
    globIgnores: ["og-image.png", "cards/**"],
    navigateFallback: "/index.html",
    navigateFallbackDenylist: [/^\/__dev/, /^\/api\//],
    cleanupOutdatedCaches: true,
    runtimeCaching: [
      {
        urlPattern: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith("/cards/"),
        handler: "CacheFirst",
        options: {
          cacheName: "card-images",
          expiration: { maxEntries: 300, maxAgeSeconds: ONE_YEAR_SECONDS },
        },
      },
    ],
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), devTasksPlugin(), pwaPlugin],
  // Tags error reports as staging vs production; Cloudflare Workers Builds sets WORKERS_CI_BRANCH.
  define: { __BUILD_BRANCH__: JSON.stringify(process.env.WORKERS_CI_BRANCH ?? "") },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
