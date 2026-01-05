import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../auth/use-auth";

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "rounded px-3 py-2 text-sm font-medium",
          isActive
            ? "bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm"
            : "text-slate-700 hover:bg-white/70",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

export function AppLayout() {
  const {
    state: { user },
    logout,
  } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50 to-slate-50 text-slate-900">
      <header className="border-b border-amber-100 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-3 py-1 text-sm font-semibold text-white shadow-sm">
                Hostmate
              </div>
            <nav className="flex gap-1">
              <NavItem to="/" label="Home" />
              <NavItem to="/guests" label="Guests" />
              <NavItem to="/dishes" label="Dishes" />
              <NavItem to="/meals" label="Meals" />
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? <div className="text-sm text-slate-600">{user.name}</div> : null}
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
