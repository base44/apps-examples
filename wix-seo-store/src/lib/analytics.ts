/**
 * Wix analytics events (client-side). `window.wixAnalytics` comes from the
 * site-analytics runtime in the Wix site scripts, which forwards to whatever the
 * merchant connected (GA4, Meta Pixel, GTM). Its script is deferred, so events
 * fired before it loads are queued and replayed.
 */
type WixAnalytics = { trackEvent: (name: string, params?: Record<string, unknown>) => void }

declare global {
  interface Window {
    wixAnalytics?: WixAnalytics
  }
}

const queue: Array<[string, Record<string, unknown>]> = []
let polling = false

function drain() {
  const wa = window.wixAnalytics
  if (!wa) return false
  for (const [name, params] of queue.splice(0)) wa.trackEvent(name, params)
  return true
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  queue.push([name, params])
  if (drain() || polling) return
  polling = true
  let tries = 0
  const timer = setInterval(() => {
    if (drain() || ++tries > 50) {
      clearInterval(timer)
      polling = false
    }
  }, 200)
}

export interface TrackedProduct {
  id: string
  name: string
  price: number
  currency: string
  category?: string
  variant?: string
  sku?: string
}

export const productParams = (p: TrackedProduct, quantity = 1) => ({
  id: p.id,
  name: p.name,
  price: p.price,
  currency: p.currency,
  quantity,
  ...(p.category ? { category: p.category } : {}),
  ...(p.variant ? { variant: p.variant } : {}),
  ...(p.sku ? { sku: p.sku } : {}),
})
