// Default layout for the authenticated area: Header + <Outlet/> + Footer.
import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../../context/AuthContext.jsx";
import Footer from "../Footer/Footer.jsx";
import Header from "../Header/Header.jsx";
import Loading from "../Loading/Loading.jsx";
import "./DefaultLayout.scss";

export default function DefaultLayout() {
  const { authed, loadingUser } = useAuth();

  if (loadingUser) {
    return <Loading fullPage label="Signing in..." />;
  }

  if (!authed) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="default-layout">
      <Header />
      <main className="default-layout__main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
