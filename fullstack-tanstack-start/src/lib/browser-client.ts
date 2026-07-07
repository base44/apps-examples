// Browser-side Base44 client, used for client-side writes (kanban drag, forms)
// and the Sales Copilot chat. The full SDK config — app id AND API origin — is
// resolved on the server at RUNTIME (from the Worker env) and handed down
// through the root route context, so nothing depends on build-time env
// (`--prebuilt` deploys have none). Without an explicit serverUrl the SDK
// defaults to the production platform, which is the wrong backend for apps
// served from any other environment. The SDK reads the logged-in user's token
// from localStorage automatically, so writes are still RLS-scoped to the rep.

import { createClient, type Base44Client } from "@base44/sdk";
import type { Base44Config } from "./types.js";

let cached: { key: string; client: Base44Client } | null = null;

export function getBrowserClient(config: Base44Config): Base44Client {
  const key = `${config.appId}|${config.apiUrl ?? ""}`;
  if (cached?.key === key) return cached.client;
  const client = createClient({
    appId: config.appId,
    ...(config.apiUrl ? { serverUrl: config.apiUrl } : {}),
  });
  cached = { key, client };
  return client;
}
