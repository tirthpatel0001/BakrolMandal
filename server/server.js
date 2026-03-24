import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import studentsRouter from "./routes/students.js";
import authRouter from "./routes/auth.js";
import attendanceRouter from "./routes/attendance.js";
import { requireAuth } from "./middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 5001;
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/bakrol_bal_mandal";

const CLIENT_URL =
  process.env.CLIENT_URL || "http://localhost:5173";

const app = express();

// ✅ CORS (FIXED)
app.use(
  cors({
    origin: "*", // later you can restrict to your Vercel URL
  })
);

// ✅ Middleware
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Routes
app.use("/api/auth", authRouter);
app.use("/api/students", requireAuth, studentsRouter);
app.use("/api/attendance", requireAuth, attendanceRouter);

// ✅ Test route
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// ✅ DB connection + server start
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected:", MONGODB_URI);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });