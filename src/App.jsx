import React, { useState } from "react";
import { Eye, EyeOff, User, Lock, Lock as LockClosed } from "lucide-react";
import "./GenLabLogin.css";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [message, setMessage] = useState("");

  // Signup states
  const [showSignup, setShowSignup] = useState(false);
  const [name, setName] = useState("");

  // =========================
  // LOGIN
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        console.log("Login successful:", data);
      } else {
        setMessage(data.message);
        console.log("Login failed:", data);
      }
    } catch (error) {
      console.error("Backend connection error:", error);
      setMessage("Cannot connect to backend");
    }
  };

  // =========================
  // REGISTER
  // =========================
  const handleRegister = async (e) => {
    e.preventDefault();

    setMessage("");

    // Basic validation
    if (!name || !email || !password) {
      setMessage("Please fill all fields");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);

        console.log("Registration successful:", data);

        // Clear fields
        setName("");
        setEmail("");
        setPassword("");
      } else {
        setMessage(data.message);
        console.log("Registration failed:", data);
      }
    } catch (error) {
      console.error("Backend connection error:", error);
      setMessage("Cannot connect to backend");
    }
  };

  return (
    <div className="gl-page">
      <div className="gl-grid" />
      <div className="gl-glow-top" />
      <div className="gl-glow-bottom" />
      <div className="gl-radial-tint" />

      {/* Swoosh */}
      <svg
        className="gl-swoosh"
        viewBox="0 0 800 1000"
        preserveAspectRatio="none"
      >
        <path
          d="M300,0 C420,120 200,260 340,420 C480,580 240,700 380,850 C460,930 600,970 800,1000 L800,0 Z"
          fill="url(#swooshGradient)"
        />

        <defs>
          <linearGradient
            id="swooshGradient"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="#a3e635"
              stopOpacity="0.35"
            />

            <stop
              offset="100%"
              stopColor="#000000"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>
      </svg>

      {/* Stars */}
      <div className="gl-stars">
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className="gl-star"
            style={{
              left: `${55 + Math.random() * 40}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              opacity: Math.random() * 0.6 + 0.3,
            }}
          />
        ))}
      </div>

      {/* Signature Lines */}
      <svg className="gl-signature-lines" viewBox="0 0 200 200">
        <g
          stroke="#bef264"
          strokeWidth="1.5"
          fill="none"
          opacity="0.7"
        >
          <rect x="0" y="0" width="100" height="100" />
          <rect x="100" y="0" width="100" height="100" />
          <rect x="0" y="100" width="100" height="100" />
          <rect x="100" y="100" width="100" height="100" />

          <path d="M0,50 A50,50 0 0,1 50,0" />
          <path d="M100,0 A50,50 0 0,1 150,50" />
          <path d="M150,100 A50,50 0 0,1 100,150" />
          <path d="M50,150 A50,50 0 0,1 0,100" />
          <path d="M100,50 A50,50 0 0,1 150,0" />
          <path d="M100,50 A50,50 0 0,1 50,100" />
          <path d="M50,100 A50,50 0 0,1 100,150" />
        </g>
      </svg>

      <div className="gl-signature-glint">
        <div className="gl-signature-glint-dot" />
      </div>

      {/* Header */}
      <header className="gl-header">
        <div className="gl-logo">
          <div className="gl-logo-mark">
            <span className="solid" />
            <span />
            <span />
            <span className="solid" />
          </div>

          <span className="gl-logo-text">
            GenLab<span className="gl-logo-dot">·</span>
          </span>
        </div>

        <div className="gl-status">
          <span className="gl-status-online">
            <span className="gl-status-dot" />
            Online
          </span>

          <span className="gl-divider-dot">|</span>

          <span>AI Infrastructure</span>
        </div>
      </header>

      {/* Main */}
      <main className="gl-main">
        <div className="gl-main-inner">

          <h1 className="gl-heading">
            Welcome
            <br />
            <span className="gl-heading-accent">
              Back.
            </span>
          </h1>

          <p className="gl-subtext">
            Continue building the future with{" "}
            <span className="gl-subtext-accent">
              AI.
            </span>
          </p>

          {/* FORM */}
          <form
            onSubmit={
              showSignup
                ? handleRegister
                : handleSubmit
            }
            className="gl-card"
          >

            {/* NAME - Signup only */}
            {showSignup && (
              <>
                <label className="gl-label">
                  Full Name
                </label>

                <div className="gl-input-wrap">
                  <User
                    size={18}
                    className="gl-icon"
                  />

                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="Your name"
                    className="gl-input"
                  />
                </div>
              </>
            )}

            {/* EMAIL */}
            <label className="gl-label">
              Email Address
            </label>

            <div className="gl-input-wrap">
              <User
                size={18}
                className="gl-icon"
              />

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="you@example.com"
                className="gl-input"
              />
            </div>

            {/* PASSWORD */}
            <label className="gl-label">
              Password
            </label>

            <div className="gl-input-wrap tight">
              <Lock
                size={18}
                className="gl-icon"
              />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="••••••••••••"
                className="gl-input"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((s) => !s)
                }
                className="gl-eye-btn"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {/* MESSAGE */}
            {message && (
              <p
                style={{
                  color: "#bef264",
                  marginBottom: "15px",
                }}
              >
                {message}
              </p>
            )}

            {/* REMEMBER / FORGOT */}
            {!showSignup && (
              <div className="gl-row-between">

                <label className="gl-checkbox-label">

                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) =>
                      setRemember(
                        e.target.checked
                      )
                    }
                    className="gl-checkbox-native"
                  />

                  <span
                    className={`gl-checkbox-box ${
                      remember
                        ? "checked"
                        : ""
                    }`}
                  >
                    {remember && (
                      <svg viewBox="0 0 12 12">
                        <path d="M4.5 8.3 2.2 6l-.9.9L4.5 10l6-6-.9-.9z" />
                      </svg>
                    )}
                  </span>

                  Remember me

                </label>

                <button
                  type="button"
                  className="gl-link-btn"
                >
                  Forgot password?
                </button>

              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              className="gl-submit-btn"
            >
              {showSignup
                ? "Create Account"
                : "Continue"}

              <span aria-hidden>
                →
              </span>
            </button>

            {/* SOCIAL LOGIN */}
            <div className="gl-divider-row">

              <div className="gl-divider-line" />

              <span className="gl-divider-text">
                OR CONTINUE WITH
              </span>

              <div className="gl-divider-line" />

            </div>

            <div className="gl-oauth-grid">

              <button
                type="button"
                className="gl-oauth-btn"
              >
                <GoogleIcon />
                Google
              </button>

              <button
                type="button"
                className="gl-oauth-btn"
              >
                <GithubIcon />
                GitHub
              </button>

            </div>

            {/* LOGIN / SIGNUP SWITCH */}
            <p className="gl-signup-text">

              {showSignup
                ? "Already have an account? "
                : "Don't have an account? "}

              <button
                type="button"
                className="gl-link-btn"
                onClick={() => {

                  setShowSignup(
                    !showSignup
                  );

                  setMessage("");
                  setName("");
                  setEmail("");
                  setPassword("");

                }}
              >
                {showSignup
                  ? "Login"
                  : "Create account"}
              </button>

            </p>

          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="gl-footer">

        <div className="gl-footer-left">

          <span className="gl-version-badge">
            v2.1
          </span>

          <span className="gl-divider-dot">
            |
          </span>

          <span>
            GenLab Workspace
          </span>

        </div>

        <div className="gl-footer-right">

          <span>
            Secure. Private. Built for{" "}
            <span className="gl-footer-accent">
              Gen Z.
            </span>
          </span>

          <span className="gl-lock-badge">
            <LockClosed size={12} />
          </span>

        </div>

      </footer>

    </div>
  );
}

/* =========================
   GOOGLE ICON
========================= */

function GoogleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 48 48"
    >
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

/* =========================
   GITHUB ICON
========================= */

function GithubIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="white"
    >
      <path d="M12 .3a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.3 3.5 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .3Z" />
    </svg>
  );
}