import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";

const AuthContext = createContext(null);

/**
 * Client-side session state. The server renders every page anonymously and
 * this provider resolves the visitor after hydration — so the first client
 * render matches the server markup and nothing here can cause a hydration
 * mismatch. Gate user-specific UI on `isLoadingAuth`.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  const refresh = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      setUser(await base44.auth.me());
    } catch (err) {
      setUser(null);
      const reason = err?.data?.extra_data?.reason;
      if (reason === "user_not_registered") setAuthError({ type: "user_not_registered", message: "Not registered" });
      else if (err?.status && err.status !== 401 && err.status !== 403) {
        setAuthError({ type: "unknown", message: err.message ?? "Failed to load session" });
      }
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoadingAuth,
      authError,
      refresh,
      logout: () => {
        setUser(null);
        base44.auth.logout(window.location.origin);
      },
      navigateToLogin: () => base44.auth.redirectToLogin(window.location.href),
    }),
    [user, isLoadingAuth, authError, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
