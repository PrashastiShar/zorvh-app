'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Update import path to use the alias, and destructure new context functions
import { useFirebase, APP_ID } from '@/components/FirebaseProvider';
// Remove direct Firebase Auth/Firestore SDK imports, as functions are now from context
// import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'; // REMOVE
// import { getFirestore, doc, setDoc } from 'firebase/firestore'; // REMOVE

export default function LoginPage() {
  const router = useRouter();
  // Destructure login and register functions from useFirebase context
  const { currentUser, loadingFirebase, userId, login, register } = useFirebase();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false); // This local loading state is good for form submission

  useEffect(() => {
    // If Firebase is loaded and a user is already authenticated,
    // replace the current history entry with the dashboard page.
    if (!loadingFirebase && currentUser) {
      router.replace('/dashboard');
    }
  }, [currentUser, loadingFirebase, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Start local loading state
    setMessage(''); // Clear previous messages
    try {
      // Use the login function provided by useFirebase context
      const user = await login(email, password);
      if (user) { // Ensure user is not null from the promise
        setMessage('Login successful!');
        router.replace('/dashboard');
      } else {
        setMessage('Login failed. No user object returned.');
      }
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = 'Login failed. Please check your credentials.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No user found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format.';
      }
      setMessage(errorMessage);
    } finally {
      setLoading(false); // End local loading state
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Start local loading state
    setMessage(''); // Clear previous messages
    try {
      // Use the register function provided by useFirebase context
      const user = await register(email, password);

      if (user) { // Ensure user is not null from the promise
        setMessage('Registration successful! You are now logged in.');
        router.replace('/dashboard');
      } else {
        setMessage('Registration failed. No user object returned.');
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      let errorMessage = 'Registration failed.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format.';
      }
      setMessage(errorMessage);
    } finally {
      setLoading(false); // End local loading state
    }
  };

  if (loadingFirebase) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-void-black"> {/* Consistent background */}
        <div className="text-xl font-semibold text-white">Loading Firebase...</div> {/* Consistent text color */}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-void-black text-white p-4 font-inter pt-20"> {/* Added pt-20 */}
      <div className="culture-card p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-treasure-gold mb-8 animate-fade-in-up">User Login</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-white/80 mb-1">Email</label>
            <input
              type="email"
              id="email"
              className="w-full bg-gray-800/50 border border-treasure-gold/30 px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-treasure-gold"
              placeholder="your@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-white/80 mb-1">Password</label>
            <input
              type="password"
              id="password"
              className="w-full bg-gray-800/50 border border-treasure-gold/30 px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-treasure-gold"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {message && (
            <p className={`text-center text-sm ${message.includes('successful') ? 'text-green-300' : 'text-red-300'} font-medium`}>
              {message}
            </p>
          )}
          <button
            type="submit"
            className="w-full py-3 bg-treasure-gold text-black font-bold rounded-lg hover:bg-amber-500 transition-colors shadow-lg disabled:opacity-70"
            disabled={loading}
          >
            {loading ? 'Logging In...' : 'Login'}
          </button>
          <button
            type="button" // Important: set to type="button" to prevent form submission
            onClick={handleRegister}
            className="w-full py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors shadow-lg disabled:opacity-70"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        {userId && (
          <p className="text-sm text-white/60 text-center mt-6">
            Current User ID: <span className="font-mono break-all">{userId}</span>
          </p>
        )}
      </div>
    </div>
  );
}