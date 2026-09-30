/**
 * Wix Headless catalog provider for Wix Stores Catalog V3 (`productsV3` +
 * `@wix/categories`). New Wix Stores sites use V3. Server-only.
 *
 * V3 differences from V1 that matter here: products are paged by cursor only
 * (no offset, no totalCount), so offset pages walk the cursor and totals come
 * from countProducts; collections are categories in the `@wix/stores` tree;
 * add-to-cart needs a variantId.
 */
import { createClient, OAuthStrategy } from '@wix/sdk'
import { productsV3 } from '@wix/stores'
import { categories } from '@wix/categories'
import type { Availability, Collection, Img, Product, ProductVariant } from '#/lib/types'
import { stripHtml } from '#/lib/seo'
import type { CatalogProvider, SitemapProduct } from './provider'

type V3Product = productsV3.V3Product
type V3Category = categories.Category

const STORES_TREE = { appNamespace: '@wix/stores' }
const ALL_PRODUCTS_HANDLE = 'online_stores_all_products'
const MAX_PAGE = 100
const LIST_FIELDS: Array<productsV3.RequestedFieldsWithLiterals> = [
  'CURRENCY',
  'PLAIN_DESCRIPTION',
  'ALL_CATEGORIES_INFO',
]
const DETAIL_FIELDS: Array<productsV3.SingleEntityOpsRequestedFieldsWithLiterals> = [
  'CURRENCY',
  'PLAIN_DESCRIPTION',
  'ALL_CATEGORIES_INFO',
  'MEDIA_ITEMS_INFO',
  'VARIANT_OPTION_CHOICE_NAMES',
]

function makeClient(clientId: string) {
  return createClient({
    modules: { productsV3, categories },
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

const inCategory = (id: string) => ({
  'allCategoriesInfo.categories': { $matchItems: [{ _id: { $in: [id] } }] },
})

function mapImage(src: string | undefined | null, alt: string): Img | undefined {
  if (!src) return undefined
  const hash = src.split('#')[1] ?? ''
  const params = new URLSearchParams(hash)
  return {
    src,
    width: Number(params.get('originWidth')) || 1000,
    height: Number(params.get('originHeight')) || 1000,
    alt,
  }
}

const toIso = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString() : undefined)

function mapAvailability(p: V3Product): Availability {
  const status = p.inventory?.availabilityStatus
  if (status === 'OUT_OF_STOCK') return 'OutOfStock'
  if (status === 'PARTIALLY_OUT_OF_STOCK') return 'LimitedAvailability'
  return 'InStock'
}

function mapVariants(p: V3Product): Array<ProductVariant> | undefined {
  const variants = (p.variantsInfo?.variants ?? []).filter((v) => v.visible !== false)
  if (variants.length === 0) return undefined
  return variants.map((v) => ({
    id: v._id!,
    label:
      (v.choices ?? [])
        .map((c) => c.optionChoiceNames?.choiceName)
        .filter(Boolean)
        .join(' / ') || 'Default',
    inStock: v.inventoryStatus?.inStock !== false,
    price: Number(v.price?.actualPrice?.amount ?? 0),
    formattedPrice: v.price?.actualPrice?.formattedAmount ?? '',
    sku: v.sku || undefined,
  }))
}

export function mapProduct(p: V3Product): Product {
  const name = p.name ?? 'Untitled product'
  const price = Number(p.actualPriceRange?.minValue?.amount ?? 0)
  const compareAt = Number(p.compareAtPriceRange?.minValue?.amount ?? 0)
  const hasSale = compareAt > price
  const images: Array<Img> = []
  for (const item of [p.media?.main, ...(p.media?.itemsInfo?.items ?? [])]) {
    const img = mapImage(item?.image, name)
    if (img && !images.some((i) => i.src === img.src)) images.push(img)
  }
  const html = p.plainDescription ?? ''
  const availability = mapAvailability(p)
  const variants = mapVariants(p)
  return {
    id: p._id!,
    slug: p.slug!,
    name,
    descriptionHtml: html,
    descriptionText: stripHtml(html),
    sku: variants?.length === 1 ? variants[0].sku : undefined,
    brand: p.brand?.name || undefined,
    currency: p.currency ?? 'USD',
    // On sale, `price` is the compare-at (list) price and `salePrice` what the shopper pays.
    price: hasSale ? compareAt : price,
    salePrice: hasSale ? price : undefined,
    formattedPrice: hasSale
      ? (p.compareAtPriceRange?.minValue?.formattedAmount ?? String(compareAt))
      : (p.actualPriceRange?.minValue?.formattedAmount ?? String(price)),
    formattedSalePrice: hasSale
      ? (p.actualPriceRange?.minValue?.formattedAmount ?? undefined)
      : undefined,
    availability,
    inStock: availability !== 'OutOfStock',
    images,
    collectionIds: (p.allCategoriesInfo?.categories ?? []).map((c) => c._id!),
    updatedAt: toIso(p._updatedDate),
    seoTitle: seoTag(p, 'title'),
    seoDescription: seoTag(p, 'description'),
    ribbon: p.ribbon?.name || undefined,
    variants,
    variantOptions:
      (p.options ?? [])
        .map((o) => o.name)
        .filter(Boolean)
        .join(' / ') || undefined,
  }
}

function seoTag(p: V3Product, kind: 'title' | 'description'): string | undefined {
  const tags = p.seoData?.tags ?? []
  if (kind === 'title') return tags.find((t) => t.type === 'title')?.children || undefined
  const meta = tags.find(
    (t) => t.type === 'meta' && (t.props as { name?: string } | undefined)?.name === 'description',
  )
  return (meta?.props as { content?: string } | undefined)?.content || undefined
}

function mapCategory(c: V3Category): Collection {
  const name = c.name ?? 'Collection'
  return {
    id: c._id!,
    slug: c.slug!,
    name,
    description: c.description ? stripHtml(c.description) : undefined,
    image: mapImage(c.image, name),
    // `handle` is returned by the API but missing from the SDK's Category type.
    isAllProducts: (c as { handle?: string }).handle === ALL_PRODUCTS_HANDLE,
  }
}

const isNotFound = (err: unknown) => (err as { status?: number }).status === 404

export function createWixV3Provider(clientId: string): CatalogProvider {
  const client = () => wix(clientId)

  /** Walks the cursor until `offset + limit` products are loaded. */
  async function collect(filter: Record<string, unknown>, offset: number, limit: number) {
    const out: Array<V3Product> = []
    let cursor: string | undefined
    for (;;) {
      const res = await client().productsV3.searchProducts(
        {
          filter,
          cursorPaging: {
            limit: Math.min(MAX_PAGE, offset + limit - out.length),
            cursor,
          },
        },
        { fields: LIST_FIELDS },
      )
      out.push(...(res.products ?? []))
      cursor = res.pagingMetadata?.cursors?.next ?? undefined
      if (!cursor || !res.pagingMetadata?.hasNext || out.length >= offset + limit) break
    }
    return out.slice(offset, offset + limit)
  }

  return {
    source: 'wix',

    async listCollections() {
      const res = await client()
        .categories.queryCategories({
          treeReference: STORES_TREE,
          fields: ['DESCRIPTION'],
        })
        .eq('visible', true)
        .limit(100)
        .find()
      return res.items.map(mapCategory)
    },

    async getCollectionBySlug(slug) {
      try {
        const { category } = await client().categories.getCategoryBySlug(slug, STORES_TREE, {
          fields: ['DESCRIPTION'],
        })
        return category && category.visible !== false ? mapCategory(category) : null
      } catch (err) {
        if (isNotFound(err)) return null
        throw err
      }
    },

    async listProducts({ collectionId, limit, offset }) {
      const filter = collectionId ? inCategory(collectionId) : {}
      const [items, { count }] = await Promise.all([
        collect(filter, offset, limit),
        client().productsV3.countProducts({ filter }),
      ])
      return { items: items.map(mapProduct), total: count ?? items.length }
    },

    async getProductBySlug(slug) {
      try {
        const { product } = await client().productsV3.getProductBySlug(slug, {
          fields: DETAIL_FIELDS,
        })
        return product && product.visible !== false ? mapProduct(product) : null
      } catch (err) {
        if (isNotFound(err)) return null
        throw err
      }
    },

    async searchProducts(query, limit) {
      const res = await client().productsV3.searchProducts(
        { search: { expression: query }, cursorPaging: { limit } },
        { fields: LIST_FIELDS },
      )
      return (res.products ?? []).map(mapProduct)
    },

    async listAllProductsForSitemap() {
      const out: Array<SitemapProduct> = []
      let cursor: string | undefined
      for (;;) {
        const res = await client().productsV3.searchProducts(
          { cursorPaging: { limit: MAX_PAGE, cursor } },
          { fields: ['ALL_CATEGORIES_INFO'] },
        )
        for (const p of res.products ?? []) {
          if (p.visible === false || !p.slug) continue
          out.push({
            slug: p.slug,
            updatedAt: toIso(p._updatedDate),
            collectionIds: (p.allCategoriesInfo?.categories ?? []).map((c) => c._id!),
          })
        }
        cursor = res.pagingMetadata?.cursors?.next ?? undefined
        if (!cursor || !res.pagingMetadata?.hasNext || out.length >= 50_000) break
      }
      return out
    },
  }
}
