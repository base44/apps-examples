import type { ReactNode } from "react";
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { getSession } from "../lib/session.js";
import { AppHeader } from "../components/AppHeader.js";
import { Copilot } from "../components/Copilot.js";
import appCss from "../styles/app.css?url";

export const Route = createRootRoute({
  // Runs on the Worker for every request: resolves the logged-in user (and the
  // app id) server-side and exposes it to every route via context.
  beforeLoad: async () => {
    const session = await getSession();
    return { session };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Base44 CRM" },
      {
        name: "description",
        content:
          "A team sales CRM built on TanStack Start + Base44 with per-owner row-level security and an AI sales copilot.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
});

function RootComponent() {
  const { session } = Route.useRouteContext();

  return (
    <RootDocument>
      {session.user ? (
        <div className="app-shell">
          <AppHeader user={session.user} appId={session.appId} />
          <Outlet />
          {session.appId ? <Copilot appId={session.appId} /> : null}
        </div>
      ) : (
        <Outlet />
      )}
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
