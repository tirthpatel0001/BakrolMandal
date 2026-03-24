import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authHeaders, clearToken, getToken } from "../auth.js";
import { getApiUrl } from "../api.js";
import "./StudentDetailPage.css";

const yesNo = (v) => (v ? "Yes" : "No");

export default function StudentDetailPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleUnauthorized = useCallback(() => {
    clearToken();
    navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(getApiUrl(`/api/students/${studentId}`), {
          headers: authHeaders(),
        });

        if (res.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to load student details");
        }

        const data = await res.json();
        setStudent(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!getToken()) {
      navigate("/login", { replace: true });
      return;
    }

    fetchStudent();
  }, [studentId, navigate, handleUnauthorized]);

  if (loading) {
    return (
      <div className="detail-page">
        <div className="detail-header">
          <button className="detail-back-btn" onClick={() => navigate("/admin")}>
            ← Back to list
          </button>
        </div>
        <div className="detail-loading">Loading student details...</div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="detail-page">
        <div className="detail-header">
          <button className="detail-back-btn" onClick={() => navigate("/admin")}>
            ← Back to list
          </button>
        </div>
        <div className="detail-error">
          {error || "Student not found"}
        </div>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateAge = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "—";
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const monthDiff = today.getMonth() - d.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="detail-page">
      <div className="detail-header">
        <button className="detail-back-btn" onClick={() => navigate("/admin")}>
          ← Back to list
        </button>
        <h1 className="detail-title">Student Details</h1>
      </div>

      <div className="detail-container">
        <div className="detail-photo-card">
          {student.photo ? (
            <img
              src={student.photo}
              alt={student.name}
              className="detail-photo"
              onError={(e) => {
                e.target.style.display = "none";
                if (e.target.nextElementSibling) {
                  e.target.nextElementSibling.style.display = "flex";
                }
              }}
            />
          ) : null}
          {!student.photo || student.photo === "" ? (
            <div className="detail-photo-placeholder">
              <div className="detail-photo-placeholder-text">No photo</div>
            </div>
          ) : null}
          <div className="detail-photo-overlay">
            <h2 className="detail-student-name">{student.name}</h2>
            <div className="detail-basic-info">
              <span className="detail-badge detail-badge-grade">Grade {student.grade}</span>
              <span className="detail-badge detail-badge-school">{student.schoolName}</span>
            </div>
          </div>
        </div>

        <div className="detail-content">
          <div className="detail-section">
            <h3 className="detail-section-title">Contact Information</h3>
            <div className="detail-info-grid">
              <DetailField label="Mobile" value={student.mobile} />
              <DetailField label="Date of Birth" value={formatDate(student.dateOfBirth)} />
              <DetailField label="Age" value={calculateAge(student.dateOfBirth)} />
            </div>
          </div>

          <div className="detail-section">
            <h3 className="detail-section-title">Academic Information</h3>
            <div className="detail-info-grid">
              <DetailField label="Grade" value={student.grade} />
              <DetailField label="School" value={student.schoolName} />
            </div>
          </div>

          <div className="detail-section">
            <h3 className="detail-section-title">Activities & Programs</h3>
            <div className="detail-activities-grid">
              <ActivityCard
                title="Pooja"
                hasActivity={student.pooja}
                subTitle={student.pooja ? `Do Pooja: ${yesNo(student.poojaTheyDo)}` : "Not registered"}
              />
              <ActivityCard
                title="Lehgo Jabho"
                hasActivity={student.lehgoJabho}
                subTitle={student.lehgoJabho ? "Enrolled" : "Not enrolled"}
              />
              <ActivityCard
                title="Bal Prakash"
                hasActivity={student.balPrakash}
                subTitle={student.balPrakash ? "Enrolled" : "Not enrolled"}
              />
              <ActivityCard
                title="Satsang Vihar Exam"
                hasActivity={student.satsangViharExam}
                subTitle={student.satsangViharExam ? "Registered" : "Not registered"}
              />
            </div>
          </div>

          <div className="detail-section">
            <h3 className="detail-section-title">Additional Details</h3>
            <div className="detail-info-grid">
              <DetailField
                label="Member Since"
                value={student.createdAt ? formatDate(student.createdAt) : "—"}
              />
              <DetailField
                label="Last Updated"
                value={student.updatedAt ? formatDate(student.updatedAt) : "—"}
              />
            </div>
          </div>

          <div className="detail-actions">
            <button
              className="detail-btn detail-btn-edit"
              onClick={() => navigate("/admin")}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div className="detail-field">
      <div className="detail-field-label">{label}</div>
      <div className="detail-field-value">{value}</div>
    </div>
  );
}

function ActivityCard({ title, hasActivity, subTitle }) {
  return (
    <div className={`detail-activity-card ${hasActivity ? "active" : "inactive"}`}>
      <div className="detail-activity-icon">
        {hasActivity ? "✓" : "—"}
      </div>
      <div className="detail-activity-content">
        <div className="detail-activity-title">{title}</div>
        <div className="detail-activity-sub">{subTitle}</div>
      </div>
    </div>
  );
}
