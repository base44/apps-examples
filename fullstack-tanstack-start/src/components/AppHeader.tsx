import { Link } from "@tanstack/react-router";
import type { SessionUser } from "../lib/types.js";
import { getBrowserClient } from "../lib/browser-client.js";
import { initials } from "../lib/format.js";

interface Props {
  user: SessionUser;
  appId: string | null;
}

export function AppHeader({ user, appId }: Props) {
  function logout() {
    if (appId) {
      getBrowserClient(appId).auth.logout("/login");
    } else {
      window.location.href = "/login";
    }
  }

  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <span className="brand-mark">B</span>
        <span>Base44 CRM</span>
      </Link>

      <nav className="nav">
        <Link to="/" activeProps={{ className: "active" }} activeOptions={{ exact: true }}>
          Dashboard
        </Link>
        <Link to="/deals" activeProps={{ className: "active" }}>
          Deals
        </Link>
        <Link to="/contacts" activeProps={{ className: "active" }}>
          Contacts
        </Link>
      </nav>

      <div className="topbar-right">
        <div className="user-chip">
          <span className="avatar">{initials(user.full_name ?? user.email)}</span>
          <span className="meta">
            <span className="name">{user.full_name ?? user.email}</span>
            <span className="role">{user.role === "admin" ? "Sales manager" : "Sales rep"}</span>
          </span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={logout}>
          Log out
        </button>
      </div>
    </header>
  );
}
