import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authHeaders } from "../auth.js";
import { filterStudentsByCohort, isBalStudent } from "../cohort.js";
import { getApiUrl } from "../api.js";
import "./AttendancePage.css";

function dateInputValue(isoOrDate) {
  if (!isoOrDate) return "";
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDate(date) {
  const d = new Date(date);
  const options = { year: "numeric", month: "short", day: "numeric" };
  return d.toLocaleDateString("en-US", options);
}

export default function AttendancePage() {
  const navigate = useNavigate();

  // Current attendance form
  const [selectedDate, setSelectedDate] = useState(dateInputValue(new Date()));
  const [cohortFilter, setCohortFilter] = useState("bal");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Attendance records for the selected date/cohort
  const [attendanceRecords, setAttendanceRecords] = useState({});

  // Past attendance data
  const [pastAttendance, setPastAttendance] = useState([]);
  const [viewMode, setViewMode] = useState("take"); // "take" or "view"
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);
  const [historyDetails, setHistoryDetails] = useState(null);

  const filteredStudents = useMemo(
    () => filterStudentsByCohort(students, cohortFilter),
    [students, cohortFilter]
  );

  // Fetch all students on mount
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await fetch(getApiUrl("/api/students"), { headers: authHeaders() });
        if (!res.ok) throw new Error("Failed to load students");
        const data = await res.json();
        setStudents(data);
      } catch (e) {
        setMessage({ type: "error", text: e.message });
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Fetch attendance for selected date
  const fetchAttendance = useCallback(async () => {
    try {
      const res = await fetch(
        getApiUrl(`/api/attendance?date=${selectedDate}&cohort=${cohortFilter}`),
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error("Failed to load attendance");
      const data = await res.json();

      const records = {};
      if (data.records) {
        data.records.forEach((r) => {
          records[r.studentId] = r.status;
        });
      }
      setAttendanceRecords(records);
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    }
  }, [selectedDate, cohortFilter]);

  useEffect(() => {
    if (viewMode === "take") {
      fetchAttendance();
    }
  }, [selectedDate, cohortFilter, viewMode, fetchAttendance]);

  // Fetch past attendance dates
  const fetchPastAttendance = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl("/api/attendance/history?limit=5"), {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load past attendance");
      const data = await res.json();
      // Filter by current cohort
      const filtered = data.filter((record) => record.cohort === cohortFilter);
      setPastAttendance(filtered);
      setSelectedHistoryDate(null);
      setHistoryDetails(null);
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    }
  }, [cohortFilter]);

  useEffect(() => {
    if (viewMode === "view") {
      fetchPastAttendance();
    }
  }, [viewMode, cohortFilter, fetchPastAttendance]);

  // Update attendance status for a student
  const handleAttendanceChange = (studentId, status) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === status ? null : status,
    }));
  };

  // Submit attendance
  const handleSubmitAttendance = async () => {
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const records = filteredStudents
        .filter((s) => attendanceRecords[s._id])
        .map((s) => ({
          studentId: s._id,
          status: attendanceRecords[s._id],
        }));

      if (records.length === 0) {
        setMessage({ type: "error", text: "Please mark at least one student's attendance" });
        setSubmitting(false);
        return;
      }

      const res = await fetch(getApiUrl("/api/attendance"), {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          cohort: cohortFilter,
          records,
        }),
      });

      if (!res.ok) throw new Error("Failed to save attendance");
      setMessage({ type: "success", text: "Attendance saved successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  // View details for a specific history date
  const handleViewHistoryDetails = (historyRecord) => {
    setSelectedHistoryDate(historyRecord.date);
    const cohortRecords = historyRecord.records || [];
    
    // Use all students from the same cohort to show complete details
    const details = filteredStudents.map((student) => {
      const record = cohortRecords.find(
        (r) => r.studentId === student._id || r.studentId === student._id.toString()
      );
      return {
        student,
        status: record ? record.status : "not-marked",
      };
    });
    setHistoryDetails(details);
  };

  return (
    <div className="attendance-page">
      <div className="attendance-header">
        <h1>Attendance Management</h1>
        <button onClick={() => navigate("/admin")} className="back-btn">
          ← Back to Dashboard
        </button>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="mode-toggle">
        <button
          className={`mode-btn ${viewMode === "take" ? "active" : ""}`}
          onClick={() => setViewMode("take")}
        >
          Take Attendance
        </button>
        <button
          className={`mode-btn ${viewMode === "view" ? "active" : ""}`}
          onClick={() => setViewMode("view")}
        >
          View Past Attendance
        </button>
      </div>

      {/* Take Attendance Mode */}
      {viewMode === "take" && (
        <div className="take-attendance-section">
          <div className="controls">
            <div className="control-group">
              <label>Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="control-group">
              <label>Cohort:</label>
              <select value={cohortFilter} onChange={(e) => setCohortFilter(e.target.value)}>
                <option value="bal">Bal (Grade 5-9)</option>
                <option value="shishu">Shishu (Other Grades)</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="loading">Loading students...</p>
          ) : (
            <>
              <div className="students-list">
                <h3>
                  {filteredStudents.length} Students ({cohortFilter})
                </h3>
                <div className="student-items">
                  {filteredStudents.map((student) => (
                    <div key={student._id} className="student-item">
                      <div className="student-info">
                        {student.photo && (
                          <img src={student.photo} alt={student.name} />
                        )}
                        <div>
                          <p className="student-name">{student.name}</p>
                          <p className="student-detail">Grade: {student.grade}</p>
                        </div>
                      </div>
                      <div className="attendance-buttons">
                        <button
                          className={`status-btn present ${
                            attendanceRecords[student._id] === "present" ? "selected" : ""
                          }`}
                          onClick={() => handleAttendanceChange(student._id, "present")}
                          title="Mark Present"
                        >
                          ✓ Present
                        </button>
                        <button
                          className={`status-btn absent ${
                            attendanceRecords[student._id] === "absent" ? "selected" : ""
                          }`}
                          onClick={() => handleAttendanceChange(student._id, "absent")}
                          title="Mark Absent"
                        >
                          ✗ Absent
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="submit-section">
                <button
                  className="submit-btn"
                  onClick={handleSubmitAttendance}
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save Attendance"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* View Past Attendance Mode */}
      {viewMode === "view" && (
        <div className="view-attendance-section">
          <div className="past-dates">
            <h3>Last 5 Attendance Dates</h3>
            <div className="dates-list">
              {pastAttendance.length === 0 ? (
                <p className="no-data">No attendance records found</p>
              ) : (
                pastAttendance.map((record) => (
                  <div key={`${record.date}-${record.cohort}`} className="date-item">
                    <div className="date-info">
                      <p className="date">{formatDate(record.date)}</p>
                      <p className="cohort-badge">{record.cohort}</p>
                      <p className="count">
                        {record.records.filter((r) => r.status === "present").length} /
                        {record.records.length} Present
                      </p>
                    </div>
                    <button
                      className="view-details-btn"
                      onClick={() => handleViewHistoryDetails(record)}
                    >
                      View Details
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* History Details */}
          {historyDetails && (
            <div className="history-details">
              <h3>Attendance Details - {formatDate(selectedHistoryDate)}</h3>
              <div className="details-list">
                {historyDetails.map((item) => (
                  <div key={item.student._id} className="detail-item">
                    <div className="student-info">
                      {item.student.photo && (
                        <img src={item.student.photo} alt={item.student.name} />
                      )}
                      <div>
                        <p className="student-name">{item.student.name}</p>
                        <p className="student-detail">Grade: {item.student.grade}</p>
                      </div>
                    </div>
                    <div className={`status ${item.status}`}>
                      {item.status === "present" && "✓ Present"}
                      {item.status === "absent" && "✗ Absent"}
                      {item.status === "not-marked" && "Not Marked"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
