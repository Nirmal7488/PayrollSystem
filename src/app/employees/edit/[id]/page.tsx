// src/app/employees/edit/[id]/page.tsx
'use client';
import React from 'react';
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
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);

  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [employee, setEmployee] = useState<EditableEmployee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not authenticated (combining auth loading and actual auth status)
  if (!authLoading && !currentUser) {
    router.push('/login');
    return null;
  }

  // Effect to fetch employee data when the component mounts or ID/auth status changes
  useEffect(() => {
    if (!id || authLoading) return;

    const fetchEmployee = async () => {
      try {
        const docRef = doc(db, 'employees', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
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
            baseSalary: typeof data.baseSalary === 'string' ? parseFloat(data.baseSalary) : data.baseSalary || 0,
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
      } catch (err: any) {
        setError(`Error fetching employee: ${err.message}`);
        console.error('Error fetching employee:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployee();
  }, [id, authLoading]);

  // Handle input changes in the form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEmployee(prev => {
      if (!prev) return null;

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
    if (!employee.employeeId || !employee.firstName || !employee.lastName || !employee.email || !employee.designation || typeof employee.baseSalary !== 'number' || isNaN(employee.baseSalary) || !employee.bankAccountNumber || !employee.ifscCode || !employee.panNumber || !employee.joiningDate) {
        setError('Please fill in all required fields and ensure salary is a number.');
        setIsSubmitting(false);
        return;
    }

    try {
      const docRef = doc(db, 'employees', id);
      await updateDoc(docRef, {
        ...employee,
        updatedAt: serverTimestamp(),
      });
      setSuccess('Employee updated successfully!');
    } catch (err: any) {
      setError(`Error updating employee: ${err.message}`);
      console.error('Error updating employee:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Display loading state while fetching data
  if (authLoading || isLoading) {
    return (
      <div className="add-employee-page-container loading-state"> {/* Reusing loading state class */}
        <p>Loading employee data...</p>
      </div>
    );
  }

  // Display error if fetching failed
  if (error && !employee) { // Only show full error if no employee loaded
    return (
      <div className="add-employee-page-container error-state"> {/* Reusing error state class */}
        <p>{error}</p>
      </div>
    );
  }

  // If employee is null (e.g., ID was invalid after loading), show 'not found'
  if (!employee) {
    return (
      <div className="add-employee-page-container error-state"> {/* Reusing error state class */}
        <p>Employee not found.</p>
      </div>
    );
  }

  // Render the edit form
  return (
    <div className="add-employee-page-container"> {/* Reusing general container class */}
      <div className="employee-form-card"> {/* Reusing form card class */}
        <h2 className="form-title">Edit Employee: {employee.firstName} {employee.lastName}</h2> {/* Reusing form title class */}

        {error && <p className="status-message error-message">{error}</p>} {/* Reusing status message classes */}
        {success && <p className="status-message success-message">{success}</p>}

        <form onSubmit={handleSubmit} className="employee-form"> {/* Reusing form class */}
          <div className="form-grid"> {/* Reusing form grid class */}
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
          </div>
          {/* Address (full width) */}
          <div className="form-group full-width"> {/* Reusing full-width class */}
            <label htmlFor="address" className="form-label">Address</label>
            <textarea id="address" name="address" value={employee.address || ''} onChange={handleChange} rows={3} className="form-input"></textarea>
          </div>

          {/* Action buttons */}
          <div className="form-actions-edit"> {/* New class for edit page actions */}
            <Link href="/employees" className="back-link"> {/* Reusing back-link class */}
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