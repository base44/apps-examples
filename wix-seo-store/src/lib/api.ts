/**
 * Server functions: the only way route loaders reach catalog data. During
 * SSR they run in-process; on client-side navigation they become RPC calls.
 * Wix credentials/tokens never reach the browser.
 */
import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { getSiteConfig } from '#/server/env'
import { getCatalog } from '#/server/catalog'
import { addToCart, createCheckoutUrl, getCart } from '#/server/cart'
import { toSummary } from './types'
import type { NavItem } from './types'

export const PAGE_SIZE = 12

/** Site-wide config + primary navigation (from Wix collections). */
export const fetchSiteConfig = createServerFn({ method: 'GET' }).handler(async () => {
  // Keep the header/footer rendering when Wix is down; the page's own loader
  // still fails and renders the error page.
  const collections = await getCatalog()
    .listCollections()
    .catch((err: unknown) => {
      console.error('[catalog] listCollections failed', err)
      return []
    })
  const nav: Array<NavItem> = collections
    .filter((c) => !c.isAllProducts)
    .slice(0, 5)
    .map((c) => ({ slug: c.slug, name: c.name }))
  const all = collections.find((c) => c.isAllProducts)
  if (all) nav.push({ slug: all.slug, name: 'Shop all' })
  return { site: getSiteConfig(), nav }
})

export const fetchHome = createServerFn({ method: 'GET' }).handler(async () => {
  const catalog = getCatalog()
  const [collections, featured] = await Promise.all([
    catalog.listCollections(),
    catalog.listProducts({ limit: 8, offset: 0 }),
  ])
  return {
    collections: collections.filter((c) => !c.isAllProducts).slice(0, 6),
    allProducts: collections.find((c) => c.isAllProducts) ?? null,
    featured: featured.items.map(toSummary),
  }
})

export const fetchCollectionPage = createServerFn({ method: 'GET' })
  .validator((d: { slug: string; page: number }) => ({
    slug: String(d.slug),
    page: Math.max(1, Math.floor(Number(d.page) || 1)),
  }))
  .handler(async ({ data }) => {
    const catalog = getCatalog()
    const collection = await catalog.getCollectionBySlug(data.slug)
    if (!collection) throw notFound()
    const res = await catalog.listProducts({
      collectionId: collection.id,
      limit: PAGE_SIZE,
      offset: (data.page - 1) * PAGE_SIZE,
    })
    const totalPages = Math.max(1, Math.ceil(res.total / PAGE_SIZE))
    // Out-of-range pages are real 404s rather than thin/empty indexable pages.
    if (data.page > totalPages) throw notFound()
    return {
      collection,
      products: res.items.map(toSummary),
      page: data.page,
      totalPages,
      total: res.total,
      pageSize: PAGE_SIZE,
    }
  })

export const fetchProduct = createServerFn({ method: 'GET' })
  .validator((d: { slug: string }) => ({ slug: String(d.slug) }))
  .handler(async ({ data }) => {
    const catalog = getCatalog()
    const product = await catalog.getProductBySlug(data.slug)
    if (!product) throw notFound()
    const collections = await catalog.listCollections()
    const primaryCollection =
      collections.find(
        (c) => !c.isAllProducts && product.collectionIds.includes(c.id),
      ) ?? null
    const related = primaryCollection
      ? (await catalog.listProducts({ collectionId: primaryCollection.id, limit: 5, offset: 0 })).items
          .filter((p) => p.id !== product.id)
          .slice(0, 4)
          .map(toSummary)
      : []
    return { product, primaryCollection, related }
  })

export const fetchSearch = createServerFn({ method: 'GET' })
  .validator((d: { q?: string }) => ({ q: String(d.q ?? '').slice(0, 100).trim() }))
  .handler(async ({ data }) => {
    if (!data.q) return { q: '', results: [] }
    const results = await getCatalog().searchProducts(data.q, 24)
    return { q: data.q, results: results.map(toSummary) }
  })

export const fetchCart = createServerFn({ method: 'GET' }).handler(() => getCart())

export const addToCartFn = createServerFn({ method: 'POST' })
  .validator((d: { productId: string; variantId?: string; quantity?: number }) => ({
    productId: String(d.productId),
    variantId: d.variantId ? String(d.variantId) : undefined,
    quantity: Math.min(99, Math.max(1, Math.floor(Number(d.quantity) || 1))),
  }))
  .handler(({ data }) => addToCart(data.productId, data.quantity, data.variantId))

export const checkoutFn = createServerFn({ method: 'POST' }).handler(() =>
  createCheckoutUrl(),
)
