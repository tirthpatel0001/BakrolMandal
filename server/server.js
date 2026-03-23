import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import studentsRouter from "./routes/students.js";
import authRouter from "./routes/auth.js";
import { requireAuth } from "./middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 5001;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bakrol_bal_mandal";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const app = express();
const cors = require("cors");

app.use(cors({
  origin: "*"
}));
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", authRouter);
app.use("/api/students", requireAuth, studentsRouter);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected:", MONGODB_URI);
    const server = app.listen(PORT);
    server.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Stop the other app or set PORT in server/.env to a free port (e.g. 5002).`);
      } else {
        console.error(err);
      }
      process.exit(1);
    });
    server.once("listening", () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
