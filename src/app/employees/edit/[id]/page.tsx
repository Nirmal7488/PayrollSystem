// src/app/employees/edit/[id]/page.tsx
'use client';
import React from 'react'; // Make sure React is imported for React.use
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { Employee } from '@/types/employee';
import Link from 'next/link';
import '../../../../styles/employee-edit.css'; // Reusing the same CSS file for form styles

// Extend Employee to include the 'id' when fetching for internal use
interface EditableEmployee extends Omit<Employee, 'createdAt' | 'updatedAt'> {
  id: string; // The Firestore document ID
}

// Next.js App Router passes dynamic segments as 'params' prop
// FIX: Revert params type back to Promise<{ id: string }> to satisfy Next.js's internal types
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  // FIX: Use React.use to unwrap the promise type for params
  const { id } = React.use(params); 

  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  // All useState declarations must come first
  const [employee, setEmployee] = useState<EditableEmployee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Effect to fetch employee data when the component mounts or ID/auth status changes
  useEffect(() => {
    // Only proceed if ID is available and auth loading is complete
    // We explicitly check if authLoading is false and currentUser is available
    // because if authLoading is true, it means we're still waiting for user session.
    // If authLoading is false but currentUser is null, the redirect will handle it later.
    if (!id || authLoading) return;

    const fetchEmployee = async () => {
      try {
        const docRef = doc(db, 'employees', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Ensure baseSalary is treated as a number
          const baseSalaryValue = typeof data.baseSalary === 'string' ? parseFloat(data.baseSalary) : data.baseSalary;
          const parsedBaseSalary = isNaN(baseSalaryValue) ? 0 : baseSalaryValue; // Default to 0 if NaN

          setEmployee({
            id: docSnap.id,
            employeeId: data.employeeId || '',
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phone: data.phone || null,
            address: data.address || null,
            position: data.position || '',
            department: data.department || '',
            hireDate: data.hireDate || '',
            baseSalary: parsedBaseSalary, // Use the parsed value
            status: data.status || 'active',
            designation: data.designation || '',
            bankAccountNumber: data.bankAccountNumber || '',
            ifscCode: data.ifscCode || '',
            panNumber: data.panNumber || '',
            joiningDate: data.joiningDate || '',
            aadhaarNumber: data.aadhaarNumber || '',
          } as EditableEmployee);
        } else {
          setError("Employee not found.");
        }
      } catch (err: unknown) { // Changed 'any' to 'unknown'
        if (err instanceof Error) {
          setError(`Error fetching employee: ${err.message}`);
        } else {
          setError('An unknown error occurred while fetching the employee.');
        }
        console.error('Error fetching employee:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployee();
  }, [id, authLoading]); // Dependencies: re-run if id or authLoading changes

  // Conditional render for authentication (This must come AFTER all hook calls)
  if (!authLoading && !currentUser) {
    router.push('/login');
    return null; // Don't render anything if redirecting
  }

  // Handle input changes in the form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEmployee(prev => {
      if (!prev) return null;

      // Handle baseSalary as number, others as string
      return {
        ...prev,
        [name]: name === 'baseSalary' ? parseFloat(value) : value,
      };
    });
  };

  // Handle form submission for updating
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    if (!employee) {
      setError('Employee data not loaded. Cannot submit.');
      setIsSubmitting(false);
      return;
    }

    // Basic validation before submitting
    if (!employee.employeeId || !employee.firstName || !employee.lastName || !employee.email || !employee.designation ||
        typeof employee.baseSalary !== 'number' || isNaN(employee.baseSalary) || employee.baseSalary < 0 || // Ensure salary is valid number
        !employee.bankAccountNumber || !employee.ifscCode || !employee.panNumber || !employee.joiningDate || !employee.position || !employee.department || !employee.hireDate || !employee.status)
    {
      setError('Please fill in all required fields and ensure salary is a valid number.');
      setIsSubmitting(false);
      return;
    }

    try {
      const docRef = doc(db, 'employees', id);
      // Omit 'id' and potential other client-side only properties before updating
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _employeeDocId, ...employeeDataToUpdate } = employee;

      await updateDoc(docRef, {
        ...employeeDataToUpdate,
        updatedAt: serverTimestamp(),
      });
      setSuccess('Employee updated successfully!');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`Error updating employee: ${err.message}`);
      } else {
        setError('An unknown error occurred while updating the employee.');
      }
      console.error('Error updating employee:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Display loading state while fetching data
  if (authLoading || isLoading) {
    return (
      <div className="add-employee-page-container loading-state">
        <p>Loading employee data...</p>
      </div>
    );
  }

  // Display error if fetching failed or employee not found after loading
  if (error) {
    return (
      <div className="add-employee-page-container error-state">
        <p>{error}</p>
        <Link href="/employees" className="back-link">
          Back to Employee List
        </Link>
      </div>
    );
  }

  // If employee is null (e.g., ID was invalid after loading, or no error but no data), show 'not found'
  if (!employee) {
    return (
      <div className="add-employee-page-container error-state">
        <p>Employee data could not be loaded or was not found.</p>
        <Link href="/employees" className="back-link">
          Back to Employee List
        </Link>
      </div>
    );
  }

  // Render the edit form
  return (
    <div className="add-employee-page-container">
      <div className="employee-form-card">
        <h2 className="form-title">Edit Employee: {employee.firstName} {employee.lastName}</h2>

        {error && <p className="status-message error-message">{error}</p>}
        {success && <p className="status-message success-message">{success}</p>}

        <form onSubmit={handleSubmit} className="employee-form">
          <div className="form-grid">
            {/* Employee ID - Read-only */}
            <div className="form-group">
              <label htmlFor="employeeId" className="form-label">Employee ID</label>
              <input type="text" id="employeeId" name="employeeId" value={employee.employeeId} readOnly className="form-input read-only-input" />
            </div>
            {/* First Name */}
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">First Name <span className="required-asterisk">*</span></label>
              <input type="text" id="firstName" name="firstName" value={employee.firstName} onChange={handleChange} required className="form-input" />
            </div>
            {/* Last Name */}
            <div className="form-group">
              <label htmlFor="lastName" className="form-label">Last Name <span className="required-asterisk">*</span></label>
              <input type="text" id="lastName" name="lastName" value={employee.lastName} onChange={handleChange} required className="form-input" />
            </div>
            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email <span className="required-asterisk">*</span></label>
              <input type="email" id="email" name="email" value={employee.email} onChange={handleChange} required className="form-input" />
            </div>
            {/* Phone Number */}
            <div className="form-group">
              <label htmlFor="phone" className="form-label">Phone Number</label>
              <input type="tel" id="phone" name="phone" value={employee.phone || ''} onChange={handleChange} className="form-input" />
            </div>
            {/* Designation */}
            <div className="form-group">
              <label htmlFor="designation" className="form-label">Designation <span className="required-asterisk">*</span></label>
              <input type="text" id="designation" name="designation" value={employee.designation} onChange={handleChange} required className="form-input" />
            </div>
            {/* Base Salary */}
            <div className="form-group">
              <label htmlFor="baseSalary" className="form-label">Base Salary (INR) <span className="required-asterisk">*</span></label>
              <input type="number" id="baseSalary" name="baseSalary" value={employee.baseSalary} onChange={handleChange} required className="form-input" />
            </div>
            {/* Bank Account Number */}
            <div className="form-group">
              <label htmlFor="bankAccountNumber" className="form-label">Bank Account Number <span className="required-asterisk">*</span></label>
              <input type="text" id="bankAccountNumber" name="bankAccountNumber" value={employee.bankAccountNumber} onChange={handleChange} required className="form-input" />
            </div>
            {/* IFSC Code */}
            <div className="form-group">
              <label htmlFor="ifscCode" className="form-label">IFSC Code <span className="required-asterisk">*</span></label>
              <input type="text" id="ifscCode" name="ifscCode" value={employee.ifscCode} onChange={handleChange} required className="form-input" />
            </div>
            {/* PAN Number */}
            <div className="form-group">
              <label htmlFor="panNumber" className="form-label">PAN Number <span className="required-asterisk">*</span></label>
              <input type="text" id="panNumber" name="panNumber" value={employee.panNumber} onChange={handleChange} required className="form-input" />
            </div>
            {/* Aadhaar Number */}
            <div className="form-group">
              <label htmlFor="aadhaarNumber" className="form-label">Aadhaar Number</label>
              <input type="text" id="aadhaarNumber" name="aadhaarNumber" value={employee.aadhaarNumber || ''} onChange={handleChange} className="form-input" />
            </div>
            {/* Joining Date */}
            <div className="form-group">
              <label htmlFor="joiningDate" className="form-label">Joining Date <span className="required-asterisk">*</span></label>
              <input type="date" id="joiningDate" name="joiningDate" value={employee.joiningDate} onChange={handleChange} required className="form-input" />
            </div>
            {/* Status dropdown */}
            <div className="form-group">
              <label htmlFor="status" className="form-label">Status <span className="required-asterisk">*</span></label>
                <select id="status" name="status" value={employee.status} onChange={handleChange} required className="form-input">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>
            {/* Position */}
            <div className="form-group">
                <label htmlFor="position" className="form-label">Position <span className="required-asterisk">*</span></label>
                <input type="text" id="position" name="position" value={employee.position} onChange={handleChange} required className="form-input" />
            </div>
            {/* Department */}
            <div className="form-group">
                <label htmlFor="department" className="form-label">Department <span className="required-asterisk">*</span></label>
                <input type="text" id="department" name="department" value={employee.department} onChange={handleChange} required className="form-input" />
            </div>
            {/* Hire Date */}
            <div className="form-group">
                <label htmlFor="hireDate" className="form-label">Hire Date <span className="required-asterisk">*</span></label>
                <input type="date" id="hireDate" name="hireDate" value={employee.hireDate} onChange={handleChange} required className="form-input" />
            </div>
          </div>
          {/* Address (full width) */}
          <div className="form-group full-width">
            <label htmlFor="address" className="form-label">Address</label>
            <textarea id="address" name="address" value={employee.address || ''} onChange={handleChange} rows={3} className="form-input"></textarea>
          </div>

          {/* Action buttons */}
          <div className="form-actions-edit">
            <Link href="/employees" className="back-link">
              Back to Employee List
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`submit-button update-button ${isSubmitting ? 'disabled-button' : ''}`}
            >
              {isSubmitting ? 'Updating Employee...' : 'Update Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}