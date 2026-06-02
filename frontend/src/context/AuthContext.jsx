// Shared auth state: current user + login/logout, exposed via React context.
import { createContext, useContext, useEffect, useState } from "react";

import { fetchMe } from "../utils/api.js";
import { clearTokens, isAuthenticated, saveTokens } from "../utils/auth.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authed, setAuthed] = useState(isAuthenticated());
  const [loadingUser, setLoadingUser] = useState(isAuthenticated());

  // If we already have a token (e.g. after a refresh), restore the user.
  useEffect(() => {
    let cancelled = false;
    if (authed && !user) {
      setLoadingUser(true);
      fetchMe()
        .then((me) => {
          if (!cancelled) setUser(me);
        })
        .catch(() => {
          if (!cancelled) {
            clearTokens();
            setAuthed(false);
            setUser(null);
          }
        })
        .finally(() => {
          if (!cancelled) setLoadingUser(false);
        });
    } else {
      setLoadingUser(false);
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  const login = (loginResponse) => {
    saveTokens({
      access: loginResponse.access,
      refresh: loginResponse.refresh,
    });
    setUser(loginResponse.user);
    setAuthed(true);
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    setAuthed(false);
  };

  const value = { user, authed, loadingUser, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
