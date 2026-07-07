// Server-side Base44 client helpers.
//
// `createServerClient` reads the visitor's identity from the incoming request
// (the `base44_access_token` cookie mirrored by the browser, or an
// `Authorization: Bearer` header) and the Base44 config from the Worker env.
// It throws when no app id is resolvable — e.g. during plain `astro dev`, which
// has no Base44 config. Auth-flavored callers treat that as a logged-out view;
// catalog reads (see store.ts) fail loudly instead — there is no mock fallback.
//
// In Astro 6 the Cloudflare adapter exposes the Worker env via the
// `cloudflare:workers` module (the old `Astro.locals.runtime.env` was removed).
// We read it defensively so the same code also runs under plain Node.

import { env as workerEnv } from "cloudflare:workers";
import { createServerClient } from "@base44/sdk";
import type { Base44Client } from "@base44/sdk";

type RuntimeEnv = Record<string, string | undefined>;

/** The bits of the Astro/API context these helpers actually use. */
export interface AstroLike {
  request: Request;
  url: URL;
}

/** Read the Base44-relevant Worker env vars, or `undefined` when unavailable. */
export function runtimeEnv(): RuntimeEnv | undefined {
  try {
    const e = workerEnv as RuntimeEnv;
    return {
      BASE44_APP_ID: e.BASE44_APP_ID,
      BASE44_API_URL: e.BASE44_API_URL,
      BASE44_SERVICE_TOKEN: e.BASE44_SERVICE_TOKEN,
      BASE44_FUNCTIONS_VERSION: e.BASE44_FUNCTIONS_VERSION,
    };
  } catch {
    return undefined;
  }
}

/**
 * Create a request-scoped Base44 client, or `null` when the app id can't be
 * resolved (running outside Base44). Auth callers treat `null` as logged-out;
 * catalog reads in store.ts reject it loudly.
 */
export function getServerClient(astro: AstroLike): Base44Client | null {
  try {
    return createServerClient({ request: astro.request, env: runtimeEnv() });
  } catch {
    return null;
  }
}

/** Resolve the current app id from the Worker env or the Base44 request header. */
export function resolveAppId(astro: AstroLike): string | null {
  return runtimeEnv()?.BASE44_APP_ID ?? astro.request.headers.get("base44-app-id") ?? null;
}

/**
 * Build the URL of the app's OWN login page (`src/pages/login.astro`),
 * returning the visitor to `nextUrl` after sign-in. The app owns `/login`
 * (and every path outside the platform-reserved `/api/apps/*` and
 * `/ws-user-apps/*`), so this is a plain same-origin link. Returns `null`
 * when there is no app id (plain local dev with no backend), in which case
 * the UI hides the sign-in affordance. The URL is identical for every
 * visitor of a given page, so it's safe to render on cached pages.
 */
export function loginUrlFor(astro: AstroLike, nextUrl: string): string | null {
  if (!resolveAppId(astro)) return null;
  const next = new URL(nextUrl, astro.url);
  return `/login?from=${encodeURIComponent(next.pathname + next.search)}`;
}

/** Get the current user, or `null` if logged out / no backend. Never throws. */
export async function getUser(base44: Base44Client | null) {
  if (!base44) return null;
  try {
    return await base44.auth.me();
  } catch {
    return null;
  }
}
