/**
 * Minimal cart backed by Wix eCom "current cart" (per-visitor, anonymous).
 * Visitor tokens are kept in an httpOnly cookie so the cart survives reloads.
 * Falls back to a cookie-only cart when running on mock data.
 * Server-only.
 */
import { createClient, OAuthStrategy } from '@wix/sdk'
import type { Tokens } from '@wix/sdk'
import { currentCart } from '@wix/ecom'
import { redirects } from '@wix/redirects'
import { getCookie, setCookie } from '@tanstack/react-start/server'
import type { Cart } from '#/lib/types'
import { getSiteConfig, getWixClientId } from './env'
import { MOCK_PRODUCTS } from './catalog/mock-data'

const SESSION_COOKIE = 'wix_session'
const MOCK_COOKIE = 'mock_cart'
/** Wix Stores app id, used as catalogReference.appId for Stores products. */
const WIX_STORES_APP_ID = '215238eb-22a5-4c36-9e7b-e7c08025e04e'

const cookieOpts = () => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: getSiteConfig().siteUrl.startsWith('https://'),
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
})

async function visitorClient(clientId: string) {
  let tokens: Tokens | undefined
  try {
    const raw = getCookie(SESSION_COOKIE)
    tokens = raw ? (JSON.parse(raw) as Tokens) : undefined
  } catch {
    tokens = undefined
  }
  const client = createClient({
    modules: { currentCart, redirects },
    auth: OAuthStrategy({ clientId, tokens }),
  })
  // Returns the existing tokens if still valid, renews via refresh token if
  // expired, or mints fresh anonymous visitor tokens.
  const fresh = await client.auth.generateVisitorTokens(tokens)
  client.auth.setTokens(fresh)
  setCookie(SESSION_COOKIE, JSON.stringify(fresh), cookieOpts())
  return client
}

function isNotFound(err: unknown): boolean {
  const e = err as { details?: { httpStatus?: number }; status?: number }
  return e.details?.httpStatus === 404 || e.status === 404 || /not.?found/i.test(String(err))
}

function mapWixCart(cart: currentCart.Cart | undefined): Cart {
  const lines = (cart?.lineItems ?? []).map((li) => ({
    id: li._id!,
    productId: li.catalogReference?.catalogItemId ?? '',
    name: li.productName?.translated ?? li.productName?.original ?? 'Item',
    slug: li.url ? li.url.split('?')[0].split('/').filter(Boolean).pop() : undefined,
    quantity: li.quantity ?? 1,
    formattedPrice: li.price?.formattedConvertedAmount ?? li.price?.formattedAmount ?? '',
    image: li.image ? { src: li.image, width: 200, height: 200, alt: li.productName?.original ?? '' } : undefined,
  }))
  return {
    lines,
    formattedSubtotal:
      (cart as { subtotal?: { formattedAmount?: string } } | undefined)?.subtotal?.formattedAmount ?? '',
    checkoutAvailable: lines.length > 0,
  }
}

type MockLine = { productId: string; quantity: number }

function readMock(): Array<MockLine> {
  try {
    return JSON.parse(getCookie(MOCK_COOKIE) ?? '[]') as Array<MockLine>
  } catch {
    return []
  }
}

function mockCart(lines: Array<MockLine>): Cart {
  const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
  let subtotal = 0
  const out = lines.flatMap((l) => {
    const p = MOCK_PRODUCTS.find((x) => x.id === l.productId)
    if (!p) return []
    const unit = p.salePrice ?? p.price
    subtotal += unit * l.quantity
    return [
      {
        id: p.id,
        productId: p.id,
        name: p.name,
        slug: p.slug,
        quantity: l.quantity,
        formattedPrice: usd.format(unit),
        image: p.images[0],
      },
    ]
  })
  return { lines: out, formattedSubtotal: usd.format(subtotal), checkoutAvailable: false }
}

export async function getCart(): Promise<Cart> {
  const clientId = getWixClientId()
  if (!clientId) return mockCart(readMock())
  const client = await visitorClient(clientId)
  try {
    return mapWixCart(await client.currentCart.getCurrentCart())
  } catch (err) {
    if (isNotFound(err)) return mapWixCart(undefined)
    throw err
  }
}

export async function addToCart(
  productId: string,
  quantity: number,
  variantId?: string,
): Promise<Cart> {
  const clientId = getWixClientId()
  if (!clientId) {
    const lines = readMock()
    const existing = lines.find((l) => l.productId === productId)
    if (existing) existing.quantity += quantity
    else lines.push({ productId, quantity })
    setCookie(MOCK_COOKIE, JSON.stringify(lines), cookieOpts())
    return mockCart(lines)
  }
  const client = await visitorClient(clientId)
  const { cart } = await client.currentCart.addToCurrentCart({
    lineItems: [
      {
        catalogReference: {
          appId: WIX_STORES_APP_ID,
          catalogItemId: productId,
          // Catalog V3 identifies the purchasable unit by variant.
          ...(variantId ? { options: { variantId } } : {}),
        },
        quantity,
      },
    ],
  })
  return mapWixCart(cart)
}

/** Creates a Wix-hosted checkout redirect for the current cart. */
export async function createCheckoutUrl(): Promise<string | null> {
  const clientId = getWixClientId()
  if (!clientId) return null
  const client = await visitorClient(clientId)
  const { checkoutId } = await client.currentCart.createCheckoutFromCurrentCart({
    channelType: currentCart.ChannelType.WEB,
  })
  const { redirectSession } = await client.redirects.createRedirectSession({
    ecomCheckout: { checkoutId: checkoutId! },
    callbacks: { postFlowUrl: getSiteConfig().siteUrl },
  })
  return redirectSession?.fullUrl ?? null
}
