import { createFileRoute } from "@tanstack/react-router";

// A server route: a raw HTTP endpoint that lives next to the pages. Handlers get
// `context.getBase44()` like server functions do. Never define routes under
// /api/apps or /api/app-logs — those belong to the Base44 platform.
export const Route = createFileRoute("/api/time")({
  server: {
    handlers: {
      GET: async () => Response.json({ now: new Date().toISOString() }, { headers: { "cache-control": "no-store" } }),
    },
  },
});
