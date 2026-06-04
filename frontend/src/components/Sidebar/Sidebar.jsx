import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";

import { NAV_ITEMS } from "../../navConfig.js";
import "./Sidebar.scss";

export default function Sidebar({ open, onClose }) {
  const location = useLocation();

  useEffect(() => {
    onClose?.();
  }, [location.pathname, onClose]);

  return (
    <>
      <button
        type="button"
        className={`sidebar-backdrop${open ? " sidebar-backdrop--visible" : ""}`}
        aria-label="Close menu"
        onClick={onClose}
      />

      <aside className={`sidebar${open ? " sidebar--open" : ""}`}>
        <div className="sidebar__brand">Expense Tracker Mini</div>

        <nav className="sidebar__nav" onClick={onClose}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar__link${isActive ? " sidebar__link--active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
