/**
 * Helpers that turn page SEO intent into TanStack Router `head()` entries.
 * Every indexable route calls `seo()` so title/description/canonical/OG/
 * Twitter/robots are always emitted together and never drift apart.
 */
import type { SiteConfig } from './types'

type MetaTag = Record<string, string>
type LinkTag = Record<string, string>

export interface SeoInput {
  site: SiteConfig
  title: string
  description: string
  /** Path (with optional query) relative to SITE_URL, e.g. `/products/foo`. */
  path: string
  image?: string
  imageAlt?: string
  type?: 'website' | 'product'
  /** Defaults to `index,follow`. */
  robots?: string
  /** Extra og:/product: meta properties. */
  extraProperties?: Record<string, string>
}

export const TITLE_MAX = 60
export const DESCRIPTION_MAX = 160

export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 20))}…`
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

export function absoluteUrl(site: SiteConfig, path: string): string {
  return new URL(path, site.siteUrl.replace(/\/$/, '') + '/').toString()
}

export function seo(input: SeoInput): { meta: Array<MetaTag>; links: Array<LinkTag> } {
  const { site } = input
  const fullTitle =
    input.title === site.siteName ? site.siteName : `${input.title} | ${site.siteName}`
  const description = truncate(input.description, DESCRIPTION_MAX)
  const canonical = absoluteUrl(site, input.path)
  const robots = input.robots ?? 'index,follow,max-image-preview:large'

  const meta: Array<MetaTag> = [
    { title: fullTitle },
    { name: 'description', content: description },
    { name: 'robots', content: robots },
    { property: 'og:site_name', content: site.siteName },
    { property: 'og:type', content: input.type ?? 'website' },
    { property: 'og:title', content: input.title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonical },
    { property: 'og:locale', content: 'en_US' },
    {
      name: 'twitter:card',
      content: input.image ? 'summary_large_image' : 'summary',
    },
    { name: 'twitter:title', content: input.title },
    { name: 'twitter:description', content: description },
  ]
  if (input.image) {
    meta.push(
      { property: 'og:image', content: input.image },
      { property: 'og:image:alt', content: input.imageAlt ?? input.title },
      { name: 'twitter:image', content: input.image },
      { name: 'twitter:image:alt', content: input.imageAlt ?? input.title },
    )
  }
  for (const [property, content] of Object.entries(input.extraProperties ?? {})) {
    meta.push({ property, content })
  }

  return { meta, links: [{ rel: 'canonical', href: canonical }] }
}

/** Serializes JSON-LD safely for inline <script> (escapes `</script`). */
export function jsonLdScript(data: unknown): { type: string; children: string } {
  return {
    type: 'application/ld+json',
    children: JSON.stringify(data).replace(/</g, '\\u003c'),
  }
}

export function breadcrumbJsonLd(
  site: SiteConfig,
  items: Array<{ name: string; path: string }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(site, item.path),
    })),
  }
}

/** Robots for non-indexable utility pages (cart, search, filtered lists). */
export const NOINDEX = 'noindex,follow'

/** Paginated listings deeper than this are `noindex,follow`. */
export const MAX_INDEXABLE_PAGE = 10
