// src/app/payroll/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { Employee } from '@/types/employee';
import { Attendance } from '@/types/attendance';
// import Link from 'next/link'; // FIX: Removed Link import as it's unused in the current component structure
import '../../styles/payroll.css'; // Import the new payroll-specific CSS

export default function PayrollCalculationPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  // --- All useState declarations must come first ---
  const [employeeId, setEmployeeId] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [calculatedGrossPay, setCalculatedGrossPay] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [employeeExists, setEmployeeExists] = useState<boolean | null>(null);

  // --- All useEffect declarations must come next ---
  useEffect(() => {
    const today = new Date();
    setMonth(String(today.getMonth() + 1).padStart(2, '0'));
    setYear(String(today.getFullYear()));
  }, []);

  useEffect(() => {
    // This effect should only run if auth is loaded, to prevent premature checks
    if (authLoading) return;

    const checkEmployee = async () => {
      if (!employeeId.trim()) {
        setEmployeeExists(null);
        setEmployee(null);
        return;
      }
      try {
        const employeesRef = collection(db, 'employees');
        const q = query(employeesRef, where('employeeId', '==', employeeId.trim()), where('status', '==', 'active'));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const employeeData = { id: querySnapshot.docs[0].id, ...(querySnapshot.docs[0].data() as Omit<Employee, 'id'>) } as Employee;
          setEmployee(employeeData);
          setEmployeeExists(true);
        } else {
          setEmployeeExists(false);
          setEmployee(null);
        }
      } catch (err: unknown) { // FIX: Changed 'any' to 'unknown'
        if (err instanceof Error) { // FIX: Added type guard
          console.error("Error checking employee ID:", err.message);
          setError(`Error checking employee ID: ${err.message}`); // Optional: display this error to user
        } else {
          console.error("An unknown error occurred while checking employee ID:", err);
          setError("An unknown error occurred while checking employee ID.");
        }
        setEmployeeExists(false);
        setEmployee(null);
      }
    };

    const timer = setTimeout(() => {
      checkEmployee();
    }, 500);

    return () => clearTimeout(timer);
  }, [employeeId, authLoading]); // Dependency: include authLoading to ensure effect runs after auth is ready

  // --- Conditional redirect for authentication (This must come AFTER all hook calls) ---
  if (!authLoading && !currentUser) {
    router.push('/login');
    return null;
  }

  const handleCalculatePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCalculatedGrossPay(null);
    setIsLoading(true);
    setAttendanceRecords([]);

    if (!employeeId || !month || !year) {
      setError('Employee ID, Month, and Year are required.');
      setIsLoading(false);
      return;
    }

    if (employeeExists === false || !employee) {
      setError('Invalid or inactive Employee ID. Please enter an active Employee ID.');
      setIsLoading(false);
      return;
    }

    try {
      // Create start and end dates for the month/year
      const yearInt = parseInt(year);
      const monthInt = parseInt(month);
      const startDate = new Date(yearInt, monthInt - 1, 1).toISOString().slice(0, 10); // YYYY-MM-DD format
      const endDate = new Date(yearInt, monthInt, 0).toISOString().slice(0, 10); // Last day of the month

      const attendanceRef = collection(db, 'attendance');
      const qAttendance = query(
        attendanceRef,
        where('employeeId', '==', employeeId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        where('status', '==', 'Present')
      );

      const attendanceSnapshot = await getDocs(qAttendance);

      const records: Attendance[] = attendanceSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          employeeId: data.employeeId,
          date: data.date,
          status: data.status,
          checkInTime: data.checkInTime || null,
          checkOutTime: data.checkOutTime || null,
          hoursWorked: data.hoursWorked ?? null,
          leaveType: data.leaveType ?? null,
          remarks: data.remarks ?? null,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      });
      setAttendanceRecords(records);

      const dailySalary = (employee?.baseSalary ?? 0) / 30; // Assuming 30 days for daily salary calculation
      const totalDaysPresent = records.length;

      // FIX: Removed unused 'totalHoursWorked' variable and its associated loop
      // totalHoursWorked is calculated directly in JSX using reduce if needed for display

      const grossPay = totalDaysPresent * dailySalary;
      setCalculatedGrossPay(grossPay);

    } catch (err: unknown) { // FIX: Changed 'any' to 'unknown'
      if (err instanceof Error) { // FIX: Added type guard
        setError(`Error calculating payroll: ${err.message}`);
      } else {
        setError('An unknown error occurred while calculating payroll.');
      }
      console.error('Error calculating payroll:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) { // This conditional check is fine here because it comes after all hooks
    return (
      <div className="payroll-page-container loading-state">
        <p>Loading user session...</p>
      </div>
    );
  }

  return (
    <div className="payroll-page-container">
      <div className="payroll-card">
        <h2 className="payroll-title">Payroll Calculation</h2>

        {error && <p className="status-message error-message">{error}</p>}

        <form onSubmit={handleCalculatePayroll} className="payroll-form">
          <div className="form-grid">
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
                <p className="input-validation-message error-message-small">Employee ID does not exist or is inactive.</p>
              )}
              {employeeId && employeeExists === true && (
                <p className="input-validation-message success-message-small">
                  Employee: {employee?.firstName ?? ''} {employee?.lastName ?? ''}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="month" className="form-label">Month <span className="required-asterisk">*</span></label>
              <select
                id="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                required
                className="form-input"
              >
                <option value="">Select Month</option>
                {[...Array(12)].map((_, i) => {
                  const monthVal = String(i + 1).padStart(2, '0');
                  const monthName = new Date(0, i).toLocaleString('en-US', { month: 'long' });
                  return <option key={monthVal} value={monthVal}>{monthName}</option>;
                })}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="year" className="form-label">Year <span className="required-asterisk">*</span></label>
              <input
                type="number"
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                min="2000"
                max="2099"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-actions-center">
            <button
              type="submit"
              disabled={isLoading || employeeExists === false || employeeExists === null}
              className={`submit-button ${isLoading || employeeExists === false || employeeExists === null ? 'disabled-button' : ''}`}
            >
              {isLoading ? 'Calculating...' : 'Calculate Payroll'}
            </button>
          </div>
        </form>

        {calculatedGrossPay !== null && (
          <div className="payroll-summary-card">
            <h3 className="summary-title">
              Payroll Summary for {employee?.firstName ?? 'N/A'} {employee?.lastName ?? ''} ({employee?.employeeId ?? 'N/A'})
            </h3>
            <div className="summary-details">
              <p className="summary-item">
                <strong>Base Monthly Salary:</strong> ₹{(employee?.baseSalary ?? 0).toLocaleString('en-IN')}
              </p>
              <p className="summary-item">
                <strong>Total Present Days in {new Date(0, parseInt(month) - 1).toLocaleString('en-US', { month: 'long' })} {year}:</strong> {attendanceRecords.length} days
              </p>
              <p className="summary-item">
                <strong>Total Hours Worked (Present Days):</strong> {attendanceRecords.reduce((sum, record) => sum + (record.hoursWorked ?? 0), 0).toFixed(2)} hours
              </p>
              <p className="gross-pay-result">
                Gross Pay: ₹{calculatedGrossPay.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}