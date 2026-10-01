/**
 * Wix OAuth session (visitor or member) in an httpOnly cookie. The browser never
 * sees Wix tokens; every Wix call that needs the visitor's identity (cart,
 * checkout, member login) goes through server code using this client.
 * Server-only.
 */
import { createClient, OAuthStrategy } from '@wix/sdk'
import type { Tokens } from '@wix/sdk'
import { currentCart } from '@wix/ecom'
import { redirects } from '@wix/redirects'
import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server'
import { getSiteConfig } from './env'

const SESSION_COOKIE = 'wix_session'

export const cookieOpts = (maxAge = 60 * 60 * 24 * 30) => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: getSiteConfig().siteUrl.startsWith('https://'),
  path: '/',
  maxAge,
})

function readTokens(): Tokens | undefined {
  try {
    const raw = getCookie(SESSION_COOKIE)
    return raw ? (JSON.parse(raw) as Tokens) : undefined
  } catch {
    return undefined
  }
}

export function saveTokens(tokens: Tokens) {
  setCookie(SESSION_COOKIE, JSON.stringify(tokens), cookieOpts())
}

export function clearSession() {
  deleteCookie(SESSION_COOKIE, { path: '/' })
}

export function isMember(): boolean {
  return readTokens()?.refreshToken.role === 'member'
}

/**
 * Client bound to this visitor's session. Existing tokens are reused while
 * valid, renewed through the refresh token when expired (visitor or member),
 * or replaced with fresh anonymous visitor tokens.
 */
export async function sessionClient(clientId: string) {
  const tokens = readTokens()
  const client = createClient({
    modules: { currentCart, redirects },
    auth: OAuthStrategy({ clientId, tokens }),
  })
  const fresh = await client.auth.generateVisitorTokens(tokens)
  client.auth.setTokens(fresh)
  saveTokens(fresh)
  return client
}
