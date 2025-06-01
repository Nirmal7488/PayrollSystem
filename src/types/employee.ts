// src/types/employee.ts
import { FieldValue, Timestamp } from 'firebase/firestore';

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  position: string;
  department: string;
  hireDate: string; // YYYY-MM-DD
  baseSalary: number;
  status: 'active' | 'inactive';
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;

  designation: string;
  bankAccountNumber: string;
  ifscCode: string;
  panNumber: string;
  joiningDate: string; // YYYY-MM-DD

  // --- ADD THIS NEW FIELD ---
  aadhaarNumber: string; // Assuming it's a required string
  // --- END NEW FIELD ---
}