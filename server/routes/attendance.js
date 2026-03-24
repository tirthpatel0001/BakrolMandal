import express from "express";
import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";

const router = express.Router();

// ⚠️ IMPORTANT: Define specific routes BEFORE generic routes to prevent mismatching

// GET /api/attendance/history - Get last N attendance records (MUST BE BEFORE /)
router.get("/history", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const cohort = req.query.cohort; // Optional filter by cohort

    let query = {};
    if (cohort && ["bal", "shishu"].includes(cohort)) {
      query.cohort = cohort;
    }

    const history = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(limit)
      .lean();

    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to fetch attendance history" });
  }
});

// GET /api/attendance/student/:studentId - Get attendance summary for a specific student (MUST BE BEFORE /)
router.get("/student/:studentId", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.studentId)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    const studentId = req.params.studentId;
    const limit = parseInt(req.query.limit) || 5;

    const attendance = await Attendance.find({
      "records.studentId": studentId,
    })
      .select("date cohort records")
      .sort({ date: -1 })
      .limit(limit)
      .lean();

    const summary = attendance.map((att) => {
      const record = att.records.find((r) => r.studentId.toString() === studentId);
      return {
        date: att.date,
        cohort: att.cohort,
        status: record ? record.status : null,
      };
    });

    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to fetch student attendance" });
  }
});

// GET /api/attendance/latest/:studentId - Get latest attendance record for a student (MUST BE BEFORE /)
router.get("/latest/:studentId", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.studentId)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    const studentId = req.params.studentId;

    const latest = await Attendance.findOne({
      "records.studentId": studentId,
    })
      .select("date cohort records")
      .sort({ date: -1 })
      .lean();

    if (!latest) {
      return res.json(null);
    }

    const record = latest.records.find((r) => r.studentId.toString() === studentId);
    res.json({
      date: latest.date,
      cohort: latest.cohort,
      status: record ? record.status : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to fetch latest attendance" });
  }
});

// GET /api/attendance/range - Get attendance records within a date range
router.get("/range", async (req, res) => {
  try {
    const { startDate, endDate, cohort } = req.query;

    let query = {};

    // Add cohort filter if provided
    if (cohort && ["bal", "shishu"].includes(cohort)) {
      query.cohort = cohort;
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const [year, month, day] = startDate.split('-').map(Number);
        query.date.$gte = new Date(Date.UTC(year, month - 1, day));
      }
      if (endDate) {
        const [year, month, day] = endDate.split('-').map(Number);
        const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
        query.date.$lt = nextDay;
      }
    }

    const records = await Attendance.find(query)
      .sort({ date: -1 })
      .lean();

    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to fetch attendance records" });
  }
});

// POST /api/attendance - Create or update attendance record
router.post("/", async (req, res) => {
  try {
    const { date, cohort, records } = req.body;

    if (!date || !cohort || !records || !Array.isArray(records)) {
      return res.status(400).json({ message: "Missing required fields: date, cohort, records" });
    }

    if (!["bal", "shishu"].includes(cohort)) {
      return res.status(400).json({ message: "Invalid cohort. Must be 'bal' or 'shishu'" });
    }

    // Parse the date string (format: YYYY-MM-DD) - use UTC to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const recordDate = new Date(Date.UTC(year, month - 1, day));

    // Validate records
    const validRecords = [];
    for (const record of records) {
      if (!mongoose.isValidObjectId(record.studentId)) {
        return res.status(400).json({ message: `Invalid student ID: ${record.studentId}` });
      }
      if (!["present", "absent"].includes(record.status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'present' or 'absent'" });
      }
      validRecords.push({
        studentId: record.studentId,
        status: record.status,
      });
    }

    const nextDay = new Date(Date.UTC(year, month - 1, day + 1));

    const attendance = await Attendance.findOneAndUpdate(
      {
        cohort,
        date: {
          $gte: recordDate,
          $lt: nextDay,
        },
      },
      { records: validRecords },
      { upsert: true, new: true }
    );

    res.json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to save attendance" });
  }
});

// GET /api/attendance - Get attendance for a specific date and cohort (GENERIC - MUST BE LAST)
router.get("/", async (req, res) => {
  try {
    const { date, cohort } = req.query;

    if (!date || !cohort) {
      return res.status(400).json({ message: "Missing required query params: date, cohort" });
    }

    if (!["bal", "shishu"].includes(cohort)) {
      return res.status(400).json({ message: "Invalid cohort" });
    }

    // Parse the date string (format: YYYY-MM-DD) - use UTC to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const recordDate = new Date(Date.UTC(year, month - 1, day));
    const nextDay = new Date(Date.UTC(year, month - 1, day + 1));

    const attendance = await Attendance.findOne({
      cohort,
      date: {
        $gte: recordDate,
        $lt: nextDay,
      },
    }).lean();

    res.json(attendance || { date: recordDate.toISOString(), cohort, records: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to fetch attendance" });
  }
});

export default router;
