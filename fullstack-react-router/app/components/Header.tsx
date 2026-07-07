import { NavLink } from "react-router";
import { useSession, login, logout } from "../lib/use-session";

function initials(user: { full_name: string | null; email: string }): string {
  const source = user.full_name?.trim() || user.email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

export function Header() {
  const { user, loading } = useSession();

  return (
    <header className="site-header">
      <div className="container">
        <NavLink to="/" className="brand" aria-label="Base44 Estates home">
          <span className="brand-mark">BE</span>
          <span>
            Base44&nbsp;<em>Estates</em>
          </span>
        </NavLink>

        <nav className="nav" aria-label="Primary">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/listings">Listings</NavLink>
          <NavLink to="/favorites">Favorites</NavLink>
          <NavLink to="/agent">Agents</NavLink>
        </nav>

        <div className="header-right">
          {user ? (
            <>
              <NavLink to="/agent" className="header-user">
                <span className="avatar">{initials(user).toUpperCase()}</span>
                <span>{user.full_name || user.email}</span>
              </NavLink>
              <button className="btn btn-ghost btn-sm" onClick={() => logout()}>
                Log out
              </button>
            </>
          ) : (
            <button
              className="btn btn-dark btn-sm"
              onClick={() => login()}
              disabled={loading}
            >
              Log in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
