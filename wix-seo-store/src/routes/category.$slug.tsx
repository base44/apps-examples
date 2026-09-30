import { createFileRoute, redirect } from '@tanstack/react-router'
import { fetchCollectionPage } from '#/lib/api'
import { publicPageCache } from '#/lib/http'
import { IMAGE_PRESETS, absoluteImageUrl } from '#/lib/media'
import {
  MAX_INDEXABLE_PAGE,
  NOINDEX,
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLdScript,
  seo,
} from '#/lib/seo'
import { Breadcrumbs } from '#/components/Breadcrumbs'
import { Pagination } from '#/components/Pagination'
import { preloadImageLink } from '#/components/Picture'
import { ProductGrid } from '#/components/ProductCard'
import { NotFound, siteFromMatches } from './__root'

interface CategorySearch {
  page?: number
}

const pagePath = (slug: string, page: number) =>
  page > 1 ? `/category/${slug}?page=${page}` : `/category/${slug}`

export const Route = createFileRoute('/category/$slug')({
  validateSearch: (search: Record<string, unknown>): CategorySearch => {
    const n = Number(search.page)
    return Number.isInteger(n) && n > 1 ? { page: n } : {}
  },
  beforeLoad: ({ location, params }) => {
    // Collapse duplicate URLs (?page=1, ?page=abc) onto the canonical one.
    const raw = (location.search as Record<string, unknown>).page
    if (raw !== undefined && !(Number.isInteger(Number(raw)) && Number(raw) > 1)) {
      throw redirect({ to: '/category/$slug', params, statusCode: 301 })
    }
  },
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: ({ params, deps }) =>
    fetchCollectionPage({ data: { slug: params.slug, page: deps.page } }),
  headers: ({ match }) => publicPageCache(match.status),
  head: ({ loaderData, matches, params }) => {
    const site = siteFromMatches(matches)
    // notFound: <NotFound> renders its own <title> + noindex (hoisted by React 19).
    if (!loaderData) return {}
    const { collection, page, totalPages, products, pageSize } = loaderData
    const titleBase = collection.name
    const title = page > 1 ? `${titleBase} – Page ${page} of ${totalPages}` : titleBase
    const description =
      (collection.description ||
        `Shop ${collection.name.toLowerCase()} at ${site.siteName}. ${loaderData.total} products with free shipping over $75.`) +
      (page > 1 ? ` Page ${page}.` : '')
    const { meta, links } = seo({
      site,
      title,
      description,
      path: pagePath(params.slug, page),
      image: absoluteImageUrl(collection.image ?? products[0]?.image, site.siteUrl),
      robots: page > MAX_INDEXABLE_PAGE ? NOINDEX : undefined,
    })
    if (page > 1) links.push({ rel: 'prev', href: absoluteUrl(site, pagePath(params.slug, page - 1)) })
    if (page < totalPages) links.push({ rel: 'next', href: absoluteUrl(site, pagePath(params.slug, page + 1)) })
    const preload = preloadImageLink(products[0]?.image, IMAGE_PRESETS.card)
    if (preload) links.push(preload)
    return {
      meta,
      links,
      scripts: [
        jsonLdScript(
          breadcrumbJsonLd(site, [
            { name: 'Home', path: '/' },
            { name: collection.name, path: pagePath(params.slug, 1) },
          ]),
        ),
        jsonLdScript({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: title,
          url: absoluteUrl(site, pagePath(params.slug, page)),
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: loaderData.total,
            itemListOrder: 'https://schema.org/ItemListUnordered',
            itemListElement: products.map((p, i) => ({
              '@type': 'ListItem',
              position: (page - 1) * pageSize + i + 1,
              url: absoluteUrl(site, `/products/${p.slug}`),
              name: p.name,
            })),
          },
        }),
      ],
    }
  },
  notFoundComponent: NotFound,
  component: CategoryPage,
})

function CategoryPage() {
  const { collection, products, page, totalPages, total } = Route.useLoaderData()
  const { slug } = Route.useParams()
  return (
    <>
      <Breadcrumbs items={[{ name: 'Home', to: '/' }, { name: collection.name }]} />
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {collection.name}
          {page > 1 && <span className="text-stone-500"> – Page {page}</span>}
        </h1>
        {collection.description && (
          <p className="mt-3 max-w-2xl text-stone-600">{collection.description}</p>
        )}
        <p className="mt-2 text-sm text-stone-500">
          {total} {total === 1 ? 'product' : 'products'}
        </p>
      </header>
      <ProductGrid products={products} priorityCount={1} label={`${collection.name} products`}
        headingLevel="h2"
      />
      <Pagination slug={slug} page={page} totalPages={totalPages} />
    </>
  )
}
