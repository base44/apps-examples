import { createMiddleware, createStart } from '@tanstack/react-start'
import { transferResponseBodyOwnership } from '@tanstack/react-start/server'
import { getSiteConfig, getWixClientId, getWixSiteUrl } from '#/server/env'
import { getSiteEmbeds, injectEmbeds } from '#/server/site-scripts'

/** Wix site scripts (Custom Code, marketing tags, consent, analytics) into every SSR page. */
const siteEmbeds = createMiddleware({ type: 'request' }).server(async ({ next, request }) => {
  const result = await next()
  const res = result.response
  const clientId = getWixClientId()
  if (
    !clientId ||
    request.method !== 'GET' ||
    !res.body ||
    !(res.headers.get('content-type') ?? '').startsWith('text/html')
  ) {
    return result
  }
  const { pathname, search } = new URL(request.url)
  const embeds = await getSiteEmbeds(clientId, `${getSiteConfig().siteUrl}${pathname}${search}`)
  const headers = new Headers(res.headers)
  headers.delete('Content-Length')
  return transferResponseBodyOwnership(
    res,
    new Response(injectEmbeds(res.body, embeds), {
      status: res.status,
      statusText: res.statusText,
      headers,
    }),
  )
})

/**
 * Paths Wix emails and dashboards link to on the storefront's own domain
 * (payment links, price quotes, checkout, invoices via /_api). Like @wix/astro,
 * hand them to the Wix site: 302 for pages, 307 for /_api so method and body survive.
 */
const WIX_PAGE_PATHS = /^\/(checkout|__ecom\/checkout|_paylink\/[^/]+|_proposal\/[^/]+)\/?$/
const wixPaths = createMiddleware({ type: 'request' }).server(({ next, request }) => {
  const wixSite = getWixSiteUrl()
  const url = new URL(request.url)
  const status = url.pathname.startsWith('/_api/') ? 307 : WIX_PAGE_PATHS.test(url.pathname) ? 302 : 0
  if (!wixSite || !status) return next()
  return new Response(null, {
    status,
    headers: { Location: `${wixSite}${url.pathname}${url.search}`, 'Cache-Control': 'no-store' },
  })
})

// Compression is left to the Workers runtime / edge; body compression here would double-encode.
export const startInstance = createStart(() => ({
  requestMiddleware: [wixPaths, siteEmbeds],
}))
