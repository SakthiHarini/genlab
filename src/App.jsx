import React, { useEffect, useState } from "react";
import "./GenLablogin.css";

const API_URL = "http://localhost:5000";

export default function App() {
  const [showSignup, setShowSignup] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("google") === "success") {
      setUserName("Google user");
      setLoggedIn(true);

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }

    if (params.get("google") === "error") {
      setMessage("Google sign-in failed. Please try again.");

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    const url = showSignup
      ? `${API_URL}/register`
      : `${API_URL}/login`;

    const body = showSignup
      ? { name, email, password }
      : { email, password };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Something went wrong");
        return;
      }

      if (showSignup) {
        setMessage("Account created successfully. Please log in.");
        setShowSignup(false);
        setPassword("");
        return;
      }

      setUserName(data.user?.name || email.split("@")[0]);
      setLoggedIn(true);
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to the backend.");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  if (loggedIn) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#07120d",
          color: "white",
          display: "grid",
          placeItems: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: "30px" }}>
          <p
            style={{
              color: "#a3e635",
              letterSpacing: "3px",
              fontWeight: "bold",
            }}
          >
            GENLAB WORKSPACE
          </p>

          <h1 style={{ fontSize: "52px", margin: "15px 0" }}>
            Welcome,{" "}
            <span style={{ color: "#a3e635" }}>{userName}!</span>
          </h1>

          <p style={{ color: "#cbd5d0", fontSize: "18px" }}>
            You are signed in and ready to build with AI.
          </p>

          <button
            onClick={() => {
              setLoggedIn(false);
              setEmail("");
              setPassword("");
              setMessage("");
            }}
            style={{
              marginTop: "28px",
              padding: "13px 26px",
              border: "none",
              borderRadius: "8px",
              background: "#a3e635",
              color: "#111",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Log out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gl-page">
      <div className="gl-grid" />
      <div className="gl-glow-top" />
      <div className="gl-glow-bottom" />

      <header className="gl-header">
        <div className="gl-logo">
          <span className="gl-logo-text">
            GenLab<span className="gl-logo-dot">·</span>
          </span>
        </div>

        <div className="gl-status">
          <span className="gl-status-online">
            <span className="gl-status-dot" />
            Online
          </span>
          <span className="gl-divider-dot"> | </span>
          <span>AI Infrastructure</span>
        </div>
      </header>

      <main className="gl-main">
        <div className="gl-main-inner">
          <h1 className="gl-heading">
            {showSignup ? "Create" : "Welcome"}
            <br />
            <span className="gl-heading-accent">
              {showSignup ? "Account." : "Back."}
            </span>
          </h1>

          <p className="gl-subtext">
            Continue building the future with{" "}
            <span className="gl-subtext-accent">AI.</span>
          </p>

          <form onSubmit={handleSubmit} className="gl-card">
            {showSignup && (
              <>
                <label className="gl-label">Full Name</label>
                <div className="gl-input-wrap">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="gl-input"
                    required
                  />
                </div>
              </>
            )}

            <label className="gl-label">Email Address</label>
            <div className="gl-input-wrap">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="gl-input"
                required
              />
            </div>

            <label className="gl-label">Password</label>
            <div className="gl-input-wrap">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="gl-input"
                required
              />
            </div>

            {message && (
              <p style={{ color: "#bef264", marginBottom: "15px" }}>
                {message}
              </p>
            )}

            <button type="submit" className="gl-submit-btn">
              {showSignup ? "Create Account" : "Continue"}{" "}
              <span aria-hidden="true">→</span>
            </button>

            <div className="gl-divider-row">
              <div className="gl-divider-line" />
              <span className="gl-divider-text">OR CONTINUE WITH</span>
              <div className="gl-divider-line" />
            </div>

            <div className="gl-oauth-grid">
              <button
                type="button"
                className="gl-oauth-btn"
                onClick={handleGoogleLogin}
              >
                <GoogleIcon />
                Google
              </button>
            </div>

            <p className="gl-signup-text">
              {showSignup
                ? "Already have an account? "
                : "Don't have an account? "}

              <button
                type="button"
                className="gl-link-btn"
                onClick={() => {
                  setShowSignup(!showSignup);
                  setMessage("");
                  setName("");
                  setEmail("");
                  setPassword("");
                }}
              >
                {showSignup ? "Login" : "Create account"}
              </button>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.9-2.26 5.36-4.78 7.02l7.73 6c4.51-4.18 7.09-10.36 7.09-17.49z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}