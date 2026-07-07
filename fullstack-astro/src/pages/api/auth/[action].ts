import type { APIRoute } from "astro";
import { Base44Error } from "@base44/sdk";
import { getServerClient } from "../../../lib/base44";

// Same-origin auth endpoints backing the app-owned /login page, following the
// same convention as the other /api/* routes: the browser never needs the SDK
// or the app id — the server runs the Base44 auth calls and, on success, sets
// the `base44_access_token` cookie that both SSR and /api/me read.
//
// Actions: login · register · verify (OTP) · resend (OTP).

const TOKEN_COOKIE = "base44_access_token";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "private, no-store",
    },
  });
}

export const POST: APIRoute = async (context) => {
  const base44 = getServerClient(context);
  if (!base44) {
    return json(
      { error: "Sign-in is available once this app is deployed on Base44." },
      503,
    );
  }

  // Mirrors what the SDK does in the browser after a successful login: store
  // the token in the cookie SSR reads. Not HttpOnly on purpose — sign-out
  // (src/lib/ui.ts) clears it with document.cookie, matching AuthBootstrap.
  function signedIn(token: string | undefined): Response {
    if (!token) return json({ error: "No access token in response." }, 502);
    context.cookies.set(TOKEN_COOKIE, token, {
      path: "/",
      maxAge: 2592000,
      sameSite: "lax",
      secure: context.url.protocol === "https:",
      httpOnly: false,
    });
    return json({ ok: true });
  }

  const body = await context.request.json().catch(() => ({}) as Record<string, unknown>);
  const email = String(body.email ?? "");
  const password = String(body.password ?? "");

  try {
    switch (context.params.action) {
      case "login": {
        const { access_token } = await base44.auth.loginViaEmailPassword(email, password);
        return signedIn(access_token);
      }
      case "register": {
        // Sends a 6-digit OTP to the email. On a private app this becomes an
        // access request for the admin instead — surface that message as-is.
        const res = await base44.auth.register({ email, password });
        return json({
          ok: true,
          accessRequest: Boolean(res?.access_request_created),
          message: res?.message ?? null,
        });
      }
      case "verify": {
        // A successful OTP verification returns an access token — the user is
        // signed in immediately.
        const res = await base44.auth.verifyOtp({ email, otpCode: String(body.code ?? "") });
        return signedIn(res?.access_token);
      }
      case "resend": {
        await base44.auth.resendOtp(email);
        return json({ ok: true });
      }
      default:
        return json({ error: "Unknown action." }, 404);
    }
  } catch (err) {
    if (err instanceof Base44Error) {
      // The backend's messages are user-appropriate ("Invalid email or
      // password", "Please verify your email…", "already exists"…).
      return json({ error: err.message, status: err.status ?? 400 }, err.status ?? 400);
    }
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
};
