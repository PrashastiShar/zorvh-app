'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Import usePathname
import Link from 'next/link';
import gsap from 'gsap';
import { useCart } from '@/context/CartContext';
import { useFirebase } from '@/components/FirebaseProvider';

// Mobile Navigation Component (extracted from ZORVHContent)
interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  router: ReturnType<typeof useRouter>;
  isLoggedIn: boolean;
  onLoginClick: () => void;
  onDashboardClick: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose, router, isLoggedIn, onLoginClick, onDashboardClick }) => {
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (navRef.current) {
      if (isOpen) {
        gsap.to(navRef.current, { x: '0%', duration: 0.5, ease: 'power3.out' });
      } else {
        gsap.to(navRef.current, { x: '100%', duration: 0.5, ease: "power3.in" });
      }
    }
  }, [isOpen]);

  const handleNavClick = (sectionId: string) => {
    onClose();
    // Use setTimeout to allow the nav animation to start before scrolling
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
  };

  return (
    <div
      ref={navRef}
      className={`fixed top-0 right-0 h-full w-full bg-void-black/95 backdrop-blur-xl z-50 transform md:hidden flex flex-col p-8 transition-transform duration-500 ease-in-out ${isOpen ?
        'translate-x-0' : 'translate-x-full'}`}
    >
      <button onClick={onClose} className="absolute top-6 right-6 text-white text-3xl">
        &times;
      </button>
      <ul className="mt-20 space-y-8">
        {['Home'].map((item) => (
          <li key={item} className="text-center">
            <button
              onClick={() => handleNavClick(item.toLowerCase())}
              className="text-white text-3xl font-medium relative group hover:text-treasure-gold transition-colors"
            >
              {item}
              <span className="absolute left-0 bottom-0 w-full h-0.5 bg-treasure-gold transform scaleX(0) group-hover:scaleX(1) transition-transform duration-300 origin-left"></span>
            </button>
          </li>
        ))}
        {isLoggedIn && (
          <li className="text-center">
            <button
              onClick={() => { onClose(); onDashboardClick(); }}
              className="text-white text-3xl font-medium relative group hover:text-globe-blue transition-colors"
            >
              Dashboard
              <span className="absolute left-0 bottom-0 w-full h-0.5 bg-globe-blue transform scaleX(0) group-hover:scaleX(1) transition-transform duration-300 origin-left"></span>
            </button>
          </li>
        )}
        {!isLoggedIn && (
          <li className="text-center">
            <button
              onClick={() => { onClose(); onLoginClick(); }}
              className="text-white text-3xl font-medium relative group hover:text-silver-metal transition-colors"
            >
              Login
              <span className="absolute left-0 bottom-0 w-full h-0.5 bg-silver-metal transform scaleX(0) group-hover:scaleX(1) transition-transform duration-300 origin-left"></span>
            </button>
          </li>
        )}
      </ul>
      <div className="mt-auto text-center">
        <button
          className="px-5 py-3 border-2 border-treasure-gold rounded-full font-bold text-treasure-gold hover:bg-treasure-gold/10 transition-colors shadow-md"
          onClick={() => {
            onClose();
            router.push('/products');
          }}
        >
          SHOP NOW
        </button>
      </div>
    </div>
  );
};

// Header Component
const Header: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname(); // Use usePathname hook
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { cartCount } = useCart();
  const { currentUser: user, logout } = useFirebase();
  const isLoggedIn = !!user;

  const handleLoginClick = () => {
    router.push('/login');
  };

  const handleDashboardClick = () => {
    router.push('/dashboard');
  };

  const handleCartClick = () => {
    // Animate cart count on click
    gsap.to('.cart-count', {
      scale: 1.5,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      ease: "power2.out",
      onComplete: () => router.push('/cart') // Navigate after animation
    });
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md py-4 px-8 border-b border-silver-light/30 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div
            className="text-2xl font-bold text-silver-metal cursor-pointer hover:text-treasure-gold transition-colors"
            onClick={() => router.push('/')}
          >
            ZORVH
          </div>
          <ul className="hidden md:flex space-x-8">
            {['Home', 'Journey', 'Products', 'Stories', 'Community', 'Contact'].map((item) => (
              <li key={item}>
                <a
                  href={`/#${item.toLowerCase()}`} // Ensure links point to sections on the homepage
                  onClick={(e) => {
                    e.preventDefault();
                    // If on a different page, navigate to home first, then scroll
                    if (pathname !== '/') { // Use pathname here
                      router.push(`/#${item.toLowerCase()}`);
                    } else {
                      const targetId = item.toLowerCase();
                      const targetElement = document.getElementById(targetId);
                      if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                      }
                    }
                  }}
                  className="text-white text-lg font-medium relative group hover:text-treasure-gold transition-colors"
                >
                  {item}
                  <span className="absolute left-0 bottom-0 w-full h-0.5 bg-treasure-gold transform scaleX(0) group-hover:scaleX(1) transition-transform duration-300 origin-left"></span>
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-6">
            {isLoggedIn ? (
              <button
                className="hidden md:block px-5 py-2 border-2 border-globe-blue rounded-full text-sm font-bold text-globe-blue hover:bg-globe-blue/10 transition-colors shadow-md transform hover:-translate-y-1"
                onClick={handleDashboardClick}
              >
                Dashboard
              </button>
            ) : (
              <button
                className="hidden md:block px-5 py-2 border-2 border-silver-metal rounded-full text-sm font-bold text-silver-metal hover:bg-silver-metal/10 transition-colors shadow-md transform hover:-translate-y-1"
                onClick={handleLoginClick}
              >
                Login / My Account
              </button>
            )}
            <div className="relative">
              <button
                className="relative p-2"
                onClick={handleCartClick} // Use the new handler
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white hover:text-treasure-gold transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {/* isClient check is not strictly needed here as Header itself is client-side */}
                {cartCount > 0 && (
                  <span className="cart-count absolute -top-1 -right-1 bg-globe-blue text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
            <button
              className="md:hidden p-2 text-white"
              onClick={() => setIsMobileNavOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
            <button
              className="hidden md:block px-5 py-2 border-2 border-treasure-gold rounded-full text-sm font-bold text-treasure-gold hover:bg-treasure-gold/10 transition-colors shadow-md transform hover:-translate-y-1"
              onClick={() => router.push('/products')}
            >
              SHOP NOW
            </button>
          </div>
        </div>
      </nav>
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        router={router}
        isLoggedIn={isLoggedIn}
        onLoginClick={handleLoginClick}
        onDashboardClick={handleDashboardClick}
      />
    </>
  );
};

export default Header;
