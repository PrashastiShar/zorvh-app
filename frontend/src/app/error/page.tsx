// frontend/src/app/error/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';

export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-void-black text-white flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-6xl md:text-8xl font-black text-red-500 mb-4">Error</h1>
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Something Went Wrong</h2>
      <p className="text-lg text-white/80 max-w-md mb-8">
        We encountered an unexpected issue while retrieving the treasure. Please try again or contact support.
      </p>
      <Link href="/" className="px-6 py-3 border-2 border-treasure-gold rounded-full font-bold text-treasure-gold hover:bg-treasure-gold/10 transition-colors">
        Go Back Home
      </Link>
    </div>
  );
}