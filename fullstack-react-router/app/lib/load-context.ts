// Augments React Router's AppLoadContext with the shape the Cloudflare Worker
// passes as the loader/action `context` (see workers/app.ts). This lets loaders
// read `context.cloudflare.env` with full type safety.
import "react-router";

export type WorkerEnv = Record<string, string | undefined>;

declare module "react-router" {
  interface AppLoadContext {
    cloudflare: {
      env: WorkerEnv;
      ctx: { waitUntil(promise: Promise<unknown>): void };
    };
  }
}
