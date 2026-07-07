// Session server function — runs on the Worker for every request (invoked from
// the root route's beforeLoad). Resolves the Base44 SDK config (app id + API
// origin, forwarded to the browser SDK for client-side writes) and the
// logged-in user, entirely server-side and entirely at RUNTIME — nothing here
// depends on build-time env, which `--prebuilt` deploys don't have.

import { createServerFn } from "@tanstack/react-start";
import { getServerClient, markPrivate } from "./server.js";
import type { Session } from "./types.js";

export const getSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<Session> => {
    markPrivate();

    try {
      const base44 = await getServerClient();
      const { appId, serverUrl } = base44.getConfig();
      const me = await base44.auth.me().catch(() => null);
      const user = me
        ? { email: me.email, full_name: me.full_name ?? null, role: me.role ?? "user" }
        : null;
      return {
        base44: appId ? { appId, apiUrl: serverUrl ?? null } : null,
        user,
      };
    } catch {
      // No app id resolvable (running outside Base44) — treat as anonymous.
      return { base44: null, user: null };
    }
  },
);
