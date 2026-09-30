import type { Collection, Product } from '#/lib/types'

export interface ProductPage {
  items: Array<Product>
  total: number
}

export interface SitemapProduct {
  slug: string
  updatedAt?: string
  collectionIds: Array<string>
}

/** Storage-agnostic catalog contract implemented by Wix and the mock fallback. */
export interface CatalogProvider {
  source: 'wix' | 'mock'
  listCollections: () => Promise<Array<Collection>>
  getCollectionBySlug: (slug: string) => Promise<Collection | null>
  listProducts: (opts: {
    collectionId?: string
    limit: number
    offset: number
  }) => Promise<ProductPage>
  getProductBySlug: (slug: string) => Promise<Product | null>
  searchProducts: (query: string, limit: number) => Promise<Array<Product>>
  listAllProductsForSitemap: () => Promise<Array<SitemapProduct>>
}

/** Wix Stores' built-in "All Products" collection (Catalog V1). */
export const ALL_PRODUCTS_COLLECTION_ID = '00000000-000000-000000-000000000001'
