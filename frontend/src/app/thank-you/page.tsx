// app/thank-you/page.tsx
import React from 'react';
import Link from 'next/link';

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-void-black text-white flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-3xl">
        <div className="w-24 h-24 bg-treasure-gold rounded-full flex items-center justify-center mx-auto mb-8">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 text-black" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth={2}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-8 text-treasure-gold">Thank You!</h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
          Your order has been placed successfully. You'll receive a confirmation email shortly.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          {/* Back to Home Button - Gold with animation */}
          <Link
            href="/"
            className="px-8 py-4 border-2 border-treasure-gold rounded-full font-bold text-treasure-gold hover:bg-treasure-gold/10 transition-all duration-300 text-center relative overflow-hidden group"
          >
            <span className="relative z-10">Back to Home</span>
            <span className="absolute inset-0 bg-treasure-gold opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
            <span className="absolute top-0 left-0 w-full h-0.5 bg-treasure-gold group-hover:h-full transition-all duration-500 ease-in-out z-0"></span>
          </Link>
          
          {/* Continue Shopping Button - Blue with animation */}
          <Link
            href="/products"
            className="px-8 py-4 border-2 border-globe-blue rounded-full font-bold text-globe-blue hover:bg-globe-blue/10 transition-all duration-300 text-center relative overflow-hidden group"
          >
            <span className="relative z-10">Continue Shopping</span>
            <span className="absolute inset-0 bg-globe-blue opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
            <span className="absolute top-0 left-0 w-full h-0.5 bg-globe-blue group-hover:h-full transition-all duration-500 ease-in-out z-0"></span>
          </Link>
        </div>
      </div>
    </div>
  );
}