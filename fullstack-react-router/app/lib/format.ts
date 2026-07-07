import type { PropertyStatus, PropertyType } from "./types";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatPrice(value: number): string {
  return usd.format(value ?? 0);
}

export function formatSqft(value: number): string {
  return `${new Intl.NumberFormat("en-US").format(value ?? 0)} sqft`;
}

const STATUS_LABELS: Record<PropertyStatus, string> = {
  for_sale: "For sale",
  pending: "Pending",
  sold: "Sold",
};

export function statusLabel(status: PropertyStatus): string {
  return STATUS_LABELS[status] ?? status;
}

const TYPE_LABELS: Record<PropertyType, string> = {
  house: "House",
  apartment: "Apartment",
  condo: "Condo",
  land: "Land",
};

export function typeLabel(type: PropertyType): string {
  return TYPE_LABELS[type] ?? type;
}

export function coverImage(images?: { url: string }[]): string {
  return images?.[0]?.url ?? FALLBACK_IMAGE;
}

// Neutral architectural placeholder used when a listing has no images.
export const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80";
