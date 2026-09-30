/**
 * Wix Headless catalog provider for Wix Stores Catalog V1 (older sites; @wix/stores
 * `products` + `collections`). Server-only.
 *
 * Auth: OAuthStrategy with the headless OAuth app's clientId. With no tokens
 * supplied, the SDK mints anonymous *visitor* tokens on first request and
 * renews them when they expire, which is all catalog reads need. One client
 * per server process is reused so visitor tokens are not re-minted per request.
 */
import { createClient, OAuthStrategy } from '@wix/sdk'
import { collections, products } from '@wix/stores'
import type { Availability, Collection, Img, Product } from '#/lib/types'
import { stripHtml } from '#/lib/seo'
import { ALL_PRODUCTS_COLLECTION_ID } from './provider'
import type { CatalogProvider, SitemapProduct } from './provider'

type WixProduct = products.Product
type WixCollection = collections.Collection

function makeClient(clientId: string) {
  return createClient({
    modules: { products, collections },
    auth: OAuthStrategy({ clientId }),
  })
}

let cached: { clientId: string; client: ReturnType<typeof makeClient> } | undefined

function wix(clientId: string) {
  if (!cached || cached.clientId !== clientId) {
    cached = { clientId, client: makeClient(clientId) }
  }
  return cached.client
}

function mapImage(
  image: { url?: string; width?: number; height?: number; altText?: string | null } | undefined,
  fallbackAlt: string,
): Img | undefined {
  if (!image?.url) return undefined
  return {
    src: image.url,
    width: image.width || 1000,
    height: image.height || 1000,
    alt: image.altText || fallbackAlt,
  }
}

function mapAvailability(p: WixProduct): Availability {
  const status = p.stock?.inventoryStatus
  if (status === 'OUT_OF_STOCK') return 'OutOfStock'
  if (status === 'PARTIALLY_OUT_OF_STOCK') return 'LimitedAvailability'
  return p.stock?.inStock === false ? 'OutOfStock' : 'InStock'
}

function seoTag(p: WixProduct, kind: 'title' | 'description'): string | undefined {
  const tags = p.seoData?.tags ?? []
  if (kind === 'title') {
    return tags.find((t) => t.type === 'title')?.children || undefined
  }
  const meta = tags.find(
    (t) => t.type === 'meta' && (t.props as { name?: string } | undefined)?.name === 'description',
  )
  return (meta?.props as { content?: string } | undefined)?.content || undefined
}

export function mapProduct(p: WixProduct): Product {
  const name = p.name ?? 'Untitled product'
  const priceData = p.priceData ?? p.price
  const price = priceData?.price ?? 0
  const discounted = priceData?.discountedPrice
  const hasSale = discounted != null && discounted < price
  const images: Array<Img> = []
  const main = mapImage(p.media?.mainMedia?.image, name)
  if (main) images.push(main)
  for (const item of p.media?.items ?? []) {
    const img = mapImage(item.image, name)
    if (img && !images.some((i) => i.src === img.src)) images.push(img)
  }
  const html = p.description ?? ''
  return {
    id: p._id!,
    slug: p.slug!,
    name,
    descriptionHtml: html,
    descriptionText: stripHtml(html),
    sku: p.sku || undefined,
    brand: p.brand || undefined,
    currency: priceData?.currency ?? 'USD',
    price,
    salePrice: hasSale ? discounted : undefined,
    formattedPrice: priceData?.formatted?.price ?? String(price),
    formattedSalePrice: hasSale ? (priceData?.formatted?.discountedPrice ?? undefined) : undefined,
    availability: mapAvailability(p),
    inStock: mapAvailability(p) !== 'OutOfStock',
    images,
    collectionIds: p.collectionIds ?? [],
    updatedAt: p.lastUpdated ? new Date(p.lastUpdated).toISOString() : undefined,
    seoTitle: seoTag(p, 'title'),
    seoDescription: seoTag(p, 'description'),
    ribbon: p.ribbon || undefined,
  }
}

function mapCollection(c: WixCollection): Collection {
  const name = c.name ?? 'Collection'
  return {
    id: c._id!,
    slug: c.slug!,
    name,
    description: c.description ? stripHtml(c.description) : undefined,
    image: mapImage(c.media?.mainMedia?.image, name),
    isAllProducts: c._id === ALL_PRODUCTS_COLLECTION_ID,
  }
}

export function createWixProvider(clientId: string): CatalogProvider {
  const client = () => wix(clientId)
  return {
    source: 'wix',

    async listCollections() {
      const res = await client().collections.queryCollections().limit(100).find()
      return res.items.filter((c) => c.visible !== false).map(mapCollection)
    },

    async getCollectionBySlug(slug) {
      try {
        const { collection } = await client().collections.getCollectionBySlug(slug)
        return collection ? mapCollection(collection) : null
      } catch (err) {
        const status = (err as { details?: { httpStatus?: number }; status?: number })
        if (status.details?.httpStatus === 404 || status.status === 404) return null
        // Wix returns a 404 application error for unknown slugs; treat any
        // "not found" shaped error as missing rather than a 500.
        if (String(err).toLowerCase().includes('not found')) return null
        throw err
      }
    },

    async listProducts({ collectionId, limit, offset }) {
      let q = client().products.queryProducts()
      if (collectionId) q = q.hasSome('collectionIds', [collectionId])
      const res = await q.limit(limit).skip(offset).find()
      return { items: res.items.map(mapProduct), total: res.totalCount ?? res.items.length }
    },

    async getProductBySlug(slug) {
      const res = await client().products.queryProducts().eq('slug', slug).limit(1).find()
      const p = res.items.at(0)
      return p ? mapProduct(p) : null
    },

    async searchProducts(query, limit) {
      const res = await client()
        .products.queryProducts()
        .startsWith('name', query)
        .limit(limit)
        .find()
      return res.items.map(mapProduct)
    },

    async listAllProductsForSitemap() {
      const out: Array<SitemapProduct> = []
      let res = await client().products.queryProducts().limit(100).find()
      for (;;) {
        for (const p of res.items) {
          if (p.visible === false || !p.slug) continue
          out.push({
            slug: p.slug,
            updatedAt: p.lastUpdated ? new Date(p.lastUpdated).toISOString() : undefined,
            collectionIds: p.collectionIds ?? [],
          })
        }
        if (!res.hasNext() || out.length >= 50_000) break
        res = await res.next()
      }
      return out
    },
  }
}
