// src/app/signup/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import Link from 'next/link';
import '../../styles/signup.css'; // <-- Import your new signup.css here

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/'); // Redirect to homepage on successful signup
    } catch (err: unknown) { // FIX: Changed 'any' to 'unknown'
      if (err instanceof Error) { // FIX: Added type guard
        setError(err.message);
      } else {
        setError('An unknown error occurred during signup.');
      }
      console.error('Signup error:', err);
    }
  };

  return (
    <div className="signup-page-container">
      <div className="signup-card">
        <h2 className="signup-title">Sign Up</h2>
        {error && <p className="error-message">{error}</p>} {/* Reusing error-message class */}
        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group"> {/* Reusing form-group */}
            <label htmlFor="email" className="form-label">Email</label> {/* Reusing form-label */}
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input" /* Reusing form-input */
            />
          </div>
          <div className="form-group"> {/* Reusing form-group */}
            <label htmlFor="password" className="form-label">Password</label> {/* Reusing form-label */}
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input" /* Reusing form-input */
            />
          </div>
          <button
            type="submit"
            className="submit-button green-button" /* Reusing submit-button, adding green-button modifier */
          >
            Sign Up
          </button>
        </form>
        <p className="login-text">
          Already have an account? <Link href="/login" className="login-link">Login</Link> {/* Semantic class for signup link */}
        </p>
      </div>
    </div>
  );
}