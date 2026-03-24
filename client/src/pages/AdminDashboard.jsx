import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authHeaders, clearToken, getToken } from "../auth.js";
import { filterStudentsByCohort, isBalStudent } from "../cohort.js";
import { getApiUrl } from "../api.js";
import "./AdminDashboard.css";

const yesNo = (v) => (v ? "Yes" : "No");

function emptyForm() {
  return {
    name: "",
    mobile: "",
    dateOfBirth: "",
    grade: "",
    schoolName: "",
    pooja: "no",
    poojaTheyDo: "no",
    lehgoJabho: "no",
    balPrakash: "no",
    satsangViharExam: "no",
    photo: null,
  };
}

function dateInputValue(isoOrDate) {
  if (!isoOrDate) return "";
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");

  const [students, setStudents] = useState([]);
  const [lastAttendance, setLastAttendance] = useState({}); // Track last attendance per student
  const [cohortFilter, setCohortFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(emptyForm);

  const handleUnauthorized = useCallback(() => {
    clearToken();
    navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const t = getToken();
    if (!t) return;
    try {
      const payload = JSON.parse(atob(t.split(".")[1]));
      setUsername(payload.sub || "");
    } catch {
      setUsername("");
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/students"), { headers: authHeaders() });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) throw new Error("Failed to load students");
      const studentsList = await res.json();
      setStudents(studentsList);

      // Fetch last attendance for each student
      const attendanceMap = {};
      for (const student of studentsList) {
        try {
          const attendRes = await fetch(getApiUrl(`/api/attendance/latest/${student._id}`), {
            headers: authHeaders(),
          });
          if (attendRes.ok) {
            const attendData = await attendRes.json();
            if (attendData) {
              attendanceMap[student._id] = attendData;
            }
          }
        } catch (e) {
          // Silently fail for individual attendance fetches
        }
      }
      setLastAttendance(attendanceMap);
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filteredStudents = useMemo(
    () => filterStudentsByCohort(students, cohortFilter),
    [students, cohortFilter]
  );

  const balCount = useMemo(() => students.filter(isBalStudent).length, [students]);
  const shishuCount = useMemo(() => students.length - balCount, [students, balCount]);

  // Activity counts for filtered students
  const activityCounts = useMemo(() => {
    return {
      hasPooja: filteredStudents.filter(s => s.pooja).length,
      doPoojaCount: filteredStudents.filter(s => s.pooja && s.poojaTheyDo).length,
      hasLehgoJabho: filteredStudents.filter(s => s.lehgoJabho).length,
      balPrakash: filteredStudents.filter(s => s.balPrakash).length,
      satsangVihar: filteredStudents.filter(s => s.satsangViharExam).length,
    };
  }, [filteredStudents]);

  const updateField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  function startEdit(s) {
    setEditingId(s._id);
    setShowForm(true);
    setMessage({ type: "", text: "" });
    setForm({
      name: s.name || "",
      mobile: s.mobile || "",
      dateOfBirth: dateInputValue(s.dateOfBirth),
      grade: s.grade != null ? String(s.grade) : "",
      schoolName: s.schoolName || "",
      pooja: s.pooja ? "yes" : "no",
      poojaTheyDo: s.poojaTheyDo ? "yes" : "no",
      lehgoJabho: s.lehgoJabho ? "yes" : "no",
      balPrakash: s.balPrakash ? "yes" : "no",
      satsangViharExam: s.satsangViharExam ? "yes" : "no",
      photo: null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setShowForm(false);
    setForm(emptyForm());
  }

  function logout() {
    clearToken();
    navigate("/login", { replace: true });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setSubmitting(true);

    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("mobile", form.mobile.trim());
    fd.append("dateOfBirth", form.dateOfBirth);
    fd.append("grade", form.grade.trim());
    fd.append("schoolName", form.schoolName.trim());
    fd.append("pooja", form.pooja === "yes");
    if (form.pooja === "yes") {
      fd.append("poojaTheyDo", form.poojaTheyDo === "yes");
    }
    fd.append("lehgoJabho", form.lehgoJabho === "yes");
    fd.append("balPrakash", form.balPrakash === "yes");
    fd.append("satsangViharExam", form.satsangViharExam === "yes");
    if (form.photo) fd.append("photo", form.photo);

    const isEdit = Boolean(editingId);
    const url = isEdit ? getApiUrl(`/api/students/${editingId}`) : getApiUrl("/api/students");
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: fd,
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not save student");

      setMessage({ type: "ok", text: isEdit ? "Student updated." : "Student added successfully." });
      setEditingId(null);
      setShowForm(false);
      setForm(emptyForm());
      e.target.reset();
      fetchStudents();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete ${name || "this student"}? This cannot be undone.`)) return;
    setDeletingId(id);
    setMessage({ type: "", text: "" });
    try {
      const res = await fetch(getApiUrl(`/api/students/${id}`), { method: "DELETE", headers: authHeaders() });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not delete");
      if (editingId === id) cancelEdit();
      setMessage({ type: "ok", text: "Student removed." });
      fetchStudents();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="dash">
      <div className="dash-bg" aria-hidden="true" />
      <header className="dash-top">
        <div className="dash-brand">
          <div className="dash-mark" />
          <div>
            <p className="dash-brand-kicker">Bakrol Bal Mandal</p>
            <h1 className="dash-brand-title">Student registry</h1>
          </div>
        </div>
        <div className="dash-actions">
          <span className="dash-user" title="Signed-in account">
            <span className="dash-user-dot" />
            {username || "Admin"}
          </span>
          <button type="button" className="dash-btn dash-btn-primary" onClick={() => navigate("/attendance")}>
            📋 Attendance
          </button>
          <button type="button" className="dash-btn dash-btn-ghost" onClick={() => fetchStudents()} disabled={loading}>
            Refresh list
          </button>
          <button type="button" className="dash-btn dash-btn-outline" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="dash-main">
        <section className="dash-panel dash-panel-list">
          <div className="dash-panel-head dash-panel-head-row">
            <div>
              <h2>Students</h2>
              <p className="dash-panel-desc">
                {loading
                  ? "Loading…"
                  : `${filteredStudents.length} shown · ${students.length} total (Bal ${balCount} · Shishu ${shishuCount})`}
              </p>
            </div>
          </div>

          {!loading && students.length > 0 ? (
            <div className="dash-stats-grid">
              <div className="dash-stat-card">
                <div className="dash-stat-label">Who has Pooja</div>
                <div className="dash-stat-number">{activityCounts.hasPooja}</div>
              </div>
              <div className="dash-stat-card">
                <div className="dash-stat-label">Who does Pooja</div>
                <div className="dash-stat-number">{activityCounts.doPoojaCount}</div>
              </div>
              <div className="dash-stat-card">
                <div className="dash-stat-label">Lehgo Jabho</div>
                <div className="dash-stat-number">{activityCounts.hasLehgoJabho}</div>
              </div>
              <div className="dash-stat-card">
                <div className="dash-stat-label">Bal Prakash</div>
                <div className="dash-stat-number">{activityCounts.balPrakash}</div>
              </div>
              <div className="dash-stat-card">
                <div className="dash-stat-label">Satsang Vihar</div>
                <div className="dash-stat-number">{activityCounts.satsangVihar}</div>
              </div>
            </div>
          ) : null}

          {!loading ? (
            <div className="dash-cohort-filter" role="tablist" aria-label="Filter by cohort">
              <button
                type="button"
                role="tab"
                aria-selected={cohortFilter === "all"}
                className={`dash-cohort-btn ${cohortFilter === "all" ? "active" : ""}`}
                onClick={() => setCohortFilter("all")}
              >
                All
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={cohortFilter === "bal"}
                className={`dash-cohort-btn ${cohortFilter === "bal" ? "active" : ""}`}
                onClick={() => setCohortFilter("bal")}
              >
                Bal
                <span className="dash-cohort-hint">grades 5–9</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={cohortFilter === "shishu"}
                className={`dash-cohort-btn ${cohortFilter === "shishu" ? "active" : ""}`}
                onClick={() => setCohortFilter("shishu")}
              >
                Shishu
                <span className="dash-cohort-hint">other grades</span>
              </button>
            </div>
          ) : null}

          {!loading && students.length === 0 ? (
            <div className="dash-empty">
              <p>No students yet.</p>
              <span>Use the form to add the first record.</span>
            </div>
          ) : null}

          {!loading && students.length > 0 && filteredStudents.length === 0 ? (
            <div className="dash-empty">
              <p>No students in this filter.</p>
              <span>Try another tab or add a student with the right grade.</span>
            </div>
          ) : null}

          {loading ? (
            <div className="dash-skeleton-wrap" aria-busy="true">
              {[1, 2, 3].map((i) => (
                <div key={i} className="dash-skeleton-card" />
              ))}
            </div>
          ) : (
            <ul className="dash-students">
              {filteredStudents.map((s) => (
                <li key={s._id} className="dash-student">
                  <div className="dash-student-photo-wrap">
                    {s.photo ? (
                      <img src={s.photo} alt="" className="dash-student-photo" />
                    ) : (
                      <div className="dash-student-photo dash-student-photo-ph">No photo</div>
                    )}
                  </div>
                  <div className="dash-student-main">
                    <div className="dash-student-top">
                      <div className="dash-student-heading">
                        <h3 className="dash-student-name">{s.name}</h3>
                        <div className="dash-student-chips">
                          <span className="dash-chip dash-chip-grade">Grade {s.grade}</span>
                          <span className={`dash-chip ${isBalStudent(s) ? "dash-chip-bal" : "dash-chip-shishu"}`}>
                            {isBalStudent(s) ? "Bal" : "Shishu"}
                          </span>
                        </div>
                      </div>
                      <div className="dash-student-actions">
                        <button type="button" className="dash-btn dash-btn-ghost dash-btn-sm" onClick={() => startEdit(s)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="dash-btn dash-btn-danger dash-btn-sm"
                          disabled={deletingId === s._id}
                          onClick={() => handleDelete(s._id, s.name)}
                        >
                          {deletingId === s._id ? "…" : "Delete"}
                        </button>
                      </div>
                    </div>
                    <p className="dash-student-meta">
                      <span>{s.mobile}</span>
                      <span className="dash-dot" />
                      <span>{s.schoolName}</span>
                    </p>
                    <div className="dash-tags">
                      <Tag label="DOB" value={s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : "—"} />
                      <Tag label="Pooja" yes={s.pooja} />
                      {s.pooja ? (
                        <span className="dash-tag dash-tag-info">
                          <strong>They do</strong> {s.poojaTheyDo == null ? "—" : yesNo(s.poojaTheyDo)}
                        </span>
                      ) : null}
                      <Tag label="Lehgo Jabho" yes={s.lehgoJabho} />
                      <Tag label="Bal Prakash" yes={s.balPrakash} />
                      <Tag label="Satsang Vihar" yes={s.satsangViharExam} />
                      {lastAttendance[s._id] && (
                        <span className={`dash-tag dash-tag-attendance ${lastAttendance[s._id].status}`}>
                          <strong>Last Sabha:</strong> {lastAttendance[s._id].status === "present" ? "✓ Present" : "✗ Absent"}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!loading && (
            <div className="dash-panel-footer">
              <button
                type="button"
                className="dash-btn dash-btn-primary"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm());
                  setShowForm(!showForm);
                  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                }}
              >
                {showForm ? "Cancel" : "+ Add Student"}
              </button>
            </div>
          )}
        </section>

        {showForm && (
          <section className="dash-panel dash-panel-form">
            <div className="dash-panel-head dash-panel-head-row">
              <div>
                <h2>{editingId ? "Edit student" : "New student"}</h2>
                <p className="dash-panel-desc">
                  {editingId ? "Update details or choose a new photo." : "Fill in details and optional photo."}
                </p>
              </div>
              {editingId ? (
                <button type="button" className="dash-btn dash-btn-ghost dash-btn-sm" onClick={cancelEdit}>
                  Cancel edit
                </button>
              ) : null}
            </div>

            {message.text ? (
              <div className={`dash-banner dash-banner-${message.type === "ok" ? "ok" : "err"}`}>{message.text}</div>
            ) : null}

            <form onSubmit={handleSubmit} className="dash-form">
              <div className="dash-form-grid">
                <label className="dash-field">
                  <span className="dash-field-label">Full name</span>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Student name"
                  />
                </label>

                <label className="dash-field">
                  <span className="dash-field-label">Photo</span>
                  <input
                    key={editingId || "new"}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="dash-file"
                    onChange={(e) => updateField("photo", e.target.files?.[0] || null)}
                  />
                </label>

                <label className="dash-field">
                  <span className="dash-field-label">Mobile</span>
                  <input
                    required
                    type="tel"
                    value={form.mobile}
                    onChange={(e) => updateField("mobile", e.target.value)}
                    placeholder="Mobile number"
                  />
                </label>

                <label className="dash-field">
                  <span className="dash-field-label">Date of birth</span>
                  <input
                    required
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => updateField("dateOfBirth", e.target.value)}
                  />
                </label>

                <label className="dash-field">
                  <span className="dash-field-label">Grade</span>
                  <input
                    required
                    value={form.grade}
                    onChange={(e) => updateField("grade", e.target.value)}
                    placeholder="e.g. 5"
                  />
                </label>

                <label className="dash-field dash-field-span">
                  <span className="dash-field-label">School name</span>
                  <input
                    required
                    value={form.schoolName}
                    onChange={(e) => updateField("schoolName", e.target.value)}
                    placeholder="School"
                  />
                </label>
              </div>

              <fieldset className="dash-fieldset">
                <legend>Pooja</legend>
                <div className="dash-toggle-row">
                  <ToggleChip name="pooja" checked={form.pooja === "yes"} onYes={() => updateField("pooja", "yes")} onNo={() => updateField("pooja", "no")} />
                </div>
                {form.pooja === "yes" ? (
                  <div className="dash-sub">
                    <span className="dash-sub-label">Do they do pooja?</span>
                    <div className="dash-toggle-row">
                      <ToggleChip
                        name="poojaTheyDo"
                        checked={form.poojaTheyDo === "yes"}
                        onYes={() => updateField("poojaTheyDo", "yes")}
                        onNo={() => updateField("poojaTheyDo", "no")}
                      />
                    </div>
                  </div>
                ) : null}
              </fieldset>

              <div className="dash-yesno-grid">
                <YesNoGroup label="Lehgo Jabho" name="lehgoJabho" value={form.lehgoJabho} onChange={(v) => updateField("lehgoJabho", v)} />
                <YesNoGroup label="Bal Prakash" name="balPrakash" value={form.balPrakash} onChange={(v) => updateField("balPrakash", v)} />
                <YesNoGroup
                  label="Satsang Vihar exam"
                  name="satsangViharExam"
                  value={form.satsangViharExam}
                  onChange={(v) => updateField("satsangViharExam", v)}
                />
              </div>

              <button type="submit" className="dash-btn dash-btn-primary" disabled={submitting}>
                {submitting ? "Saving…" : editingId ? "Update student" : "Add student"}
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}

function ToggleChip({ name, checked, onYes, onNo }) {
  return (
    <div className="dash-seg" role="group" aria-label={name}>
      <button type="button" className={`dash-seg-btn ${checked ? "on" : ""}`} onClick={onYes}>
        Yes
      </button>
      <button type="button" className={`dash-seg-btn ${!checked ? "on" : ""}`} onClick={onNo}>
        No
      </button>
    </div>
  );
}

function YesNoGroup({ label, name, value, onChange }) {
  return (
    <fieldset className="dash-fieldset dash-fieldset-compact">
      <legend>{label}</legend>
      <ToggleChip name={name} checked={value === "yes"} onYes={() => onChange("yes")} onNo={() => onChange("no")} />
    </fieldset>
  );
}

function Tag({ label, value, yes }) {
  if (value !== undefined) {
    return (
      <span className="dash-tag dash-tag-info">
        <strong>{label}</strong> {value}
      </span>
    );
  }
  return (
    <span className={`dash-tag ${yes ? "dash-tag-yes" : "dash-tag-no"}`}>
      {label}: {yesNo(yes)}
    </span>
  );
}
