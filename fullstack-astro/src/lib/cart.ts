// Client-side shopping cart.
//
// The cart lives entirely in the browser (localStorage) — it never touches the
// server, so catalog pages that include the cart badge stay identical for every
// visitor and remain safe to edge-cache. The cart is only turned into an Order
// (server state) at checkout. Imported by the small client `<script>` blocks in
// the pages/components; safe to tree-shake out of server bundles.

export interface CartLine {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  qty: number;
  accent?: string;
}

const KEY = "meridian:cart";
const CHANGED = "cart:change";

function read(): CartLine[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(lines: CartLine[]): void {
  localStorage.setItem(KEY, JSON.stringify(lines));
  window.dispatchEvent(new CustomEvent(CHANGED, { detail: lines }));
}

export function getCart(): CartLine[] {
  return read();
}

export function addToCart(line: Omit<CartLine, "qty">, qty = 1): void {
  const lines = read();
  const existing = lines.find((l) => l.id === line.id);
  if (existing) {
    existing.qty += qty;
  } else {
    lines.push({ ...line, qty });
  }
  write(lines);
}

export function setQty(id: string, qty: number): void {
  let lines = read();
  if (qty <= 0) {
    lines = lines.filter((l) => l.id !== id);
  } else {
    const line = lines.find((l) => l.id === id);
    if (line) line.qty = qty;
  }
  write(lines);
}

export function removeLine(id: string): void {
  write(read().filter((l) => l.id !== id));
}

export function clearCart(): void {
  write([]);
}

export function cartCount(lines: CartLine[] = read()): number {
  return lines.reduce((n, l) => n + l.qty, 0);
}

export function cartSubtotal(lines: CartLine[] = read()): number {
  return lines.reduce((sum, l) => sum + l.price * l.qty, 0);
}

export function cartCurrency(lines: CartLine[] = read()): string {
  return lines[0]?.currency ?? "USD";
}

/** Subscribe to cart changes; returns an unsubscribe function. */
export function onCartChange(cb: (lines: CartLine[]) => void): () => void {
  const handler = () => cb(read());
  window.addEventListener(CHANGED, handler);
  // Also react to changes from other tabs.
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) handler();
  });
  return () => window.removeEventListener(CHANGED, handler);
}
