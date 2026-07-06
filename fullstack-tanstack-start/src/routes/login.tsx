import { useEffect, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { getAccessToken, Base44Error } from "@base44/sdk";
import { getBrowserClient } from "../lib/browser-client.js";

interface LoginSearch {
  from?: string;
}

function safePath(from: string | undefined): string {
  return from && from.startsWith("/") ? from : "/";
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    from: typeof search.from === "string" ? search.from : undefined,
  }),
  beforeLoad: ({ context, search }) => {
    // Already signed in? Skip the form.
    if (context.session.user) {
      throw redirect({ to: safePath(search.from) });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const { from } = Route.useSearch();
  const { session } = Route.useRouteContext();
  const appId = session.appId;
  const dest = safePath(from);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OAuth return: Base44 redirects back with `?access_token=…`. Capturing it
  // saves the token to localStorage AND mirrors it to the cookie the server
  // reads, so a full reload lands on an authenticated, server-rendered page.
  useEffect(() => {
    const token = getAccessToken();
    if (token) window.location.assign(dest);
  }, [dest]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!appId) {
      setError("This app isn't linked to Base44 yet. Deploy it first (see the README).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await getBrowserClient(appId).auth.loginViaEmailPassword(email, password);
      window.location.assign(dest); // fresh SSR load now carries the session cookie
    } catch (err) {
      const message =
        err instanceof Base44Error
          ? "Incorrect email or password."
          : "Something went wrong. Please try again.";
      setError(message);
      setBusy(false);
    }
  }

  function google() {
    if (!appId) {
      setError("This app isn't linked to Base44 yet. Deploy it first (see the README).");
      return;
    }
    // Return to /login so the effect above can capture the token, then forward.
    getBrowserClient(appId).auth.loginWithProvider(
      "google",
      `/login?from=${encodeURIComponent(dest)}`,
    );
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand">
          <span className="brand-mark">B</span>
          <span>Base44 CRM</span>
        </div>
        <p className="tagline">Sign in to your sales workspace</p>

        <button className="btn block" onClick={google} disabled={busy}>
          <span aria-hidden>🔓</span> Continue with Google
        </button>

        <div className="auth-divider">or with email</div>

        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error ? <div className="form-error">{error}</div> : null}
          <button className="btn btn-primary block" type="submit" disabled={busy}>
            {busy ? <span className="spinner" /> : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
