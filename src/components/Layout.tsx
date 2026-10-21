import { NavLink, Outlet } from "react-router-dom";

const links = [
  ["/", "Home"],
  ["/matches", "Matches"],
  ["/competitions", "Competitions"],
  ["/teams", "Teams"],
  ["/players", "Players"],
  ["/search", "Search"],
  ["/endpoints", "42 routes"],
] as const;

export function Layout() {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <strong>Baseball Lab</strong>
          <span>Calls SportsAPI365 /v1/baseball directly</span>
        </div>
        <nav className="nav">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="page">
        <Outlet />
      </main>
      <footer className="footer">SportsAPI365 baseball · no local API</footer>
    </div>
  );
}
