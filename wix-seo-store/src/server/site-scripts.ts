/**
 * Wix site scripts: everything Wix itself adds to a page of a Wix site —
 * dashboard Custom Code, marketing integrations (GA4/GTM/Meta Pixel), the
 * consent-policy runtime and the analytics/BI runtime (`window.wixAnalytics`).
 * Same source as @wix/astro's htmlEmbeds. Server-only.
 *
 * Wix's generic main-page SEO tags (`wix-seo-tag`) are dropped: every route
 * here renders more specific per-page tags, and two titles/canonicals would
 * conflict.
 */
import { createClient, OAuthStrategy } from '@wix/sdk'
import { scripts } from '@wix/headless-site-assets'

export interface SiteEmbeds {
  head: string
  bodyStart: string
  bodyEnd: string
}

const EMPTY: SiteEmbeds = { head: '', bodyStart: '', bodyEnd: '' }
const TTL_MS = 60_000
const TIMEOUT_MS = 1500

let cached: { clientId: string; client: ReturnType<typeof makeClient> } | undefined
const byUrl = new Map<string, { at: number; embeds: SiteEmbeds }>()

function makeClient(clientId: string) {
  return createClient({ modules: { scripts }, auth: OAuthStrategy({ clientId }) })
}

async function fetchEmbeds(clientId: string, pageUrl: string): Promise<SiteEmbeds> {
  if (cached?.clientId !== clientId) cached = { clientId, client: makeClient(clientId) }
  const { siteScripts } = await cached.client.scripts.listSiteScripts({ pageUrl })
  const out = { ...EMPTY }
  for (const s of siteScripts ?? []) {
    const html = s.html ?? ''
    if (!html || html.includes('wix-seo-tag')) continue
    if (s.position === 'BODY_START') out.bodyStart += html
    else if (s.position === 'BODY_END') out.bodyEnd += html
    else out.head += html
  }
  return out
}

/** Never fails the page: a slow or failing Wix call just means no embeds. */
export async function getSiteEmbeds(clientId: string, pageUrl: string): Promise<SiteEmbeds> {
  const hit = byUrl.get(pageUrl)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.embeds
  try {
    const embeds = await Promise.race([
      fetchEmbeds(clientId, pageUrl),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('site scripts timeout')), TIMEOUT_MS),
      ),
    ])
    if (byUrl.size > 500) byUrl.clear()
    byUrl.set(pageUrl, { at: Date.now(), embeds })
    return embeds
  } catch (err) {
    console.error('[site-scripts] unavailable', err)
    return EMPTY
  }
}

/**
 * Streams the SSR HTML, inserting embeds before `</head>`, after `<body…>` and
 * before `</body>`. Markers are matched on a small carry-over window so a
 * marker split across chunks is still found.
 */
export function injectEmbeds(body: ReadableStream<Uint8Array>, embeds: SiteEmbeds) {
  const steps: Array<{ re: RegExp; html: string; after: boolean }> = [
    { re: /<\/head>/i, html: embeds.head, after: false },
    { re: /<body[^>]*>/i, html: embeds.bodyStart, after: true },
    { re: /<\/body>/i, html: embeds.bodyEnd, after: false },
  ].filter((s) => s.html)
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let buf = ''
  const flush = (controller: TransformStreamDefaultController<Uint8Array>, all: boolean) => {
    while (steps.length) {
      const m = steps[0].re.exec(buf)
      if (!m) break
      const at = steps[0].after ? m.index + m[0].length : m.index
      controller.enqueue(encoder.encode(buf.slice(0, at) + steps[0].html))
      buf = buf.slice(at)
      steps.shift()
    }
    // Keep a tail long enough to hold a split marker (`<body …>` can be long).
    const keep = all || !steps.length ? 0 : 512
    if (buf.length > keep) {
      controller.enqueue(encoder.encode(buf.slice(0, buf.length - keep)))
      buf = buf.slice(buf.length - keep)
    }
  }
  return body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buf += decoder.decode(chunk, { stream: true })
        flush(controller, false)
      },
      flush(controller) {
        buf += decoder.decode()
        flush(controller, true)
      },
    }),
  )
}
