import { Link } from '@tanstack/react-router'
import { IMAGE_PRESETS } from '#/lib/media'
import type { ProductSummary } from '#/lib/types'
import { Picture } from './Picture'

export function Price({
  formattedPrice,
  formattedSalePrice,
}: Pick<ProductSummary, 'formattedPrice' | 'formattedSalePrice'>) {
  if (formattedSalePrice) {
    return (
      <span className="flex items-baseline gap-2">
        <span className="font-semibold text-rose-700">{formattedSalePrice}</span>
        <s className="text-sm text-stone-500">
          <span className="sr-only">Was </span>
          {formattedPrice}
        </s>
      </span>
    )
  }
  return <span className="font-semibold">{formattedPrice}</span>
}

export function ProductCard({
  product,
  priority = false,
  headingLevel = 'h3',
}: {
  product: ProductSummary
  priority?: boolean
  headingLevel?: 'h2' | 'h3'
}) {
  const Heading = headingLevel
  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-stone-100">
        {product.image && (
          <Picture
            image={product.image}
            widths={IMAGE_PRESETS.card.widths}
            sizes={IMAGE_PRESETS.card.sizes}
            aspectRatio={IMAGE_PRESETS.card.aspectRatio}
            priority={priority}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {product.ribbon && (
          <span className="absolute left-2 top-2 rounded bg-stone-900 px-2 py-0.5 text-xs font-medium text-white">
            {product.ribbon}
          </span>
        )}
      </div>
      <Heading className="mt-3 text-sm font-medium text-stone-900">
        <Link
          to="/products/$slug"
          params={{ slug: product.slug }}
          className="after:absolute after:inset-0 focus:outline-none focus-visible:underline"
        >
          {product.name}
        </Link>
      </Heading>
      <div className="mt-1 text-sm text-stone-800">
        <Price
          formattedPrice={product.formattedPrice}
          formattedSalePrice={product.formattedSalePrice}
        />
      </div>
      {!product.inStock && <p className="mt-1 text-xs text-stone-500">Out of stock</p>}
    </article>
  )
}

export function ProductGrid({
  products,
  priorityCount = 0,
  label,
  headingLevel = 'h3',
}: {
  products: Array<ProductSummary>
  /** Card title level; use h2 when the grid sits directly under the page h1. */
  headingLevel?: 'h2' | 'h3'
  /** Number of leading cards that are above the fold on mobile. */
  priorityCount?: number
  label?: string
}) {
  return (
    <ul
      aria-label={label}
      className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4"
    >
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  )
}
