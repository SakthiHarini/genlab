require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5174";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  "http://localhost:5000/auth/google/callback";

const googleStates = new Map();

app.use(cors());
app.use(express.json());

// MYSQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: process.env.DB_PASSWORD || "",
  database: "genlab",
  port: 3306,
});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:", err);
    return;
  }

  console.log("MySQL connected successfully!");
});

// GOOGLE LOGIN: send the user to Google
app.get("/auth/google", (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      message:
        "Google credentials are missing. Check backend/.env.",
    });
  }

  const state = crypto.randomBytes(32).toString("hex");
  googleStates.set(state, Date.now() + 10 * 60 * 1000);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  return res.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
});

// GOOGLE LOGIN: receive the user after Google approves login
app.get("/auth/google/callback", async (req, res) => {
  const { code, state, error } = req.query;
  const expiresAt = googleStates.get(state);

  googleStates.delete(state);

  if (error || !code || !expiresAt || expiresAt < Date.now()) {
    return res.redirect(`${FRONTEND_URL}/?google=error`);
  }

  try {
    const tokenResponse = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: GOOGLE_REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error("Google token request failed");
    }

    const { access_token } = await tokenResponse.json();

    const profileResponse = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const profile = await profileResponse.json();

    if (
      !profileResponse.ok ||
      !profile.email ||
      !profile.email_verified
    ) {
      throw new Error("Google did not provide a verified email");
    }

    db.query(
      "SELECT id, name, email FROM users WHERE email = ?",
      [profile.email],
      async (dbError, users) => {
        if (dbError) {
          console.error("Google login database error:", dbError);
          return res.redirect(`${FRONTEND_URL}/?google=error`);
        }

        // Existing user: sign in.
        if (users.length > 0) {
          return res.redirect(`${FRONTEND_URL}/?google=success`);
        }

        // New Google user: create an account.
        const generatedPassword = await bcrypt.hash(
          crypto.randomBytes(32).toString("hex"),
          10
        );

        db.query(
          "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
          [
            profile.name || profile.email.split("@")[0],
            profile.email,
            generatedPassword,
          ],
          (insertError) => {
            if (insertError) {
              console.error(
                "Google user creation error:",
                insertError
              );
              return res.redirect(
                `${FRONTEND_URL}/?google=error`
              );
            }

            return res.redirect(
              `${FRONTEND_URL}/?google=success`
            );
          }
        );
      }
    );
  } catch (error) {
    console.error("Google OAuth error:", error);
    return res.redirect(`${FRONTEND_URL}/?google=error`);
  }
});

// TEST
app.get("/", (req, res) => {
  res.json({
    message: "GenLab Backend is running",
  });
});

// REGISTER
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  try {
    db.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      async (err, results) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({
            message: "Database error",
          });
        }

        if (results.length > 0) {
          return res.status(409).json({
            message: "Email already registered",
          });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
          "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
          [name, email, hashedPassword],
          (insertError, result) => {
            if (insertError) {
              console.error("Insert error:", insertError);
              return res.status(500).json({
                message: "Registration failed",
              });
            }

            return res.status(201).json({
              message: "Registration successful",
              userId: result.insertId,
            });
          }
        );
      }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      message: "Registration failed",
    });
  }
});

// LOGIN
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) {
        console.error("Login database error:", err);
        return res.status(500).json({
          message: "Database error",
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      try {
        const user = results[0];
        const passwordMatch = await bcrypt.compare(
          password,
          user.password
        );

        if (!passwordMatch) {
          return res.status(401).json({
            message: "Invalid email or password",
          });
        }

        return res.status(200).json({
          message: "Login successful",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        });
      } catch (error) {
        console.error("Bcrypt error:", error);
        return res.status(500).json({
          message: "Login failed",
        });
      }
    }
  );
});

// GET USERS
app.get("/users", (req, res) => {
  db.query(
    "SELECT id, name, email FROM users",
    (err, results) => {
      if (err) {
        return res.status(500).json({
          message: "Database error",
        });
      }

      res.json(results);
    }
  );
});

app.listen(PORT, () => {
  console.log(`GenLab Backend running on http://localhost:${PORT}`);
});