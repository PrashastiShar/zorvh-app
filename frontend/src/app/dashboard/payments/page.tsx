'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import { useFirebase, APP_ID } from '@/components/FirebaseProvider';
import { collection, query, onSnapshot, DocumentData, doc, updateDoc, writeBatch } from 'firebase/firestore';

// Declare Razorpay global object type for TypeScript
declare global {
  interface Window {
    Razorpay: new (options: any) => any;
  }
}

// IMPORTANT: This URL MUST match the port your NestJS backend is running on.
// Ensure this matches the BACKEND_URL in your CheckoutPage or is configured globally.
const BACKEND_URL = 'http://localhost:4000'; // Adjust if your backend is on a different URL/port

// IMPORTANT: Add this useEffect to ensure Razorpay SDK is loaded on this page
// This is crucial because DashboardPaymentMethodsPage might be accessed directly
// without CheckoutPage having loaded the SDK.
const useRazorpayScript = () => {
  useEffect(() => {
    const loadRazorpayScript = () => {
      if (typeof window !== 'undefined' && !window.Razorpay) { // Only load if not already loaded
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          console.log('Razorpay SDK loaded successfully on DashboardPaymentMethodsPage.');
        };
        script.onerror = (e) => {
          console.error('Failed to load Razorpay SDK on DashboardPaymentMethodsPage:', e);
          // You might want to set an error state here if the SDK is critical for the page
        };
        document.body.appendChild(script);
        return () => {
          // Clean up the script if the component unmounts
          if (document.body.contains(script)) {
            document.body.removeChild(script);
          }
        };
      }
    };
    loadRazorpayScript();
  }, []); // Empty dependency array ensures this runs once on mount
};


// Define the interface for the saved payment method as it will be in Firestore
interface SavedPaymentMethod {
  id: string; // The payment method ID from the gateway (e.g., pm_xxxx)
  brand: string; // e.g., "Visa", "Mastercard"
  last4: string; // Last 4 digits of the card
  expMonth: number;
  expYear: number;
  type: 'card' | 'wallet' | 'upi' | string; // e.g., 'card', 'NetBanking', 'UPI'
  isDefault: boolean;
  createdAt: Date;
  razorpayCustomerId?: string; // Changed from customerId to razorpayCustomerId for clarity
}

export default function DashboardPaymentMethodsPage() {
  const router = useRouter();
  // Destructure isAuthReady from useFirebase
  const { currentUser, loadingFirebase, isAuthReady, db } = useFirebase();
  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false); // Unified state for adding/deleting

  // Call the custom hook to load Razorpay SDK
  useRazorpayScript();

  useEffect(() => {
    // Redirect only after Firebase auth state is ready AND no current user
    if (isAuthReady && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, isAuthReady, router]); // Depend on isAuthReady

  // Fetch saved payment methods in real-time using onSnapshot
  useEffect(() => {
    // Only proceed if db is available, currentUser is authenticated with a UID,
    // AND the Firebase auth state is confirmed ready.
    if (!db || !currentUser?.uid || !isAuthReady) {
      console.log("Skipping payment methods fetch: DB unavailable, user not logged in, or auth not ready.");
      setLoadingMethods(false); // Ensure loading state is false if skipping
      if (!currentUser?.uid && savedMethods.length > 0) {
        setSavedMethods([]); // Clear any stale data if user logs out or session expires
      }
      return;
    }

    setLoadingMethods(true);
    setError(null); // Clear previous errors

    // Log the UID that is being used for the path
    console.log(`Firestore Path UID: ${currentUser.uid}, APP_ID: ${APP_ID}`);

    // Path to the user's payment methods subcollection
    const methodsCollectionRef = collection(db, `artifacts/${APP_ID}/users/${currentUser.uid}/paymentMethods`);
    const q = query(methodsCollectionRef);

    console.log(`Attempting to fetch payment methods for user: ${currentUser.uid}`);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMethods: SavedPaymentMethod[] = snapshot.docs.map(doc => {
        const data = doc.data() as DocumentData;
        return {
          id: doc.id,
          brand: data.brand || 'Unknown',
          last4: data.last4 || '****',
          expMonth: data.expMonth || 0,
          expYear: data.expYear || 0,
          type: data.type || 'card',
          isDefault: data.isDefault || false,
          razorpayCustomerId: data.razorpayCustomerId || undefined, // Use razorpayCustomerId from Firestore
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        };
      });
      // Sort to show default first
      fetchedMethods.sort((a, b) => (b.isDefault as any) - (a.isDefault as any));
      setSavedMethods(fetchedMethods);
      setLoadingMethods(false);
      console.log(`Successfully fetched ${fetchedMethods.length} payment methods.`);
    }, (err) => {
      console.error("Error fetching payment methods from Firestore:", err);
      setError('Failed to load payment methods. Please try again later.');
      setLoadingMethods(false);
    });

    return () => unsubscribe();
  }, [db, currentUser, isAuthReady, APP_ID, savedMethods.length]); // Depend on isAuthReady

  // Function to handle adding a new payment method
  const handleAddPaymentMethod = async () => {
    if (!currentUser || isProcessing) return;
    setIsProcessing(true);
    setError(null);

    try {
      // STEP 1: Request a Razorpay Order from your backend
      // Use a minimal amount (e.g., 1 INR = 100 paise) for tokenization purposes.
      // Razorpay requires an amount even for saving cards via checkout.js.
      const orderPayload = {
        orderId: `save_card_${currentUser.uid}_${Date.now()}`, // Unique ID for this operation
        amount: 1, // Minimum amount for tokenization (1 INR = 100 paise)
        currency: 'INR',
        customerName: currentUser.displayName || 'Guest',
        customerEmail: currentUser.email || '',
      };

      console.log('Requesting Razorpay order from backend with payload:', orderPayload);

      const orderResponse = await fetch(`${BACKEND_URL}/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser.getIdToken()}`, // Send JWT for authentication
        },
        body: JSON.stringify(orderPayload),
      });

      const orderData = await orderResponse.json();
      // Removed: if (!orderResponse.ok) check here.
      // The backend now handles the Razorpay API errors and throws BadRequestException.
      // If the response is not OK, the fetch will throw an error, which the outer try-catch will handle.
      // If the backend returns a 200 OK, it means the order was created.

      console.log('Razorpay order created by backend:', orderData);

      // STEP 2: Initialize and Open Razorpay Checkout modal for tokenization
      // Add a small delay to ensure Razorpay SDK is fully loaded, especially during fast refreshes.
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay

      if (typeof window === 'undefined' || !window.Razorpay) {
        console.error('Razorpay SDK is not available after delay.');
        throw new Error('Razorpay SDK not loaded. Please try refreshing the page.');
      }

      const options = {
        key: orderData.key, // Your Razorpay Key ID from backend response
        amount: orderData.amount, // Amount in paise
        currency: orderData.currency,
        name: orderData.name,
        description: "Save Payment Method", // Specific description for saving card
        order_id: orderData.id, // The Razorpay Order ID
        handler: async function (response: any) {
          // This handler is called when the payment (or tokenization attempt) is successful
          if (response.razorpay_payment_id && response.razorpay_signature) {
            console.log('Razorpay Payment/Tokenization Successful:', response);

            const placeholderCardDetails = { // These will be filled by your backend
              brand: 'Unknown',
              last4: '****',
              expMonth: 0,
              expYear: 0,
              type: 'card'
            };

            // STEP 3: Send the Razorpay payment method ID and non-sensitive details to your backend
            const idToken = await currentUser.getIdToken();
            const saveResponse = await fetch(`${BACKEND_URL}/payments/save-method`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
              },
              body: JSON.stringify({
                userId: currentUser.uid,
                razorpayPaymentMethodId: response.razorpay_payment_id, // Or response.card_id if available
                cardDetails: placeholderCardDetails, // Backend will likely override/fill this
              }),
            });

            const saveData = await saveResponse.json();
            if (!saveResponse.ok) {
              console.error('Backend save method error:', saveData);
              throw new Error(saveData.message || 'Failed to save payment method to database.');
            }
            alert('Payment method added successfully!'); // Use a toast/modal
            // The onSnapshot listener will automatically update `savedMethods` state
          } else {
            throw new Error('Razorpay payment ID or signature missing from response.');
          }
        },
        prefill: {
          name: currentUser.displayName || '',
          email: currentUser.email || '',
          contact: currentUser.phoneNumber || '', // Add if you store phone number
        },
        theme: {
          color: '#F37254', // Matches your brand color
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error("Razorpay payment failed:", response.error);
        setError(response.error?.description || 'Payment method addition failed.');
      });
      rzp.open();

    } catch (err: any) {
      console.error("Client-side error adding payment method:", err);
      setError(err.message || 'An unexpected error occurred while adding payment method.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to set a saved payment method as default
  const handleSetDefault = async (methodId: string) => {
    if (!db || !currentUser || !currentUser.uid || isProcessing) {
      console.warn("Attempted to set default payment method without full user context.");
      setError('Cannot set default payment method: User not fully authenticated or system busy.');
      return;
    }
    setIsProcessing(true);
    setError(null);

    try {
      const batch = writeBatch(db);

      savedMethods.forEach(method => {
        if (method.id !== methodId && method.isDefault) {
          const docRef = doc(db, `artifacts/${APP_ID}/users/${currentUser.uid}/paymentMethods`, method.id);
          batch.update(docRef, { isDefault: false });
        }
      });

      const selectedDocRef = doc(db, `artifacts/${APP_ID}/users/${currentUser.uid}/paymentMethods`, methodId);
      batch.update(selectedDocRef, { isDefault: true });

      await batch.commit();
      alert('Default payment method updated!');
    } catch (err) {
      console.error("Error setting default payment method:", err);
      setError('Failed to set default payment method.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to handle deleting a payment method
  const handleDeleteMethod = async (methodId: string, razorpayCustomerId: string | undefined) => {
    if (!db || !currentUser || isProcessing) return;
    if (!window.confirm('Are you sure you want to delete this payment method?')) return;

    setIsProcessing(true);
    setError(null);

    try {
      const idToken = await currentUser.getIdToken();

      const response = await fetch(`${BACKEND_URL}/payments/delete-method`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          paymentMethodId: methodId,
          razorpayCustomerId: razorpayCustomerId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete payment method.');
      }

      alert('Payment method deleted successfully!');
    } catch (err: any) {
      console.error("Client-side error deleting payment method:", err);
      setError(err.message || 'An unexpected error occurred while deleting payment method.');
    } finally {
      setIsProcessing(false);
    }
  };


  if (!isAuthReady || loadingMethods) { // Use isAuthReady for initial loading state
    return (
      <div className="flex items-center justify-center min-h-screen bg-void-black text-white text-2xl">
        {loadingFirebase ? 'Loading Firebase...' : 'Loading Payment Methods...'}
      </div>
    );
  }

  if (!currentUser) {
    return null; // Should redirect via useEffect after isAuthReady
  }

  return (
    <div className="min-h-screen bg-void-black text-white font-inter relative overflow-x-hidden">
      <Header />
      <div className="p-6 pt-20">
        <div className="max-w-3xl mx-auto culture-card p-8 rounded-xl shadow-lg">
          <h2 className="text-3xl font-bold text-center text-treasure-gold mb-8">Your Payment Methods</h2>

          {error && (
            <p className="text-center text-red-300 mb-4">{error}</p>
          )}

          {savedMethods.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xl text-white/70 mb-4">You have no saved payment methods.</p>
              <button
                onClick={handleAddPaymentMethod}
                className="px-6 py-3 bg-treasure-gold text-black font-bold rounded-lg hover:bg-amber-500 transition-colors"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Add New Payment Method'}
              </button>
              <p className="text-sm text-white/60 mt-4">
                (Note: Payment details are securely handled by Razorpay, not stored directly here.)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedMethods.map(method => (
                <div key={method.id} className={`product-card p-4 rounded-lg flex items-center justify-between ${method.isDefault ? 'border-2 border-treasure-gold' : 'border border-gray-700/50'}`}>
                  <div>
                    <p className="font-semibold text-lg">{method.brand} **** {method.last4}</p>
                    <p className="text-sm text-white/70">Expires: {method.expMonth}/{method.expYear}</p>
                    {method.isDefault && <span className="text-xs text-treasure-gold font-bold">Default</span>}
                  </div>
                  <div className="flex space-x-2">
                    {!method.isDefault && (
                      <button
                        onClick={() => handleSetDefault(method.id)}
                        className="py-1 px-3 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
                        disabled={isProcessing}
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteMethod(method.id, method.razorpayCustomerId)}
                      className="py-1 px-3 text-red-400 hover:text-red-500 transition-colors text-sm"
                      disabled={isProcessing}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={handleAddPaymentMethod}
                className="mt-6 w-full py-3 bg-treasure-gold text-black font-bold rounded-lg hover:bg-amber-500 transition-colors"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Add Another Payment Method'}
              </button>
              <p className="text-sm text-white/60 mt-4 text-center">
                (Note: Payment details are securely handled by Razorpay, not stored directly here.)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
