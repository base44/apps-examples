// Client-side wiring for the app-owned /login page.
//
// Like every other write in this app, auth goes through same-origin API routes
// (`/api/auth/*`, see src/pages/api/auth/[action].ts) that run the Base44 SDK
// server-side — the browser never needs the SDK or the app id. A successful
// call sets the `base44_access_token` cookie, so a plain navigation afterwards
// renders as the signed-in user.

type Mode = "signin" | "signup" | "verify";

interface AuthResponse {
  ok?: boolean;
  error?: string;
  accessRequest?: boolean;
  message?: string | null;
}

async function post(action: string, payload: unknown): Promise<AuthResponse> {
  try {
    const res = await fetch(`/api/auth/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });
    return (await res.json()) as AuthResponse;
  } catch {
    return { error: "Network error. Please try again." };
  }
}

export function mountLoginForms(): void {
  const root = document.querySelector<HTMLElement>("[data-auth]");
  if (!root) return;
  const dest = root.dataset.dest || "/";

  const forms: Record<Mode, HTMLFormElement | null> = {
    signin: root.querySelector("[data-signin-form]"),
    signup: root.querySelector("[data-signup-form]"),
    verify: root.querySelector("[data-verify-form]"),
  };
  const oauth = root.querySelector<HTMLElement>("[data-auth-oauth]");
  const eyebrow = root.querySelector<HTMLElement>("[data-auth-eyebrow]");
  const title = root.querySelector<HTMLElement>("[data-auth-title]");
  const sub = root.querySelector<HTMLElement>("[data-auth-sub]");
  const noticeEl = root.querySelector<HTMLElement>("[data-auth-notice]");
  const errorEl = root.querySelector<HTMLElement>("[data-auth-error]");
  if (!forms.signin) return; // no live backend — static note is shown instead

  // The email/password typed into either form; kept so OTP verification can
  // be resumed after an unverified sign-in attempt.
  let email = "";
  let password = "";

  function setText(el: HTMLElement | null, text: string | null): void {
    if (!el) return;
    el.hidden = !text;
    el.textContent = text ?? "";
  }

  function show(mode: Mode): void {
    for (const [name, form] of Object.entries(forms)) {
      if (form) form.hidden = name !== mode;
    }
    if (oauth) oauth.hidden = mode === "verify";
    setText(errorEl, null);
    if (eyebrow) eyebrow.textContent = mode === "verify" ? "Check your inbox" : "Welcome";
    if (title) {
      title.textContent =
        mode === "signin"
          ? "Sign in to Meridian"
          : mode === "signup"
            ? "Create your account"
            : "Verify your email";
    }
    if (sub) {
      sub.textContent =
        mode === "verify"
          ? `Enter the 6-digit code we sent to ${email}.`
          : "Track orders, check out faster, and review your favorite roasts.";
    }
  }

  function busy(form: HTMLFormElement, on: boolean): void {
    const btn = form.querySelector<HTMLButtonElement>("button[type=submit]");
    if (btn) btn.disabled = on;
  }

  root.querySelector("[data-show-signup]")?.addEventListener("click", () => {
    setText(noticeEl, null);
    show("signup");
  });
  root.querySelector("[data-show-signin]")?.addEventListener("click", () => {
    setText(noticeEl, null);
    show("signin");
  });

  forms.signin.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = forms.signin!;
    const data = new FormData(form);
    email = String(data.get("email") || "");
    password = String(data.get("password") || "");
    busy(form, true);
    setText(errorEl, null);
    const res = await post("login", { email, password });
    if (res.ok) {
      location.assign(dest);
      return;
    }
    // Account exists but the email was never verified — resume verification.
    if (res.error?.includes("verify your email")) {
      await post("resend", { email });
      setText(noticeEl, `We emailed a new verification code to ${email}.`);
      show("verify");
    } else {
      setText(errorEl, res.error ?? "Sign-in failed. Please try again.");
    }
    busy(form, false);
  });

  forms.signup?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = forms.signup!;
    const data = new FormData(form);
    email = String(data.get("email") || "");
    password = String(data.get("password") || "");
    busy(form, true);
    setText(errorEl, null);
    const res = await post("register", { email, password });
    if (res.ok && res.accessRequest) {
      // Private app: registration became an access request for the admin.
      setText(noticeEl, res.message || "Access requested — watch your inbox.");
    } else if (res.ok) {
      setText(noticeEl, `We emailed a 6-digit verification code to ${email}.`);
      show("verify");
    } else {
      setText(errorEl, res.error ?? "Sign-up failed. Please try again.");
    }
    busy(form, false);
  });

  forms.verify?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = forms.verify!;
    const code = String(new FormData(form).get("code") || "");
    busy(form, true);
    setText(errorEl, null);
    // A successful verification signs the user in (the API route sets the
    // session cookie from the verify response).
    const res = await post("verify", { email, code });
    if (res.ok) {
      location.assign(dest);
      return;
    }
    setText(errorEl, res.error ?? "Verification failed. Please try again.");
    busy(form, false);
  });

  root.querySelector("[data-resend]")?.addEventListener("click", async () => {
    setText(errorEl, null);
    const res = await post("resend", { email });
    setText(
      res.ok ? noticeEl : errorEl,
      res.ok ? `A new code is on its way to ${email}.` : (res.error ?? "Couldn't resend the code."),
    );
  });
}
