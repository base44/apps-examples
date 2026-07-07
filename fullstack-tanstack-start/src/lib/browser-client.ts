// Browser-side Base44 client, used for client-side writes (kanban drag, forms)
// and the Sales Copilot chat. Created with serverUrl: "" so every SDK call is
// SAME-ORIGIN — the apps dispatcher reverse-proxies /api/apps/* (and the
// /ws-user-apps/* websocket) to the platform, so there is zero CORS and no
// platform origin ever appears in browser code. Only the app id is threaded
// from the server (resolved at RUNTIME from the Worker env — `--prebuilt`
// deploys have no build-time env). The SDK reads the logged-in user's token
// from localStorage automatically, so writes are still RLS-scoped to the rep.

import { createClient, type Base44Client } from "@base44/sdk";
import type { Base44Config } from "./types.js";

let cached: { key: string; client: Base44Client } | null = null;

export function getBrowserClient(config: Base44Config): Base44Client {
  const key = config.appId;
  if (cached?.key === key) return cached.client;
  const client = createClient({ appId: config.appId, serverUrl: "" });
  cached = { key, client };
  return client;
}
