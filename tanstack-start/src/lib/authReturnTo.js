// Post-auth destination, shared by the auth pages and the MCP consent page.
// Keep the check in one place — it is security-sensitive.
//
// Reads ?returnTo= (our pages) or ?from_url= (what the platform's redirectToLogin
// and login-gate redirects send). A same-origin check alone is not enough: a
// value like "/.//evil.com" or "/\evil.com" parses same-origin but normalizes
// to a protocol-relative "//evil.com" when assigned to location.href, so the
// resolved path must start with exactly one "/" and contain no backslash.
//
// An auth page is never a destination: coming back to /reset-password?token=…
// would carry a live one-time credential through the login round-trip (and,
// via Google, into the provider's OAuth state), and the other three would just
// loop. `/oauth/consent` is a legitimate destination and is not in this set.
const AUTH_PAGES = new Set(["/login", "/register", "/forgot-password", "/reset-password"]);

export function safeReturnTo(search) {
  if (typeof window === "undefined") return "/";
  const params = new URLSearchParams(search ?? window.location.search);
  return sanitizeReturnTo(params.get("returnTo") || params.get("from_url"));
}

export function sanitizeReturnTo(raw) {
  if (!raw || typeof window === "undefined") return "/";
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return "/";
    // Bootstrap params must never ride through a login round-trip and get
    // persisted into the fresh session. App-flow params (e.g. the consent ctx) stay.
    for (const p of ["access_token", "clear_access_token", "app_id", "app_base_url", "functions_version", "from_url", "returnTo"]) {
      url.searchParams.delete(p);
    }
    if (AUTH_PAGES.has(url.pathname.replace(/\/+$/, "") || "/")) return "/";
    const path = url.pathname + url.search;
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return "/";
    return path;
  } catch {
    return "/";
  }
}

// The current page as a returnTo value: same rules as any other destination, so
// an auth page or a bootstrap param never becomes the way back.
export function currentPath() {
  if (typeof window === "undefined") return "/";
  return sanitizeReturnTo(window.location.pathname + window.location.search);
}

// The current page as the absolute URL the platform login's from_url expects.
export function currentUrl() {
  if (typeof window === "undefined") return "/";
  return window.location.origin + currentPath();
}

// `search` for a <Link> to an auth page that should come back to `returnTo`.
export function returnToSearch(returnTo) {
  return returnTo && returnTo !== "/" ? { returnTo } : {};
}
