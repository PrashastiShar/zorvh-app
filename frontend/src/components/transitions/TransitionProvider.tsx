'use client'; // This component will run on the client side

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';

interface TransitionProviderProps {
  children: React.ReactNode;
}

const TransitionProvider: React.FC<TransitionProviderProps> = ({ children }) => {
  const transitionRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Animate the overlay out when route changes
    if (transitionRef.current) {
      gsap.to(transitionRef.current, {
        height: '0%', // Animate height to 0
        opacity: 0,
        duration: 0.8,
        ease: 'power3.inOut',
        onComplete: () => {
          // Reset for next animation
          gsap.set(transitionRef.current, { height: '100%', opacity: 1 });
        },
      });
    }
  }, [pathname]);

  return (
    <>
      {/* This overlay will cover the content during transition */}
      <div
        ref={transitionRef}
        className="fixed inset-0 bg-futuristic-purple z-[9999] flex items-center justify-center overflow-hidden"
      >
        <h1 className="text-futuristic-light-gray text-4xl sm:text-6xl font-display animate-pulse">
          Loading SynthThreads...
        </h1>
      </div>
      {children}
    </>
  );
};

export default TransitionProvider;