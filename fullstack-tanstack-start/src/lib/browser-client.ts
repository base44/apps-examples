// Browser-side Base44 client, used for client-side writes (kanban drag, forms)
// and the Sales Copilot chat. The app id is resolved on the server and handed
// down through the root route context; the SDK reads the logged-in user's token
// from localStorage automatically, so writes are still RLS-scoped to the rep.

import { createClient, type Base44Client } from "@base44/sdk";

let cached: { appId: string; client: Base44Client } | null = null;

export function getBrowserClient(appId: string): Base44Client {
  if (cached?.appId === appId) return cached.client;
  const client = createClient({ appId });
  cached = { appId, client };
  return client;
}
