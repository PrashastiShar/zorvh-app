'use client';

import React, { useState } from 'react';

const BACKEND_URL = 'http://localhost:4000'; // Your NestJS backend URL

export default function AuthTestPage() {
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });
  const [registerMessage, setRegisterMessage] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle changes for both forms
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
  };

  // --- Registration ---
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRegisterMessage('');
    try {
      const response = await fetch(`${BACKEND_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerForm),
      });

      const data = await response.json();

      if (response.ok) {
        setRegisterMessage('Registration successful! You can now log in.');
        setRegisterForm({ email: '', password: '', firstName: '', lastName: '' }); // Clear form
        console.log('Registration success:', data);
      } else {
        setRegisterMessage(`Registration failed: ${data.message || 'Unknown error'}`);
        console.error('Registration error:', data);
      }
    } catch (error: any) {
      setRegisterMessage(`Network error during registration: ${error.message}`);
      console.error('Registration network error:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Login ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginMessage('');
    setAccessToken('');
    setProfileMessage('');
    try {
      const response = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();

      if (response.ok) {
        setLoginMessage('Login successful!');
        setAccessToken(data.access_token);
        console.log('Login success:', data);
      } else {
        setLoginMessage(`Login failed: ${data.message || 'Invalid credentials'}`);
        console.error('Login error:', data);
      }
    } catch (error: any) {
      setLoginMessage(`Network error during login: ${error.message}`);
      console.error('Login network error:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Get Profile (Protected Route) ---
  const handleGetProfile = async () => {
    setLoading(true);
    setProfileMessage('');
    try {
      if (!accessToken) {
        setProfileMessage('Please log in first to get profile.');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/users/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`, // Send JWT token
        },
      });

      const data = await response.json();

      if (response.ok) {
        setProfileMessage(`Profile: ${JSON.stringify(data, null, 2)}`);
        console.log('Profile data:', data);
      } else {
        setProfileMessage(`Failed to get profile: ${data.message || 'Unauthorized'}`);
        console.error('Get profile error:', data);
      }
    } catch (error: any) {
      setProfileMessage(`Network error getting profile: ${error.message}`);
      console.error('Get profile network error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-400">Backend Auth Test</h1>

        {/* Registration Section */}
        <div className="mb-12 border-b border-gray-700 pb-8">
          <h2 className="text-2xl font-semibold mb-6 text-green-400">Register New User</h2>
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">Email</label>
              <input
                type="email"
                name="email"
                value={registerForm.email}
                onChange={handleRegisterChange}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Password (min 6 chars)</label>
              <input
                type="password"
                name="password"
                value={registerForm.password}
                onChange={handleRegisterChange}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">First Name</label>
              <input
                type="text"
                name="firstName"
                value={registerForm.firstName}
                onChange={handleRegisterChange}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={registerForm.lastName}
                onChange={handleRegisterChange}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
          {registerMessage && (
            <p className={`mt-4 text-center ${registerMessage.includes('successful') ? 'text-green-500' : 'text-red-500'}`}>
              {registerMessage}
            </p>
          )}
        </div>

        {/* Login Section */}
        <div className="mb-12 border-b border-gray-700 pb-8">
          <h2 className="text-2xl font-semibold mb-6 text-yellow-400">Login</h2>
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">Email</label>
              <input
                type="email"
                name="email"
                value={loginForm.email}
                onChange={handleLoginChange}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Password</label>
              <input
                type="password"
                name="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          {loginMessage && (
            <p className={`mt-4 text-center ${loginMessage.includes('successful') ? 'text-green-500' : 'text-red-500'}`}>
              {loginMessage}
            </p>
          )}
          {accessToken && (
            <div className="mt-4 p-3 bg-gray-700 rounded-md break-all">
              <p className="font-semibold text-blue-300">Access Token (copy this!):</p>
              <p className="text-sm">{accessToken}</p>
            </div>
          )}
        </div>

        {/* Get Profile Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-purple-400">Get User Profile (Protected)</h2>
          <button
            onClick={handleGetProfile}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            disabled={loading}
          >
            {loading ? 'Fetching Profile...' : 'Get Profile'}
          </button>
          {profileMessage && (
            <p className="mt-4 p-3 bg-gray-700 rounded-md text-sm whitespace-pre-wrap break-words">
              {profileMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
