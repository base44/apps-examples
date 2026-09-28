// Where to go after signing in: ?from_url= (sent by base44.auth.redirectToLogin)
// or ?returnTo=, reduced to a same-origin path, else "/".
//
// Same-origin is not enough: /.//evil.com or /\evil.com parse same-origin but
// become a protocol-relative //evil.com once assigned to location.href, so the
// path must start with exactly one slash and contain no backslash.
export function safeReturnTo() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("from_url") || params.get("returnTo");
  if (!raw) return "/";
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return "/";
    for (const p of ["access_token", "clear_access_token", "from_url"]) url.searchParams.delete(p);
    const path = url.pathname + url.search + url.hash;
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return "/";
    return path.startsWith("/login") ? "/" : path;
  } catch {
    return "/";
  }
}
