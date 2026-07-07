import { createClient, type Base44Client } from "@base44/sdk";

// Browser-only Base44 client, created lazily on first use (login, save-favorite,
// the concierge widget). It is configured purely from the app ID that the server
// injects into the document as a <meta> tag (CSP-safe — no inline script) with a
// Vite env fallback for pure client-side dev. serverUrl: "" makes every SDK call
// SAME-ORIGIN — the apps dispatcher reverse-proxies /api/apps/* (and the
// /ws-user-apps/* websocket) to the platform, so no CORS and no platform origin
// in browser code. It carries NO service token: the client can only ever act as
// the anonymous or logged-in user.

let client: Base44Client | null = null;

function readMeta(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const el = document.querySelector(`meta[name="${name}"]`);
  const content = el?.getAttribute("content")?.trim();
  return content || undefined;
}

export function getBrowserClient(): Base44Client {
  if (client) return client;

  const appId =
    readMeta("base44:app-id") ??
    (import.meta.env.VITE_BASE44_APP_ID as string | undefined);
  if (!appId) {
    throw new Error(
      "Base44 app ID is not configured. Link the project (npx base44 link) so the server can inject it, or set VITE_BASE44_APP_ID for local client-only dev.",
    );
  }

  client = createClient({ appId, serverUrl: "" });
  return client;
}
