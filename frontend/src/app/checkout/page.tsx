'use client'; // Essential for client-side functionality

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useFirebase } from '@/components/FirebaseProvider'; // Import useFirebase
import { CartItem } from '@/types/index'; // IMPORTANT: Import CartItem to ensure correct typing

// Declare Razorpay global object type for TypeScript
declare global {
  interface Window {
    Razorpay: new (options: any) => any;
  }
}

// IMPORTANT: This URL MUST match the port your NestJS backend is running on.
const BACKEND_URL = 'http://localhost:4000';

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const router = useRouter();
  const { currentUser, loadingFirebase, isAuthReady } = useFirebase(); // Destructure currentUser, loadingFirebase, isAuthReady

  // State for form data (shipping info)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });

  // States for backend interaction feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentResponse, setPaymentResponse] = useState<any>(null);

  // Function to dynamically load the Razorpay SDK script
  useEffect(() => {
    const loadRazorpayScript = () => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        console.log('Razorpay SDK loaded successfully.');
      };
      script.onerror = (e) => {
        console.error('Failed to load Razorpay SDK:', e);
        setError('Failed to load payment gateway. Please try again later.');
      };
      document.body.appendChild(script);
    };

    loadRazorpayScript();
  }, []);

  // Redirect to login if not authenticated after auth state is ready
  useEffect(() => {
    if (isAuthReady && !currentUser) {
      router.push('/login');
    }
  }, [isAuthReady, currentUser, router]);

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPaymentResponse(null);

    // Ensure user is authenticated before proceeding
    if (!currentUser || !currentUser.uid) {
      setError('You must be logged in to place an order.');
      setLoading(false);
      router.push('/login'); // Redirect to login
      return;
    }

    // Basic client-side validation for shipping info
    if (!formData.name || !formData.email || !formData.address || !formData.city || !formData.state || !formData.zip) {
      setError('Please fill in all shipping information fields.');
      setLoading(false);
      return;
    }

    const totalAmount = calculateTotal();
    if (totalAmount <= 0) {
      setError('Your cart is empty or total amount is zero. Please add items to your cart.');
      setLoading(false);
      return;
    }

    try {
      // Generate a unique orderId for this transaction
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Step 1: Call your backend to create a payment order/intent
      const paymentPayload = {
        orderId: orderId,
        amount: Math.round(totalAmount * 100), // Razorpay expects amount in paisa/cents
        currency: 'INR',
        customerName: formData.name,
        customerEmail: formData.email,
        // Add items to the payload, ensuring imageUrls are converted to the new 'images' structure
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          size: item.size,
          // When sending to backend, usually you'd send the main image URL or an array of URLs
          // If backend expects the first image URL:
          imageUrl: item.images.length > 0 ? item.images[0].src : null,
          // Or if it expects the entire images array (depends on your backend schema):
          // images: item.images,
        })),
        shippingAddress: formData, // Send shipping info to backend
        userId: currentUser.uid, // Send user ID
      };

      console.log('Sending payment request to backend with payload:', paymentPayload);

      const response = await fetch(`${BACKEND_URL}/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser.getIdToken()}`,
        },
        body: JSON.stringify(paymentPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Backend payment error response:', data);
        throw new Error(data.message || 'Failed to initiate payment. Please check backend logs.');
      }

      setPaymentResponse(data);
      console.log('Backend payment initiation response:', data);

      // Step 2: Open Razorpay Checkout modal
      if (typeof window !== 'undefined' && window.Razorpay) {
        const options = {
          key: data.key,
          amount: data.amount,
          currency: data.currency,
          name: data.name,
          description: data.description,
          order_id: data.id,
          handler: async function (razorpayResponse: any) { // Made handler async
            console.log('Razorpay Payment Successful:', razorpayResponse);
            // Verify payment on your backend (crucial step for security)
            try {
              const verifyResponse = await fetch(`${BACKEND_URL}/payments/verify-payment`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${await currentUser.getIdToken()}`,
                },
                body: JSON.stringify({
                  razorpay_order_id: razorpayResponse.razorpay_order_id,
                  razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                  razorpay_signature: razorpayResponse.razorpay_signature,
                  orderId: orderId, // Your unique orderId from the frontend
                  totalAmount: totalAmount, // Send total amount for server-side validation
                  userId: currentUser.uid,
                  items: cart, // Send cart items again to save full order details
                  shippingAddress: formData,
                }),
              });

              const verifyData = await verifyResponse.json();

              if (!verifyResponse.ok) {
                console.error('Payment verification failed on backend:', verifyData);
                router.push(`/payment-status?success=false&message=${encodeURIComponent(verifyData.message || 'Payment verification failed.')}`);
              } else {
                console.log('Payment successfully verified by backend:', verifyData);
                clearCart(); // Clear cart only after successful verification
                router.push('/thank-you'); // Or `/payment-status?success=true&orderId=${orderId}`
              }
            } catch (verificationError: any) {
              console.error('Error during payment verification:', verificationError);
              router.push(`/payment-status?success=false&message=${encodeURIComponent(verificationError.message || 'Payment verification failed due to network error.')}`);
            }
          },
          prefill: data.prefill,
          theme: data.theme,
          modal: {
            ondismiss: function() {
              console.log('Razorpay modal dismissed.');
              setError('Payment cancelled by user or dismissed.');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        setError('Razorpay SDK not loaded. Please try refreshing the page.');
      }

    } catch (err: any) {
      console.error('Error during payment process:', err);
      setError(err.message || 'An unexpected error occurred during payment.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state if Firebase is still initializing or auth state is not ready
  if (loadingFirebase || !isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-void-black text-white text-2xl">
        Loading...
      </div>
    );
  }

  // If not authenticated after auth is ready, show nothing (redirect handled by useEffect)
  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-void-black text-white py-16 px-4 pt-20"> {/* Added pt-20 for navbar offset */}
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Shipping and Payment Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Shipping Information</h2>

              <div>
                <label className="block mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-treasure-gold"
                />
              </div>

              <div>
                <label className="block mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-treasure-gold"
                />
              </div>

              <div>
                <label className="block mb-2">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-treasure-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-treasure-gold"
                  />
                </div>
                <div>
                  <label className="block mb-2">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-treasure-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2">ZIP Code</label>
                <input
                  type="text"
                  name="zip"
                  value={formData.zip}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-treasure-gold"
                />
              </div>

              <h2 className="text-2xl font-bold mt-12 mb-6">Payment Details (Razorpay)</h2>
              <p className="text-white/70 mb-4">
                You will be redirected to the Razorpay payment gateway to complete your order.
              </p>

              <button
                type="submit"
                disabled={loading || cart.length === 0} // Disable if cart is empty
                // Updated classes for consistency with main page buttons
                className={`w-full py-4 bg-gradient-to-r from-treasure-gold to-amber-500 rounded-full font-bold text-black hover:scale-105 transition-transform shadow-lg transform hover:-translate-y-1 mt-8
                  ${loading || cart.length === 0 ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Processing Order...' : 'PLACE ORDER'}
              </button>

              {error && (
                <div className="mt-6 p-4 bg-red-800 text-red-200 rounded-lg" role="alert">
                  <p className="font-bold">Error:</p>
                  <p>{error}</p>
                </div>
              )}
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
            <div className="bg-gray-900/50 rounded-xl p-6">
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {/* Image Component Fixes */}
                {cart.map((item: CartItem) => ( // Explicitly type item for clarity
                  <div key={`${item.id}-${item.size}`} className="flex gap-4 py-4 border-b border-silver-light/20">
                    <div className="w-24 h-24 relative flex-shrink-0 overflow-hidden rounded-lg"> {/* Added flex-shrink-0 and overflow-hidden for rounded-lg */}
                      {/* FIX: Use item.images array, similar to CartPage */}
                      {item.images && Array.isArray(item.images) && item.images.length > 0 && item.images[0].src ? (
                        <Image
                          src={item.images[0].src} // Access the 'src' property of the first image object
                          alt={item.images[0].alt || item.name || 'Checkout Item Image'} // Use alt from image object, fallback
                          fill // Use fill to make image fill parent container
                          style={{ objectFit: 'cover' }} // Use style prop for objectFit
                          className="rounded-lg" // Class for styling
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Recommended for 'fill'
                          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none'; // Hide broken image
                            const parent = target.parentElement;
                            if (parent) {
                              parent.classList.add('bg-gray-700', 'text-white/50', 'flex', 'items-center', 'justify-center', 'text-xs');
                              parent.textContent = 'Error';
                            }
                          }}
                        />
                      ) : (
                        // Fallback for no image
                        <div className="absolute inset-0 bg-gray-700 rounded-lg flex items-center justify-center text-white/50 text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold">{item.name}</h3>
                      <p className="text-treasure-gold">₹{item.price.toFixed(2)}</p>
                      <p className="text-white/70">Size: {item.size}</p>
                      <p className="text-white/70">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-silver-light/20 pt-4 mt-4 space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between text-xl font-bold mt-4">
                  <span>Total</span>
                  <span>₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
