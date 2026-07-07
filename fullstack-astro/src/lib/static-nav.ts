// Checked-in catalog sections for PRERENDERED pages.
//
// Prerendered (SSG) pages are built in a sandbox with no Base44 backend, so
// they can't fetch the live Category list the way SSR pages do. The four
// catalog sections are a stable part of Meridian's information architecture
// (they match `base44/entities/category.jsonc` seed data), so the static
// pages bake these into their header/footer nav at build time. If the live
// catalog ever restructures, update this list and rebuild — that's the SSG
// trade-off on display.

import type { Category } from "./types";

export const STATIC_CATEGORIES: Category[] = [
  { id: "single-origin", name: "Single-Origin", slug: "single-origin" },
  { id: "blends", name: "Signature Blends", slug: "blends" },
  { id: "decaf", name: "Decaf", slug: "decaf" },
  { id: "gear", name: "Brewing Gear", slug: "gear" },
];
