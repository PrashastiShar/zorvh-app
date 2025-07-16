// frontend/src/app/404/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-void-black text-white flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-6xl md:text-8xl font-black text-treasure-gold mb-4">404</h1>
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Page Not Found</h2>
      <p className="text-lg text-white/80 max-w-md mb-8">
        Oops! The treasure you're looking for seems to be hidden elsewhere.
      </p>
      <Link href="/" className="px-6 py-3 border-2 border-globe-blue rounded-full font-bold text-globe-blue hover:bg-globe-blue/10 transition-colors">
        Return to Vault (Home)
      </Link>
    </div>
  );
}