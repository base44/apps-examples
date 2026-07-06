// Client-side write actions.
//
// Mutations go through same-origin Astro API routes (`/api/*`) which run a
// server-side Base44 client authenticated from the visitor's cookie. Keeping
// the write on the server means the browser never needs the SDK or the app id,
// and RLS is enforced with the real user identity.

import { cartCurrency, cartSubtotal, clearCart, getCart } from "./cart";

function setMsg(el: HTMLElement | null, text: string, ok: boolean): void {
  if (!el) return;
  el.hidden = false;
  el.textContent = text;
  el.classList.toggle("is-ok", ok);
  el.classList.toggle("is-error", !ok);
}

/** Wire the "write a review" form on the product page. */
export function postReview(): void {
  const form = document.querySelector<HTMLFormElement>("[data-review-form]");
  if (!form) return;
  const msg = form.querySelector<HTMLElement>("[data-review-msg]");
  const loginUrl = form.dataset.loginUrl || "";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const payload = {
      product_id: String(data.get("product_id") || ""),
      rating: Number(data.get("rating") || 0),
      title: String(data.get("title") || ""),
      body: String(data.get("body") || ""),
      author_name: String(data.get("author_name") || ""),
    };
    const submit = form.querySelector<HTMLButtonElement>("button[type=submit]");
    if (submit) submit.disabled = true;
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setMsg(msg, "Thanks! Refreshing…", true);
        location.reload();
        return;
      }
      if (res.status === 401) {
        if (msg) {
          msg.hidden = false;
          msg.classList.add("is-error");
          msg.innerHTML = loginUrl
            ? `Please <a href="${loginUrl}">sign in</a> to post a review.`
            : "Please sign in to post a review.";
        }
      } else {
        setMsg(msg, "Something went wrong. Please try again.", false);
      }
    } catch {
      setMsg(msg, "Network error. Please try again.", false);
    } finally {
      if (submit) submit.disabled = false;
    }
  });
}

/** Wire the checkout form. Turns the local cart into an Order. */
export function placeOrder(): void {
  const form = document.querySelector<HTMLFormElement>("[data-checkout-form]");
  if (!form) return;
  const msg = form.querySelector<HTMLElement>("[data-checkout-msg]");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const cart = getCart();
    if (cart.length === 0) {
      setMsg(msg, "Your cart is empty.", false);
      return;
    }
    const data = new FormData(form);
    const payload = {
      items: cart.map((l) => ({
        product_id: l.id,
        name: l.name,
        qty: l.qty,
        unit_price: l.price,
      })),
      total: cartSubtotal(cart),
      currency: cartCurrency(cart),
      customer_email: String(data.get("email") || ""),
      shipping_address: {
        name: String(data.get("name") || ""),
        line1: String(data.get("line1") || ""),
        line2: String(data.get("line2") || ""),
        city: String(data.get("city") || ""),
        region: String(data.get("region") || ""),
        postal_code: String(data.get("postal_code") || ""),
        country: String(data.get("country") || ""),
      },
    };
    const submit = form.querySelector<HTMLButtonElement>("button[type=submit]");
    if (submit) submit.disabled = true;
    setMsg(msg, "Placing your order…", true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        clearCart();
        location.assign("/account/orders?placed=1");
        return;
      }
      if (res.status === 401) {
        setMsg(msg, "Please sign in to complete checkout.", false);
      } else {
        setMsg(msg, "We couldn't place your order. Please try again.", false);
      }
    } catch {
      setMsg(msg, "Network error. Please try again.", false);
    } finally {
      if (submit) submit.disabled = false;
    }
  });
}
