'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/header'; // Assuming Header.tsx is in src/components/Header.tsx
import { useFirebase, APP_ID } from '@/components/FirebaseProvider';
import { collection, query, onSnapshot, DocumentData, deleteDoc, doc, setDoc } from 'firebase/firestore'; // Added setDoc for potential future "add" logic if needed here
import { useCart } from '@/context/CartContext'; // To allow adding from wishlist to cart
import { Product } from '@/types/index'; // Assuming Product interface is defined here or in a global types file

interface WishlistItem {
  id: string; // This will be the product ID
  name: string;
  price: number;
  imageUrl?: string;
  origin: string;
  // Add any other product details you store in your wishlist item document
}

export default function DashboardWishlistPage() {
  const router = useRouter();
  // Destructure isAuthReady from useFirebase
  const { currentUser, loadingFirebase, isAuthReady, db } = useFirebase();
  const { addToCart } = useCart();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect only after Firebase auth state is ready AND no current user
    if (isAuthReady && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, isAuthReady, router]); // Depend on isAuthReady

  useEffect(() => {
    // Only proceed if db is available, currentUser is authenticated with a UID,
    // AND the Firebase auth state is confirmed ready.
    if (!db || !currentUser?.uid || !isAuthReady) {
      console.log("Skipping wishlist fetch: DB unavailable, user not logged in, or auth not ready.");
      setLoadingWishlist(false); // Ensure loading state is false if skipping
      if (!currentUser?.uid && wishlistItems.length > 0) {
        setWishlistItems([]); // Clear any stale data if user logs out or session expires
      }
      return;
    }

    setLoadingWishlist(true);
    setError(null); // Clear previous errors

    console.log(`Firestore Path UID for Wishlist: ${currentUser.uid}, APP_ID: ${APP_ID}`);

    // Path to the user's wishlist subcollection
    const wishlistCollectionRef = collection(db, `artifacts/${APP_ID}/users/${currentUser.uid}/wishlist`);
    const q = query(wishlistCollectionRef); // Fetch all wishlist items

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems: WishlistItem[] = snapshot.docs.map(doc => {
        const data = doc.data() as DocumentData;
        return {
          id: doc.id, // The document ID is the product ID here
          name: data.name || 'Unknown Product',
          price: data.price || 0,
          imageUrl: data.imageUrl || undefined,
          origin: data.origin || 'Unknown Origin',
          // Map other relevant product fields stored in wishlist item
        };
      });
      setWishlistItems(fetchedItems);
      setLoadingWishlist(false);
      console.log(`Successfully fetched ${fetchedItems.length} wishlist items.`);
    }, (err: any) => { // Explicitly type err as any
      console.error("Error fetching wishlist:", err);
      setError('Failed to load your wishlist. Please try again later.');
      setLoadingWishlist(false);
    });

    return () => unsubscribe();
  }, [db, currentUser, isAuthReady, APP_ID, wishlistItems.length]); // Depend on isAuthReady

  const handleRemoveFromWishlist = async (itemId: string) => {
    if (!db || !currentUser || !currentUser.uid) return;
    try {
      const itemDocRef = doc(db, `artifacts/${APP_ID}/users/${currentUser.uid}/wishlist`, itemId);
      await deleteDoc(itemDocRef);
      alert('Item removed from wishlist!'); // Use a custom toast/modal in a real app
    } catch (err: any) { // Explicitly type err as any
      console.error("Error removing from wishlist:", err);
      alert(`Failed to remove item from wishlist: ${err.message}`);
    }
  };

  const handleAddToCartFromWishlist = (item: WishlistItem) => { // FIX: Explicitly type item as WishlistItem
    // Assuming a default size for wishlist items if not explicitly stored
    const defaultSize = 'One Size';
    // You might need to fetch full product details (e.g., stock, sizes) from 'products' collection
    // before adding to cart if your WishlistItem interface doesn't contain all Product fields.
    // For simplicity, using available WishlistItem data here.
    addToCart({ ...item, stock: 100 } as Product, defaultSize, 1); // Mock stock for now
    alert(`${item.name} added to cart!`); // Use a custom toast/modal
    handleRemoveFromWishlist(item.id); // Optionally remove from wishlist after adding to cart
  };

  // Show loading state if Firebase is still initializing or auth state is not ready
  if (!isAuthReady || loadingWishlist) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-void-black text-white text-2xl">
        {loadingFirebase ? 'Loading Firebase...' : 'Loading Wishlist...'}
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
      <div className="p-6 pt-20"> {/* pt-20 for navbar offset */}
        <div className="max-w-4xl mx-auto culture-card p-8 rounded-xl shadow-lg">
          <h2 className="text-3xl font-bold text-center text-treasure-gold mb-8">Your Wishlist</h2>

          {error && (
            <p className="text-center text-red-300 mb-4">{error}</p>
          )}

          {wishlistItems.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xl text-white/70 mb-4">Your wishlist is empty.</p>
              <button
                onClick={() => router.push('/products')}
                className="px-6 py-3 bg-treasure-gold text-black font-bold rounded-lg hover:bg-amber-500 transition-colors"
              >
                Discover Products
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {wishlistItems.map((item: WishlistItem) => ( // FIX: Corrected map function syntax to return JSX
                <div
                  key={item.id}
                  className="product-card p-6 rounded-xl border border-treasure-gold/30 flex flex-col md:flex-row items-center"
                >
                  <div className="w-24 h-24 relative mb-4 md:mb-0 md:mr-6 flex-shrink-0 flex items-center justify-center">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name || 'Wishlist Item Image'}
                        width={96}
                        height={96}
                        style={{ objectFit: 'cover' }}
                        className="rounded-lg"
                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.classList.add('bg-gray-700', 'text-white/50', 'flex', 'items-center', 'justify-center', 'text-xs');
                              parent.textContent = 'Error';
                            }
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gray-700 rounded-lg flex items-center justify-center text-white/50 text-xs">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-center md:text-left md:ml-6">
                    <h2 className="text-xl font-bold text-treasure-gold mb-1">{item.name}</h2>
                    <p className="text-sm text-white/80 mb-2">
                      {item.origin}
                    </p>
                    <span className="text-white font-bold text-lg">₹{item.price.toFixed(2)}</span>
                  </div>
                  <div className="mt-4 md:mt-0 flex flex-col items-center md:items-end space-y-2">
                    <button
                      onClick={() => handleAddToCartFromWishlist(item)}
                      className="bg-treasure-gold text-black py-2 px-4 rounded-lg hover:bg-amber-500 transition-colors text-sm"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleRemoveFromWishlist(item.id)}
                      className="text-white/60 hover:text-red-500 transition-colors p-2 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
