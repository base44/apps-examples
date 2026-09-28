import { Link } from "@tanstack/react-router";
import { LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/AuthContext";

export function Logo({ className = "" }) {
  return (
    <span className={`flex items-center gap-2 font-display text-[15px] font-semibold tracking-tight ${className}`}>
      <span className="relative grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-300 text-[13px] font-bold text-stone-950 shadow-[0_0_24px_rgba(249,115,22,0.45)]">
        F
      </span>
      Foundry
    </span>
  );
}

export function AppShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-6 px-4 sm:px-6">
          <Link to="/" aria-label="Foundry home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
            <Link to="/studio" className="rounded-md px-3 py-1.5 hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              Studio
            </Link>
            <a href="#how-it-works" className="rounded-md px-3 py-1.5 hover:text-foreground">
              How it works
            </a>
          </nav>
          <div className="ml-auto">
            <SessionBadge />
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}

function SessionBadge() {
  const { user, isLoadingAuth, logout, navigateToLogin } = useAuth();
  if (isLoadingAuth) return <Skeleton className="h-8 w-28" />;
  if (!user) {
    return (
      <Button size="sm" variant="outline" onClick={navigateToLogin}>
        <LogIn className="mr-1.5 h-4 w-4" /> Sign in
      </Button>
    );
  }
  const initial = (user.full_name || user.email || "?").slice(0, 1).toUpperCase();
  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[14rem] truncate text-sm text-muted-foreground md:inline">{user.full_name || user.email}</span>
      <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-sm font-medium">{initial}</span>
      <Button size="icon" variant="ghost" onClick={logout} aria-label="Sign out">
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
