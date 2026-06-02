import { useState } from "react";
import { useNavigate } from "react-router-dom";

import InputComponent from "../../components/InputComponent/InputComponent.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { login as loginRequest } from "../../utils/api.js";
import { extractError } from "../../utils/errors.js";

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await loginRequest({ email, password });
      login(data);
      navigate("/", { replace: true });
    } catch (err) {
      setError(extractError(err, "Incorrect email or password."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {error && <div className="alert alert--error">{error}</div>}
      <InputComponent
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <InputComponent
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" className="btn btn--primary" disabled={submitting}>
        {submitting ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
