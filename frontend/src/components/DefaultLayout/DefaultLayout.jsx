// Default layout: Sidebar (nav) + header (user) + main + Footer.
import { useCallback, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../../context/AuthContext.jsx";
import AppHeader from "../AppHeader/AppHeader.jsx";
import Footer from "../Footer/Footer.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";
import Loading from "../Loading/Loading.jsx";
import "./DefaultLayout.scss";

export default function DefaultLayout() {
  const { authed, loadingUser } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  if (loadingUser) {
    return <Loading fullPage label="Signing in..." />;
  }

  if (!authed) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="default-layout">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      <div className="default-layout__body">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="default-layout__main">
          <Outlet key={location.pathname} />
        </main>
        <Footer />
      </div>
    </div>
  );
}
