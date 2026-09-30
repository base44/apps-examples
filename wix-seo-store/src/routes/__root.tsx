import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
  useRouter,
} from '@tanstack/react-router'
import type { AnyRouteMatch, ErrorComponentProps } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { fetchSiteConfig } from '#/lib/api'
import { absoluteUrl, jsonLdScript } from '#/lib/seo'
import type { SiteConfig } from '#/lib/types'
import { SiteFooter, SiteHeader } from '#/components/SiteChrome'

// Imported (not ?url) so the build can inline it (inlineCss in vite.config.ts).
import '../styles.css'

/** Child routes read site config (SITE_URL etc.) from the root loader. */
export function siteFromMatches(matches: Array<AnyRouteMatch>): SiteConfig {
  const data = matches[0]?.loaderData as { site: SiteConfig } | undefined
  return (
    data?.site ?? {
      siteUrl: 'http://localhost:3000',
      siteName: 'Wix SEO Store',
      siteDescription: '',
      logo: '/logo.png',
      dataSource: 'mock',
    }
  )
}

export const Route = createRootRoute({
  loader: () => fetchSiteConfig(),
  // Site config and nav don't change between client navigations.
  staleTime: Infinity,
  shouldReload: false,
  headers: ({ loaderData }) => ({
    'X-Data-Source': loaderData?.site.dataSource ?? 'unknown',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  }),
  head: ({ loaderData }) => {
    const site = loaderData?.site
    const scripts = site
      ? [
          jsonLdScript({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            '@id': `${site.siteUrl}/#organization`,
            name: site.siteName,
            url: absoluteUrl(site, '/'),
            logo: /^https?:\/\//.test(site.logo) ? site.logo : absoluteUrl(site, site.logo),
          }),
          jsonLdScript({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            '@id': `${site.siteUrl}/#website`,
            name: site.siteName,
            url: absoluteUrl(site, '/'),
            publisher: { '@id': `${site.siteUrl}/#organization` },
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: `${absoluteUrl(site, '/search')}?q={search_term_string}`,
              },
              'query-input': 'required name=search_term_string',
            },
          }),
        ]
      : []
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#1c1917' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
      links: [
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/logo.png' },
        // Warm up the Wix media CDN connection for product images.
        ...(site?.dataSource === 'wix'
          ? [{ rel: 'preconnect', href: 'https://static.wixstatic.com' }]
          : []),
      ],
      scripts,
    }
  },
  shellComponent: RootDocument,
  component: RootLayout,
  notFoundComponent: NotFound,
  errorComponent: ServerError,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-white text-stone-900 antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootLayout() {
  const { site, nav } = Route.useLoaderData()
  return (
    <>
      <SiteHeader site={site} nav={nav} />
      <main id="main" className="mx-auto min-h-[60vh] max-w-7xl px-4 py-8">
        <Outlet />
      </main>
      <SiteFooter site={site} nav={nav} />
    </>
  )
}

export function NotFound() {
  const { site } = Route.useLoaderData()
  return (
    <div className="py-16 text-center">
      {/* React 19 hoists these into <head>; 404s must never be indexed. */}
      <title>{`Page not found | ${site.siteName}`}</title>
      <meta name="robots" content="noindex,follow" />
      <p className="text-sm font-semibold text-stone-500">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-4 text-stone-600">
        Sorry, we couldn’t find the page you’re looking for.
      </p>
      <p className="mt-8">
        <Link to="/" className="rounded-md bg-stone-900 px-4 py-2 text-white">
          Back to the homepage
        </Link>
      </p>
    </div>
  )
}

/** Upstream (Wix) or render failure. Never indexed; offers a retry. */
export function ServerError({ reset }: ErrorComponentProps) {
  const router = useRouter()
  return (
    <div className="py-16 text-center">
      <title>Something went wrong</title>
      <meta name="robots" content="noindex,nofollow" />
      <p className="text-sm font-semibold text-stone-500">500</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">We couldn’t load this page</h1>
      <p className="mt-4 text-stone-600">
        Our store is having trouble right now. Please try again in a moment.
      </p>
      <p className="mt-8 flex justify-center gap-4">
        <button
          type="button"
          onClick={() => {
            reset()
            void router.invalidate()
          }}
          className="rounded-md bg-stone-900 px-4 py-2 text-white"
        >
          Try again
        </button>
        <Link to="/" className="rounded-md border border-stone-300 px-4 py-2">
          Homepage
        </Link>
      </p>
    </div>
  )
}
