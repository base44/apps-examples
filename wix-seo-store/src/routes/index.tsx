import { Link, createFileRoute } from '@tanstack/react-router'
import { fetchHome } from '#/lib/api'
import { publicPageCache } from '#/lib/http'
import { IMAGE_PRESETS, absoluteImageUrl } from '#/lib/media'
import { absoluteUrl, jsonLdScript, seo } from '#/lib/seo'
import { Picture, preloadImageLink } from '#/components/Picture'
import { ProductGrid } from '#/components/ProductCard'
import { siteFromMatches } from './__root'

/** Home LCP is the first product card image on mobile & desktop. */
const LCP_PRESET = IMAGE_PRESETS.card

export const Route = createFileRoute('/')({
  loader: () => fetchHome(),
  headers: ({ match }) => publicPageCache(match.status),
  head: ({ loaderData, matches }) => {
    const site = siteFromMatches(matches)
    // Error: <ServerError> renders its own <title> + noindex.
    if (!loaderData) return {}
    const firstImage = loaderData.featured[0]?.image
    const { meta, links } = seo({
      site,
      title: 'Everyday goods, thoughtfully made',
      description: site.siteDescription,
      path: '/',
      image: absoluteImageUrl(firstImage, site.siteUrl),
      imageAlt: firstImage?.alt,
    })
    const preload = preloadImageLink(firstImage, LCP_PRESET)
    return {
      meta,
      links: preload ? [...links, preload] : links,
      scripts: [
        jsonLdScript({
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Featured products',
          itemListElement: loaderData.featured.map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: absoluteUrl(site, `/products/${p.slug}`),
            name: p.name,
          })),
        }),
      ],
    }
  },
  component: Home,
})

function Home() {
  const { featured, collections, allProducts } = Route.useLoaderData()
  return (
    <>
      <section aria-labelledby="hero-heading" className="rounded-2xl bg-stone-100 px-6 py-12 sm:px-12">
        <h1 id="hero-heading" className="max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
          Everyday goods, thoughtfully made
        </h1>
        <p className="mt-4 max-w-xl text-lg text-stone-700">
          Apparel, home goods and accessories built to last. Free shipping over $75 and
          30-day returns.
        </p>
        {allProducts && (
          <Link
            to="/category/$slug"
            params={{ slug: allProducts.slug }}
            className="mt-8 inline-block rounded-md bg-stone-900 px-6 py-3 font-medium text-white hover:bg-stone-800"
          >
            Shop all products
          </Link>
        )}
      </section>

      <section aria-labelledby="featured-heading" className="mt-12">
        <h2 id="featured-heading" className="mb-6 text-2xl font-bold tracking-tight">
          Featured products
        </h2>
        {/* First 2 cards are above the fold on mobile; the first is the LCP. */}
        <ProductGrid products={featured} priorityCount={1} label="Featured products" />
      </section>

      {collections.length > 0 && (
        <section aria-labelledby="collections-heading" className="mt-16">
          <h2 id="collections-heading" className="mb-6 text-2xl font-bold tracking-tight">
            Shop by collection
          </h2>
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {collections.map((c) => (
              <li key={c.id} className="group relative overflow-hidden rounded-lg bg-stone-100">
                {c.image && (
                  <Picture
                    image={c.image}
                    widths={IMAGE_PRESETS.card.widths}
                    sizes="(min-width: 640px) 33vw, 100vw"
                    aspectRatio={4 / 3}
                    className="aspect-[4/3] w-full object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold">
                    <Link
                      to="/category/$slug"
                      params={{ slug: c.slug }}
                      className="after:absolute after:inset-0"
                    >
                      {c.name}
                    </Link>
                  </h3>
                  {c.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-stone-600">{c.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
