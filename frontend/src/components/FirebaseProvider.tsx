'use client';

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  Auth,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  Firestore,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';

// --- IMPORTANT: REPLACE THESE WITH YOUR ACTUAL FIREBASE CONFIG AND PROJECT ID ---
const YOUR_ACTUAL_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBPWSxT3fu_O9-_TxAtyOHENQAoyS2OaJA",
  authDomain: "zorvh-app.firebaseapp.com",
  projectId: "zorvh-app",
  storageBucket: "zorvh-app.firebasestorage.app",
  messagingSenderId: "774548293353",
  appId: "1:774548293353:web:e155fc400557e442a11278",
  measurementId: "G-J3BYZKBL6V"
};

export const APP_ID ="zorvh-app"; // It's better to derive APP_ID from projectId for consistency

// --- Firebase Context ---
interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  currentUser: User | null;
  isAdmin: boolean;
  loadingFirebase: boolean; // Still indicates if Firebase init is in progress
  isAuthReady: boolean; // NEW: Indicates if the initial auth state check is complete
  userId: string | null;
  login: (email: string, password: string) => Promise<User | null>;
  register: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider = ({ children }: { children: React.ReactNode }) => {
  const [app, setApp] = useState<FirebaseApp | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loadingFirebase, setLoadingFirebase] = useState<boolean>(true); // Still true during initial Firebase app init
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false); // NEW: Initially false
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeAuth: () => void;
    let unsubscribeProfile: () => void | undefined;

    try {
      const firebaseConfig = YOUR_ACTUAL_FIREBASE_CONFIG;
      const initializedApp = initializeApp(firebaseConfig);
      const initializedAuth = getAuth(initializedApp);
      const initializedDb = getFirestore(initializedApp);

      setApp(initializedApp);
      setAuth(initializedAuth);
      setDb(initializedDb);

      unsubscribeAuth = onAuthStateChanged(initializedAuth, async (user) => {
        setCurrentUser(user);
        if (user) {
          const currentUserId = user.uid;
          setUserId(currentUserId);

          const userDocRef = doc(initializedDb, `artifacts/${APP_ID}/users/${currentUserId}/user_data/profile`);
          
          // Listen for real-time updates to user profile (e.g., admin status changes)
          // This listener also serves as the point where we know auth state is fully processed.
          unsubscribeProfile = onSnapshot(userDocRef, (docSnap: DocumentSnapshot<DocumentData>) => {
            if (docSnap.exists()) {
              setIsAdmin(docSnap.data()?.isAdmin || false);
            } else {
              setIsAdmin(false);
              // Create a default profile if it doesn't exist for a newly signed-up user or old user logging in for first time
              setDoc(userDocRef, { 
                isAdmin: false, 
                createdAt: new Date(),
                email: user.email // Store email on profile
              }, { merge: true })
                .then(() => console.log("User profile created/updated."))
                .catch((e: any) => console.error("Error setting user profile:", e));
            }
            setLoadingFirebase(false); // Firebase app initialization and initial user/profile check complete
            setIsAuthReady(true); // NEW: Auth state is now stable
          }, (error: any) => {
            console.error("Error listening to user profile:", error);
            setIsAdmin(false);
            setLoadingFirebase(false); // Even on error, Firebase init is done
            setIsAuthReady(true); // NEW: Auth state is stable (even if profile fetch failed)
          });
        } else {
          // User is logged out
          setUserId(null);
          setIsAdmin(false);
          setLoadingFirebase(false); // Firebase app initialization and user check complete
          setIsAuthReady(true); // NEW: Auth state is stable (no user)
          // Ensure profile listener is unsubscribed if user logs out
          if (unsubscribeProfile) unsubscribeProfile();
        }
      });

      // Cleanup function for useEffect
      return () => {
        if (unsubscribeAuth) unsubscribeAuth();
        if (unsubscribeProfile) unsubscribeProfile();
      };
    } catch (error: any) {
      console.error("Failed to initialize Firebase:", error);
      setLoadingFirebase(false); // Firebase init failed
      setIsAuthReady(true); // NEW: Auth state is stable (failed to init)
    }
  }, []); // Empty dependency array ensures this runs only once for initialization


  // NEW: Authentication functions as part of the context value
  const login = useCallback(async (email: string, password: string): Promise<User | null> => {
    if (!auth) throw new Error("Firebase Auth not initialized.");
    // setLoadingFirebase(true); // Don't set here, onAuthStateChanged will handle it
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error("Login error:", error);
      throw error; // Re-throw to allow component to catch and display error
    }
  }, [auth]);

  const register = useCallback(async (email: string, password: string): Promise<User | null> => {
    if (!auth || !db) throw new Error("Firebase Auth or Firestore not initialized.");
    // setLoadingFirebase(true); // Don't set here, onAuthStateChanged will handle it
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Create initial profile document for new user
      if (userCredential.user) {
        const userDocRef = doc(db, `artifacts/${APP_ID}/users/${userCredential.user.uid}/user_data/profile`);
        await setDoc(userDocRef, {
          isAdmin: false,
          createdAt: new Date(),
          email: email // Store the email upon registration
        }, { merge: true });
      }
      return userCredential.user;
    } catch (error) {
      console.error("Registration error:", error);
      throw error; // Re-throw to allow component to catch and display error
    }
  }, [auth, db]);


  const logout = useCallback(async (): Promise<void> => {
    if (!auth) throw new Error("Firebase Auth not initialized.");
    // setLoadingFirebase(true); // Don't set here, onAuthStateChanged will handle it
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error; // Re-throw to allow component to catch and display error
    }
  }, [auth]);

  // Provide the functions and states through the context
  const contextValue = {
    app,
    auth,
    db,
    currentUser,
    isAdmin,
    loadingFirebase,
    isAuthReady, // NEW
    userId,
    login,
    register,
    logout,
  };

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
