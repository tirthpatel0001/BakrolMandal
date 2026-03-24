import React, { useState } from 'react';
import './AttendanceManagementComponent.css';

// Sample student data for testing
const SAMPLE_STUDENTS = [
  {
    id: 1,
    name: 'Raj Kumar',
    phone: '919876543210'
  },
  {
    id: 2,
    name: 'Priya Sharma',
    phone: '919123456789'
  },
  {
    id: 3,
    name: 'Amit Patel',
    phone: '918765432109'
  },
  {
    id: 4,
    name: 'Neha Gupta',
    phone: '917654321098'
  },
  {
    id: 5,
    name: 'Vikram Singh',
    phone: '916543210987'
  }
];

const AttendanceManagementComponent = ({ students = SAMPLE_STUDENTS }) => {
  // State to manage attendance for each student
  const [attendance, setAttendance] = useState(
    students.reduce((acc, student) => {
      acc[student.id] = null; // null means not selected
      return acc;
    }, {})
  );

  /**
   * Handle attendance status change
   * @param {number} studentId - The ID of the student
   * @param {string} status - 'present' or 'absent'
   */
  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prevState => ({
      ...prevState,
      [studentId]: status
    }));
  };

  /**
   * Generate WhatsApp message based on attendance status
   * @param {string} name - Student name
   * @param {string} status - 'present' or 'absent'
   * @returns {string} - Formatted message
   */
  const generateWhatsAppMessage = (name, status) => {
    if (status === 'present') {
      return `Hello, ${name} was PRESENT today in sabha. Jay Swaminarayan.`;
    } else if (status === 'absent') {
      return `Hello, your student ${name} was ABSENT today in sabha.`;
    }
    return '';
  };

  /**
   * Handle WhatsApp notification
   * @param {object} student - Student object with name and phone
   * @param {string} status - Attendance status
   */
  const handleWhatsAppNotify = (student, status) => {
    const message = generateWhatsAppMessage(student.name, status);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${student.phone}?text=${encodedMessage}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
  };

  /**
   * Get button class based on attendance status
   * @param {string} status - Current attendance status
   * @param {string} buttonStatus - The status of the button being rendered
   * @returns {string} - CSS class name
   */
  const getStatusButtonClass = (status, buttonStatus) => {
    if (status === buttonStatus) {
      return `status-button ${buttonStatus} active`;
    }
    return `status-button ${buttonStatus}`;
  };

  return (
    <div className="attendance-management-container">
      <div className="attendance-header">
        <h1>Attendance Management</h1>
        <p className="subtitle">Mark attendance and notify students via WhatsApp</p>
      </div>

      <div className="table-wrapper">
        <table className="attendance-table">
          <thead>
            <tr>
              <th className="col-name">Student Name</th>
              <th className="col-phone">Phone Number</th>
              <th className="col-status">Attendance Status</th>
              <th className="col-notify">Notify</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const studentAttendance = attendance[student.id];
              const isAttendanceSelected = studentAttendance !== null;

              return (
                <tr key={student.id} className="student-row">
                  <td className="col-name">
                    <span className="student-name">{student.name}</span>
                  </td>
                  <td className="col-phone">
                    <span className="phone-number">{student.phone}</span>
                  </td>
                  <td className="col-status">
                    <div className="button-group">
                      <button
                        className={getStatusButtonClass(
                          studentAttendance,
                          'present'
                        )}
                        onClick={() =>
                          handleAttendanceChange(student.id, 'present')
                        }
                        title="Mark student as present"
                      >
                        Present
                      </button>
                      <button
                        className={getStatusButtonClass(
                          studentAttendance,
                          'absent'
                        )}
                        onClick={() =>
                          handleAttendanceChange(student.id, 'absent')
                        }
                        title="Mark student as absent"
                      >
                        Absent
                      </button>
                    </div>
                  </td>
                  <td className="col-notify">
                    <button
                      className={`whatsapp-button ${
                        !isAttendanceSelected ? 'disabled' : ''
                      }`}
                      onClick={() =>
                        handleWhatsAppNotify(student, studentAttendance)
                      }
                      disabled={!isAttendanceSelected}
                      title={
                        isAttendanceSelected
                          ? 'Send WhatsApp notification'
                          : 'Please select attendance status first'
                      }
                    >
                      <span className="whatsapp-icon">💬</span>
                      Notify
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="info-section">
        <div className="info-card">
          <h3>How it works:</h3>
          <ul>
            <li>Select "Present" or "Absent" for each student</li>
            <li>Click "Notify" to send a WhatsApp message to the student</li>
            <li>Message will open in WhatsApp with pre-filled attendance status</li>
            <li>You can edit or send the message directly from WhatsApp</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagementComponent;
