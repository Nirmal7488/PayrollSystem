// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '../styles/navbar.css'; // <--- NEW: Import the new navbar CSS
import { AuthProvider } from '@/lib/AuthContext';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Payroll Management System',
  description: 'Manage employees and payroll efficiently.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {/* --- START NAVIGATION BAR (Updated with semantic classes) --- */}
          <nav className="navbar">
            <div className="navbar-container">
              <Link href="/" className="navbar-brand">
                PayrollPro
              </Link>
              <div className="navbar-links">
                <Link href="/employees" className="nav-link">
                  Employees
                </Link>
                <Link href="/attendance" className="nav-link">
                  Attendance
                </Link>
                <Link href="/payroll" className="nav-link">
                  Payroll
                </Link>
                {/* Add more navigation links here as you build more features */}
              </div>
            </div>
          </nav>
          {/* --- END NAVIGATION BAR --- */}

          <main>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}