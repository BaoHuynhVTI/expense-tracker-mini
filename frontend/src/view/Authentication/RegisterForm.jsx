import { useState } from "react";

import InputComponent from "../../components/InputComponent/InputComponent.jsx";
import { register } from "../../utils/api.js";
import { extractError } from "../../utils/errors.js";

export default function RegisterForm({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await register({
        email,
        password,
        password_confirm: passwordConfirm,
      });
      setSuccess("Account created successfully. You can now log in.");
      setEmail("");
      setPassword("");
      setPasswordConfirm("");
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(extractError(err, "Registration failed. Please check your details."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {error && <div className="alert alert--error">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}
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
        minLength={8}
        hint="At least 8 characters."
        required
      />
      <InputComponent
        label="Confirm password"
        type="password"
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
        required
      />
      <button type="submit" className="btn btn--primary" disabled={submitting}>
        {submitting ? "Creating account..." : "Register"}
      </button>
    </form>
  );
}
