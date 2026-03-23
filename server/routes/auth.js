import express from "express";
import jwt from "jsonwebtoken";
import { isAllowedAdmin, normalizeUsername } from "../config/admins.js";

const router = express.Router();

router.post("/login", (req, res) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ message: "Server is missing JWT_SECRET in .env" });
  }

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.error("ADMIN_PASSWORD missing in .env");
    return res.status(500).json({ message: "Server login is not configured." });
  }

  try {
    const { username, password: pwd } = req.body || {};
    const u = normalizeUsername(username);

    if (!isAllowedAdmin(u) || pwd !== password) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const token = jwt.sign({ sub: u }, secret, { expiresIn: "7d" });
    res.json({ token, username: u });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed." });
  }
});

export default router;
