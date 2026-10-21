import { redirect } from "@tanstack/react-router";
import { DefaultCatchBoundary } from "@/components/DefaultCatchBoundary";
import { UserNotRegistered } from "@/components/auth/UserNotRegistered";
import { authQuery } from "@/lib/AuthContext";

class NotRegisteredError extends Error {}

/**
 * The login gate for a pathless layout route (src/routes/_authed.jsx), which gates
 * every route under src/routes/_authed/ (their URLs carry no "_authed" segment):
 *
 *   createFileRoute("/_authed")({ ssr: false, beforeLoad: requireSignedIn, errorComponent: AuthGateError })
 *
 * TanStack Router's authenticated-routes pattern: beforeLoad reads the visitor from the
 * router context (the QueryClient's cached `authQuery`, shared with useAuth()), so a
 * child's loader never runs as an anonymous visitor. Signed out → /login with the way
 * back; signed in but not a user of this app → the not-registered screen. Children read
 * the visitor with `Route.useRouteContext().user`. `ssr: false` — the server is anonymous,
 * so these pages render in the browser only, and children inherit that.
 */
export async function requireSignedIn({ context, location }) {
  // A /me outage (429, 503) is not a sign-out: it rejects here and reaches the error
  // boundary, whose "Try again" asks the server again (a failed query caches nothing).
  const { user, error } = await context.queryClient.ensureQueryData(authQuery);
  if (user) return { user };
  // Thrown rather than returned so the children's loaders never run without a user.
  if (error?.type === "user_not_registered") throw new NotRegisteredError(error.message);
  // A document navigation on purpose: an app served behind the platform login gets the
  // platform's /login, which reads from_url; the app's own /login page reads returnTo.
  throw redirect({ to: "/login", search: { returnTo: location.href, from_url: location.href }, reloadDocument: true });
}

export function AuthGateError({ error }) {
  return error instanceof NotRegisteredError ? <UserNotRegistered /> : <DefaultCatchBoundary error={error} />;
}
