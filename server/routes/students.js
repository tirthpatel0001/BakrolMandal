import express from "express";
import mongoose from "mongoose";
import Student from "../models/Student.js";
import { uploadStudentPhoto, deleteCloudinaryImage, getImageUrl } from "../middleware/cloudinary-upload.js";

function parseStudentBody(body) {
  const {
    name,
    mobile,
    dateOfBirth,
    grade,
    schoolName,
    pooja,
    poojaTheyDo,
    lehgoJabho,
    balPrakash,
    satsangViharExam,
  } = body;

  const poojaBool = pooja === "true" || pooja === true;
  let theyDo = null;
  if (poojaBool) {
    theyDo = poojaTheyDo === "true" || poojaTheyDo === true;
  }

  return {
    name,
    mobile,
    dateOfBirth: new Date(dateOfBirth),
    grade,
    schoolName,
    pooja: poojaBool,
    poojaTheyDo: theyDo,
    lehgoJabho: lehgoJabho === "true" || lehgoJabho === true,
    balPrakash: balPrakash === "true" || balPrakash === true,
    satsangViharExam: satsangViharExam === "true" || satsangViharExam === true,
  };
}

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 }).lean();
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to list students" });
  }
});

router.post("/", uploadStudentPhoto.single("photo"), async (req, res) => {
  try {
    const data = parseStudentBody(req.body);
    
    // Get image URL from Cloudinary (secure_url from multer-storage-cloudinary)
    const photoUrl = getImageUrl(req.file);
    console.log("POST /api/students - File upload result:", {
      fileProvided: !!req.file,
      photoUrl: photoUrl ? photoUrl.substring(0, 80) + "..." : "empty",
      fileKeys: req.file ? Object.keys(req.file) : [],
    });

    const student = await Student.create({
      ...data,
      photo: photoUrl,
    });

    console.log("POST /api/students - Student created:", {
      id: student._id,
      name: student.name,
      photoStored: student.photo ? student.photo.substring(0, 80) + "..." : "empty",
    });

    res.status(201).json(student);
  } catch (err) {
    console.error("Error creating student:", err);
    res.status(400).json({ message: err.message || "Failed to create student" });
  }
});

router.patch("/:id", uploadStudentPhoto.single("photo"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid student id" });
    }
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const data = parseStudentBody(req.body);
    Object.assign(student, data);

    if (req.file) {
      // Delete old image from Cloudinary if it exists
      if (student.photo) {
        console.log("PATCH /api/students/:id - Deleting old image:", student.photo.substring(0, 80) + "...");
        await deleteCloudinaryImage(student.photo);
      }
      // Set new image URL from Cloudinary
      const newPhotoUrl = getImageUrl(req.file);
      console.log("PATCH /api/students/:id - Setting new image:", newPhotoUrl ? newPhotoUrl.substring(0, 80) + "..." : "empty");
      student.photo = newPhotoUrl;
    }

    await student.save();
    console.log("PATCH /api/students/:id - Student updated:", {
      id: student._id,
      name: student.name,
      photoStored: student.photo ? student.photo.substring(0, 80) + "..." : "empty",
    });
    res.json(student);
  } catch (err) {
    console.error("Error updating student:", err);
    res.status(400).json({ message: err.message || "Failed to update student" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid student id" });
    }
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Delete image from Cloudinary if it exists
    if (student.photo) {
      await deleteCloudinaryImage(student.photo);
    }

    await student.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting student:", err);
    res.status(400).json({ message: err.message || "Failed to delete student" });
  }
});

// ✅ DIAGNOSTIC: Test Cloudinary upload
router.post("/test-upload", uploadStudentPhoto.single("test"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: "No file uploaded",
        fileProvided: !!req.file,
      });
    }

    const photoUrl = getImageUrl(req.file);
    
    const diagnostic = {
      success: true,
      uploadedAt: new Date().toISOString(),
      fileReceived: {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
      extractedUrl: photoUrl,
      fileObjectKeys: Object.keys(req.file),
      cloudinaryResponseProperties: {
        secure_url: req.file.secure_url || "NOT PROVIDED",
        url: req.file.url || "NOT PROVIDED",
        path: req.file.path || "NOT PROVIDED",
        public_id: req.file.public_id || "NOT PROVIDED",
      },
    };

    console.log("DIAGNOSTIC: Test upload result:", diagnostic);
    res.json(diagnostic);
  } catch (err) {
    console.error("DIAGNOSTIC: Test upload error:", err);
    res.status(500).json({ 
      error: "Upload test failed",
      message: err.message,
    });
  }
});

export default router;
