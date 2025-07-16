'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, APP_ID } from '../components/FirebaseProvider'; // Import useFirebase hook and APP_ID
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'; // Import Firebase auth methods
import { getFirestore, doc, getDoc } from 'firebase/firestore'; // Import Firestore methods

// Define the shape of the authentication context
interface AuthContextType {
  // User object now includes uid, optional email, and optional isAdmin flag
  user: { name: string; email?: string; uid: string; isAdmin?: boolean } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean; // Indicates if authentication state is currently loading
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component to wrap your application
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { auth, currentUser, loadingFirebase, app } = useFirebase(); // Get Firebase auth state and app from FirebaseProvider
  const [user, setUser] = useState<{ name: string; email?: string; uid: string; isAdmin?: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Initially true as we wait for Firebase to load
  const router = useRouter();

  // Effect to update AuthContext's user state when Firebase currentUser changes
  useEffect(() => {
    const fetchUserData = async () => {
      if (!loadingFirebase) {
        if (currentUser && app) {
          try {
            const db = getFirestore(app);
            // Construct the path to the user's profile document
            const userDocRef = doc(db, `artifacts/${APP_ID}/users/${currentUser.uid}/user_data/profile`);
            const userDocSnap = await getDoc(userDocRef);

            let isAdmin = false;
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              isAdmin = userData?.isAdmin || false; // Get isAdmin status, default to false
            }

            setUser({
              name: currentUser.displayName || currentUser.email || 'User',
              email: currentUser.email || undefined,
              uid: currentUser.uid,
              isAdmin: isAdmin // Set the isAdmin status
            });
          } catch (error) {
            console.error("Error fetching user data from Firestore:", error);
            setUser({
              name: currentUser.displayName || currentUser.email || 'User',
              email: currentUser.email || undefined,
              uid: currentUser.uid,
              isAdmin: false // Default to false on error
            });
          }
        } else {
          setUser(null);
        }
        setIsLoading(false); // Authentication state is now known
      }
    };

    fetchUserData();
  }, [currentUser, loadingFirebase, app]); // Depend on currentUser and loadingFirebase, and app

  // Function to handle user login using Firebase
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (!auth) {
        console.error("Firebase Auth not initialized.");
        throw new Error("Firebase Auth not initialized.");
      }
      await signInWithEmailAndPassword(auth, email, password);
      // currentUser will be updated by onAuthStateChanged listener in FirebaseProvider
      // and then reflected here in the useEffect, which will then fetch isAdmin.
      router.replace('/dashboard'); // Changed from router.push to router.replace
    } catch (error: any) {
      console.error('Login error:', error);
      // You might want to pass this error message back to the UI
      // For now, we'll just log it.
      throw error; // Re-throw to allow component to catch and display
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle user logout using Firebase
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      if (auth) {
        await signOut(auth);
      }
      // currentUser will be set to null by onAuthStateChanged listener
      setUser(null); // Clear user state
      router.replace('/'); // Changed from router.push to router.replace for cleaner history
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [auth, router]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily access the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
