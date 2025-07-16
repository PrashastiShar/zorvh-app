'use client'; // Essential for client-side functionality

import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { Product, CartItem, ProductImage } from '@/types/index'; // Import ProductImage
import Link from 'next/link';

import { useFirebase, APP_ID } from '@/components/FirebaseProvider';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  query, // Import query
  getDocs // Import getDocs for initial product fetch
} from 'firebase/firestore';

gsap.registerPlugin(ScrollTrigger);

// --- Product Categories Data and Interface ---
// Define the interface for your product categories
export interface ProductCategory {
  id: string; // Unique ID for the category, e.g., 'outerwear'
  name: string; // Display name, e.g., 'Outerwear'
  images: string[]; // Array of image URLs for this category
  description: string; // A short description for the category
  path: string; // The URL path to view all products in this category (e.g., '/products?category=outerwear')
}

// Initial structure for product categories (images will be filled dynamically)
const initialProductCategories: ProductCategory[] = [
  {
    id: 'tops',
    name: 'Tops',
    images: [], // Will be populated with a product image
    description: 'Discover the latest trends in shirts, blouses, and unique upper wear.',
    path: '/products?category=tops',
  },
  {
    id: 'skirts',
    name: 'Skirts',
    images: [], // Will be populated with a product image
    description: 'Browse our collection of skirts, from flowing maxis to chic minis.',
    path: '/products?category=skirts',
  },
  {
    id: 'shoes',
    name: 'Shoes',
    images: [], // Will be populated with a product image
    description: 'Step out in style with our unique and comfortable footwear selections.',
    path: '/products?category=shoes',
  },
  {
    id: 'stockings',
    name: 'Stockings',
    images: [], // Will be populated with a product image
    description: 'Complete your look with our diverse range of stockings and hosiery.',
    path: '/products?category=stockings',
  },
  {
    id: 'jewelry',
    name: 'Jewelry',
    images: [], // Will be populated with a product image
    description: 'Adorn yourself with handcrafted and unique jewelry pieces.',
    path: '/products?category=jewelry',
  },
  {
    id: 'handbags',
    name: 'Handbags',
    images: [], // Will be populated with a product image
    description: 'Carry your essentials in style with our globally inspired handbag collection.',
    path: '/products?category=handbags',
  },
];

// --- Mobile Navigation Component ---
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

  const handleNavClick = (item: string) => { // Changed item type to string
    onClose();
    // Use setTimeout to allow the nav closing animation to start
    setTimeout(() => {
      if (item === 'products') { // Conditional check for 'Products'
        router.push('/products'); // Navigate to /products page
      } else {
        const element = document.getElementById(item);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
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
        {['Home', 'Journey', 'Products', 'Stories', 'Team', 'Contact'].map((item) => ( // Updated 'Community' to 'Team'
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

// --- Toast component ---
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg text-white ${bgColor} z-50 transition-transform duration-300 ease-out transform translate-y-0 opacity-100`}>
      {message}
    </div>
  );
};

// Main ZORVHContent component
export default function ZORVHContent() {
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const [isClient, setIsClient] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);
  const vaultRef = useRef<HTMLDivElement>(null);
  const vaultLeftRef = useRef<HTMLDivElement>(null);
  const vaultRightRef = useRef<HTMLDivElement>(null);
  const vaultCenterRef = useRef<HTMLDivElement>(null);
  const [currentLocation, setCurrentLocation] = useState("Seoul, South Korea"); // Updated initial location
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [userWishlistIds, setUserWishlistIds] = useState<string[]>([]);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const { cartCount } = useCart();
  // Removed loadingFirebase from destructuring. isAuthReady should cover readiness.
  const { currentUser: user, logout, db, isAuthReady } = useFirebase();
  const isLoggedIn = !!user;

  // State for dynamic product categories with images
  const [dynamicProductCategories, setDynamicProductCategories] = useState<ProductCategory[]>(initialProductCategories);

  // Effect to fetch user wishlist IDs
  useEffect(() => {
    if (!db || !user?.uid || !isAuthReady) {
      setUserWishlistIds([]);
      console.log("Skipping wishlist ID fetch on main page: DB unavailable, user not logged in, or auth not ready.");
      return;
    }

    const wishlistCollectionRef = collection(db, `artifacts/${APP_ID}/users/${user.uid}/wishlist`);
    const unsubscribeWishlist = onSnapshot(wishlistCollectionRef, (snapshot) => {
      const fetchedWishlistIds: string[] = snapshot.docs.map(doc => doc.id);
      setUserWishlistIds(fetchedWishlistIds);
      console.log("Fetched wishlist IDs for main page:", fetchedWishlistIds);
    }, (err) => {
      console.error("Error fetching user wishlist IDs on main page:", err);
    });

    return () => unsubscribeWishlist();
  }, [db, user, isAuthReady, APP_ID]);

  // NEW Effect for fetching products and populating category images
  useEffect(() => {
    // Only proceed if db and auth are ready
    if (!db || !isAuthReady) return;

    const fetchCategoryImages = async () => {
      try {
        const productsCollectionRef = collection(db, `artifacts/${APP_ID}/products`);
        const snapshot = await getDocs(query(productsCollectionRef)); // Fetch all products
        const allProducts: Product[] = snapshot.docs.map(doc => {
          const data = doc.data();
          let fetchedImages: ProductImage[] = [];

          if (data.images && Array.isArray(data.images) && data.images.length > 0) {
            fetchedImages = data.images.map((img: any, index: number) => ({
              id: img.id || `${doc.id}-img-${index}`,
              src: img.src || img,
              alt: img.alt || `${data.name || 'Product'} Image ${index + 1}`
            }));
          } else if (data.imageUrl && Array.isArray(data.imageUrl) && data.imageUrl.length > 0) {
            fetchedImages = data.imageUrl.map((url: string, index: number) => ({
              id: `${doc.id}-main-${index}`,
              src: url,
              alt: `${data.name || 'Product'} Image ${index + 1}`
            }));
          } else if (data.imageUrl && typeof data.imageUrl === 'string') {
            fetchedImages.push({
              id: `${doc.id}-main-single`,
              src: data.imageUrl,
              alt: `${data.name || 'Product'} Main Image`
            });
          }

          return {
            id: doc.id,
            name: data.name as string,
            price: data.price as number,
            category: data.category as string,
            origin: data.origin as string,
            story: data.story as string,
            images: fetchedImages,
            stock: data.stock as number,
            description: data.description as string || undefined,
            details: data.details as string || undefined,
            sizes: data.sizes as string[] || undefined,
            attributes: data.attributes || undefined,
            hoverImageUrl: data.hoverImageUrl as string || undefined,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : undefined,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined,
          } as Product;
        });

        // Create a map to store the first image URL found for each category
        const categoryImageMap: { [key: string]: string[] } = {};

        // Iterate through all products to find an image for each category
        initialProductCategories.forEach(category => {
          const productInCat = allProducts.find(p => p.category.toLowerCase() === category.id.toLowerCase() && p.images.length > 0);
          if (productInCat) {
            categoryImageMap[category.id] = [productInCat.images[0].src]; // Take the first image
          } else {
            // Fallback image if no products are found for a category
            categoryImageMap[category.id] = ['https://res.cloudinary.com/dzfzr4vwc/image/upload/v1752706000/default_category.jpg']; // A generic fallback image
          }
        });

        // Update the dynamicProductCategories state
        setDynamicProductCategories(
          initialProductCategories.map(category => ({
            ...category,
            images: categoryImageMap[category.id] || [],
          }))
        );

      } catch (error) {
        console.error("Error fetching products for category images:", error);
        // Optionally set a fallback for all categories on error
        setDynamicProductCategories(
          initialProductCategories.map(category => ({
            ...category,
            images: ['https://res.cloudinary.com/dzfzr4vwc/image/upload/v1752706000/default_category.jpg'],
          }))
        );
      }
    };

    fetchCategoryImages();
  }, [db, isAuthReady, APP_ID]); // Depend on db and isAuthReady

  // Removed old category image rotation effect as it's no longer needed.
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const vaultOpenedThisSession = sessionStorage.getItem('vaultOpenedThisSession') === 'true';
      setVaultOpen(isHomePage ? vaultOpenedThisSession : true);
    }
  }, [isHomePage]);

  // Callback to open the vault animation
  const openVault = useCallback(() => {
    if (!isHomePage || vaultOpen) return;
    if (!vaultLeftRef.current || !vaultRightRef.current || !vaultCenterRef.current || !vaultRef.current) return;

    const tl = gsap.timeline({
      onComplete: () => {
        setVaultOpen(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('vaultOpenedThisSession', 'true');
        }
      }
    });

    tl.to(vaultCenterRef.current, {
      duration: 0.5,
      // Updated boxShadow for silver/gold glow
      boxShadow: '0 0 30px #c0c0c0, 0 0 60px #ffffff, 0 0 90px #FFD166',
      ease: "power2.out"
    });
    tl.to(vaultCenterRef.current, {
      duration: 1.8,
      rotation: 360,
      ease: "elastic.out(1, 0.5)",
      transformOrigin: 'center center'
    }, "<0.5");
    tl.to(vaultLeftRef.current, {
      duration: 1.8,
      x: '-100%',
      rotationY: 15,
      transformOrigin: 'right center',
      ease: "power3.inOut"
    }, "<0.5");
    tl.to(vaultRightRef.current, {
      duration: 1.8,
      x: '100%',
      rotationY: -15,
      transformOrigin: 'left center',
      ease: "power3.inOut"
    }, "<");
    tl.to(vaultRef.current, {
      duration: 1,
      opacity: 0,
      scale: 0.9,
      ease: "power2.out",
      onComplete: () => {
        if (vaultRef.current) {
          vaultRef.current.style.display = 'none';
        }
      }
    }, "-=0.5");
  }, [isHomePage, vaultOpen]);

  // Effect for scroll-based animations
  useEffect(() => {
    if (!isClient || !vaultOpen || !isHomePage) return;
    ScrollTrigger.getAll().forEach((st: ScrollTrigger) => st.kill());

    // Target the .category-card class for animations
    gsap.utils.toArray('.category-card').forEach((card: any, i) => {
      gsap.fromTo(card,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: i * 0.1,
          scrollTrigger: {
            trigger: card,
            start: "top 90%",
            toggleActions: "play none none none"
          }
        }
      );
    });

    gsap.utils.toArray('section').forEach((section: any) => {
      if (section.classList.contains('vault-intro') && (isHomePage && !vaultOpen)) return;
      gsap.fromTo(section,
        { opacity: 0, y: 80 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          scrollTrigger: {
            trigger: section,
            start: "top 90%",
            toggleActions: "play none none none"
          }
        }
      );
    });

    const footerElement = document.querySelector('footer');
    if (footerElement) {
      gsap.fromTo(footerElement,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 1,
          scrollTrigger: {
            trigger: footerElement,
            start: "top 90%",
            toggleActions: "play none none none"
          }
        }
      );
    }
  }, [isClient, vaultOpen, isHomePage]);

  // Effect for rotating location text - UPDATED
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const locations = [
      "Seoul, South Korea", "Bangkok, Thailand", "Shanghai, China",
      "Kyoto, Japan", "Marrakech, Morocco", "Cusco, Peru",
      "Kathmandu, Nepal", "Ho Chi Minh City, Vietnam", "Havana, Cuba",
      "Manaus, Brazil", "Petra, Jordan", "Istanbul, Turkey", "Lisbon, Portugal", " "
    ];
    let index = 0;
    const interval = setInterval(() => {
      setCurrentLocation(locations[index]);
      index = (index + 1) % locations.length;
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleNewsletterSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail && db) {
      try {
        // Use setDoc with a specific ID (the email) to prevent duplicate subscriptions
        await setDoc(doc(collection(db, `artifacts/${APP_ID}/newsletter_subscribers`), newsletterEmail), {
          email: newsletterEmail,
          subscribedAt: new Date(),
        }, { merge: true }); // Use merge: true to avoid overwriting other fields if they exist
        setToastMessage("Thanks for joining! Welcome to the Keyholders!");
        setShowToast(true);
        setNewsletterEmail('');
        setTimeout(() => setShowToast(false), 3000);
      } catch (error) {
        console.error("Error adding newsletter subscriber:", error);
        setToastMessage("Failed to subscribe. Please try again.");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } else if (!newsletterEmail) {
        setToastMessage("Please enter your email.");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    } else {
      setToastMessage("Service not ready. Please try again in a moment.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingEmail(true);

    try {
      // Ensure this URL is correct and your Cloud Function is deployed
      const functionUrl = 'https://sendcontactemail-eljhfm2xgq-uc.a.run.app';

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactForm),
      });

      if (response.ok) {
        setToastMessage('Your message has been sent successfully!');
        setContactForm({ name: '', email: '', subject: '', message: '' });
      } else {
        const errorText = await response.text();
        setToastMessage(`Failed to send message: ${errorText}`);
      }
      setShowToast(true);
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setToastMessage('An unexpected error occurred. Please try again.');
      setShowToast(true);
    } finally {
      setIsSendingEmail(false);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleLoginClick = () => {
    router.push('/login');
  };

  const handleDashboardClick = () => {
    router.push('/dashboard');
  };

  // Loading state for the entire page
  // Changed condition from `loadingFirebase` to `!isAuthReady` as loadingFirebase isn't explicitly returned
  if (!isClient || !isAuthReady || !db) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-void-black text-white text-2xl">
        Loading ZORVH...
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-void-black">
      {isClient && showToast && (
        <Toast message={toastMessage} type="success" onClose={() => setShowToast(false)} />
      )}
      {isClient && (
        <MobileNav
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
          router={router}
          isLoggedIn={isLoggedIn}
          onLoginClick={handleLoginClick}
          onDashboardClick={handleDashboardClick}
        />
      )}
      {/* Vault Introduction Section (only on home page if not opened yet) */}
      {(!isClient && isHomePage) ? (
        <div className="flex items-center justify-center min-h-screen bg-void-black text-white">
          Loading ZORVH...
        </div>
      ) : (isHomePage && !vaultOpen) ? (
        <section
          ref={vaultRef}
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black cursor-pointer vault-intro`}
          onClick={openVault}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-void-black via-gray-900 to-black opacity-90" />
          <div className="absolute inset-0 flex overflow-hidden">
            <div
              ref={vaultLeftRef}
              // Reverted to silver-metal for dark metallic blue
              className="absolute top-0 left-0 w-1/2 h-full bg-silver-metal/90 border-r-4 border-silver-light/50 vault-door flex items-center justify-end pr-10"
            >
              <div className="w-16 h-full bg-gradient-to-r from-silver-metal/20 to-silver-metal/50 border-l border-silver-light/30 shadow-inner" />
            </div>
            <div
              ref={vaultRightRef}
              // Reverted to silver-metal for dark metallic blue
              className="absolute top-0 right-0 w-1/2 h-full bg-silver-metal/90 border-l-4 border-silver-light/50 vault-door flex items-center justify-start pl-10"
            >
              <div className="w-16 h-full bg-gradient-to-l from-silver-metal/20 to-silver-metal/50 border-r border-silver-light/30 shadow-inner" />
            </div>
            <div
              ref={vaultCenterRef}
              // Reverted to silver-metal and silver-light border, inner circle is translucent gold
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-silver-metal border-8 border-silver-light flex items-center justify-center shadow-2xl vault-dial"
            >
              <div className="w-36 h-36 rounded-full bg-treasure-gold/80 animate-pulse-slow relative z-10 flex items-center justify-center text-black text-2xl font-bold">
                {/* Removed the SVG icon */}
              </div>
            </div>
          </div>
          <div className="relative z-10 text-center animate-fade-in-up">
            <h1 className="text-6xl md:text-8xl font-black text-silver-metal mb-6 glitch-text" data-text="ZORVH">ZORVH</h1>
            <p className="text-xl md:text-2xl text-silver-light mb-8 max-w-xl mx-auto font-light">
              <span className="font-bold text-treasure-gold"></span>
            </p>
            <button
              className="px-10 py-4 bg-gradient-to-r from-treasure-gold to-amber-500 rounded-full font-bold text-xl text-black hover:scale-105 transition-transform shadow-xl transform hover:-translate-y-1"
              onClick={openVault}
            >
              ENTER THE VAULT
            </button>
          </div>
        </section>
      ) : (isClient && vaultOpen) ? (
        <>
          {/* Main Navigation */}
          <nav className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md py-4 px-8 border-b border-silver-light/30 shadow-lg">
            <div className="container mx-auto flex justify-between items-center">
              <div
                className="text-2xl font-bold text-silver-metal cursor-pointer hover:text-treasure-gold transition-colors"
                onClick={() => router.push('/')}
              >
                ZORVH
              </div>
              <ul className="hidden md:flex space-x-8">
                {['Home', 'Journey', 'Products', 'Stories', 'Team', 'Contact'].map((item) => ( // Updated 'Community' to 'Team'
                  <li key={item}>
                    <a
                      href={`#${item.toLowerCase()}`}
                      onClick={(e) => {
                        e.preventDefault();
                        if (item === 'Products') { // Conditional check for 'Products'
                          router.push('/products'); // Navigate to /products page
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
                    onClick={() => router.push('/cart')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white hover:text-treasure-gold transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {cartCount > 0 && (
                      <span className="cart-count absolute -top-1 -right-1 bg-globe-blue text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                        {cartCount}
                      </span>
                    )}
                  </button>
                </div>
                <button
                  className="hidden md:block px-5 py-2 border-2 border-treasure-gold rounded-full text-sm font-bold text-treasure-gold hover:bg-treasure-gold/10 transition-colors shadow-md transform hover:-translate-y-1"
                  onClick={() => router.push('/products')}
                >
                  SHOP NOW
                </button>
              </div>
            </div>
          </nav>

          {/* Home Section - Hero Area */}
          <section id="home" className="min-h-screen relative flex items-center justify-center pt-24 pb-12 overflow-hidden">
            {/* FIXED: Removed opacity-20 from here to prevent black corners */}
            <div className="absolute inset-0 z-0">
              <Image
                src="https://res.cloudinary.com/dh6sxfevk/image/upload/v1718627020/world-map_dj8jvj.png"
                alt="World Map"
                fill
                style={{ objectFit: 'cover' }}
                className="animate-pan-background"
                sizes="100vw"
              />
            </div>
            {isClient && (
              <div className="absolute top-24 right-8 z-10 bg-black/70 px-5 py-2 rounded-full border border-silver-light/30 animate-fade-in-down">
                <div className="flex items-center text-silver-light">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-globe-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-medium">Currently scouting: </span>
                  <span className="ml-1 font-bold text-treasure-gold">{currentLocation}</span>
                </div>
              </div>
            )}
            <div className="container mx-auto px-4 py-16 relative z-10 text-center">
              <div className="max-w-4xl mx-auto mb-16 animate-fade-in-up">
                <h1 className="text-5xl md:text-7xl font-extrabold mb-8 text-white leading-tight">
                  Your <span className="text-treasure-gold highlight-text">Global Treasure Vault</span> for <span className="text-globe-blue highlight-text">Unique Fashion</span>
                </h1>
                <p className="text-xl md:text-2xl text-white/90 mb-10 font-light">
                  Unearth rare pieces, each with an extraordinary story from vibrant street markets worldwide. Experience fashion with soul.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <button
                    className="px-8 py-4 border-2 border-treasure-gold rounded-full font-bold text-lg text-treasure-gold hover:bg-treasure-gold/10 transition-colors shadow-md transform hover:-translate-y-1"
                    onClick={() => router.push('/products')}
                  >
                    START YOUR DISCOVERY
                  </button>
                  <button
                    className="px-8 py-4 border-2 border-globe-blue rounded-full font-bold text-globe-blue hover:bg-globe-blue/10 transition-colors shadow-lg transform hover:-translate-y-1"
                    onClick={() => {
                      const element = document.getElementById('journey');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    LEARN OUR STORY
                  </button>
                </div>
                {/* This is where the old 4 featured product images were. They are now moved to the #products section below. */}
              </div>
            </div>
          </section>

          {/* NEW/UPDATED SECTION: CATEGORY CARDS - Moved below the Home hero buttons */}
          <section id="products" className="py-20 bg-black">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16 animate-fade-in-up">
                <h2 className="text-4xl md:text-6xl font-bold text-treasure-gold mb-4">EXPLORE OUR VAULTS BY CATEGORY</h2> {/* Updated title */}
                <p className="text-xl text-white/70 max-w-2xl mx-auto font-light">
                  Dive into our curated collections, each a unique chapter in global style.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"> {/* Changed to 3 columns for 6 items */}
                {dynamicProductCategories.map((category: ProductCategory) => ( // Use dynamicProductCategories here
                  <Link key={category.id} href={category.path} passHref>
                    <div className="category-card group relative overflow-hidden rounded-xl border border-treasure-gold/30 shadow-lg cursor-pointer transform hover:scale-[1.02] transition-transform duration-300">
                      <div className="h-64 relative flex items-center justify-center">
                        {category.images && category.images.length > 0 ? (
                          <Image
                            src={category.images[0]} // Display the first image from the dynamically set array
                            alt={category.name || 'Category Image'}
                            fill
                            style={{ objectFit: 'cover' }}
                            className="rounded-t-xl transition-opacity duration-500 ease-in-out group-hover:scale-105" // Added hover effect
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.classList.add('bg-gray-700', 'text-white/50', 'flex', 'items-center', 'justify-center', 'text-sm');
                                  parent.textContent = 'Image Load Error';
                                }
                            }}
                          />
                        ) : (
                          // Fallback for missing or empty 'images' array, or if first image has no 'src'
                          <div className="absolute inset-0 bg-gray-700 rounded-t-xl flex items-center justify-center text-white/50 text-sm">
                            No Category Image
                          </div>
                        )}
                        {/* No stock/origin badge for category cards */}
                      </div>
                      <div className="p-6 bg-black/70 rounded-b-xl">
                        <h3 className="text-xl font-bold text-white group-hover:text-treasure-gold transition-colors mb-2">
                          {category.name}
                        </h3>
                        <p className="text-white/80 text-base mb-4 line-clamp-2">
                          {category.description}
                        </p>
                        <div className="flex justify-center items-center mt-4">
                          <button
                            className="px-5 py-2 bg-treasure-gold rounded-full text-sm font-bold text-black hover:scale-105 transition-transform shadow-md transform hover:-translate-y-1 flex items-center gap-1"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent Link from triggering immediately
                                e.preventDefault(); // Prevent default link behavior
                                router.push(category.path);
                            }}
                          >
                            Explore {category.name}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-16 text-center animate-fade-in-up">
                <button
                  className="px-9 py-4 border-2 border-treasure-gold rounded-full font-bold text-lg text-treasure-gold hover:bg-treasure-gold/10 transition-colors shadow-md transform hover:-translate-y-1"
                  onClick={() => router.push('/products')}
                >
                  VIEW ALL CATEGORIES
                </button>
              </div>
            </div>
          </section>

          {/* Journey Section - UPDATED with single image and overlay text */}
          <section id="journey" className="py-20 bg-gradient-to-b from-black to-gray-900/50">
            <div className="container mx-auto px-4">
              <h2 className="text-4xl md:text-6xl font-bold mb-16 text-center text-treasure-gold animate-fade-in-up">THE JOURNEY OF ZORVH</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="relative animate-fade-in-left">
                  {/* Replaced the old image box with a new simple div and Image */}
                  <div className="relative w-full h-80 md:h-96 rounded-2xl overflow-hidden shadow-xl border border-treasure-gold/30">
                    <Image
                      src="https://res.cloudinary.com/dzfzr4vwc/image/upload/v1752684825/d3dfbdec-994e-4f3f-b5e2-06c4ac777797_smfwrv.jpg"
                      alt="Person Browse unique clothing, symbolizing global curation"
                      fill
                      style={{ objectFit: 'cover' }}
                      className="rounded-2xl"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    {/* Badge moved here, ensuring it's relative to this new image container */}
                    <div className="absolute bottom-4 right-4 bg-treasure-gold text-black px-4 py-2 rounded-lg font-bold text-md shadow-lg animate-bounce-slow">
                      5+ Countries Explored
                    </div>
                  </div>
                </div>
                <div className="animate-fade-in-right">
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">From Backpacking Dreams to Global Curation</h3>
                  <p className="text-lg text-white/80 mb-6 leading-relaxed">
                    Hi, I'm Prasha. My adventure began with a single backpack and a bunch of pinterest boards.
                    This journey evolved into ZORVH -- a mission to share the authentic pulse of global street fashion.
                  </p>
                  <p className="text-lg text-white/80 mb-6 leading-relaxed">
                    Every garment and accessory in our vault is personally handpicked.
                    I travel, discover local street vendors, and bring their unique stories and creations directly to you, ensuring your wardrobe is prepared to serve.
                  </p>
                  <div className="flex flex-wrap gap-3 mb-6">
                    {['Trendy', 'Affordable', 'Limited Pieces'].map((tag) => (
                      <span key={tag} className="px-4 py-2 bg-globe-blue/20 text-globe-blue rounded-full text-sm font-semibold border border-globe-blue/50">
                        {tag}
                      </span>
                    ))}
                  </div>

                </div>
              </div>
            </div>
          </section>

          {/* Stories Section */}
          <section id="stories" className="py-20 bg-gradient-to-b from-black to-globe-blue/10">
            <div className="container mx-auto px-4">
              <h2 className="text-4xl md:text-6xl font-bold mb-16 text-center text-treasure-gold animate-fade-in-up">Beyond Souvenirs: Postcard Street Style.</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* South Korea Postcard */}
                <div className="culture-card p-6 rounded-xl shadow-lg animate-fade-in-up delay-100">
                  <div className="aspect-square rounded-lg mb-4 overflow-hidden relative">
                    <Image
                      src="https://res.cloudinary.com/dzfzr4vwc/image/upload/v1752681407/korea_jii3bd.jpg"
                      alt="Seoul Street Fashion"
                      fill
                      style={{ objectFit: 'cover' }}
                      className="rounded-lg"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Greetings from Seoul!</h3>
                  <p className="text-white/70 mb-4 text-base">
                    Wish you were here to see the magic of K-fashion firsthand! Every street corner is a runway, with trends that are bold, innovative, and truly inspiring. The blend of traditional elegance and modern streetwear is something you have to see to believe. So much creativity in one city!
                  </p>
                </div>
                {/* Thailand Postcard */}
                <div className="culture-card p-6 rounded-xl shadow-lg animate-fade-in-up delay-200">
                  <div className="aspect-square rounded-lg mb-4 overflow-hidden relative">
                    <Image
                      src="https://res.cloudinary.com/dzfzr4vwc/image/upload/v1752681960/bangkok_knuelv.jpg"
                      alt="Bangkok Night Markets"
                      fill
                      style={{ objectFit: 'cover' }}
                      className="rounded-lg"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Hello from Bangkok!</h3>
                  <p className="text-white/70 mb-4 text-base">
                    The vibrancy here is infectious! From the bustling night markets to hidden alleyways, Thai fashion is a kaleidoscope of colors, intricate patterns, and effortless comfort. It's truly a celebration of individuality and joy. You'd love the energy!
                  </p>
                </div>
                {/* Shanghai Postcard */}
                <div className="culture-card p-6 rounded-xl shadow-lg animate-fade-in-up delay-300">
                  <div className="aspect-square rounded-lg mb-4 overflow-hidden relative">
                    <Image
                      src="https://res.cloudinary.com/dzfzr4vwc/image/upload/v1752681980/shanghai_zwlsto.jpg"
                      alt="Shanghai Modern Streetwear"
                      fill
                      style={{ objectFit: 'cover' }}
                      className="rounded-lg"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Greetings from Shanghai!</h3>
                  <p className="text-white/70 mb-4 text-base">
                    This city is an incredible fusion of eras! Picture traditional Chinese aesthetics meeting cutting-edge global streetwear. The style here is sophisticated yet daring, always a step ahead. You really feel like you're witnessing the future of fashion. Wish you could see it!
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Our Team Section */}
          <section id="team" className="py-20 bg-gradient-to-b from-gray-900/50 to-void-black">
            <div className="container mx-auto px-4 text-center animate-fade-in-up">
              <h2 className="text-4xl md:text-6xl font-bold text-silver-light mb-8">MEET THE ZORVH FAMILY</h2>
              <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-12 font-light">
                We're a family of passionate travelers, each bringing a unique eye for global style to ZORVH. Every piece we offer is a handpicked discovery, curated with love from our journeys.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {/* Prasha - Curates Tops & Dresses */}
                <div className="relative group overflow-hidden rounded-xl shadow-xl border border-silver-light/20 p-6 flex flex-col items-center justify-center text-center">
                  <div className="w-40 h-40 rounded-full overflow-hidden mb-4 relative flex-shrink-0">
                    <Image
                      src="https://res.cloudinary.com/dzfzr4vwc/image/upload/v1752684543/a178c759-e7f2-4cfc-9b69-453759a2ffba_ylve10.jpg"
                      alt="Prashasti Sharma, Curator of Tops and Dresses"
                      fill
                      style={{ objectFit: 'cover' }}
                      className="transition-transform duration-300 group-hover:scale-110"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-treasure-gold mb-2">Prashasti Sharma</h3>
                  <p className="text-white/70 text-lg">Curator of Flow & Form (Tops & Dresses)</p>
                  <p className="text-white/60 text-sm mt-2">
                    "From the vibrant silks of Southeast Asia to the structured elegance of Korean fashion, I seek pieces that capture the spirit of movement and individual expression."
                  </p>
                </div>
                {/* Akshay - Curates Bottoms & Outerwear */}
                <div className="relative group overflow-hidden rounded-xl shadow-xl border border-silver-light/20 p-6 flex flex-col items-center justify-center text-center">
                  <div className="w-40 h-40 rounded-full overflow-hidden mb-4 relative flex-shrink-0">
                    <Image
                      src="https://res.cloudinary.com/dzfzr4vwc/image/upload/v1752684542/d7adfffd-c58e-4c79-8832-08cfa497356b_j09tgo.jpg"
                      alt="Kshitiz Sharma, Curator of Bottoms and Outerwear"
                      fill
                      style={{ objectFit: 'cover' }}
                      className="transition-transform duration-300 group-hover:scale-110"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-treasure-gold mb-2">Kshitiz Sharma</h3>
                  <p className="text-white/70 text-lg">Curator of Foundation & Function (Bottoms & Outerwear)</p>
                  <p className="text-white/60 text-sm mt-2">
                    "My travels inspire me to find durable and versatile pieces – from Moroccan desert pants to urban Shanghai jackets – that form the foundation of any adventurous wardrobe."
                  </p>
                </div>
                {/* Zara - Curates Accessories & Footwear */}
                <div className="relative group overflow-hidden rounded-xl shadow-xl border border-silver-light/20 p-6 flex flex-col items-center justify-center text-center">
                  <div className="w-40 h-40 rounded-full overflow-hidden mb-4 relative flex-shrink-0">
                    <Image
                      src="https://res.cloudinary.com/dzfzr4vwc/image/upload/v1752684542/da568c48-9a89-456e-b241-c158fd4acbc0_ubdp0d.jpg"
                      alt="Moutushi Ganguli Sharma, Curator of Accessories and Footwear"
                      fill
                      style={{ objectFit: 'cover' }}
                      className="transition-transform duration-300 group-hover:scale-110"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-treasure-gold mb-2">Moutushi Ganguli Sharma</h3>
                  <p className="text-white/70 text-lg">Curator of Detail & Journey (Accessories & Footwear)</p>
                  <p className="text-white/60 text-sm mt-2">
                    "I believe the true story is in the details. My passion is discovering unique handcrafted accessories and comfortable, stylish footwear that completes any global look."
                  </p>
                </div>
              </div>
              <button className="mt-12 px-10 py-4 border-2 border-treasure-gold rounded-full font-bold text-xl text-treasure-gold hover:bg-treasure-gold/10 transition-colors shadow-md transform hover:-translate-y-1">
                CONTACT OUR FAMILY
              </button>
            </div>
          </section>

          {/* Contact Section */}
          <section id="contact" className="py-20 bg-gradient-to-r from-treasure-gold/10 to-globe-blue/10">
            <div className="container mx-auto px-4 text-center animate-fade-in-up">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">HAVE A QUESTION?</h2>
              <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-10">
                Whether it's about an order, a product's story, or a collaboration, our family is ready to assist your journey.
              </p>
              {/* Contact Form */}
              <div className="max-w-2xl mx-auto mt-8 p-8 rounded-xl bg-gray-900/50 shadow-lg border border-treasure-gold/20">
                <h3 className="text-2xl font-bold text-treasure-gold mb-6">Send Us a Message</h3>
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div>
                    <input
                      type="text"
                      name="name"
                      placeholder="Your Name"
                      value={contactForm.name}
                      onChange={handleContactFormChange}
                      required
                      className="w-full px-5 py-3 bg-gray-800/70 border border-silver-light/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-treasure-gold transition-colors"
                      disabled={isSendingEmail}
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      name="email"
                      placeholder="Your Email"
                      value={contactForm.email}
                      onChange={handleContactFormChange}
                      required
                      className="w-full px-5 py-3 bg-gray-800/70 border border-silver-light/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-treasure-gold transition-colors"
                      disabled={isSendingEmail}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="subject"
                      placeholder="Subject"
                      value={contactForm.subject}
                      onChange={handleContactFormChange}
                      required
                      className="w-full px-5 py-3 bg-gray-800/70 border border-silver-light/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-treasure-gold transition-colors"
                      disabled={isSendingEmail}
                    />
                  </div>
                  <div>
                    <textarea
                      name="message"
                      rows={5}
                      placeholder="Your Message"
                      value={contactForm.message}
                      onChange={handleContactFormChange}
                      required
                      className="w-full px-5 py-3 bg-gray-800/70 border border-silver-light/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-treasure-gold transition-colors resize-y"
                      disabled={isSendingEmail}
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full px-8 py-4 bg-gradient-to-r from-treasure-gold to-amber-500 rounded-full font-bold text-black text-lg hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={isSendingEmail}
                  >
                    {isSendingEmail ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      'SEND MESSAGE'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-16 bg-gradient-to-t from-black to-gray-900 border-t border-treasure-gold/30 shadow-inner">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                <div>
                  <h3 className="text-3xl font-black text-silver-metal mb-4">ZORVH</h3>
                  <p className="text-white/70 mb-6 leading-relaxed">
                    Your portal to authentic street fashion, handpicked from vibrant cultures across the globe. Each piece, a story.
                  </p>
                  <div className="flex gap-4">
                    <a href="https://facebook.com/zorvh.vault" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-10 h-10 rounded-full bg-silver-metal/10 flex items-center justify-center hover:bg-silver-metal/20 transition-colors cursor-pointer text-white hover:text-treasure-gold">
                      <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-5 h-5"
                      >
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                      </svg>
                    </a>
                    <a href="https://instagram.com/zorvh.vault" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-10 h-10 rounded-full bg-silver-metal/10 flex items-center justify-center hover:bg-silver-metal/20 transition-colors cursor-pointer text-white hover:text-treasure-gold">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-5 h-5"
                    >
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                    </a>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-4">Explore</h4>
                  <ul className="space-y-3">
                    {['New Arrivals', 'Bestsellers', 'Outerwear', 'Accessories', 'Dresses', 'Jewelry'].map((item) => (
                      <li key={item}>
                        <a href="#" className="text-white/70 hover:text-treasure-gold transition-colors font-light text-base">{item}</a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-4">Support</h4>
                  <ul className="space-y-3">
                    {[
                      { name: 'Contact Us', path: '/contact' },
                      { name: 'FAQ', path: '/faq' },
                      { name: 'Shipping & Delivery', path: '/shipping' },
                      { name: 'Returns & Exchanges', path: '/returns' },
                      { name: 'Privacy Policy', path: '/privacy' }
                    ].map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.path}
                          className="text-white/70 hover:text-treasure-gold transition-colors font-light text-base"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                    {isLoggedIn && (
                      <li>
                        <button
                          onClick={logout}
                          className="text-white/70 hover:text-red-500 transition-colors font-light text-base w-full text-left"
                        >
                          Logout
                        </button>
                      </li>
                    )}
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-4 mt-6">Account</h4>
                  <ul className="space-y-3">
                    {isLoggedIn ? (
                      <li>
                        <Link
                          href="/dashboard"
                          className="text-white/70 hover:text-globe-blue transition-colors font-light text-base"
                        >
                          User Dashboard
                        </Link>
                      </li>
                    ) : (
                      <li>
                        <Link
                          href="/login"
                          className="text-white/70 hover:text-silver-metal transition-colors font-light text-base"
                        >
                          Login / Register
                        </Link>
                      </li>
                    )}
                  </ul>
                  <h4 className="text-lg font-bold text-white mb-4 mt-6">Join Our Newsletter</h4> {/* Changed title here */}
                  <p className="text-white/70 mb-4 text-base leading-relaxed">
                    Stay updated with new arrivals and exclusive insights from our global adventures!
                  </p>
                  <form className="flex w-full" onSubmit={handleNewsletterSignup}>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="flex-grow bg-gray-800/50 border border-treasure-gold/30 px-4 py-2 rounded-l-lg text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-treasure-gold transition-all"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      className="border-2 border-treasure-gold text-treasure-gold px-5 py-2 rounded-r-lg font-bold hover:bg-treasure-gold/10 transition-colors shadow-md"
                    >
                      JOIN
                    </button>
                  </form>
                  <div className="mt-6 flex items-center text-white/70 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-globe-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Currently curating in: <span className="font-semibold text-treasure-gold">{currentLocation}</span></span>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </>
      ) : null}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        html {
          scroll-behavior: smooth;
        }
        body {
          font-family: 'Inter', sans-serif;
          overflow-x: hidden;
        }
        :root {
          --void-black: #0A0F16;
          --treasure-gold: #FFD166;
          --globe-blue: #3DCCC7;
          --silver-metal: #c0c0c0;
          --silver-light: #e0e0e0;
        }
        .bg-void-black { background-color: var(--void-black); }
        .text-treasure-gold { color: var(--treasure-gold); }
        .bg-treasure-gold { background-color: var(--treasure-gold); }
        .border-treasure-gold { border-color: var(--treasure-gold); }
        .text-globe-blue { color: var(--globe-blue); }
        .bg-globe-blue { background-color: var(--globe-blue); }
        .text-silver-metal { color: var(--silver-metal); }
        .bg-silver-metal { background-color: var(--silver-metal); }
        .text-silver-light { color: var(--silver-light); }
        .bg-silver-light { background-color: var(--silver-light); }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInLeft {
          0% { opacity: 0; transform: translateX(-30px); }
          100% { transform: translateX(0); }
        }
        @keyframes fadeInRight {
          0% { opacity: 0; transform: translateX(30px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pan-background {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-pulse-slow { animation: pulse-slow 2.5s infinite ease-in-out alternate; }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.7s ease-out forwards; }
        .animate-fade-in-down { animation: fadeInDown 0.7s ease-out forwards; }
        .animate-fade-in-left { animation: fadeInLeft 0.7s ease-out forwards; }
        .animate-fade-in-right { animation: fadeInRight 0.7s ease-out forwards; }
        .animate-bounce-slow { animation: bounce-slow 2s infinite ease-in-out; }
        .animate-pan-background { animation: pan-background 30s linear infinite alternate; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }

        /* Styles for both culture and category cards */
        .culture-card, .category-card {
          position: relative;
          overflow: hidden;
          background: rgba(20, 20, 30, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 209, 102, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4),
                      inset 0 0 20px rgba(255, 209, 102, 0.15);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .culture-card:hover, .category-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 45px rgba(255, 209, 102, 0.25),
                      inset 0 0 30px rgba(255, 209, 102, 0.3);
        }
        .culture-card::before, .category-card::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(
            transparent,
            rgba(255, 209, 102, 0.35),
            transparent 30%
          );
          animation: rotate 8s linear infinite;
          z-index: -1;
        }
        @keyframes rotate {
          100% { transform: rotate(360deg); }
        }
        .glitch-text {
          position: relative;
          color: var(--silver-light);
          animation: glitch 1s infinite;
        }
        .glitch-text::before,
        .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        .glitch-text::before {
          left: 2px;
          text-shadow: -2px 0 var(--treasure-gold);
          animation: glitch-anim-1 2s infinite linear alternate-reverse;
          clip-path: inset(var(--y-glitch-offset, 0%) 0 calc(100% - var(--y-glitch-offset, 0%) - 1%) 0);
        }
        .glitch-text::after {
          left: -2px;
          text-shadow: 2px 0 var(--globe-blue);
          animation: glitch-anim-2 2.5s infinite linear alternate-reverse;
          clip-path: inset(var(--y-glitch-offset, 0%) 0 calc(100% - var(--y-glitch-offset, 0%) - 1%) 0);
        }
        @keyframes glitch-anim-1 {
          0% { clip-path: inset(5% 0 95% 0); --y-glitch-offset: 5; }
          20% { clip-path: inset(80% 0 10% 0); --y-glitzh-offset: 80; }
          40% { clip-path: inset(10% 0 80% 0); --y-glitch-offset: 10; }
          60% { clip-path: inset(70% 0 20% 0); --y-glitch-offset: 70; }
          80% { clip-path: inset(25% 0 65% 0); --y-glitch-offset: 25; }
          100% { clip-path: inset(90% 0 5% 0); --y-glitch-offset: 90; }
        }
        @keyframes glitch-anim-2 {
          0% { clip-path: inset(20% 0 70% 0); --y-glitch-offset: 20; }
          25% { clip-path: inset(90% 0 0% 0); --y-glitch-offset: 90; }
          50% { clip-path: inset(0% 0 90% 0); --y-glitch-offset: 0; }
          75% { clip-path: inset(60% 0 30% 0); --y-glitch-offset: 60; }
          100% { clip-path: inset(35% 0 55% 0); --y-glitch-offset: 35; }
        }
        .highlight-text {
          position: relative;
          display: inline-block;
        }
        .highlight-text::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -5px;
          width: 100%;
          height: 3px;
          background-color: currentColor;
          transform: scaleX(0);
          transform-origin: bottom right;
          transition: transform 0.3s ease-out;
        }
        .highlight-text:hover::after {
          transform: scaleX(1);
          transform-origin: bottom left;
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #1a1a1a;
        }
        ::-webkit-scrollbar-thumb {
          background-color: var(--treasure-gold);
          border-radius: 10px;
          border: 2px solid var(--void-black);
        }
        ::-webkit-scrollbar-thumb:hover {
          background-color: #fdd878;
        }
      `}</style>
    </div>
  );
}
