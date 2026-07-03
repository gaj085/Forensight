const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDb, getDb } = require("./configs/db");
const authRoutes = require("./routes/authRoutes");
const criminalRoutes = require("./routes/criminalRoutes");

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

// Enable CORS and JSON Parsing
app.use(cors());
app.use(express.json());

// Register API Routes
app.use("/api/auth", authRoutes);
app.use("/api", criminalRoutes);

// Health check endpoint
app.get("/api/health", async (req, res) => {
  let mongoOk = false;
  try {
    const db = getDb();
    if (db) {
      await db.command({ ping: 1 });
      mongoOk = true;
    }
  } catch (e) {
    console.error("Health check database ping error:", e);
  }

  return res.json({
    ok: true,
    mongo: mongoOk,
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.send("Backend Running");
});

// Establish database connection and start listening
connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed, aborted server start:", err);
    process.exit(1);
  });
