import mongoose from "mongoose";
import "dotenv/config";
import Attendance from "./models/Attendance.js";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/bakrol_bal_mandal";

async function cleanupDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find and remove documents with null dates
    console.log("Removing documents with null dates...");
    const result = await Attendance.deleteMany({ date: null });
    console.log(`Deleted ${result.deletedCount} documents with null dates`);

    // Drop existing index to recreate it
    console.log("Dropping old index...");
    try {
      await Attendance.collection.dropIndex("date_1_cohort_1");
      console.log("Old index dropped");
    } catch (err) {
      console.log("Index doesn't exist or already dropped");
    }

    // Recreate the sparse unique index
    console.log("Creating new sparse unique index...");
    await Attendance.collection.createIndex(
      { date: 1, cohort: 1 },
      { unique: true, sparse: true }
    );
    console.log("✓ New sparse unique index created");

    // Show remaining records
    const count = await Attendance.countDocuments();
    console.log(`\nTotal attendance records: ${count}`);

    const records = await Attendance.find().select("date cohort records").lean();
    console.log("\nRemaining records:");
    records.forEach(r => {
      console.log(`  - ${new Date(r.date).toLocaleDateString()} (${r.cohort}): ${r.records.length} students`);
    });

    console.log("\n✓ Cleanup complete!");
    process.exit(0);
  } catch (err) {
    console.error("Error during cleanup:", err);
    process.exit(1);
  }
}

cleanupDatabase();
