/**
 * Wix member login/logout (OAuth + PKCE via Wix-hosted login), mirroring
 * @wix/astro's /api/auth/* routes (here under /account/*: Base44 owns /api/auth/*). Member tokens replace the visitor tokens in
 * the httpOnly session cookie; nothing auth-related reaches browser JS.
 * The callback URL `${SITE_URL}/account/callback` must be an allowed redirect
 * URI of the Wix OAuth app (Headless Settings).
 * Server-only.
 */
import { createClient, OAuthStrategy } from '@wix/sdk'
import type { OauthData } from '@wix/sdk'
import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server'
import { getSiteConfig, getWixClientId } from './env'
import { clearSession, cookieOpts, isMember, saveTokens, sessionClient } from './session'

const STATE_COOKIE = 'wix_oauth_state'

/** Only same-site relative paths, so login can't be used as an open redirect. */
function safeReturnTo(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')
    ? value
    : '/'
}

const redirect = (location: string) =>
  new Response(null, { status: 302, headers: { Location: location, 'Cache-Control': 'no-store' } })

const authClient = (clientId: string) => createClient({ auth: OAuthStrategy({ clientId }) })

export async function login(request: Request): Promise<Response> {
  const clientId = getWixClientId()
  const url = new URL(request.url)
  const returnTo = safeReturnTo(url.searchParams.get('returnToUrl'))
  if (!clientId) return redirect(returnTo)
  const { siteUrl } = getSiteConfig()
  const client = authClient(clientId)
  const oauthData = client.auth.generateOAuthData(`${siteUrl}/account/callback`, returnTo)
  const { authUrl } = await client.auth.getAuthUrl(oauthData, {
    prompt: url.searchParams.get('prompt') === 'none' ? 'none' : 'login',
    responseMode: 'query',
  })
  setCookie(STATE_COOKIE, JSON.stringify(oauthData), cookieOpts(1800))
  return redirect(authUrl)
}

export async function callback(request: Request): Promise<Response> {
  const clientId = getWixClientId()
  let oauthData: OauthData | undefined
  try {
    oauthData = JSON.parse(getCookie(STATE_COOKIE) ?? '') as OauthData
  } catch {
    oauthData = undefined
  }
  deleteCookie(STATE_COOKIE, { path: '/' })
  if (!clientId || !oauthData) return redirect('/')
  const client = authClient(clientId)
  const { code, state, error } = client.auth.parseFromUrl(request.url, 'query')
  if (error || !code || state !== oauthData.state) return redirect(safeReturnTo(oauthData.originalUri))
  saveTokens(await client.auth.getMemberTokens(code, state, oauthData))
  return redirect(safeReturnTo(oauthData.originalUri))
}

export async function logout(request: Request): Promise<Response> {
  const clientId = getWixClientId()
  const returnTo = safeReturnTo(new URL(request.url).searchParams.get('returnToUrl'))
  if (!clientId || !isMember()) {
    clearSession()
    return redirect(returnTo)
  }
  const { siteUrl } = getSiteConfig()
  const client = await sessionClient(clientId)
  const { logoutUrl } = await client.auth.logout(
    `${siteUrl}/account/logout-callback?returnTo=${encodeURIComponent(returnTo)}`,
  )
  clearSession()
  return redirect(logoutUrl)
}

export function logoutCallback(request: Request): Response {
  clearSession()
  return redirect(safeReturnTo(new URL(request.url).searchParams.get('returnTo')))
}

/** Per-visitor auth state for the header; never CDN-cached. */
export function me(): Response {
  return Response.json(
    { member: Boolean(getWixClientId()) && isMember() },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
