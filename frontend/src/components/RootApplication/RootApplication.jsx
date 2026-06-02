// Application root route: provides global context and renders the matched
// child route via <Outlet/>. The router itself lives in route.jsx.
import { Outlet } from "react-router-dom";

import { AuthProvider } from "../../context/AuthContext.jsx";

export default function RootApplication() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
