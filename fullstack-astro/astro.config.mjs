import { defineConfig, sessionDrivers } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
  // Base44 full-stack hosting doesn't support extra Worker bindings yet, so
  // avoid the adapter defaults that auto-provision them:
  // - imageService "cloudflare-binding" would add an IMAGES binding
  // - the default session driver would add a SESSION KV binding
  adapter: cloudflare({ imageService: "passthrough" }),
  session: { driver: sessionDrivers.memory() },
  // Hybrid rendering: pages that opt in with `export const prerender = true`
  // (/about, /brewing, the 404) are emitted as static HTML into dist/client
  // and served by the platform's asset layer BEFORE any Worker code runs.
  // "file" format emits `about.html` (not `about/index.html`) so `/about` is
  // served directly with a 200 instead of a trailing-slash redirect.
  build: { format: "file" },
  // Astro 7 changed the default to "jsx", which strips whitespace around
  // inline elements that sit on their own line (breaking spacing in prose
  // with inline links). Keep the HTML-aware v6 behaviour.
  compressHTML: true,
});
