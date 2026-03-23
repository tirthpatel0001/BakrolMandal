/** Bal: grades 5–9. Shishu: all other grades (including unparseable). */
const BAL_GRADES = new Set([5, 6, 7, 8, 9]);

export function gradeToNum(grade) {
  const m = String(grade ?? "").match(/(\d+)/);
  if (!m) return NaN;
  return parseInt(m[1], 10);
}

export function isBalStudent(student) {
  const n = gradeToNum(student.grade);
  return BAL_GRADES.has(n);
}

export function isShishuStudent(student) {
  return !isBalStudent(student);
}

export function filterStudentsByCohort(students, cohort) {
  if (cohort === "bal") return students.filter(isBalStudent);
  if (cohort === "shishu") return students.filter(isShishuStudent);
  return students;
}
