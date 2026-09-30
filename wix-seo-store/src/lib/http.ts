/**
 * Cache-Control for SSR HTML. Public catalog pages are CDN-cacheable for a
 * short time and served stale while revalidating; per-visitor pages
 * (cart, search) are never shared-cached.
 */
export const CACHE_PUBLIC_PAGE = {
  'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
}
export const CACHE_PRIVATE = { 'Cache-Control': 'private, no-store' }
/** 404s: cache briefly so a newly published product shows up quickly. */
export const CACHE_NOT_FOUND = {
  'Cache-Control': 'public, max-age=0, s-maxage=60',
}
/** Errors (e.g. Wix unreachable) must never be shared-cached. */
export const CACHE_ERROR = { 'Cache-Control': 'no-store' }

/** Cache-Control for a public catalog route, by how its match resolved. */
export function publicPageCache(status: string): Record<string, string> {
  if (status === 'success') return CACHE_PUBLIC_PAGE
  return status === 'notFound' ? CACHE_NOT_FOUND : CACHE_ERROR
}
