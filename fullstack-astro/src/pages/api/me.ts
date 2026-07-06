import type { APIRoute } from "astro";
import { getServerClient, getUser } from "../../lib/base44";

// Returns the current visitor's identity (or null). The header uses this to
// personalise itself ON THE CLIENT, so the server-rendered catalog HTML can
// stay identical for everyone and remain edge-cacheable. This response itself
// is per-user, so it must never be shared by a cache.
export const GET: APIRoute = async (context) => {
  const base44 = getServerClient(context);
  const user = await getUser(base44);
  const body = user
    ? { user: { full_name: user.full_name ?? null, email: user.email } }
    : { user: null };
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "private, no-store",
    },
  });
};
