// Renders the cart page entirely on the client from localStorage. The cart is
// never server state, so the cart page carries no per-user HTML from the server
// (it's still marked `private, no-store` because it's inherently personal).

import {
  cartSubtotal,
  getCart,
  onCartChange,
  removeLine,
  setQty,
  type CartLine,
} from "./cart";
import { formatPrice } from "./format";

function lineRow(line: CartLine): HTMLElement {
  const row = document.createElement("div");
  row.className = "cart-row";
  row.innerHTML = `
    <span class="cart-row__swatch" style="background:${line.accent ?? "#5b4632"}" aria-hidden="true">☕</span>
    <div class="cart-row__info">
      <a class="cart-row__name" href="/products/${line.slug}">${escapeHtml(line.name)}</a>
      <span class="cart-row__unit">${formatPrice(line.price, line.currency)} each</span>
    </div>
    <div class="cart-row__qty">
      <button type="button" data-dec aria-label="Decrease quantity">−</button>
      <span data-qty>${line.qty}</span>
      <button type="button" data-inc aria-label="Increase quantity">+</button>
    </div>
    <span class="cart-row__total">${formatPrice(line.price * line.qty, line.currency)}</span>
    <button class="cart-row__remove" type="button" data-remove aria-label="Remove item">Remove</button>
  `;
  row.querySelector("[data-dec]")?.addEventListener("click", () => setQty(line.id, line.qty - 1));
  row.querySelector("[data-inc]")?.addEventListener("click", () => setQty(line.id, line.qty + 1));
  row.querySelector("[data-remove]")?.addEventListener("click", () => removeLine(line.id));
  return row;
}

function escapeHtml(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function render(root: HTMLElement): void {
  const lines = getCart();
  root.innerHTML = "";

  if (lines.length === 0) {
    const empty = document.createElement("div");
    empty.className = "cart-empty";
    empty.innerHTML = `
      <p class="cart-empty__title">Your cart is empty.</p>
      <p class="muted">Find something you'll love in the shop.</p>
      <a class="btn" href="/">Browse coffee</a>
    `;
    root.appendChild(empty);
    return;
  }

  const layout = document.createElement("div");
  layout.className = "cart-layout";

  const list = document.createElement("div");
  list.className = "cart-list";
  lines.forEach((line) => list.appendChild(lineRow(line)));

  const subtotal = cartSubtotal(lines);
  const currency = lines[0]?.currency ?? "USD";
  const summary = document.createElement("aside");
  summary.className = "cart-summary";
  summary.innerHTML = `
    <h2>Summary</h2>
    <div class="cart-summary__row"><span>Subtotal</span><strong>${formatPrice(subtotal, currency)}</strong></div>
    <div class="cart-summary__row muted"><span>Shipping</span><span>Calculated at delivery</span></div>
    <a class="btn btn--block" href="/checkout">Checkout</a>
    <a class="cart-summary__continue" href="/">Continue shopping</a>
  `;

  layout.appendChild(list);
  layout.appendChild(summary);
  root.appendChild(layout);
}

export function mountCart(): void {
  const root = document.querySelector<HTMLElement>("[data-cart-root]");
  if (!root) return;
  render(root);
  onCartChange(() => render(root));
}

/** Render a read-only order summary into the checkout page. */
export function mountCheckoutSummary(): void {
  const root = document.querySelector<HTMLElement>("[data-checkout-summary]");
  if (!root) return;
  const draw = () => {
    const lines = getCart();
    const currency = lines[0]?.currency ?? "USD";
    if (lines.length === 0) {
      root.innerHTML = `<p class="muted">Your cart is empty. <a href="/">Add something first.</a></p>`;
      document
        .querySelector<HTMLButtonElement>("[data-checkout-form] button[type=submit]")
        ?.setAttribute("disabled", "true");
      return;
    }
    const rows = lines
      .map(
        (l) => `
      <div class="co-line">
        <span>${escapeHtml(l.name)} <span class="muted">× ${l.qty}</span></span>
        <span>${formatPrice(l.price * l.qty, l.currency)}</span>
      </div>`,
      )
      .join("");
    root.innerHTML = `
      ${rows}
      <div class="co-line co-line--total">
        <strong>Total</strong>
        <strong>${formatPrice(cartSubtotal(lines), currency)}</strong>
      </div>`;
  };
  draw();
  onCartChange(draw);
}
