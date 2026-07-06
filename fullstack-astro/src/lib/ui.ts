// Site-wide client behaviour, imported once from the Layout.
//
// Two responsibilities, both designed to keep public pages cache-safe:
//   1. Cart: add-to-cart buttons + the header badge run purely off localStorage,
//      so the server-rendered HTML never depends on who is viewing it.
//   2. Auth hydration: the header is rendered generically on the server (so the
//      cached HTML is identical for everyone) and personalised here on the
//      client by asking the private `/api/me` endpoint who the visitor is.

import {
  addToCart,
  cartCount,
  onCartChange,
  type CartLine,
} from "./cart";

const TOKEN_KEY = "base44_access_token";

function refreshCartBadge(): void {
  const count = cartCount();
  document.querySelectorAll<HTMLElement>("[data-cart-count]").forEach((el) => {
    el.textContent = String(count);
    el.hidden = count === 0;
  });
}

function wireAddToCart(): void {
  document.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement)?.closest<HTMLElement>(
      "[data-add-to-cart]",
    );
    if (!target) return;
    event.preventDefault();
    const line: Omit<CartLine, "qty"> = {
      id: target.dataset.id ?? "",
      slug: target.dataset.slug ?? "",
      name: target.dataset.name ?? "",
      price: Number(target.dataset.price ?? "0"),
      currency: target.dataset.currency ?? "USD",
      accent: target.dataset.accent,
    };
    if (!line.id) return;
    addToCart(line);
    flash(`${line.name} added to cart`);
  });
}

let flashTimer: number | undefined;
function flash(message: string): void {
  let toast = document.querySelector<HTMLElement>("[data-toast]");
  if (!toast) {
    toast = document.createElement("div");
    toast.setAttribute("data-toast", "");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(flashTimer);
  flashTimer = window.setTimeout(() => toast?.classList.remove("is-visible"), 2200);
}

function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

function wireSignOut(): void {
  document.addEventListener("click", (event) => {
    const btn = (event.target as HTMLElement)?.closest("[data-logout]");
    if (!btn) return;
    event.preventDefault();
    clearToken();
    location.reload();
  });
}

async function hydrateAccount(): Promise<void> {
  const slot = document.querySelector<HTMLElement>("[data-account]");
  if (!slot) return;
  let user: { full_name?: string | null; email?: string } | null = null;
  try {
    const res = await fetch("/api/me", { credentials: "same-origin" });
    if (res.ok) user = (await res.json()).user ?? null;
  } catch {
    /* stay logged out */
  }
  const signedIn = slot.querySelector<HTMLElement>("[data-account-in]");
  const signedOut = slot.querySelector<HTMLElement>("[data-account-out]");
  const nameEl = slot.querySelector<HTMLElement>("[data-account-name]");
  if (user) {
    if (nameEl) nameEl.textContent = user.full_name || user.email || "Account";
    if (signedIn) signedIn.hidden = false;
    if (signedOut) signedOut.hidden = true;
  } else {
    if (signedIn) signedIn.hidden = true;
    if (signedOut) signedOut.hidden = false;
  }
}

function init(): void {
  wireAddToCart();
  wireSignOut();
  refreshCartBadge();
  onCartChange(refreshCartBadge);
  void hydrateAccount();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
