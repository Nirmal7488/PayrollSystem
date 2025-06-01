// src/app/attendance/add/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { Attendance } from '@/types/attendance'; // Import the Attendance interface
import Link from 'next/link';
import '../../../styles/attendance-add.css'; // Import the existing employee form CSS

export default function AddAttendancePage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  // Form states
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<Attendance['status']>('Present'); // Default to Present
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [leaveType, setLeaveType] = useState('');
  const [remarks, setRemarks] = useState('');

  // UI states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeExists, setEmployeeExists] = useState<boolean | null>(null); // To check if employeeId is valid

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [authLoading, currentUser, router]);

  // Set today's date as default
  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Check if employeeId exists in Firestore
  useEffect(() => {
    const checkEmployee = async () => {
      if (!employeeId.trim()) {
        setEmployeeExists(null);
        return;
      }
      try {
        const employeesRef = collection(db, 'employees');
        const q = query(employeesRef, where('employeeId', '==', employeeId.trim()));
        const querySnapshot = await getDocs(q);
        setEmployeeExists(!querySnapshot.empty);
      } catch (err) {
        console.error("Error checking employee ID:", err);
        setEmployeeExists(false);
      }
    };

    const timer = setTimeout(() => {
      checkEmployee();
    }, 500);

    return () => clearTimeout(timer);
  }, [employeeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    if (!employeeId || !date || !status) {
      setError('Employee ID, Date, and Status are required.');
      setIsSubmitting(false);
      return;
    }

    if (employeeExists === false) {
      setError('Employee ID does not exist. Please enter a valid Employee ID.');
      setIsSubmitting(false);
      return;
    }

    if (status === 'Present') {
      if (!checkInTime || !checkOutTime) {
        setError('Check-in time and Check-out time are required for "Present" status.');
        setIsSubmitting(false);
        return;
      }
      if (checkInTime >= checkOutTime) {
        setError('Check-out time must be after Check-in time.');
        setIsSubmitting(false);
        return;
      }
    }

    let calculatedHoursWorked: number | null = null;
    if (status === 'Present' && checkInTime && checkOutTime) {
      const [inHours, inMinutes] = checkInTime.split(':').map(Number);
      const [outHours, outMinutes] = checkOutTime.split(':').map(Number);

      const checkInDate = new Date();
      checkInDate.setHours(inHours, inMinutes, 0, 0);

      const checkOutDate = new Date();
      checkOutDate.setHours(outHours, outMinutes, 0, 0);

      if (checkOutDate < checkInDate) {
        checkOutDate.setDate(checkOutDate.getDate() + 1);
      }

      const diffMs = checkOutDate.getTime() - checkInDate.getTime();
      calculatedHoursWorked = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    }

    try {
      const newAttendance: Omit<Attendance, 'id'> = {
        employeeId: employeeId.trim(),
        date: date,
        status: status,
        checkInTime: status === 'Present' ? checkInTime : null,
        checkOutTime: status === 'Present' ? checkOutTime : null,
        hoursWorked: calculatedHoursWorked,
        leaveType: status === 'Leave' ? leaveType || null : null,
        remarks: remarks.trim() || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'attendance'), newAttendance);
      setSuccess('Attendance record added successfully!');

      // Clear form
      setEmployeeId('');
      setCheckInTime('');
      setCheckOutTime('');
      setLeaveType('');
      setRemarks('');
      setEmployeeExists(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(`Error adding attendance: ${err.message}`);
        console.error('Error adding attendance:', err);
      } else {
        setError('An unexpected error occurred while adding attendance.');
        console.error('Unknown error:', err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || (!authLoading && !currentUser)) {
    return (
      <div className="add-employee-page-container loading-state">
        <p>Loading user session...</p>
      </div>
    );
  }

  return (
    <div className="add-employee-page-container">
      <div className="employee-form-card">
        <h2 className="form-title">Add New Attendance Record</h2>

        {error && <p className="status-message error-message">{error}</p>}
        {success && <p className="status-message success-message">{success}</p>}

        <form onSubmit={handleSubmit} className="employee-form">
          <div className="form-grid">
            {/* Employee ID */}
            <div className="form-group">
              <label htmlFor="employeeId" className="form-label">Employee ID <span className="required-asterisk">*</span></label>
              <input
                type="text"
                id="employeeId"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
                className={`form-input ${employeeId && employeeExists === false ? 'input-error-border' : ''}`}
              />
              {employeeId && employeeExists === false && (
                <p className="input-validation-message error-message-small">Employee ID does not exist.</p>
              )}
              {employeeId && employeeExists === true && (
                <p className="input-validation-message success-message-small">Employee ID found.</p>
              )}
            </div>

            {/* Date */}
            <div className="form-group">
              <label htmlFor="date" className="form-label">Date <span className="required-asterisk">*</span></label>
              <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required className="form-input" />
            </div>

            {/* Status */}
            <div className="form-group">
              <label htmlFor="status" className="form-label">Status <span className="required-asterisk">*</span></label>
              <select id="status" value={status} onChange={(e) => setStatus(e.target.value as Attendance['status'])} required className="form-input">
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Leave">Leave</option>
              </select>
            </div>

            {/* Check-in Time */}
            {status === 'Present' && (
              <div className="form-group">
                <label htmlFor="checkInTime" className="form-label">Check-in Time <span className="required-asterisk">*</span></label>
                <input type="time" id="checkInTime" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} className="form-input" />
              </div>
            )}

            {/* Check-out Time */}
            {status === 'Present' && (
              <div className="form-group">
                <label htmlFor="checkOutTime" className="form-label">Check-out Time <span className="required-asterisk">*</span></label>
                <input type="time" id="checkOutTime" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} className="form-input" />
              </div>
            )}

            {/* Leave Type */}
            {status === 'Leave' && (
              <div className="form-group">
                <label htmlFor="leaveType" className="form-label">Leave Type</label>
                <input type="text" id="leaveType" value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="form-input" />
              </div>
            )}
          </div>

          {/* Remarks */}
          <div className="form-group full-width">
            <label htmlFor="remarks" className="form-label">Remarks</label>
            <textarea id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} className="form-input"></textarea>
          </div>

          {/* Actions */}
          <div className="form-actions-edit">
            <Link href="/attendance" className="back-link">
              Back to Attendance List
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || employeeExists === false || employeeExists === null}
              className={`submit-button ${isSubmitting || employeeExists === false || employeeExists === null ? 'disabled-button' : ''}`}
            >
              {isSubmitting ? 'Adding Record...' : 'Add Attendance Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
