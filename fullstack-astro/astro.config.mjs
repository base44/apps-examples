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
});
