import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, index: true },
    cohort: { type: String, enum: ["bal", "shishu"], required: true },
    records: [
      {
        studentId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Student" },
        status: { type: String, enum: ["present", "absent"], required: true },
      },
    ],
  },
  { timestamps: true }
);

// Ensure unique date-cohort combination
attendanceSchema.index({ date: 1, cohort: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
