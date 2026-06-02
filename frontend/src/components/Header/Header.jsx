import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext.jsx";
import "./Header.scss";

const NAV_ITEMS = [
  { to: "/", label: "Overview", end: true },
  { to: "/expenses", label: "Expenses" },
  { to: "/income", label: "Income" },
  { to: "/debts", label: "Debts" },
  { to: "/credit", label: "Credit" },
  { to: "/settings", label: "Settings" },
];

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="header">
      <div className="header__inner">
        <h1 className="header__brand">Expense Tracker Mini</h1>
        <nav className="header__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `header__link${isActive ? " header__link--active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="header__right">
          {user?.email && <span className="header__email">{user.email}</span>}
          <button type="button" className="btn btn--ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
