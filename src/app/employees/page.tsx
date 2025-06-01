// src/app/employees/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { Employee } from '@/types/employee'; // Import the Employee interface
import Link from 'next/link';
import '../../styles/employee-list.css'; // <-- Import your new CSS file here

export default function EmployeesPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect if not authenticated
  if (!authLoading && !currentUser) {
    router.push('/login');
    return null;
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to deactivate ${name}?`)) {
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      const employeeRef = doc(db, 'employees', id);
      await updateDoc(employeeRef, { status: 'inactive' });
      setSuccess(`${name} has been deactivated successfully!`);
    } catch (err: any) {
      setError(`Error deactivating ${name}: ${err.message}`);
      console.error('Error deactivating employee:', err);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    const q = query(
      collection(db, 'employees'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const employees: Employee[] = snapshot.docs.map(doc => {
        const data = doc.data(); // Get all data as a generic object
        return {
          id: doc.id,
          employeeId: data.employeeId || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || null,
          address: data.address || null,
          position: data.position || '',
          department: data.department || '',
          hireDate: data.hireDate || '',
          baseSalary: data.baseSalary || 0,
          status: data.status || 'active',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          designation: data.designation || '',
          bankAccountNumber: data.bankAccountNumber || '',
          ifscCode: data.ifscCode || '',
          panNumber: data.panNumber || '',
          joiningDate: data.joiningDate || '',
        } as Employee;
      });
      setEmployees(employees);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching employees:", err);
      setError("Failed to load employees. Please try again.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [authLoading]);

  // Loading and Error states
  if (authLoading || isLoading) {
    return (
      <div className="employee-page-container loading-state">
        <p>Loading employees...</p>
      </div>
    );
  }

  if (error && !employees.length) { // Only show full-page error if no employees loaded at all
    return (
      <div className="employee-page-container error-state">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="employee-page-container">
      <div className="employee-list-card">
        <div className="header-actions">
          <h2 className="list-title">Employee List</h2>
          <Link href="/employees/add" className="add-employee-button">
            Add New Employee
          </Link>
        </div>

        {error && employees.length > 0 && <p className="status-message error-message">{error}</p>}
        {success && <p className="status-message success-message">{success}</p>}

        {employees.length === 0 ? (
          <p className="no-employees-message">No employees found. Please add some.</p>
        ) : (
          <div className="table-wrapper">
            <table className="employee-table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Employee ID</th>
                  <th className="table-header-cell">Name</th>
                  <th className="table-header-cell">Email</th>
                  <th className="table-header-cell">Phone</th>
                  <th className="table-header-cell">Position</th>
                  <th className="table-header-cell">Department</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="table-row">
                    <td className="table-cell">{employee.employeeId}</td>
                    <td className="table-cell">{employee.firstName} {employee.lastName}</td>
                    <td className="table-cell">{employee.email}</td>
                    <td className="table-cell">{employee.phone || '-'}</td>
                    <td className="table-cell">{employee.position}</td>
                    <td className="table-cell">{employee.department}</td>
                    <td className="table-cell">
                      <span className={`status-badge ${employee.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="table-cell actions-column">
                      <div className="action-buttons-group">
                        <Link href={`/employees/edit/${employee.id}`} className="action-link edit-link">
                          Edit
                        </Link>
                        {employee.status === 'active' ? (
                          <button
                            onClick={() => handleDelete(employee.id, `${employee.firstName || ''} ${employee.lastName || ''}`)}
                            className="action-button deactivate-button"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => router.push(`/employees/edit/${employee.id}?activate=true`)}
                            className="action-button activate-button"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
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