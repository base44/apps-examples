import { createFileRoute } from '@tanstack/react-router'
import { fetchSearch } from '#/lib/api'
import { CACHE_PRIVATE } from '#/lib/http'
import { NOINDEX, seo } from '#/lib/seo'
import { ProductGrid } from '#/components/ProductCard'
import { siteFromMatches } from './__root'

export const Route = createFileRoute('/search')({
  validateSearch: (s: Record<string, unknown>): { q?: string } =>
    typeof s.q === 'string' && s.q.trim() ? { q: s.q.trim().slice(0, 100) } : {},
  loaderDeps: ({ search }) => ({ q: search.q ?? '' }),
  loader: ({ deps }) => fetchSearch({ data: { q: deps.q } }),
  // Internal search results are thin/duplicate content: keep them out of the index.
  headers: () => ({ ...CACHE_PRIVATE, 'X-Robots-Tag': 'noindex' }),
  head: ({ loaderData, matches }) => {
    const site = siteFromMatches(matches)
    return seo({
      site,
      title: loaderData?.q ? `Search results for “${loaderData.q}”` : 'Search',
      description: `Search the ${site.siteName} catalog.`,
      path: '/search',
      robots: NOINDEX,
    })
  },
  component: SearchPage,
})

function SearchPage() {
  const { q, results } = Route.useLoaderData()
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">
        {q ? `Search results for “${q}”` : 'Search'}
      </h1>
      <form action="/search" method="get" role="search" className="mt-6 flex max-w-md gap-2">
        <label htmlFor="q" className="sr-only">
          Search products
        </label>
        <input id="q" name="q" type="search" defaultValue={q} className="flex-1 rounded border border-stone-300 px-3 py-2" />
        <button type="submit" className="rounded bg-stone-900 px-4 py-2 text-white">
          Search
        </button>
      </form>
      <div className="mt-8">
        {q && results.length === 0 && <p className="text-stone-600">No products match “{q}”.</p>}
        {results.length > 0 && <ProductGrid products={results} headingLevel="h2" label="Search results" />}
      </div>
    </>
  )
}
