require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const app = express();

/* =========================================================
   CONFIGURATION
========================================================= */

const PORT = process.env.PORT || 5000;

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "https://pl13pz9m-5173.inc1.devtunnels.ms";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  "https://pl13pz9m-5000.inc1.devtunnels.ms/auth/google/callback";

/* =========================================================
   GOOGLE OAUTH STATE
========================================================= */

const googleStates = new Map();

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://sakthi-mauve.vercel.app",
      "https://pl13pz9m-5173.inc1.devtunnels.ms",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

/* =========================================================
   MYSQL CONNECTION
========================================================= */

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  }
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection failed:");
    console.error(err.message);
    return;
  }

  console.log("✅ MySQL connected successfully!");
});

/* =========================================================
   TEST ROUTE
========================================================= */

app.get("/", (req, res) => {
  res.json({
    message: "GenLab Backend is running",
    status: "success",
  });
});

/* =========================================================
   GOOGLE LOGIN
   STEP 1: REDIRECT USER TO GOOGLE
========================================================= */

app.get("/auth/google", (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error("❌ Google credentials are missing.");

    return res.status(503).json({
      message: "Google credentials are missing. Check backend/.env.",
    });
  }

  const state = crypto.randomBytes(32).toString("hex");

  googleStates.set(state, Date.now() + 10 * 60 * 1000);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state: state,
    prompt: "select_account",
  });

  const googleURL =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    params.toString();

  console.log("➡️ Redirecting user to Google...");

  return res.redirect(googleURL);
});

/* =========================================================
   GOOGLE LOGIN
   STEP 2: GOOGLE CALLBACK
========================================================= */

app.get("/auth/google/callback", async (req, res) => {
  const { code, state, error } = req.query;

  const expiresAt = googleStates.get(state);

  googleStates.delete(state);

  if (
    error ||
    !code ||
    !expiresAt ||
    expiresAt < Date.now()
  ) {
    console.error("❌ Invalid Google OAuth request.");

    return res.redirect(
      `${FRONTEND_URL}/?google=error`
    );
  }

  try {
    /* =====================================================
       EXCHANGE GOOGLE CODE FOR ACCESS TOKEN
    ===================================================== */

    const tokenResponse = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code: code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: GOOGLE_REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();

      console.error(
        "❌ Google token request failed:",
        errorText
      );

      throw new Error("Google token request failed");
    }

    const tokenData = await tokenResponse.json();

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error(
        "Google did not return an access token"
      );
    }

    /* =====================================================
       GET GOOGLE USER PROFILE
    ===================================================== */

    const profileResponse = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const profile = await profileResponse.json();

    if (
      !profileResponse.ok ||
      !profile.email ||
      !profile.email_verified
    ) {
      throw new Error(
        "Google did not provide a verified email"
      );
    }

    console.log(
      "✅ Google user:",
      profile.email
    );

    /* =====================================================
       CHECK USER IN MYSQL
    ===================================================== */

    db.query(
      "SELECT id, name, email FROM users WHERE email = ?",
      [profile.email.toLowerCase()],
      async (dbError, users) => {
        if (dbError) {
          console.error(
            "❌ Google login database error:",
            dbError
          );

          return res.redirect(
            `${FRONTEND_URL}/?google=error`
          );
        }

        /* =================================================
           EXISTING USER
        ================================================= */

        if (users.length > 0) {
          console.log(
            "✅ Existing Google user logged in:",
            profile.email
          );

          return res.redirect(
            `${FRONTEND_URL}/?google=success&name=${encodeURIComponent(
              users[0].name
            )}`
          );
        }

        /* =================================================
           NEW GOOGLE USER
        ================================================= */

        try {
          const generatedPassword =
            await bcrypt.hash(
              crypto.randomBytes(32).toString("hex"),
              10
            );

          const userName =
            profile.name ||
            profile.email.split("@")[0];

          db.query(
            `INSERT INTO users
             (name, email, password)
             VALUES (?, ?, ?)`,
            [
              userName,
              profile.email.toLowerCase(),
              generatedPassword,
            ],
            (insertError, result) => {
              if (insertError) {
                console.error(
                  "❌ Google user creation error:",
                  insertError
                );

                return res.redirect(
                  `${FRONTEND_URL}/?google=error`
                );
              }

              console.log(
                "✅ New Google user created. ID:",
                result.insertId
              );

              return res.redirect(
                `${FRONTEND_URL}/?google=success&name=${encodeURIComponent(
                  userName
                )}`
              );
            }
          );
        } catch (error) {
          console.error(
            "❌ Google password generation error:",
            error
          );

          return res.redirect(
            `${FRONTEND_URL}/?google=error`
          );
        }
      }
    );
  } catch (error) {
    console.error(
      "❌ Google OAuth error:",
      error
    );

    return res.redirect(
      `${FRONTEND_URL}/?google=error`
    );
  }
});

/* =========================================================
   REGISTER
========================================================= */

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message:
        "Password must be at least 6 characters",
    });
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  try {
    db.query(
      "SELECT id FROM users WHERE email = ?",
      [cleanEmail],
      async (err, results) => {
        if (err) {
          console.error(
            "❌ Registration database error:",
            err
          );

          return res.status(500).json({
            message: "Database error",
          });
        }

        if (results.length > 0) {
          return res.status(409).json({
            message: "Email already registered",
          });
        }

        const hashedPassword =
          await bcrypt.hash(password, 10);

        db.query(
          `INSERT INTO users
           (name, email, password)
           VALUES (?, ?, ?)`,
          [
            cleanName,
            cleanEmail,
            hashedPassword,
          ],
          (insertError, result) => {
            if (insertError) {
              console.error(
                "❌ User insertion error:",
                insertError
              );

              return res.status(500).json({
                message: "Registration failed",
              });
            }

            console.log(
              "✅ New user registered:",
              cleanEmail
            );

            return res.status(201).json({
              message:
                "Registration successful",
              userId: result.insertId,
            });
          }
        );
      }
    );
  } catch (error) {
    console.error(
      "❌ Registration error:",
      error
    );

    return res.status(500).json({
      message: "Registration failed",
    });
  }
});

/* =========================================================
   LOGIN
========================================================= */

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message:
        "Email and password are required",
    });
  }

  const cleanEmail = email.trim().toLowerCase();

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [cleanEmail],
    async (err, results) => {
      if (err) {
        console.error(
          "❌ Login database error:",
          err
        );

        return res.status(500).json({
          message: "Database error",
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          message:
            "Invalid email or password",
        });
      }

      try {
        const user = results[0];

        const passwordMatch =
          await bcrypt.compare(
            password,
            user.password
          );

        if (!passwordMatch) {
          return res.status(401).json({
            message:
              "Invalid email or password",
          });
        }

        console.log(
          "✅ User logged in:",
          user.email
        );

        return res.status(200).json({
          message: "Login successful",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        });
      } catch (error) {
        console.error(
          "❌ Password comparison error:",
          error
        );

        return res.status(500).json({
          message: "Login failed",
        });
      }
    }
  );
});

/* =========================================================
   GET USERS
========================================================= */

app.get("/users", (req, res) => {
  db.query(
    "SELECT id, name, email FROM users",
    (err, results) => {
      if (err) {
        console.error(
          "❌ Get users error:",
          err
        );

        return res.status(500).json({
          message: "Database error",
        });
      }

      return res.json(results);
    }
  );
});

/* =========================================================
   START SERVER
========================================================= */

app.listen(PORT, () => {
  console.log("");
  console.log("====================================");
  console.log("       GENLAB BACKEND STARTED       ");
  console.log("====================================");
  console.log(`Local:    http://localhost:${PORT}`);
  console.log(
    "Public:   https://pl13pz9m-5000.inc1.devtunnels.ms"
  );
  console.log(`Frontend: ${FRONTEND_URL}`);
  console.log("====================================");
  console.log("");
});