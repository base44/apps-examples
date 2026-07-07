// Catalog data access.
//
// Every function reads LIVE entity data through the request-scoped server
// client — there are no demo/mock fallbacks. An empty catalog renders honest
// empty states in the pages, and a failed read (or a missing Base44 runtime)
// throws so the problem surfaces instead of being silently masked by fake
// content. All catalog reads are public (see the Product/Category RLS), which
// is what lets the catalog pages be served from a shared edge cache.

import type { Base44Client } from "@base44/sdk";
import type { Category, Product, Review } from "./types";

const MAX = 200;

/** Reject a null client loudly: rendering without a backend would be a lie. */
function required(base44: Base44Client | null): Base44Client {
  if (!base44) {
    throw new Error(
      "No Base44 backend available (app id not resolvable). Deploy the app with `base44 deploy`, or configure the Worker env for local development.",
    );
  }
  return base44;
}

export async function listCategories(base44: Base44Client | null): Promise<Category[]> {
  return (await required(base44).entities.Category.list("name", MAX)) as Category[];
}

export async function listProducts(base44: Base44Client | null): Promise<Product[]> {
  return (await required(base44).entities.Product.filter(
    { status: "active" },
    "-created_date",
    MAX,
  )) as Product[];
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
  const matches = (await required(base44).entities.Product.filter(
    { slug },
    null,
    1,
  )) as Product[];
  return matches[0] ?? null;
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
  return (await required(base44).entities.Product.filter(
    { category_id: categoryId, status: "active" },
    "-created_date",
    MAX,
  )) as Product[];
}

export async function listReviews(
  base44: Base44Client | null,
  productId: string,
): Promise<Review[]> {
  return (await required(base44).entities.Review.filter(
    { product_id: productId },
    "-created_date",
    50,
  )) as Review[];
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
