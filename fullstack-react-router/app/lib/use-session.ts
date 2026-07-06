import { useEffect, useState } from "react";
import { getBrowserClient } from "./base44.client";
import type { SessionUser } from "./types";

type SessionState = { user: SessionUser | null; loading: boolean };

// Resolves the current user on the CLIENT only. Public pages are edge-cached, so
// their SSR HTML must not embed a specific user's identity — we render the
// logged-out state on the server and fill in the real session after hydration.
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    user: null,
    loading: true,
  });

  useEffect(() => {
    let active = true;
    getBrowserClient()
      .auth.me()
      .then((u) => {
        if (active) setState({ user: u as unknown as SessionUser, loading: false });
      })
      .catch(() => {
        if (active) setState({ user: null, loading: false });
      });
    return () => {
      active = false;
    };
  }, []);

  return state;
}

export function login(nextUrl?: string) {
  const target =
    nextUrl ?? (typeof window !== "undefined" ? window.location.href : "/");
  getBrowserClient().auth.redirectToLogin(target);
}

export function logout() {
  getBrowserClient().auth.logout("/");
}
