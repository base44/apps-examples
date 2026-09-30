/**
 * Server-only runtime configuration. Read from process.env at request time so
 * the same build can be deployed to any origin (canonical URLs follow SITE_URL).
 */
import type { SiteConfig } from '#/lib/types'

export function getWixClientId(): string | undefined {
  const id = process.env.WIX_CLIENT_ID?.trim()
  return id ? id : undefined
}

export function getSiteConfig(): SiteConfig {
  const siteUrl = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
  return {
    siteUrl,
    siteName: process.env.SITE_NAME || 'Wix SEO Store',
    siteDescription:
      process.env.SITE_DESCRIPTION ||
      'Thoughtfully made goods for everyday living, shipped fast. Shop apparel, home goods and accessories.',
    logo: process.env.SITE_LOGO_URL || '/logo.png',
    dataSource: getWixClientId() ? 'wix' : 'mock',
  }
}
