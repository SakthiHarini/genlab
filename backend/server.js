const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");

const app = express();

// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());
app.use(express.json());

// ===============================
// MYSQL
// ===============================

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "sa21ha0405",
  database: "genlab",
  port: 3306
});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:", err);
    return;
  }

  console.log("MySQL connected successfully!");
});

// ===============================
// TEST
// ===============================

app.get("/", (req, res) => {
  res.json({
    message: "GenLab Backend is running"
  });
});

// ===============================
// REGISTER
// ===============================

app.post("/register", async (req, res) => {

  const { name, email, password } = req.body;

  console.log("\n========== REGISTER ==========");
  console.log("Name:", name);
  console.log("Email:", email);

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "All fields are required"
    });
  }

  try {

    // Check email
    db.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      async (err, results) => {

        if (err) {
          console.error("Database error:", err);

          return res.status(500).json({
            message: "Database error"
          });
        }

        // Existing user
        if (results.length > 0) {

          return res.status(409).json({
            message: "Email already registered"
          });
        }

        // ===============================
        // BCRYPT HASH
        // ===============================

        const hashedPassword = await bcrypt.hash(password, 10);

        console.log("Original password:", password);
        console.log("Hashed password:", hashedPassword);

        // ===============================
        // INSERT
        // ===============================

        const sql = `
          INSERT INTO users (name, email, password)
          VALUES (?, ?, ?)
        `;

        db.query(
          sql,
          [name, email, hashedPassword],
          (err, result) => {

            if (err) {

              console.error("Insert error:", err);

              return res.status(500).json({
                message: "Registration failed"
              });
            }

            console.log("User inserted!");
            console.log("User ID:", result.insertId);

            return res.status(201).json({
              message: "Registration successful",
              userId: result.insertId
            });
          }
        );
      }
    );

  } catch (error) {

    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Registration failed"
    });
  }
});

// ===============================
// LOGIN
// ===============================

app.post("/login", (req, res) => {

  const { email, password } = req.body;

  console.log("\n========== LOGIN ==========");
  console.log("Email:", email);

  if (!email || !password) {

    return res.status(400).json({
      message: "Email and password are required"
    });
  }

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {

      if (err) {

        console.error("Login database error:", err);

        return res.status(500).json({
          message: "Database error"
        });
      }

      // User doesn't exist
      if (results.length === 0) {

        console.log("User not found");

        return res.status(401).json({
          message: "Invalid email or password"
        });
      }

      const user = results[0];

      try {

        // ===============================
        // BCRYPT COMPARE
        // ===============================

        const passwordMatch = await bcrypt.compare(
          password,
          user.password
        );

        console.log("Password match:", passwordMatch);

        if (!passwordMatch) {

          console.log("Wrong password");

          return res.status(401).json({
            message: "Invalid email or password"
          });
        }

        console.log("Login successful!");

        return res.status(200).json({
          message: "Login successful",
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        });

      } catch (error) {

        console.error("Bcrypt error:", error);

        return res.status(500).json({
          message: "Login failed"
        });
      }
    }
  );
});

// ===============================
// GET USERS
// ===============================

app.get("/users", (req, res) => {

  db.query(
    "SELECT id, name, email, password FROM users",
    (err, results) => {

      if (err) {

        console.error("Get users error:", err);

        return res.status(500).json({
          message: "Database error"
        });
      }

      res.json(results);
    }
  );
});

// ===============================
// START SERVER
// ===============================

app.listen(5000, () => {

  console.log("\n================================");
  console.log("GenLab Backend running");
  console.log("http://localhost:5000");
  console.log("================================\n");

});