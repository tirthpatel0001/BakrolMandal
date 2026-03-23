import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    photo: { type: String, default: "" },
    mobile: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    grade: { type: String, required: true, trim: true },
    schoolName: { type: String, required: true, trim: true },
    pooja: { type: Boolean, required: true },
    poojaTheyDo: { type: Boolean, default: null },
    lehgoJabho: { type: Boolean, required: true },
    balPrakash: { type: Boolean, required: true },
    satsangViharExam: { type: Boolean, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Student", studentSchema);
