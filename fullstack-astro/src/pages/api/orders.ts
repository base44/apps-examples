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

interface IncomingItem {
  product_id?: unknown;
  name?: unknown;
  qty?: unknown;
  unit_price?: unknown;
}

// Create an Order from the shopper's cart. Requires auth; Base44 stamps
// `created_by`, which the owner-scoped Order RLS uses so a shopper only ever
// sees their own orders. The server recomputes the total from the line items
// rather than trusting the client-sent total.
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

  const rawItems = Array.isArray(payload.items) ? (payload.items as IncomingItem[]) : [];
  const items = rawItems
    .map((it) => ({
      product_id: String(it.product_id ?? ""),
      name: String(it.name ?? ""),
      qty: Math.max(1, Math.floor(Number(it.qty ?? 1))),
      unit_price: Number(it.unit_price ?? 0),
    }))
    .filter((it) => it.product_id && Number.isFinite(it.unit_price));

  if (items.length === 0) return json({ error: "empty_cart" }, 400);

  const total = Math.round(items.reduce((sum, it) => sum + it.unit_price * it.qty, 0) * 100) / 100;
  const currency = String(payload.currency ?? "USD");
  const shipping = (payload.shipping_address ?? {}) as Record<string, unknown>;

  try {
    const order = await base44.entities.Order.create({
      items,
      total,
      currency,
      status: "pending",
      customer_email: String(payload.customer_email ?? "") || user.email,
      shipping_address: {
        name: String(shipping.name ?? ""),
        line1: String(shipping.line1 ?? ""),
        line2: String(shipping.line2 ?? ""),
        city: String(shipping.city ?? ""),
        region: String(shipping.region ?? ""),
        postal_code: String(shipping.postal_code ?? ""),
        country: String(shipping.country ?? ""),
      },
    });
    return json({ ok: true, order }, 201);
  } catch {
    return json({ error: "create_failed" }, 500);
  }
};
