import { useNavigate, useLocation } from "react-router-dom";

import { useAuth } from "../../context/AuthContext.jsx";
import { getPageTitle } from "../../navConfig.js";
import "./AppHeader.scss";

export default function AppHeader({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const pageTitle = getPageTitle(pathname);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="app-header">
      <div className="app-header__left">
        <button
          type="button"
          className="app-header__menu"
          aria-label="Open menu"
          onClick={onMenuClick}
        >
          <span className="app-header__menu-icon" aria-hidden />
        </button>
        <h1 className="app-header__title">{pageTitle}</h1>
      </div>

      <div className="app-header__right">
        {user?.email && <span className="app-header__email">{user.email}</span>}
        <button type="button" className="btn btn--ghost" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
