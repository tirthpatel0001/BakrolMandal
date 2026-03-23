import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { getToken, setToken } from "../auth.js";
import { getApiUrl } from "../api.js";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (getToken()) {
    return <Navigate to="/admin" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Could not sign in.");
        return;
      }
      setToken(data.token);
      navigate("/admin", { replace: true });
    } catch {
      setError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg" aria-hidden="true">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
        <div className="login-grid" />
      </div>

      <div className="login-shell">
        <div className="login-brand">
          <div className="login-emblem" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="22" stroke="url(#lg)" strokeWidth="1.5" opacity="0.5" />
              <path
                d="M24 8c-4 8-8 12-8 18a8 8 0 0016 0c0-6-4-10-8-18z"
                fill="url(#lg)"
                opacity="0.85"
              />
              <defs>
                <linearGradient id="lg" x1="8" y1="8" x2="40" y2="40">
                  <stop stopColor="#f4d03f" />
                  <stop offset="1" stopColor="#c9a227" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <p className="login-kicker">Bakrol</p>
          <h1 className="login-title">Bal Mandal</h1>
          <p className="login-tagline">Student records — secure admin access</p>
        </div>

        <div className="login-card">
          <h2 className="login-card-title">Sign in</h2>
          <p className="login-card-hint">Use your assigned admin username.</p>

          {error ? <div className="login-error">{error}</div> : null}

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-label">
              Username
              <input
                className="login-input"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="bakrolbalmandal or bakrolshishumandal"
                required
              />
            </label>

            <label className="login-label">
              Password
              <div className="login-pass-wrap">
                <input
                  className="login-input"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="login-toggle-pass"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? "Signing in…" : "Enter dashboard"}
            </button>
          </form>
        </div>

        <p className="login-foot">Authorized personnel only</p>
      </div>
    </div>
  );
}
