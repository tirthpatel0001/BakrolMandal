import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import "dotenv/config";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Setup Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "bakrol-bal-mandal/students",
    resource_type: "auto",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
  },
});

// File filter to only accept images
const fileFilter = (_req, file, cb) => {
  const ok = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype);
  if (ok) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, GIF, or WebP images are allowed"), false);
  }
};

// Create multer instance with Cloudinary storage
export const uploadStudentPhoto = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter,
});

// Function to delete image from Cloudinary
export async function deleteCloudinaryImage(imageUrl) {
  try {
    if (!imageUrl) return;

    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
    const urlParts = imageUrl.split("/");
    const fileWithExtension = urlParts[urlParts.length - 1];
    const publicId = fileWithExtension.split(".")[0];
    const folder = urlParts.slice(-2, -1)[0];

    if (publicId && folder) {
      const fullPublicId = `${folder}/${publicId}`;
      await cloudinary.uploader.destroy(fullPublicId);
    }
  } catch (err) {
    console.error("Error deleting image from Cloudinary:", err);
    // Don't throw - silently fail
  }
}

// Helper to get image URL from multer result
export function getImageUrl(file) {
  if (!file) return "";
  // CloudinaryStorage provides secure_url in the file object
  return file.secure_url || "";
}
