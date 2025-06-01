'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { Attendance } from '@/types/attendance';
import Link from 'next/link';
import '../../styles/attendance-list.css';

export default function AttendancePage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Safe redirect using useEffect
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [authLoading, currentUser, router]);

  useEffect(() => {
    if (authLoading || !currentUser) return;

    const q = query(collection(db, 'attendance'), orderBy('date', 'desc'), orderBy('employeeId', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: Attendance[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          employeeId: data.employeeId,
          date: data.date,
          status: data.status,
          checkInTime: data.checkInTime || null,
          checkOutTime: data.checkOutTime || null,
          hoursWorked: data.hoursWorked || null,
          leaveType: data.leaveType || null,
          remarks: data.remarks || null,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        } as Attendance;
      });
      setAttendanceRecords(records);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching attendance records:", err);
      setError("Failed to load attendance records. Please try again.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [authLoading, currentUser]);

  if (authLoading || !currentUser || isLoading) {
    return (
      <div className="attendance-page-container loading-state">
        <p>Loading attendance records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="attendance-page-container error-state">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="attendance-page-container">
      <div className="attendance-card">
        <div className="attendance-header">
          <h2 className="attendance-title">Attendance Records</h2>
          <Link href="/attendance/add" className="add-record-button">
            Add New Record
          </Link>
        </div>

        {attendanceRecords.length === 0 ? (
          <p className="no-records-message">No attendance records found. Please add some.</p>
        ) : (
          <div className="table-responsive">
            <table className="attendance-table">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Employee ID</th>
                  <th className="table-th">Date</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Check-in</th>
                  <th className="table-th">Check-out</th>
                  <th className="table-th">Hours Worked</th>
                  <th className="table-th">Leave Type</th>
                  <th className="table-th">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record) => (
                  <tr key={record.id} className="table-row">
                    <td className="table-td">{record.employeeId}</td>
                    <td className="table-td">{record.date}</td>
                    <td className="table-td">
                      <span className={`status-badge ${
                        record.status === 'Present' ? 'status-present' :
                        record.status === 'Leave' ? 'status-leave' :
                        'status-absent'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="table-td">{record.checkInTime || '-'}</td>
                    <td className="table-td">{record.checkOutTime || '-'}</td>
                    <td className="table-td">{record.hoursWorked != null ? record.hoursWorked.toFixed(2) : '-'}</td>
                    <td className="table-td">{record.leaveType || '-'}</td>
                    <td className="table-td">{record.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
