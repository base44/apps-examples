import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { productParams, trackEvent } from '#/lib/analytics'
import { fetchProduct } from '#/lib/api'
import { publicPageCache } from '#/lib/http'
import { IMAGE_PRESETS, absoluteImageUrl } from '#/lib/media'
import { TITLE_MAX, absoluteUrl, breadcrumbJsonLd, jsonLdScript, seo, truncate } from '#/lib/seo'
import type { Availability, Product } from '#/lib/types'
import { AddToCart } from '#/components/AddToCart'
import { Breadcrumbs } from '#/components/Breadcrumbs'
import { Picture, preloadImageLink } from '#/components/Picture'
import { Price, ProductGrid } from '#/components/ProductCard'
import { NotFound, siteFromMatches } from './__root'

const SCHEMA_AVAILABILITY: Record<Availability, string> = {
  InStock: 'https://schema.org/InStock',
  OutOfStock: 'https://schema.org/OutOfStock',
  LimitedAvailability: 'https://schema.org/LimitedAvailability',
  PreOrder: 'https://schema.org/PreOrder',
}

/** One Offer per purchasable variant when there are several, else a single Offer. */
function productOffers(product: Product, url: string, siteUrl: string, priceValidUntil: string) {
  const base = {
    '@type': 'Offer',
    url,
    priceCurrency: product.currency,
    priceValidUntil,
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@id': `${siteUrl}/#organization` },
  }
  const variants = product.variants ?? []
  if (variants.length <= 1) {
    return {
      ...base,
      price: (product.salePrice ?? product.price).toFixed(2),
      availability: SCHEMA_AVAILABILITY[product.availability],
    }
  }
  const prices = variants.map((v) => v.price)
  return {
    '@type': 'AggregateOffer',
    priceCurrency: product.currency,
    lowPrice: Math.min(...prices).toFixed(2),
    highPrice: Math.max(...prices).toFixed(2),
    offerCount: variants.length,
    offers: variants.map((v) => ({
      ...base,
      name: v.label,
      price: v.price.toFixed(2),
      ...(v.sku ? { sku: v.sku } : {}),
      availability: SCHEMA_AVAILABILITY[v.inStock ? 'InStock' : 'OutOfStock'],
    })),
  }
}

export const Route = createFileRoute('/products/$slug')({
  loader: ({ params }) => fetchProduct({ data: { slug: params.slug } }),
  headers: ({ match }) => publicPageCache(match.status),
  head: ({ loaderData, matches, params }) => {
    const site = siteFromMatches(matches)
    // notFound: <NotFound> renders its own <title> + noindex (hoisted by React 19).
    if (!loaderData) return {}
    const { product, primaryCollection } = loaderData
    const path = `/products/${params.slug}`
    const url = absoluteUrl(site, path)
    const images = product.images
      .map((img) => absoluteImageUrl(img, site.siteUrl))
      .filter((u): u is string => Boolean(u))
    const price = product.salePrice ?? product.price
    const { meta, links } = seo({
      site,
      title: truncate(product.seoTitle || product.name, TITLE_MAX),
      description:
        product.seoDescription ||
        product.descriptionText ||
        `Buy ${product.name} at ${site.siteName}.`,
      path,
      type: 'product',
      image: images[0],
      imageAlt: product.images[0]?.alt,
      extraProperties: {
        'product:price:amount': price.toFixed(2),
        'product:price:currency': product.currency,
        'product:availability': product.inStock ? 'in stock' : 'out of stock',
        'product:condition': 'new',
        ...(product.brand ? { 'product:brand': product.brand } : {}),
        ...(product.sku ? { 'product:retailer_item_id': product.sku } : {}),
      },
    })
    const preload = preloadImageLink(product.images[0], IMAGE_PRESETS.pdpMain)
    if (preload) links.push(preload)

    const crumbs = [{ name: 'Home', path: '/' }]
    if (primaryCollection) {
      crumbs.push({ name: primaryCollection.name, path: `/category/${primaryCollection.slug}` })
    }
    crumbs.push({ name: product.name, path })

    const priceValidUntil = new Date(Date.UTC(new Date().getUTCFullYear() + 1, 0, 1))
      .toISOString()
      .slice(0, 10)

    return {
      meta,
      links,
      scripts: [
        jsonLdScript({
          '@context': 'https://schema.org',
          '@type': 'Product',
          '@id': `${url}#product`,
          name: product.name,
          description: product.descriptionText || product.name,
          url,
          image: images,
          ...(product.sku ? { sku: product.sku } : {}),
          productID: product.id,
          brand: { '@type': 'Brand', name: product.brand || site.siteName },
          ...(primaryCollection ? { category: primaryCollection.name } : {}),
          offers: productOffers(product, url, site.siteUrl, priceValidUntil),
        }),
        jsonLdScript(breadcrumbJsonLd(site, crumbs)),
      ],
    }
  },
  notFoundComponent: NotFound,
  component: ProductPage,
})

function ProductPage() {
  const { product, primaryCollection, related } = Route.useLoaderData()
  const tracked = {
    id: product.id,
    name: product.name,
    price: product.salePrice ?? product.price,
    currency: product.currency,
    category: primaryCollection?.name,
    sku: product.sku,
  }
  useEffect(() => {
    trackEvent('ViewContent', productParams(tracked))
  }, [product.id]) // once per product
  const main = product.images.at(0)
  const rest = product.images.slice(1)
  return (
    <>
      <Breadcrumbs
        items={[
          { name: 'Home', to: '/' },
          ...(primaryCollection
            ? [
                {
                  name: primaryCollection.name,
                  to: '/category/$slug',
                  params: { slug: primaryCollection.slug },
                },
              ]
            : []),
          { name: product.name },
        ]}
      />
      <article className="grid gap-10 lg:grid-cols-2">
        <div>
          {main && (
            <div className="overflow-hidden rounded-xl bg-stone-100">
              <Picture
                image={main}
                widths={IMAGE_PRESETS.pdpMain.widths}
                sizes={IMAGE_PRESETS.pdpMain.sizes}
                aspectRatio={IMAGE_PRESETS.pdpMain.aspectRatio}
                priority
                className="aspect-square w-full object-cover"
              />
            </div>
          )}
          {rest.length > 0 && (
            <ul className="mt-4 grid grid-cols-4 gap-3" aria-label="More images">
              {rest.map((img) => (
                <li key={img.src} className="overflow-hidden rounded-md bg-stone-100">
                  <Picture
                    image={img}
                    widths={[160, 240, 320]}
                    sizes="(min-width: 1024px) 12vw, 25vw"
                    aspectRatio={1}
                    className="aspect-square w-full object-cover"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          {product.ribbon && (
            <p className="mb-2 inline-block rounded bg-stone-900 px-2 py-0.5 text-xs font-medium text-white">
              {product.ribbon}
            </p>
          )}
          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
          <div className="mt-4 text-2xl">
            <Price
              formattedPrice={product.formattedPrice}
              formattedSalePrice={product.formattedSalePrice}
            />
          </div>
          <p className="mt-2 text-sm text-stone-600">
            {product.inStock ? 'In stock — ships in 1–2 business days' : 'Currently out of stock'}
          </p>
          <div className="mt-8">
            <AddToCart
              product={tracked}
              variants={product.variants}
              optionsLabel={product.variantOptions}
              disabled={!product.inStock}
            />
          </div>
          <section aria-labelledby="desc-heading" className="mt-10">
            <h2 id="desc-heading" className="text-lg font-semibold">
              Description
            </h2>
            {/* Description HTML comes from the merchant's Wix Stores catalog. */}
            <div
              className="mt-3 max-w-none text-stone-700 [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-3"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          </section>
          <dl className="mt-8 grid grid-cols-2 gap-2 text-sm text-stone-600">
            {product.sku && (
              <>
                <dt className="font-medium text-stone-900">SKU</dt>
                <dd>{product.sku}</dd>
              </>
            )}
            {product.brand && (
              <>
                <dt className="font-medium text-stone-900">Brand</dt>
                <dd>{product.brand}</dd>
              </>
            )}
          </dl>
        </div>
      </article>
      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-20">
          <h2 id="related-heading" className="mb-6 text-2xl font-bold tracking-tight">
            You may also like
          </h2>
          <ProductGrid products={related} label="Related products" />
        </section>
      )}
    </>
  )
}
