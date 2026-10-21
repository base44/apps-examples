import { UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { AuthLayout } from "./AuthLayout";

// Signed in to Base44, but not a user of this app (invite-only apps).
export function UserNotRegistered() {
  const { logout } = useAuth();
  return (
    <AuthLayout icon={UserX} title="Access not granted" subtitle="Your account is not registered for this app.">
      <p className="mb-6 text-center text-sm text-foreground">Ask the app owner for an invitation, or sign in with a different account.</p>
      <Button variant="outline" className="h-12 w-full font-medium" onClick={logout}>
        Sign out
      </Button>
    </AuthLayout>
  );
}
