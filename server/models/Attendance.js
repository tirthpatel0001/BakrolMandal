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

// Ensure unique date-cohort combination with sparse index to ignore null dates
attendanceSchema.index({ date: 1, cohort: 1 }, { unique: true, sparse: true });

// Add validation to prevent null dates
attendanceSchema.pre('save', function(next) {
  if (!this.date) {
    return next(new Error('Date is required'));
  }
  next();
});

attendanceSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.$set && !update.$set.date) {
    return next(new Error('Date is required'));
  }
  next();
});

export default mongoose.model("Attendance", attendanceSchema);
