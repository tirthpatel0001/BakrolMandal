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

    const student = await Student.create({
      ...data,
      photo: photoUrl,
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
        await deleteCloudinaryImage(student.photo);
      }
      // Set new image URL from Cloudinary
      student.photo = getImageUrl(req.file);
    }

    await student.save();
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

export default router;
