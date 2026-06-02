import { useState } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext.jsx";
import LoginForm from "./LoginForm.jsx";
import RegisterForm from "./RegisterForm.jsx";
import "./Authentication.scss";

export default function Authentication() {
  const { authed } = useAuth();
  const [mode, setMode] = useState("login");

  if (authed) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Expense Tracker Mini</h1>
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tabs__tab ${mode === "login" ? "is-active" : ""}`}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-tabs__tab ${mode === "register" ? "is-active" : ""}`}
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>
        {mode === "login" ? (
          <LoginForm />
        ) : (
          <RegisterForm onSuccess={() => setMode("login")} />
        )}
      </div>
    </div>
  );
}
