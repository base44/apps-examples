// Edge-cache policy helpers.
//
// Base44's dispatcher is a *dumb* shared cache: it will cache a GET/HEAD 200
// response ONLY when the app itself says the response is shareable via
// `Cache-Control` (public + a positive max-age/s-maxage, no `Set-Cookie`, and
// not private/no-store/no-cache). The APP owns cacheability — so we set the
// right header explicitly on every page.
//
// Rule of thumb used across this app:
//   - Public, identical-for-everyone pages (catalog, product, category) ->
//     PUBLIC_CACHE, so the edge can serve them fast to all visitors.
//   - Anything personalised (auth'd header content, cart, checkout, orders) ->
//     PRIVATE_CACHE, so the shared cache never stores one user's view.

/**
 * Fresh at the edge for 5 minutes (`s-maxage`), fresh in the browser for 1
 * minute (`max-age`), and allowed to serve a slightly stale copy for up to 10
 * minutes while it revalidates in the background. Tune to taste per page.
 */
export const PUBLIC_CACHE =
  "public, max-age=60, s-maxage=300, stale-while-revalidate=600";

/** Never share and never store — the correct default for authenticated content. */
export const PRIVATE_CACHE = "private, no-store";

interface ResponseLike {
  response: { headers: Headers };
}

/** Mark the current page as publicly cacheable at the edge. */
export function setPublicCache(astro: ResponseLike): void {
  astro.response.headers.set("Cache-Control", PUBLIC_CACHE);
}

/** Mark the current page as private / uncacheable (per-user content). */
export function setPrivateCache(astro: ResponseLike): void {
  astro.response.headers.set("Cache-Control", PRIVATE_CACHE);
}
