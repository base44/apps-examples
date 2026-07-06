// Catalog data access.
//
// Every function takes a (possibly null) server client and prefers LIVE data
// from Base44. When the backend is unavailable (local dev) or hasn't been
// seeded yet (fresh deploy), it falls back to the curated demo catalog so the
// storefront always renders like a real store. All catalog reads are public
// (see the Product/Category RLS), which is what lets the catalog pages be
// served from a shared edge cache.

import type { Base44Client } from "@base44/sdk";
import { DEMO_CATEGORIES, DEMO_PRODUCTS, DEMO_REVIEWS } from "./demo-data";
import type { Category, Product, Review } from "./types";

const MAX = 200;

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export async function listCategories(base44: Base44Client | null): Promise<Category[]> {
  if (base44) {
    const live = await safe(() => base44.entities.Category.list("name", MAX));
    if (live && live.length) return live as Category[];
  }
  return DEMO_CATEGORIES;
}

export async function listProducts(base44: Base44Client | null): Promise<Product[]> {
  if (base44) {
    const live = await safe(() =>
      base44.entities.Product.filter({ status: "active" }, "-created_date", MAX),
    );
    if (live && live.length) return live as Product[];
  }
  return DEMO_PRODUCTS.filter((p) => p.status !== "draft");
}

export async function listFeatured(base44: Base44Client | null): Promise<Product[]> {
  const all = await listProducts(base44);
  const featured = all.filter((p) => p.featured);
  return (featured.length ? featured : all).slice(0, 4);
}

export async function getProductBySlug(
  base44: Base44Client | null,
  slug: string,
): Promise<Product | null> {
  if (base44) {
    const live = await safe(() => base44.entities.Product.filter({ slug }, null, 1));
    if (live && live.length) return live[0] as Product;
  }
  return DEMO_PRODUCTS.find((p) => p.slug === slug) ?? null;
}

export async function getCategoryBySlug(
  base44: Base44Client | null,
  slug: string,
): Promise<Category | null> {
  const categories = await listCategories(base44);
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function listProductsByCategory(
  base44: Base44Client | null,
  categoryId: string,
): Promise<Product[]> {
  if (base44) {
    const live = await safe(() =>
      base44.entities.Product.filter(
        { category_id: categoryId, status: "active" },
        "-created_date",
        MAX,
      ),
    );
    if (live && live.length) return live as Product[];
  }
  return DEMO_PRODUCTS.filter(
    (p) => p.category_id === categoryId && p.status !== "draft",
  );
}

export async function listReviews(
  base44: Base44Client | null,
  productId: string,
): Promise<Review[]> {
  if (base44) {
    const live = await safe(() =>
      base44.entities.Review.filter({ product_id: productId }, "-created_date", 50),
    );
    if (live) return live as Review[];
  }
  return DEMO_REVIEWS.filter((r) => r.product_id === productId);
}

export function averageRating(reviews: Review[]): number | null {
  if (!reviews.length) return null;
  const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

export function categoryName(categories: Category[], id?: string): string | null {
  if (!id) return null;
  return categories.find((c) => c.id === id)?.name ?? null;
}
