/**
 * Normalized catalog types shared by server (Wix / mock providers) and UI.
 * Everything here must be serializable (plain JSON) because it crosses the
 * server-function boundary and is dehydrated into the SSR payload.
 */

export interface Img {
  /**
   * Either a Wix media identifier (`wix:image://v1/...`), a Wix static URL
   * (`https://static.wixstatic.com/media/...`) or a local path (mock data).
   */
  src: string
  width: number
  height: number
  alt: string
}

export type Availability = 'InStock' | 'OutOfStock' | 'LimitedAvailability' | 'PreOrder'

export interface Product {
  id: string
  slug: string
  name: string
  /** Sanitized-at-source HTML from Wix (rich text description). */
  descriptionHtml: string
  /** Plain-text description, used for meta description / JSON-LD. */
  descriptionText: string
  sku?: string
  brand?: string
  currency: string
  price: number
  /** Discounted price, if lower than `price`. */
  salePrice?: number
  formattedPrice: string
  formattedSalePrice?: string
  availability: Availability
  inStock: boolean
  images: Array<Img>
  collectionIds: Array<string>
  updatedAt?: string
  seoTitle?: string
  seoDescription?: string
  ribbon?: string
  /** Purchasable variants (Catalog V3). Absent when the product has none to choose. */
  variants?: Array<ProductVariant>
  /** Option names for the variant picker, e.g. "Size / Color". */
  variantOptions?: string
}

export interface ProductVariant {
  id: string
  /** Choice names joined, e.g. "Medium / Blue". */
  label: string
  inStock: boolean
  price: number
  formattedPrice: string
  sku?: string
}

export type ProductSummary = Pick<
  Product,
  | 'id'
  | 'slug'
  | 'name'
  | 'currency'
  | 'price'
  | 'salePrice'
  | 'formattedPrice'
  | 'formattedSalePrice'
  | 'inStock'
  | 'ribbon'
> & { image?: Img }

export interface Collection {
  id: string
  slug: string
  name: string
  description?: string
  image?: Img
  /** Wix Stores' built-in "All Products" collection/category. */
  isAllProducts?: boolean
}

export interface SiteConfig {
  siteUrl: string
  siteName: string
  siteDescription: string
  /** Absolute URL or site path of the brand logo (Organization JSON-LD). */
  logo: string
  dataSource: 'wix' | 'mock'
}

export interface NavItem {
  slug: string
  name: string
}

export interface CartLine {
  id: string
  productId: string
  name: string
  slug?: string
  quantity: number
  formattedPrice: string
  image?: Img
}

export interface Cart {
  lines: Array<CartLine>
  formattedSubtotal: string
  checkoutAvailable: boolean
}

export function toSummary(p: Product): ProductSummary {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    currency: p.currency,
    price: p.price,
    salePrice: p.salePrice,
    formattedPrice: p.formattedPrice,
    formattedSalePrice: p.formattedSalePrice,
    inStock: p.inStock,
    ribbon: p.ribbon,
    image: p.images[0],
  }
}
