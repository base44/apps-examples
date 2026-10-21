import { createClientFromRequest, getAccessToken } from "@base44/sdk";
import { createMiddleware } from "@tanstack/react-start";
import { getRequest, setResponseStatus } from "@tanstack/react-start/server";

// Both middlewares hand handlers the same lazy `context.getBase44()`: a
// function, not the client, because the client needs the platform headers and
// a handler that never touches Base44 must still answer without them. The
// platform sets those headers on every request that reaches the server; a
// visitor's Authorization header makes the client act as that visitor.
const withGetBase44 = (next, request = getRequest()) => {
  let client;
  return next({ context: { getBase44: () => (client ??= createClientFromRequest(request)) } });
};

// Applied to every server function by src/start.js: sends the visitor's Base44
// access token with the call so `context.getBase44()` acts as the visitor (entity
// access rules apply). Anonymous visitors send nothing and get an anonymous client.
export const authMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const token = typeof window === "undefined" ? null : getAccessToken();
    return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
  })
  .server(({ next }) => withGetBase44(next));

// Applied to every request by src/start.js, so a server route handler
// (`server.handlers`) receives the same `context.getBase44()` as a server function.
export const base44RequestMiddleware = createMiddleware({ type: "request" }).server(({ next, request }) =>
  withGetBase44(next, request),
);

// Only an auth rejection means "not signed in"; outages and rate limits propagate as themselves.
const currentUser = (context) =>
  context
    .getBase44()
    .auth.me()
    .catch((error) => {
      if (error?.status === 401 || error?.status === 403) return null;
      throw error;
    });

// Neither middleware authenticates anyone. Add this to a server function that
// needs a signed-in caller; it rejects anonymous callers and sets `context.user`:
//   createServerFn().middleware([requireUser]).handler(({ context }) => context.user.id)
export const requireUser = createMiddleware({ type: "function" }).server(async ({ next, context }) => {
  const user = await currentUser(context);
  if (!user) {
    setResponseStatus(401);
    throw Object.assign(new Error("Unauthorized"), { status: 401, code: "UNAUTHORIZED" });
  }
  return next({ context: { user } });
});

// The same for a server route: `server: { middleware: [requireUserRoute], handlers }` answers
// anonymous callers with 401 and sets `context.user`. Only on src/routes/api/* files: a route's
// middleware also runs for every route under it, and page navigations carry no token.
export const requireUserRoute = createMiddleware({ type: "request" }).server(async ({ next, context }) => {
  const user = await currentUser(context);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return next({ context: { user } });
});
