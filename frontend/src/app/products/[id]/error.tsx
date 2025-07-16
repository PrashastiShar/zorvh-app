// app/products/[id]/error.tsx
'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-void-black text-white">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4 text-red-500">Product Error!</h2>
        <p className="mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="px-6 py-2 border border-treasure-gold rounded-full text-treasure-gold hover:bg-treasure-gold/10 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}