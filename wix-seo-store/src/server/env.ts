/**
 * Server-only runtime configuration. Read from process.env at request time so
 * the same build can be deployed to any origin (canonical URLs follow SITE_URL).
 */
import { getRequestUrl } from '@tanstack/react-start/server'
import type { SiteConfig } from '#/lib/types'

/** Public origin of the current request; hosts like Base44 forward the visitor's host. */
function requestOrigin(): string | undefined {
  try {
    return getRequestUrl().origin
  } catch {
    return undefined
  }
}

export function getWixClientId(): string | undefined {
  const id = process.env.WIX_CLIENT_ID?.trim()
  return id ? id : undefined
}

export function getSiteConfig(): SiteConfig {
  const siteUrl = (process.env.SITE_URL || requestOrigin() || 'http://localhost:3000').replace(
    /\/$/,
    '',
  )
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

/** Public URL of the Wix site itself (for checkout, payment links, invoices). */
export function getWixSiteUrl(): string | undefined {
  return process.env.WIX_SITE_URL?.trim().replace(/\/$/, '') || undefined
}
