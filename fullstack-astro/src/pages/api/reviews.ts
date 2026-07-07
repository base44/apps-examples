import type { APIRoute } from "astro";
import { getServerClient, getUser } from "../../lib/base44";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "private, no-store",
    },
  });

// Create a Review. Reviews are publicly readable (RLS), but posting one
// requires a signed-in shopper: we enforce that here and let Base44 stamp
// `created_by` from the authenticated identity so the owner-scoped edit/delete
// RLS works.
export const POST: APIRoute = async (context) => {
  const base44 = getServerClient(context);
  if (!base44) return json({ error: "backend_unavailable" }, 503);

  const user = await getUser(base44);
  if (!user) return json({ error: "unauthorized" }, 401);

  let payload: Record<string, unknown>;
  try {
    payload = await context.request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const productId = String(payload.product_id ?? "");
  const rating = Number(payload.rating ?? 0);
  if (!productId || !Number.isFinite(rating) || rating < 1 || rating > 5) {
    return json({ error: "invalid_review" }, 400);
  }

  try {
    const review = await base44.entities.Review.create({
      product_id: productId,
      rating,
      title: String(payload.title ?? "").slice(0, 120),
      body: String(payload.body ?? "").slice(0, 2000),
      author_name:
        String(payload.author_name ?? "").slice(0, 80) || user.full_name || "Anonymous",
    });
    return json({ ok: true, review }, 201);
  } catch {
    return json({ error: "create_failed" }, 500);
  }
};
