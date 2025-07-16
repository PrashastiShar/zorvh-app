'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, APP_ID } from '@/components/FirebaseProvider';
import Header from '@/components/header'; // Import the reusable Header component
import { collection, query, orderBy, limit, onSnapshot, DocumentData } from 'firebase/firestore';

// Define a basic interface for Order, assuming it's in your types/index.ts
// You might need to expand this based on your actual order structure in Firestore
interface Order {
  id: string;
  orderDate: Date;
  total: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    imageUrl?: string; // Optional image URL for items
    size?: string;
  }>;
  trackingNumber?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  // Destructure isAuthReady from useFirebase
  const { currentUser, loadingFirebase, isAdmin, userId, logout, db, isAuthReady } = useFirebase();
  const [message, setMessage] = useState<string>('');
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);

  // Redirect to login if Firebase is loaded and no current user
  useEffect(() => {
    // Redirect only after Firebase auth state is ready AND no current user
    if (isAuthReady && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, isAuthReady, router]); // Depend on isAuthReady

  // Fetch user-specific orders from Firestore
  useEffect(() => {
    // Only proceed if db is available, currentUser is authenticated with a UID,
    // AND the Firebase auth state is confirmed ready.
    if (!db || !currentUser?.uid || !isAuthReady) {
      console.log("Skipping recent orders fetch: DB unavailable, user not logged in, or auth not ready.");
      setLoadingOrders(false); // Ensure loading state is false if skipping
      if (!currentUser?.uid && userOrders.length > 0) {
        setUserOrders([]); // Clear any stale data if user logs out or session expires
      }
      return;
    }

    setLoadingOrders(true);
    setMessage(''); // Clear previous messages

    console.log(`Firestore Path UID for Recent Orders: ${currentUser.uid}, APP_ID: ${APP_ID}`);

    // Construct the path to the user's orders subcollection
    // Ensure APP_ID is correctly defined and available
    const ordersCollectionRef = collection(db, `artifacts/${APP_ID}/users/${currentUser.uid}/orders`);
    const q = query(ordersCollectionRef, orderBy('orderDate', 'desc'), limit(5)); // Fetch recent 5 orders

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders: Order[] = snapshot.docs.map(doc => {
        const data = doc.data() as DocumentData; // Cast to DocumentData for flexible access
        return {
          id: doc.id,
          orderDate: data.orderDate?.toDate ? data.orderDate.toDate() : new Date(), // Convert Timestamp to Date
          total: data.total || 0,
          status: data.status || 'pending',
          items: data.items || [],
          trackingNumber: data.trackingNumber || undefined,
        };
      });
      setUserOrders(fetchedOrders);
      setLoadingOrders(false);
      console.log(`Successfully fetched ${fetchedOrders.length} recent orders.`);
    }, (error: any) => { // Explicitly type error
      console.error("Error fetching user orders:", error);
      setMessage('Failed to load recent orders.');
      setLoadingOrders(false);
    });

    // Cleanup the listener when the component unmounts or dependencies change
    return () => unsubscribe();
  }, [db, currentUser, isAuthReady, APP_ID, userOrders.length]); // Depend on isAuthReady

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error: any) {
      console.error("Logout error:", error);
      setMessage('Failed to log out.');
    }
  };

  // Navigation handlers for dashboard sections
  const handleViewOrders = () => {
    router.push('/dashboard/orders');
  };

  const handleViewWishlist = () => {
    router.push('/dashboard/wishlist');
  };

  const handleManageAddresses = () => {
    router.push('/dashboard/addresses');
  };

  const handleManagePayments = () => {
    router.push('/dashboard/payments');
  };

  const handleManageAccount = () => {
    router.push('/dashboard/account');
  };

  // Show loading state if Firebase is still initializing or auth state is not ready
  if (!isAuthReady || loadingOrders) { // Use isAuthReady for initial loading state
    return (
      <div className="flex items-center justify-center min-h-screen bg-void-black">
        <div className="text-xl font-semibold text-white">
          {loadingFirebase ? 'Loading Firebase...' : 'Loading Dashboard...'}
        </div>
      </div>
    );
  }

  // If not authenticated after auth is ready, show nothing (redirect handled by useEffect)
  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-void-black text-white font-inter relative overflow-x-hidden">
      <Header /> {/* Render the Header component */}
      <div className="p-6 pt-20"> {/* Added pt-20 for navbar offset */}
        <div className="max-w-3xl mx-auto culture-card p-8 rounded-xl shadow-lg">
          <h2 className="text-3xl font-bold text-center text-treasure-gold mb-8 animate-fade-in-up">Your Dashboard</h2>
          <div className="flex justify-between items-center mb-6">
            <p className="text-lg text-white/80">
              Welcome, <span className="font-semibold">{currentUser?.email || 'User'}</span>!
            </p>
            <button
              onClick={handleLogout}
              className="py-2 px-5 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors shadow-lg"
            >
              Logout
            </button>
          </div>

          {userId && (
            <p className="text-sm text-white/60 text-center mb-6">
              Your User ID: <span className="font-mono break-all">{userId}</span>
            </p>
          )}

          {message && (
            <p className={`text-center text-sm ${message.includes('success') ? 'text-green-300' : 'text-red-300'} font-medium mb-4`}>
              {message}
            </p>
          )}

          {/* Account Details Section */}
          <div className="culture-card p-6 rounded-lg shadow-sm mb-6">
            <h3 className="text-xl font-semibold text-treasure-gold mb-3">Account Details</h3>
            <p className="text-white/80 mb-2">
              <span className="font-semibold">Email:</span> {currentUser.email}
            </p>
            {/* Password should NEVER be displayed. Only offer a change password option. */}
            <p className="text-white/80 mb-4">
              <span className="font-semibold">User ID:</span> <span className="font-mono break-all text-sm">{userId}</span>
            </p>
            <button
              onClick={handleManageAccount}
              className="mt-2 bg-treasure-gold text-black py-2 px-4 rounded-lg hover:bg-amber-500 transition-colors"
            >
              Manage Account
            </button>
          </div>

          {/* Your Orders Section */}
          <div className="culture-card p-6 rounded-lg shadow-sm mb-6">
            <h3 className="text-xl font-semibold text-treasure-gold mb-3">Your Recent Orders</h3>
            {loadingOrders ? (
              <p className="text-white/70">Loading orders...</p>
            ) : userOrders.length === 0 ? (
              <p className="text-white/70">No recent orders found.</p>
            ) : (
              <div className="space-y-4">
                {userOrders.map(order => (
                  <div key={order.id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-white">Order ID: {order.id.substring(0, 8)}...</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${order.status === 'delivered' ? 'bg-green-500 text-white' :
                          order.status === 'shipped' ? 'bg-blue-500 text-white' :
                          order.status === 'pending' ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'}`}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-white/70 text-sm mb-2">Date: {order.orderDate.toLocaleDateString()}</p>
                    <p className="text-white/70 text-sm">Total: ₹{order.total.toFixed(2)}</p>
                    {order.trackingNumber && (
                      <p className="text-white/70 text-sm">Tracking: {order.trackingNumber}</p>
                    )}
                    <ul className="mt-2 text-sm text-white/60">
                      {order.items.map((item, index) => (
                        <li key={index}>- {item.name} (x{item.quantity})</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={handleViewOrders}
              className="mt-4 bg-treasure-gold text-black py-2 px-4 rounded-lg hover:bg-amber-500 transition-colors"
            >
              View All Orders
            </button>
          </div>

          {/* Other Dashboard Sections (Wishlist, Addresses, Payments) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="culture-card p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-treasure-gold mb-3">Your Wishlist</h3>
              <p className="text-white/80 mb-4">Browse items you've saved for later or add new ones.</p>
              <button
                onClick={handleViewWishlist}
                className="mt-2 bg-treasure-gold text-black py-2 px-4 rounded-lg hover:bg-amber-500 transition-colors"
              >
                View Wishlist
              </button>
            </div>
            <div className="culture-card p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-treasure-gold mb-3">Saved Addresses</h3>
              <p className="text-white/80 mb-4">Manage your shipping and billing addresses for faster checkout.</p>
              <button
                onClick={handleManageAddresses}
                className="mt-2 bg-treasure-gold text-black py-2 px-4 rounded-lg hover:bg-amber-500 transition-colors"
              >
                Manage Addresses
              </button>
            </div>
            <div className="culture-card p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-treasure-gold mb-3">Payment Methods</h3>
              <p className="text-white/80 mb-4">Add, edit, or remove your payment options securely.</p>
              <button
                onClick={handleManagePayments}
                className="mt-2 bg-treasure-gold text-black py-2 px-4 rounded-lg hover:bg-amber-500 transition-colors"
              >
                Manage Payments
              </button>
            </div>
          </div>

          {isAdmin && (
            <div className="mt-8 text-center">
              <p className="text-lg font-semibold text-treasure-gold mb-4">
                You have Administrator privileges!
              </p>
              <button
                onClick={() => router.push('/admin')}
                className="py-3 px-8 bg-treasure-gold text-black font-bold rounded-lg hover:bg-amber-500 transition-colors shadow-lg"
              >
                Go to Admin Page
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
