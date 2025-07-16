'use client'; // Essential for client-side functionality

import React from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
// You might need to import CartItem if it's not implicitly available via useCart's return type
// import { CartItem } from '@/types/index'; // Uncomment if TypeScript complains

export default function CartPage() {
  // Destructure functions from useCart. cart now has item.id as string.
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const router = useRouter();

  const handleQuantityChange = (itemId: string, itemSize: string, newQuantity: number) => {
    if (newQuantity > 0) {
      updateQuantity(itemId, itemSize, newQuantity);
    } else {
      // If quantity becomes 0 or less, remove the item
      removeFromCart(itemId, itemSize);
    }
  };

  return (
    <div className="min-h-screen bg-void-black text-white pt-20"> {/* Added pt-20 for navbar */}
      <div className="container mx-auto py-16 px-4 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-10 text-center text-treasure-gold">
          Your Treasure Chest
        </h1>

        {cart.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🧳</div>
            <p className="text-xl text-white/80 mb-8">Your vault is empty</p>
            <button
              onClick={() => router.push('/#products')}
              // Updated classes for consistency with main page buttons
              className="px-8 py-3 bg-gradient-to-r from-treasure-gold to-amber-500 rounded-full font-bold text-black hover:scale-105 transition-transform shadow-lg transform hover:-translate-y-1"
            >
              DISCOVER TREASURES
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {cart.map((item) => (
              <div
                key={`${item.id}-${item.size}`}
                className="product-card p-6 rounded-xl border border-treasure-gold/30 flex flex-col md:flex-row items-center"
              >
                <div className="w-24 h-24 relative mb-4 md:mb-0 md:mr-6 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {/*
                    FIXED LOGIC HERE:
                    - Check if 'item.images' exists and is an array.
                    - Check if the array has at least one element (`.length > 0`).
                    - Access the 'src' property of the first image object (`item.images[0].src`).
                  */}
                  {item.images && Array.isArray(item.images) && item.images.length > 0 && item.images[0].src ? (
                    <Image
                      src={item.images[0].src} // Access the 'src' property of the first image object
                      alt={item.images[0].alt || item.name || 'Cart Item Image'} // Use alt from image object, fallback to item name
                      width={96}
                      height={96}
                      style={{ objectFit: 'cover' }}
                      className="rounded-lg"
                      // On error, hide the image and show a fallback div
                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none'; // Hide the broken image
                          const parent = target.parentElement;
                          if (parent) {
                            parent.classList.add('bg-gray-700', 'text-white/50', 'flex', 'items-center', 'justify-center', 'text-xs');
                            parent.textContent = 'Error loading image';
                          }
                      }}
                    />
                  ) : (
                    // Fallback for missing or empty 'images' array, or if first image has no 'src'
                    <div className="absolute inset-0 bg-gray-700 rounded-lg flex items-center justify-center text-white/50 text-xs">
                      No Image
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center md:text-left md:ml-6">
                  <h2 className="text-xl font-bold text-treasure-gold mb-1">{item.name}</h2>
                  <p className="text-sm text-white/80 mb-2">
                    {item.origin}
                    {item.size && <span className="ml-2 text-white/60">Size: {item.size}</span>}
                  </p>
                  <div className="flex justify-center md:justify-start items-center space-x-2 mt-4">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.size, item.quantity - 1)}
                      className="bg-gray-800/50 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-700 text-lg font-bold"
                      aria-label={`Decrease quantity of ${item.name}`}
                    >
                      -
                    </button>
                    <span className="text-white font-bold text-lg">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.size, item.quantity + 1)}
                      className="bg-gray-800/50 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-700 text-lg font-bold"
                      aria-label={`Increase quantity of ${item.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 flex flex-col items-center md:items-end">
                  <span className="text-2xl font-bold mb-2 text-treasure-gold">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.id, item.size)}
                    className="text-white/60 hover:text-red-500 transition-colors p-2"
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            <div className="product-card p-6 rounded-xl border border-treasure-gold/30 mt-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-white/80">Subtotal</span>
                <span className="text-white font-bold">₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-white/80">Shipping</span>
                <span className="text-treasure-gold font-bold">FREE</span>
              </div>
              <div className="flex justify-between text-xl font-bold mt-4">
                <span>Total</span>
                <span className="text-2xl font-bold text-treasure-gold">₹{cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-10">
              <button
                onClick={() => router.push('/#products')}
                // Updated classes for consistency with main page buttons
                className="px-8 py-4 border-2 border-globe-blue rounded-full font-bold text-lg text-globe-blue hover:bg-globe-blue/10 transition-colors shadow-md transform hover:-translate-y-1"
              >
                CONTINUE EXPLORING
              </button>

              <button
                onClick={() => router.push('/checkout')}
                // Updated classes for consistency with main page buttons
                className="px-8 py-4 border-2 border-treasure-gold rounded-full font-bold text-lg text-treasure-gold hover:bg-treasure-gold/10 transition-colors shadow-md transform hover:-translate-y-1"
              >
                PROCEED TO CHECKOUT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
