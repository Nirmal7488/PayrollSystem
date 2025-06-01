// src/app/employees/add/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { Employee } from '@/types/employee'; // Import the Employee interface
import Link from 'next/link';
import '../../../styles/employee-form.css'; // <-- Import your new CSS file here

export default function AddEmployeePage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [employeeId, setEmployeeId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  // --- NEW FIELDS STATE ---
  const [designation, setDesignation] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  // --- END NEW FIELDS STATE ---

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEmployeeIdUnique, setIsEmployeeIdUnique] = useState<boolean | null>(null);

  // Redirect if not authenticated
  if (!authLoading && !currentUser) {
    router.push('/login');
    return null;
  }

  // Effect for Employee ID uniqueness check (debounced)
  useEffect(() => {
    const checkUniqueness = async () => {
      if (!employeeId.trim()) {
        setIsEmployeeIdUnique(null);
        return;
      }
      try {
        const employeesRef = collection(db, 'employees');
        const q = query(employeesRef, where('employeeId', '==', employeeId.trim()));
        const querySnapshot = await getDocs(q);
        setIsEmployeeIdUnique(querySnapshot.empty);
      } catch (err) {
        console.error("Error checking employee ID uniqueness:", err);
        setIsEmployeeIdUnique(false);
      }
    };

    const timer = setTimeout(() => {
      checkUniqueness();
    }, 500);

    return () => clearTimeout(timer);
  }, [employeeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (isEmployeeIdUnique === false) { // Check if it's explicitly false
      setError('Employee ID must be unique.');
      setIsLoading(false);
      return;
    }

    try {
      const newEmployee: Omit<Employee, 'id'> = {
        employeeId: employeeId.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        position: position.trim(),
        department: department.trim(),
        hireDate: hireDate,
        baseSalary: parseFloat(baseSalary),
        status: status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        designation: designation.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        ifscCode: ifscCode.trim(),
        panNumber: panNumber.trim(),
        joiningDate: joiningDate,
        aadhaarNumber: aadhaarNumber.trim(),
      };

      await addDoc(collection(db, 'employees'), newEmployee);
      setSuccess('Employee added successfully!');
      // Clear form
      setEmployeeId('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setPosition('');
      setDepartment('');
      setHireDate('');
      setBaseSalary('');
      setStatus('active');
      setDesignation('');
      setBankAccountNumber('');
      setIfscCode('');
      setPanNumber('');
      setJoiningDate('');
      setAadhaarNumber('');
      setIsEmployeeIdUnique(null);

    } catch (err: any) {
      setError(`Error adding employee: ${err.message}`);
      console.error('Error adding employee:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="add-employee-page-container loading-state">
        <p>Loading user session...</p>
      </div>
    );
  }

  return (
    <div className="add-employee-page-container">
      <div className="employee-form-card">
        <h2 className="form-title">Add New Employee</h2>

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
                className={`form-input ${isEmployeeIdUnique === false ? 'input-error-border' : ''}`}
              />
              {isEmployeeIdUnique === false && (
                <p className="input-validation-message error-message-small">Employee ID already exists.</p>
              )}
            </div>

            {/* First Name */}
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">First Name <span className="required-asterisk">*</span></label>
              <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="form-input" />
            </div>

            {/* Last Name */}
            <div className="form-group">
              <label htmlFor="lastName" className="form-label">Last Name <span className="required-asterisk">*</span></label>
              <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="form-input" />
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email <span className="required-asterisk">*</span></label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="form-input" />
            </div>

            {/* Phone */}
            <div className="form-group">
              <label htmlFor="phone" className="form-label">Phone</label>
              <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="form-input" />
            </div>

            {/* Address */}
            <div className="form-group full-width"> {/* Added full-width for textarea */}
              <label htmlFor="address" className="form-label">Address</label>
              <textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="form-input"></textarea>
            </div>

            {/* Position */}
            <div className="form-group">
              <label htmlFor="position" className="form-label">Position <span className="required-asterisk">*</span></label>
              <input type="text" id="position" value={position} onChange={(e) => setPosition(e.target.value)} required className="form-input" />
            </div>

            {/* Department */}
            <div className="form-group">
              <label htmlFor="department" className="form-label">Department <span className="required-asterisk">*</span></label>
              <input type="text" id="department" value={department} onChange={(e) => setDepartment(e.target.value)} required className="form-input" />
            </div>

            {/* Hire Date */}
            <div className="form-group">
              <label htmlFor="hireDate" className="form-label">Hire Date <span className="required-asterisk">*</span></label>
              <input type="date" id="hireDate" value={hireDate} onChange={(e) => setHireDate(e.target.value)} required className="form-input" />
            </div>

            {/* Base Salary */}
            <div className="form-group">
              <label htmlFor="baseSalary" className="form-label">Base Salary <span className="required-asterisk">*</span></label>
              <input type="number" id="baseSalary" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} required step="0.01" className="form-input" />
            </div>

            {/* Designation - NEW FIELD */}
            <div className="form-group">
              <label htmlFor="designation" className="form-label">Designation <span className="required-asterisk">*</span></label>
              <input type="text" id="designation" value={designation} onChange={(e) => setDesignation(e.target.value)} required className="form-input" />
            </div>

            {/* Bank Account Number - NEW FIELD */}
            <div className="form-group">
              <label htmlFor="bankAccountNumber" className="form-label">Bank Account Number <span className="required-asterisk">*</span></label>
              <input type="text" id="bankAccountNumber" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} required className="form-input" />
            </div>

            {/* IFSC Code - NEW FIELD */}
            <div className="form-group">
              <label htmlFor="ifscCode" className="form-label">IFSC Code <span className="required-asterisk">*</span></label>
              <input type="text" id="ifscCode" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} required className="form-input" />
            </div>

            {/* PAN Number - NEW FIELD */}
            <div className="form-group">
              <label htmlFor="panNumber" className="form-label">PAN Number <span className="required-asterisk">*</span></label>
              <input type="text" id="panNumber" value={panNumber} onChange={(e) => setPanNumber(e.target.value)} required className="form-input" />
            </div>

            {/* Joining Date - NEW FIELD */}
            <div className="form-group">
              <label htmlFor="joiningDate" className="form-label">Joining Date <span className="required-asterisk">*</span></label>
              <input type="date" id="joiningDate" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} required className="form-input" />
            </div>

            {/* Aadhaar Number - NEW FIELD */}
            <div className="form-group">
              <label htmlFor="aadhaarNumber" className="form-label">Aadhaar Number <span className="required-asterisk">*</span></label>
              <input type="text" id="aadhaarNumber" value={aadhaarNumber} onChange={(e) => setAadhaarNumber(e.target.value)} required className="form-input" />
            </div>

            {/* Status (hidden/default for Add) */}
            <input type="hidden" value={status} />

          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={isLoading || isEmployeeIdUnique === false}
              className={`submit-button ${isLoading || isEmployeeIdUnique === false ? 'disabled-button' : ''}`}
            >
              {isLoading ? 'Adding...' : 'Add Employee'}
            </button>
          </div>
        </form>

        <div className="back-link-container">
          <Link href="/employees" className="back-link">
            Back to Employee List
          </Link>
        </div>
      </div>
    </div>
  );
}