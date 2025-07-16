'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import { useFirebase, APP_ID } from '@/components/FirebaseProvider';
import { doc, getDoc, setDoc, updateDoc, DocumentData, onSnapshot } from 'firebase/firestore'; // Added onSnapshot
import { updateProfile, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail } from 'firebase/auth'; // Added sendPasswordResetEmail

interface UserProfile {
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  isAdmin: boolean; // From Firestore profile, not editable by user directly
  createdAt: Date;
  email: string; // Stored in Firestore profile for redundancy/lookup
  // Add any other custom fields you store in the user's profile document
}

export default function DashboardAccountPage() {
  const router = useRouter();
  const { currentUser, loadingFirebase, isAuthReady, db, auth, logout } = useFirebase();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [reauthPassword, setReauthPassword] = useState<string>('');
  const [showReauthModal, setShowReauthModal] = useState<boolean>(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');

  useEffect(() => {
    // Redirect if not authenticated after auth state is ready
    if (isAuthReady && !currentUser) {
      router.push('/login');
    }
  }, [isAuthReady, currentUser, router]);

  // Fetch user profile data from Firestore
  useEffect(() => {
    if (!db || !currentUser?.uid || !isAuthReady) {
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);
    setMessage(null);

    const userDocRef = doc(db, `artifacts/${APP_ID}/users/${currentUser.uid}/user_data/profile`);

    const unsubscribe = onSnapshot(userDocRef, (docSnap: DocumentData) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfileData({
          name: data.name || currentUser?.displayName || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zip: data.zip || '',
          isAdmin: data.isAdmin || false,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          email: data.email || currentUser?.email || '', // Prefer Firestore email, fallback to Auth email
        });
      } else {
        // If profile document doesn't exist, create a basic one
        console.log("User profile document not found, creating default.");
        setDoc(userDocRef, {
          name: currentUser.displayName || '',
          email: currentUser.email || '',
          isAdmin: false,
          createdAt: new Date(),
        }, { merge: true }).then(() => {
          setProfileData({
            name: currentUser.displayName || '',
            email: currentUser.email || '',
            isAdmin: false,
            createdAt: new Date(),
          });
        }).catch((e: any) => console.error("Error creating default profile:", e)); // Explicitly type 'e' as any
      }
      setLoadingProfile(false);
    }, (error: any) => { // Explicitly type 'error' as any
      console.error("Error fetching user profile:", error);
      setMessage('Failed to load profile. Please try again.');
      setLoadingProfile(false);
    });

    return () => unsubscribe(); // Cleanup listener
  }, [db, currentUser, isAuthReady, APP_ID]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !db || !profileData || isSaving) return;

    setIsSaving(true);
    setMessage(null);

    try {
      // 1. Update Firebase Auth profile (display name)
      if (currentUser.displayName !== profileData.name) {
        await updateProfile(currentUser, { displayName: profileData.name });
        console.log("Firebase Auth display name updated.");
      }

      // 2. Update Firestore profile document (custom fields)
      const userDocRef = doc(db, `artifacts/${APP_ID}/users/${currentUser.uid}/user_data/profile`);
      await updateDoc(userDocRef, {
        name: profileData.name,
        phone: profileData.phone || null,
        address: profileData.address || null,
        city: profileData.city || null,
        state: profileData.state || null,
        zip: profileData.zip || null,
        email: profileData.email, // Keep Firestore email in sync
      });
      console.log("Firestore profile updated.");

      setMessage('Profile updated successfully!');
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setMessage(`Failed to update profile: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailChangeRequest = async () => {
    if (!currentUser || !auth || isSaving || !profileData?.email) return;
    if (profileData.email === currentUser.email) {
      setMessage('New email is the same as current email.');
      return;
    }
    setPendingEmail(profileData.email); // Store the new email temporarily
    setShowReauthModal(true); // Show re-authentication modal
  };

  const handlePasswordChangeRequest = async () => {
    if (!currentUser || !auth || isSaving || !newPassword) return;
    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long.');
      return;
    }
    setShowReauthModal(true); // Show re-authentication modal
  };

  const handleReauthenticate = async () => {
    if (!auth || !currentUser || !reauthPassword || isSaving) return;
    setIsSaving(true);
    setMessage(null);

    try {
      const credential = EmailAuthProvider.credential(currentUser.email!, reauthPassword);
      await reauthenticateWithCredential(currentUser, credential);
      console.log("User re-authenticated successfully.");

      if (pendingEmail) {
        await updateEmail(currentUser, pendingEmail);
        // Also update the email in Firestore profile
        const userDocRef = doc(db!, `artifacts/${APP_ID}/users/${currentUser.uid}/user_data/profile`);
        await updateDoc(userDocRef, { email: pendingEmail });
        setMessage('Email updated successfully! Please log in with your new email.');
        await logout(); // Force logout so user logs in with new email
      } else if (newPassword) {
        await updatePassword(currentUser, newPassword);
        setMessage('Password updated successfully! Please log in with your new password.');
        await logout(); // Force logout to apply new password
      }
    } catch (err: any) {
      console.error("Re-authentication or update failed:", err);
      setMessage(`Re-authentication failed: ${err.message}. Please try again.`);
    } finally {
      setIsSaving(false);
      setShowReauthModal(false);
      setReauthPassword('');
      setPendingEmail(null);
      setNewPassword('');
    }
  };

  // NEW: Handle Forgot Password
  const handleForgotPassword = async () => {
    if (!auth) {
      setMessage('Firebase Auth not initialized.');
      return;
    }
    setMessage(null);
    const emailToReset = prompt('Please enter your email address to reset your password:');

    if (emailToReset) {
      try {
        await sendPasswordResetEmail(auth, emailToReset);
        alert('Password reset email sent! Please check your inbox.'); // Use alert as per instructions
      } catch (error: any) {
        console.error("Error sending password reset email:", error);
        alert(`Failed to send password reset email: ${error.message}`); // Use alert as per instructions
      }
    } else {
      setMessage('Password reset cancelled.');
    }
  };

  if (!isAuthReady || loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-void-black text-white text-2xl">
        {loadingFirebase ? 'Loading Firebase...' : 'Loading Profile...'}
      </div>
    );
  }

  if (!currentUser || !profileData) {
    return null; // Should redirect or show error if profileData is null unexpectedly
  }

  return (
    <div className="min-h-screen bg-void-black text-white font-inter relative overflow-x-hidden">
      <Header />
      <div className="p-6 pt-20">
        <div className="max-w-3xl mx-auto culture-card p-8 rounded-xl shadow-lg">
          <h2 className="text-3xl font-bold text-center text-treasure-gold mb-8">Manage Your Account</h2>

          {message && (
            <p className={`text-center text-sm ${message.includes('success') ? 'text-green-300' : 'text-red-300'} font-medium mb-4`}>
              {message}
            </p>
          )}

          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <h3 className="text-xl font-semibold text-treasure-gold mb-4">Personal Information</h3>
            <div>
              <label htmlFor="name" className="block mb-2 text-white/80">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={profileData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-treasure-gold"
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className="block mb-2 text-white/80">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={profileData.phone || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-treasure-gold"
              />
            </div>
            <div>
              <label htmlFor="address" className="block mb-2 text-white/80">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={profileData.address || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-treasure-gold"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block mb-2 text-white/80">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={profileData.city || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-treasure-gold"
                />
              </div>
              <div>
                <label htmlFor="state" className="block mb-2 text-white/80">State</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={profileData.state || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-treasure-gold"
                />
              </div>
              <div>
                <label htmlFor="zip" className="block mb-2 text-white/80">ZIP Code</label>
                <input
                  type="text"
                  id="zip"
                  name="zip"
                  value={profileData.zip || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-treasure-gold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className={`w-full py-3 bg-treasure-gold text-black font-bold rounded-lg hover:bg-amber-500 transition-colors ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSaving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>

          <div className="mt-10 space-y-6">
            <h3 className="text-xl font-semibold text-treasure-gold mb-4">Account Credentials</h3>
            <div>
              <label htmlFor="email" className="block mb-2 text-white/80">Email Address</label>
              <div className="flex items-center space-x-2">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleChange}
                  className="flex-1 px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-treasure-gold"
                  required
                />
                <button
                  onClick={handleEmailChangeRequest}
                  disabled={isSaving || profileData.email === currentUser.email}
                  className={`py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors ${isSaving || profileData.email === currentUser.email ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  Change Email
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="newPassword" className="block mb-2 text-white/80">New Password</label>
              <div className="flex items-center space-x-2">
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="flex-1 px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-treasure-gold"
                />
                <button
                  onClick={handlePasswordChangeRequest}
                  disabled={isSaving || !newPassword}
                  className={`py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors ${isSaving || !newPassword ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  Change Password
                </button>
              </div>
              {/* NEW: Forgot Password Option */}
              <button
                onClick={handleForgotPassword}
                className="mt-2 text-sm text-white/60 hover:text-treasure-gold transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          {/* Re-authentication Modal */}
          {showReauthModal && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
              <div className="culture-card p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                <h3 className="text-2xl font-bold text-treasure-gold mb-6">Re-authenticate</h3>
                <p className="text-white/80 mb-4">Please enter your current password to confirm this action.</p>
                <input
                  type="password"
                  value={reauthPassword}
                  onChange={(e) => setReauthPassword(e.target.value)}
                  placeholder="Current Password"
                  className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-treasure-gold mb-6"
                  required
                />
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleReauthenticate}
                    disabled={isSaving || !reauthPassword}
                    className={`py-2 px-5 bg-treasure-gold text-black font-bold rounded-lg hover:bg-amber-500 transition-colors ${isSaving || !reauthPassword ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isSaving ? 'Confirming...' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => {
                      setShowReauthModal(false);
                      setReauthPassword('');
                      setPendingEmail(null);
                      setNewPassword('');
                      setMessage(null);
                    }}
                    className="py-2 px-5 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
