import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { safeReturnTo } from "@/lib/auth-return";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign in · Base44 App" }] }),
  component: LoginPage,
});

// The app's own sign-in page: base44.auth.redirectToLogin() targets this same
// /login, so sign in directly here instead.
function LoginPage() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [returnTo] = useState(safeReturnTo);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      await refresh();
      await navigate({ href: returnTo });
    } catch (err) {
      setError(err.message || "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use your Base44 app account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" onClick={() => base44.auth.loginWithProvider("google", returnTo)}>
            Continue with Google
          </Button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Separator className="flex-1" /> or <Separator className="flex-1" />
          </div>
          <form className="space-y-3" onSubmit={submit}>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" variant="outline" className="w-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in with email"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
