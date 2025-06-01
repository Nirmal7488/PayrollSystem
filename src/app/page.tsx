// src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import '../styles/homepage.css'; // Your global CSS import

export default function HomePage() {
  const { currentUser, loading, logout } = useAuth(); // Destructure logout from useAuth
  const router = useRouter();

  // Redirect to login if not authenticated and not loading
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  // Handle logout function
  const handleLogout = async () => {
    try {
      await logout(); // Call the logout function from your AuthContext
      router.push('/login'); // Redirect to login page after successful logout
    } catch (error: any) {
      console.error("Error logging out:", error);
      alert(`Failed to logout: ${error.message}`); // Simple alert for now
    }
  };

  // Show loading state while authentication is in progress
  if (loading) {
    return (
      <div className="page-container loading-state"> {/* Added loading-state class for styling */}
        <p>Loading user session...</p>
      </div>
    );
  }

  // If authenticated, display the dashboard content
  if (currentUser) {
    return (
      <div className="homepage-wrapper"> {/* New wrapper for header, main, footer */}
        <header className="app-header">
          <div className="app-logo">
            <h1 className="header-title">PayrollPro!</h1>
          </div>
          <nav className="header-nav">
            {/* Optional: Add other main navigation links here if desired */}
            {/* <Link href="/dashboard" className="nav-link">Dashboard</Link> */}
            {currentUser && (
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            )}
          </nav>
        </header>

        <main className="main-content-area"> {/* Main content area */}
          <div className="card"> {/* Your existing card for modules */}
            <h1 className="title">Welcome to <span className="title-highlight">PayrollPro!</span></h1>
            <p className="subtitle">Your streamlined solution for efficient and effortless payroll management.</p>

            <div className="grid">
              <Link href="/employees" className="card-link blue">
                <h2 className="card-title">Manage Employees</h2>
                <p className="card-description">View, add, edit, and deactivate employee records.</p>
              </Link>

              <Link href="/attendance" className="card-link green">
                <h2 className="card-title">Manage Attendance</h2>
                <p className="card-description">Add and view daily attendance records for accurate tracking.</p>
              </Link>

              <Link href="/payroll" className="card-link purple">
                <h2 className="card-title">Payroll Processing</h2>
                <p className="card-description">Calculate and generate payrolls.</p>
              </Link>
            </div>

            <p className="footer-text-card">Logged in as: <span className="footer-email">{currentUser.email}</span></p> {/* Renamed class to avoid confusion with actual page footer */}
          </div>
        </main>

        <footer className="app-footer">
          <p>&copy; {new Date().getFullYear()} PayrollPro. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  return null;
}