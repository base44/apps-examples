import { Link } from '@tanstack/react-router'
import type { NavItem, SiteConfig } from '#/lib/types'
import { AccountLink } from './AccountLink'

export function SiteHeader({ site, nav }: { site: SiteConfig; nav: Array<NavItem> }) {
  return (
    <header className="border-b border-stone-200 bg-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-white focus:p-2"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link to="/" className="text-lg font-bold tracking-tight text-stone-900">
          {site.siteName}
        </Link>
        <nav aria-label="Primary">
          <ul className="flex flex-wrap gap-5 text-sm font-medium text-stone-700">
            {nav.map((n) => (
              <li key={n.slug}>
                <Link
                  to="/category/$slug"
                  params={{ slug: n.slug }}
                  className="hover:text-stone-950"
                  activeProps={{ className: 'text-stone-950 underline underline-offset-4' }}
                >
                  {n.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-4 text-sm">
          <form action="/search" method="get" role="search" className="flex">
            <label htmlFor="site-search" className="sr-only">
              Search products
            </label>
            <input
              id="site-search"
              name="q"
              type="search"
              placeholder="Search"
              className="w-32 rounded-l border border-stone-300 px-2 py-1 text-sm sm:w-44"
            />
            <button type="submit" className="rounded-r border border-l-0 border-stone-300 bg-stone-100 px-2 text-sm">
              Go
            </button>
          </form>
          <AccountLink />
          <Link to="/cart" className="font-medium text-stone-800 hover:text-stone-950">
            Cart
          </Link>
        </div>
      </div>
    </header>
  )
}

export function SiteFooter({ site, nav }: { site: SiteConfig; nav: Array<NavItem> }) {
  return (
    <footer className="mt-24 border-t border-stone-200 bg-stone-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-stone-600 sm:grid-cols-3">
        <div>
          <p className="font-semibold text-stone-900">{site.siteName}</p>
          <p className="mt-2">{site.siteDescription}</p>
        </div>
        <nav aria-label="Footer">
          <p className="font-semibold text-stone-900">Shop</p>
          <ul className="mt-2 space-y-1">
            {nav.map((n) => (
              <li key={n.slug}>
                <Link to="/category/$slug" params={{ slug: n.slug }} className="hover:underline">
                  {n.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p>© {new Date().getUTCFullYear()} {site.siteName}. Powered by Wix Headless.</p>
          {site.dataSource === 'mock' && (
            <p className="mt-2 rounded bg-amber-100 px-2 py-1 text-amber-900">
              Demo data: WIX_CLIENT_ID is not set, so this catalog is mock data.
            </p>
          )}
        </div>
      </div>
    </footer>
  )
}
