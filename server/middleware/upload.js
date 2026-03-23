import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `student-${Date.now()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ok = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype);
  if (ok) cb(null, true);
  else cb(new Error("Only JPEG, PNG, GIF, or WebP images are allowed"), false);
};

export const uploadStudentPhoto = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});
