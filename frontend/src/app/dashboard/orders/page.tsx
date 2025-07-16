'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header'; // Assuming Header.tsx is in src/components/Header.tsx
import { useFirebase, APP_ID } from '@/components/FirebaseProvider';
import { collection, query, orderBy, onSnapshot, DocumentData } from 'firebase/firestore';

// Define the Order interface, consistent with your DashboardPage
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
    imageUrl?: string;
    size?: string;
  }>;
  trackingNumber?: string;
}

export default function DashboardOrdersPage() {
  const router = useRouter();
  // Destructure isAuthReady from useFirebase
  const { currentUser, loadingFirebase, isAuthReady, db } = useFirebase();
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect only after Firebase auth state is ready AND no current user
    if (isAuthReady && !currentUser) {
      router.push('/login');
    }
  }, [isAuthReady, currentUser, router]);

  // Fetch user-specific orders from Firestore in real-time
  useEffect(() => {
    // Only proceed if db is available, currentUser is authenticated with a UID,
    // AND the Firebase auth state is confirmed ready.
    if (!db || !currentUser?.uid || !isAuthReady) {
      console.log("Skipping orders fetch: DB unavailable, user not logged in, or auth not ready.");
      setLoadingOrders(false); // Ensure loading state is false if skipping
      if (!currentUser?.uid && userOrders.length > 0) {
        setUserOrders([]); // Clear any stale data if user logs out or session expires
      }
      return;
    }

    setLoadingOrders(true);
    setError(null); // Clear previous errors

    console.log(`Firestore Path UID for Orders: ${currentUser.uid}, APP_ID: ${APP_ID}`);

    // Construct the path to the user's orders subcollection
    const ordersCollectionRef = collection(db, `artifacts/${APP_ID}/users/${currentUser.uid}/orders`);
    // Fetch all orders, ordered by date
    const q = query(ordersCollectionRef, orderBy('orderDate', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders: Order[] = snapshot.docs.map(doc => {
        const data = doc.data() as DocumentData;
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
      console.log(`Successfully fetched ${fetchedOrders.length} user orders.`);
    }, (err) => {
      console.error("Error fetching user orders:", err);
      setError('Failed to load your orders. Please try again later.');
      setLoadingOrders(false);
    });

    // Cleanup the listener when the component unmounts or dependencies change
    return () => unsubscribe();
  }, [db, currentUser, isAuthReady, APP_ID, userOrders.length]); // Depend on isAuthReady

  // Show loading state if Firebase is still initializing or auth state is not ready
  if (!isAuthReady || loadingOrders) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-void-black text-white text-2xl">
        {loadingFirebase ? 'Loading Firebase...' : 'Loading Orders...'}
      </div>
    );
  }

  // If not authenticated after auth is ready, show nothing (redirect handled by useEffect)
  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-void-black text-white font-inter relative overflow-x-hidden">
      <Header />
      <div className="p-6 pt-20"> {/* Added pt-20 for navbar offset */}
        <div className="max-w-4xl mx-auto culture-card p-8 rounded-xl shadow-lg">
          <h2 className="text-3xl font-bold text-center text-treasure-gold mb-8">Your Orders</h2>

          {error && (
            <p className="text-center text-red-300 mb-4">{error}</p>
          )}

          {userOrders.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xl text-white/70 mb-4">You haven't placed any orders yet.</p>
              <button
                onClick={() => router.push('/products')}
                className="px-6 py-3 bg-treasure-gold text-black font-bold rounded-lg hover:bg-amber-500 transition-colors"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {userOrders.map(order => (
                <div key={order.id} className="bg-gray-800/50 p-6 rounded-lg border border-gray-700/50 shadow-md">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                    <span className="font-semibold text-white text-lg">Order ID: {order.id.substring(0, 8)}...</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold mt-2 md:mt-0
                      ${order.status === 'delivered' ? 'bg-green-500 text-white' :
                        order.status === 'shipped' ? 'bg-blue-500 text-white' :
                        order.status === 'pending' ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'}`}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-white/70 text-sm mb-2">Date: {order.orderDate.toLocaleDateString()} at {order.orderDate.toLocaleTimeString()}</p>
                  <p className="text-white font-bold text-md mb-3">Total: ₹{order.total.toFixed(2)}</p>
                  {order.trackingNumber && (
                    <p className="text-white/70 text-sm mb-3">Tracking Number: <span className="font-mono">{order.trackingNumber}</span></p>
                  )}

                  <h4 className="text-md font-semibold text-treasure-gold mb-2">Items:</h4>
                  <ul className="space-y-2">
                    {order.items.map((item, index) => (
                      <li key={index} className="flex items-center space-x-3 text-white/80 text-sm">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                            onError={(e) => (e.currentTarget.src = 'https://placehold.co/48x48/808080/FFFFFF?text=No+Image')}
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-white/70">Qty: {item.quantity} x ₹{item.price.toFixed(2)}</p>
                          {item.size && <p className="text-white/70">Size: {item.size}</p>}
                        </div>
                        <span className="font-bold">₹{(item.quantity * item.price).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
