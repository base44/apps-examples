import { useEffect, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { getAccessToken, Base44Error } from "@base44/sdk";
import { getBrowserClient } from "../lib/browser-client.js";

// The app OWNS this page: on your deployed domain, Base44 reserves only
// /api/apps/* and /ws-user-apps/* — every other path, including /login, is
// served by this app. Sign-in AND sign-up go through the Base44 SDK directly.

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

type Mode = "signin" | "signup" | "verify";

function LoginPage() {
  const { from } = Route.useSearch();
  const { session } = Route.useRouteContext();
  const base44 = session.base44;
  const dest = safePath(from);

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // OAuth return: Base44 redirects back with `?access_token=…`. Capturing it
  // saves the token to localStorage AND mirrors it to the cookie the server
  // reads, so a full reload lands on an authenticated, server-rendered page.
  useEffect(() => {
    const token = getAccessToken();
    if (token) window.location.assign(dest);
  }, [dest]);

  function requireConfig(): boolean {
    if (!base44) {
      setError("This app isn't linked to Base44 yet. Deploy it first (see the README).");
      return false;
    }
    return true;
  }

  function fail(err: unknown, fallback: string) {
    setError(err instanceof Base44Error ? err.message : fallback);
    setBusy(false);
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (!requireConfig()) return;
    setBusy(true);
    setError(null);
    try {
      await getBrowserClient(base44!).auth.loginViaEmailPassword(email, password);
      window.location.assign(dest); // fresh SSR load now carries the session cookie
    } catch (err) {
      // Account exists but the email was never verified — resume verification.
      if (err instanceof Base44Error && err.message.includes("verify your email")) {
        await getBrowserClient(base44!).auth.resendOtp(email).catch(() => {});
        setNotice(`We emailed a new verification code to ${email}.`);
        setMode("verify");
        setBusy(false);
        return;
      }
      fail(err, "Sign-in failed. Please try again.");
    }
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    if (!requireConfig()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await getBrowserClient(base44!).auth.register({ email, password });
      if (res?.access_request_created) {
        // Private app: registration becomes an access request for the admin.
        setNotice(res.message ?? "Access requested — watch your inbox.");
        setBusy(false);
        return;
      }
      setNotice(`We emailed a 6-digit verification code to ${email}.`);
      setMode("verify");
      setBusy(false);
    } catch (err) {
      fail(err, "Sign-up failed. Please try again.");
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!requireConfig()) return;
    setBusy(true);
    setError(null);
    try {
      const auth = getBrowserClient(base44!).auth;
      await auth.verifyOtp({ email, otpCode: code });
      // SDK-documented flow: log in after verification so the token lands in
      // localStorage and the SSR cookie mirror.
      await auth.loginViaEmailPassword(email, password);
      window.location.assign(dest);
    } catch (err) {
      fail(err, "Verification failed. Please try again.");
    }
  }

  async function resend() {
    if (!requireConfig()) return;
    setError(null);
    try {
      await getBrowserClient(base44!).auth.resendOtp(email);
      setNotice(`A new code is on its way to ${email}.`);
    } catch (err) {
      fail(err, "Couldn't resend the code. Please try again.");
    }
  }

  function google() {
    if (!requireConfig()) return;
    // Return to /login so the effect above can capture the token, then forward.
    // NOTE: on newly added base domains the staging OAuth gateway may reject
    // Google sign-in until the domain is allowlisted — that's platform
    // configuration, not app code. Email/password works regardless.
    getBrowserClient(base44!).auth.loginWithProvider(
      "google",
      `/login?from=${encodeURIComponent(dest)}`,
    );
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand">
          <span className="brand-mark">B</span>
          <span>Base44 CRM</span>
        </div>
        <p className="tagline">
          {mode === "signin" && "Sign in to your sales workspace"}
          {mode === "signup" && "Create your account"}
          {mode === "verify" && `Enter the 6-digit code we sent to ${email}`}
        </p>

        {notice ? <div className="form-notice">{notice}</div> : null}

        {mode !== "verify" && (
          <>
            <button className="btn block" onClick={google} disabled={busy}>
              <span aria-hidden>🔓</span> Continue with Google
            </button>

            <div className="auth-divider">or with email</div>
          </>
        )}

        {mode === "verify" ? (
          <form onSubmit={verify}>
            <div className="field">
              <label htmlFor="otp">Verification code</label>
              <input
                id="otp"
                className="input"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
              />
            </div>
            {error ? <div className="form-error">{error}</div> : null}
            <button className="btn btn-primary block" type="submit" disabled={busy}>
              {busy ? <span className="spinner" /> : "Verify and sign in"}
            </button>
            <p className="auth-switch">
              Didn't get it?{" "}
              <button type="button" className="link-btn" onClick={resend}>
                Resend code
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={mode === "signin" ? signIn : signUp}>
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
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                minLength={mode === "signup" ? 8 : undefined}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
              />
            </div>
            {error ? <div className="form-error">{error}</div> : null}
            <button className="btn btn-primary block" type="submit" disabled={busy}>
              {busy ? (
                <span className="spinner" />
              ) : mode === "signin" ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </button>
            <p className="auth-switch">
              {mode === "signin" ? (
                <>
                  New here?{" "}
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => switchMode("signup")}
                  >
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => switchMode("signin")}
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
