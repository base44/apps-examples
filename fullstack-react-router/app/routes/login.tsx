import { useEffect, useState } from "react";
import type { Route } from "./+types/login";
import { redirect } from "react-router";
import { Base44Error, getAccessToken } from "@base44/sdk";
import { getBrowserClient } from "../lib/base44.client";
import { getCurrentUser, getServerClient } from "../lib/base44.server";

// The app OWNS this page. On your deployed domain, Base44 reserves only
// /api/apps/* and /ws-user-apps/* — every other path, including /login, is
// served by this Worker. Sign-in and sign-up talk to the Base44 auth API
// through the SDK; there is no platform-hosted /login on the app's domain.

// Only same-origin paths make valid return targets ("//evil.com" is not).
function safeDest(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const dest = safeDest(url.searchParams.get("from_url") ?? url.searchParams.get("from"));
  // Already signed in (cookie-mirrored token)? Skip the form.
  const user = await getCurrentUser(getServerClient(request, context));
  if (user) throw redirect(dest);
  return { dest };
}

// Never edge-cache an auth page.
export function headers() {
  return { "Cache-Control": "no-store" };
}

export const meta: Route.MetaFunction = () => [
  { title: "Sign in — Base44 Estates" },
];

type Mode = "signin" | "signup" | "verify";

export default function Login({ loaderData }: Route.ComponentProps) {
  const { dest } = loaderData;

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Google OAuth return: Base44 redirects back here with `?access_token=…`.
  // getAccessToken() stores it in localStorage AND mirrors it to the cookie the
  // server reads, so the next document load renders as the signed-in user.
  useEffect(() => {
    if (getAccessToken()) window.location.assign(dest);
  }, [dest]);

  function fail(err: unknown, fallback: string) {
    setError(err instanceof Base44Error ? err.message : fallback);
    setBusy(false);
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await getBrowserClient().auth.loginViaEmailPassword(email, password);
      window.location.assign(dest); // fresh SSR load now carries the session cookie
    } catch (err) {
      // Account exists but the email was never verified — resume verification.
      if (err instanceof Base44Error && err.message.includes("verify your email")) {
        await getBrowserClient().auth.resendOtp(email).catch(() => {});
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
    setBusy(true);
    setError(null);
    try {
      const res = await getBrowserClient().auth.register({ email, password });
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
    setBusy(true);
    setError(null);
    try {
      const auth = getBrowserClient().auth;
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
    setError(null);
    try {
      await getBrowserClient().auth.resendOtp(email);
      setNotice(`A new code is on its way to ${email}.`);
    } catch (err) {
      fail(err, "Couldn't resend the code. Please try again.");
    }
  }

  function google() {
    // Redirect OAuth flow via the SDK; it round-trips through same-origin
    // /api/apps/auth/login (a platform-reserved path) and returns here with
    // ?access_token=… for the effect above to capture.
    // NOTE: on newly added base domains the staging OAuth gateway may reject
    // Google sign-in until the domain is allowlisted — that's platform
    // configuration, not app code. Email/password works regardless.
    getBrowserClient().auth.loginWithProvider(
      "google",
      `/login?from_url=${encodeURIComponent(dest)}`,
    );
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  return (
    <main>
      <div className="auth-wrap">
        <div className="auth-card">
          <p className="eyebrow">
            {mode === "verify" ? "Check your inbox" : "Welcome"}
          </p>
          <h1>
            {mode === "signin" && "Sign in to Estates"}
            {mode === "signup" && "Create your account"}
            {mode === "verify" && "Verify your email"}
          </h1>
          <p className="auth-sub">
            {mode === "verify"
              ? `Enter the 6-digit code we sent to ${email}.`
              : "Save favorite homes and manage your listings."}
          </p>

          {notice && (
            <div className="notice notice-ok" role="status">
              {notice}
            </div>
          )}

          {mode !== "verify" && (
            <>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={google}
                disabled={busy}
              >
                Continue with Google
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
              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={busy}
              >
                {busy ? "Verifying…" : "Verify and sign in"}
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
                  placeholder="you@example.com"
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
              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={busy}
              >
                {busy
                  ? "One moment…"
                  : mode === "signin"
                    ? "Sign in"
                    : "Create account"}
              </button>
              <p className="auth-switch">
                {mode === "signin" ? (
                  <>
                    New to Estates?{" "}
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
    </main>
  );
}
