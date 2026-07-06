import { createServerClient, getLoginUrl } from "@base44/sdk";
import type { AppLoadContext } from "react-router";
import type { SessionUser } from "./types";

// Server-only Base44 helpers. Everything here runs inside the Worker loader/
// action — the service token (when present) never crosses to the browser.

export function getServerClient(request: Request, context: AppLoadContext) {
  return createServerClient({ request, env: context.cloudflare.env });
}

// Reader for the PUBLIC catalog (Property has `read: true` RLS).
// Prefer the service role when a service token is available (guaranteed on
// Base44 hosting) so reads are unaffected by any future RLS tightening; fall
// back to the anonymous request-scoped client, which can still read public
// listings. Either way, no elevated token reaches the client bundle.
export function getCatalogReader(request: Request, context: AppLoadContext) {
  const base44 = getServerClient(request, context);
  return context.cloudflare.env?.BASE44_SERVICE_TOKEN
    ? base44.asServiceRole
    : base44;
}

export async function getCurrentUser(
  base44: ReturnType<typeof getServerClient>,
): Promise<SessionUser | null> {
  return base44.auth
    .me()
    .then((u) => (u ? (u as unknown as SessionUser) : null))
    .catch(() => null);
}

// Absolute URL of the hosted Base44 login page, returning to `nextUrl` after
// sign-in. Used by private loaders to redirect anonymous visitors.
export function loginUrl(context: AppLoadContext, nextUrl: string): string {
  const env = context.cloudflare.env;
  const appId = env.BASE44_APP_ID ?? "";
  const serverUrl = env.BASE44_API_URL ?? "https://base44.app";
  return getLoginUrl(nextUrl, { serverUrl, appId });
}
