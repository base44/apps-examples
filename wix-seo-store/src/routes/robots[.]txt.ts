import { createFileRoute } from '@tanstack/react-router'
import { getSiteConfig } from '#/server/env'

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () => {
        const { siteUrl } = getSiteConfig()
        const body = [
          'User-agent: *',
          'Allow: /',
          // Per-visitor / thin pages. They also carry noindex meta tags.
          'Disallow: /cart',
          'Disallow: /search',
          // TanStack Start server-function RPC endpoint.
          'Disallow: /_serverFn/',
          'Disallow: /account/',
          '',
          `Sitemap: ${siteUrl}/sitemap.xml`,
          '',
        ].join('\n')
        return new Response(body, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      },
    },
  },
})
