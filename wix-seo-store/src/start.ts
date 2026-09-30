import { createMiddleware, createStart } from '@tanstack/react-start'
import { transferResponseBodyOwnership } from '@tanstack/react-start/server'

const COMPRESSIBLE = /^(text\/|application\/(xml|json|javascript|ld\+json)|image\/svg\+xml)/

/**
 * gzip dynamic responses (SSR HTML, sitemap.xml, robots.txt, server-fn JSON).
 * Streaming-friendly: pipes the body through CompressionStream so SSR still
 * flushes early. Static assets are pre-compressed at build time by Nitro
 * (compressPublicAssets). A CDN in front would typically also do this.
 */
const compression = createMiddleware({ type: 'request' }).server(async ({ next, request }) => {
  const result = await next()
  const res = result.response
  const type = res.headers.get('content-type') ?? ''
  if (
    request.method === 'HEAD' ||
    !res.body ||
    res.headers.has('content-encoding') ||
    res.status === 204 ||
    res.status === 304 ||
    !COMPRESSIBLE.test(type) ||
    !/\bgzip\b/.test(request.headers.get('accept-encoding') ?? '')
  ) {
    return result
  }
  const headers = new Headers(res.headers)
  headers.set('Content-Encoding', 'gzip')
  headers.append('Vary', 'Accept-Encoding')
  headers.delete('Content-Length')
  // Tell Start the new body derives from the SSR stream so its lifecycle
  // (cleanup on finish/abort) follows the compressed response.
  return transferResponseBodyOwnership(
    res,
    new Response(res.body.pipeThrough(new CompressionStream('gzip')), {
      status: res.status,
      statusText: res.statusText,
      headers,
    }),
  )
})

export const startInstance = createStart(() => ({
  requestMiddleware: [compression],
}))
