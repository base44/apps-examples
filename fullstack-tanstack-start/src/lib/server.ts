// Server-only helpers. Imported exclusively from inside `createServerFn`
// handlers, so the TanStack Start compiler strips this module (and the
// server-only `@tanstack/react-start/server` + `cloudflare:workers` imports it
// pulls in) out of the client bundle.

import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { createServerClient, type Base44Client } from "@base44/sdk";

/**
 * Build a request-scoped Base44 client on the Worker. It reads the visitor's
 * identity from the incoming request — the `base44_access_token` cookie the
 * browser SDK mirrors from localStorage, or an `Authorization: Bearer` header —
 * so every entity call it makes is executed AS that user and is subject to the
 * entity row-level-security rules. Anonymous visitors simply get a client whose
 * `auth.me()` rejects.
 */
export async function getServerClient(): Promise<Base44Client> {
  const request = getRequest();

  // `cloudflare:workers` only resolves on the Worker runtime, so import it
  // lazily here (never at module top level, which would leak the server-only
  // module into the client bundle). Under plain `vite dev` this throws and the
  // SDK falls back to resolving the app id from the request headers.
  let env: Record<string, string | undefined> | undefined;
  try {
    ({ env } = await import("cloudflare:workers"));
  } catch {
    // Not running on workerd — leave env undefined.
  }

  return createServerClient({ request, env });
}

/**
 * Mark the current response as private, uncacheable per-user data. Every CRM
 * route serves owner-scoped data, so nothing here may ever be edge- or
 * browser-cached.
 */
export function markPrivate(): void {
  setResponseHeader("Cache-Control", "no-store");
}
