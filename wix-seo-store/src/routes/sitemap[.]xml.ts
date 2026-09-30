import { createFileRoute } from '@tanstack/react-router'
import { getSiteConfig } from '#/server/env'
import { getCatalog } from '#/server/catalog'
import { PAGE_SIZE } from '#/lib/api'
import { MAX_INDEXABLE_PAGE } from '#/lib/seo'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const maxDate = (dates: Array<string | undefined>) =>
  dates.filter(Boolean).sort().at(-1)

/**
 * XML sitemap generated live from the Wix catalog: home, every collection
 * (lastmod = newest product in it) with its indexable pages 2..MAX_INDEXABLE_PAGE,
 * and every visible product (lastmod = Wix last update). Cached at the CDN for
 * an hour; a Wix outage returns 503 so crawlers retry instead of dropping URLs.
 */
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const site = getSiteConfig()
        const catalog = getCatalog()
        let collections, products
        try {
          ;[collections, products] = await Promise.all([
            catalog.listCollections(),
            catalog.listAllProductsForSitemap(),
          ])
        } catch (err) {
          console.error('[sitemap] catalog unavailable', err)
          return new Response('Service unavailable', {
            status: 503,
            headers: { 'Retry-After': '3600', 'Cache-Control': 'no-store' },
          })
        }
        const newest = maxDate(products.map((p) => p.updatedAt))
        const entries: Array<{ loc: string; lastmod?: string }> = [
          { loc: `${site.siteUrl}/`, lastmod: newest },
        ]
        for (const c of collections) {
          const inCollection = products.filter((p) => p.collectionIds.includes(c.id))
          const lastmod = maxDate(inCollection.map((p) => p.updatedAt))
          const base = `${site.siteUrl}/category/${encodeURIComponent(c.slug)}`
          const pages = Math.min(MAX_INDEXABLE_PAGE, Math.ceil(inCollection.length / PAGE_SIZE))
          entries.push({ loc: base, lastmod })
          for (let page = 2; page <= pages; page++)
            entries.push({ loc: `${base}?page=${page}`, lastmod })
        }
        for (const p of products) {
          entries.push({
            loc: `${site.siteUrl}/products/${encodeURIComponent(p.slug)}`,
            lastmod: p.updatedAt,
          })
        }
        const xml =
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
          entries
            .map(
              (e) =>
                `  <url><loc>${esc(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`,
            )
            .join('\n') +
          `\n</urlset>\n`
        return new Response(xml, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
          },
        })
      },
    },
  },
})
