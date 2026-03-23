import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ message: "Server is missing JWT_SECRET in .env" });
  }

  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: "Sign in required." });
  }
  try {
    const payload = jwt.verify(token, secret);
    req.user = { username: payload.sub };
    next();
  } catch {
    return res.status(401).json({ message: "Session expired. Please sign in again." });
  }
}
