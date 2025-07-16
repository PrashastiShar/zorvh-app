// frontend/src/app/products/page.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation'; // <<< ADDED: useSearchParams
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Product, CartItem, ProductImage } from '@/types/index';
import { useFirebase, APP_ID } from '@/components/FirebaseProvider';
import {
  collection,
  onSnapshot,
  DocumentData,
  QuerySnapshot,
  query,
  orderBy,
  where,
  doc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import gsap from 'gsap';

// --- Mobile Navigation Component (No Changes Needed) ---
interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  router: ReturnType<typeof useRouter>;
  isLoggedIn: boolean;
  onLoginClick: () => void;
  onDashboardClick: () => void;
  pathname: string;
}

const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose, router, isLoggedIn, onLoginClick, onDashboardClick, pathname }) => {
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
    setTimeout(() => {
      if (pathname !== '/') {
        router.push(`/#${sectionId}`);
      } else {
        const element = document.getElementById(sectionId);
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
        {['Home', 'Journey', 'Products', 'Stories', 'Community', 'Contact'].map((item) => (
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

// --- Toast component (MUST BE DEFINED OUTSIDE the main component) ---
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

// Main ProductsPage component (default export)
export default function ProductsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams(); // <<< ADDED: Get search parameters for the current page
  const { db, loadingFirebase, currentUser: user, logout, isAuthReady } = useFirebase();
  const { cart, addToCart, cartCount } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [userWishlistIds, setUserWishlistIds] = useState<string[]>([]);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const isLoggedIn = !!user;

  const categories = ['all', 'tops', 'skirts', 'shoes', 'stockings', 'jewelry', 'handbags'];
  // <<< MODIFIED: Initialize selectedCategory from URL or default to 'all'
  const initialCategory = searchParams.get('category') || 'all';
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);

  // <<< ADDED: Effect to update selectedCategory when URL category changes
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl && selectedCategory !== categoryFromUrl) {
      setSelectedCategory(decodeURIComponent(categoryFromUrl));
    } else if (!categoryFromUrl && selectedCategory !== 'all') {
      // If category param is removed from URL, reset to 'all'
      setSelectedCategory('all');
    }
  }, [searchParams, selectedCategory]);


  useEffect(() => {
    if (!db || !user?.uid || !isAuthReady) {
      setUserWishlistIds([]);
      return;
    }

    const wishlistCollectionRef = collection(db, `artifacts/${APP_ID}/users/${user.uid}/wishlist`);
    const unsubscribeWishlist = onSnapshot(wishlistCollectionRef, (snapshot) => {
      const fetchedWishlistIds: string[] = snapshot.docs.map(doc => doc.id);
      setUserWishlistIds(fetchedWishlistIds);
    }, (err) => {
      console.error("Error fetching user wishlist IDs:", err);
    });

    return () => unsubscribeWishlist();
  }, [db, user, isAuthReady, APP_ID]);


  useEffect(() => {
    if (!db || loadingFirebase) {
      return;
    }

    setLoadingProducts(true);
    const productsCollectionRef = collection(db, `artifacts/${APP_ID}/products`);

    let productsQuery = query(productsCollectionRef, orderBy('createdAt', 'desc'));
    // Ensure the Firestore query matches the selectedCategory state
    if (selectedCategory !== 'all') {
      productsQuery = query(productsCollectionRef, where('category', '==', selectedCategory), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(productsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
      const fetchedProducts: Product[] = snapshot.docs.map(doc => {
        const data = doc.data();

        // --- START MODIFIED LOGIC FOR IMAGES ---
        let fetchedImages: ProductImage[] = [];

        // Prioritize 'images' array if it exists and has content (new structure)
        if (data.images && Array.isArray(data.images) && data.images.length > 0) {
            fetchedImages = data.images.map((img: any, index: number) => ({
                id: img.id || `${doc.id}-img-${index}`,
                src: img.src || img, // Handles both object {src, alt} and direct string URL
                alt: img.alt || `${data.name || 'Product'} Image ${index + 1}`
            }));
        }
        // Fallback to 'imageUrl' array if 'images' is not present or empty (your current structure)
        else if (data.imageUrl && Array.isArray(data.imageUrl) && data.imageUrl.length > 0) {
            fetchedImages = data.imageUrl.map((url: string, index: number) => ({
                id: `${doc.id}-main-${index}`, // Unique ID for each fallback image
                src: url,
                alt: `${data.name || 'Product'} Image ${index + 1}`
            }));
        }
        // Handle single `imageUrl` string as a last resort (less common for multiple images but good for robustness)
        else if (data.imageUrl && typeof data.imageUrl === 'string') {
            fetchedImages.push({
                id: `${doc.id}-main-single`,
                src: data.imageUrl,
                alt: `${data.name || 'Product'} Main Image`
            });
        }
        // --- END MODIFIED LOGIC FOR IMAGES ---

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
      setProducts(fetchedProducts);
      setLoadingProducts(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      setToastMessage("Failed to load products. Please try again later.");
      setToastType('error');
      setShowToast(true);
      setLoadingProducts(false);
    });

    return () => unsubscribe();
  }, [db, loadingFirebase, APP_ID, selectedCategory]); // <<< Ensure selectedCategory is a dependency


  const handleAddToCart = (productToAdd: Product) => {
    if (productToAdd.stock === 0) {
      setToastMessage(`${productToAdd.name} is currently out of stock.`);
      setToastType('error');
      setShowToast(true);
      return;
    }

    const defaultSize = productToAdd.sizes && productToAdd.sizes.length > 0
      ? (productToAdd.sizes.includes('M') ? 'M' : productToAdd.sizes[0])
      : 'One Size';

    const currentCartItem = cart.find(item => item.id === productToAdd.id && item.size === defaultSize);
    const quantityInCart = currentCartItem ? currentCartItem.quantity : 0;

    if ((quantityInCart + 1) > productToAdd.stock) {
      setToastMessage(`Cannot add more. Only ${productToAdd.stock - quantityInCart} of ${productToAdd.name} (Size: ${defaultSize}) left!`);
      setToastType('error');
      setShowToast(true);
      return;
    }

    addToCart(productToAdd, defaultSize, 1);
    setToastMessage(`${productToAdd.name} added to cart!`);
    setToastType('success');
    setShowToast(true);
  };

  const toggleFavorite = async (product: Product, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();

    if (!db || !user?.uid) {
      setToastMessage("Please log in to add items to your wishlist.");
      setToastType('error');
      setShowToast(true);
      return;
    }

    const wishlistDocRef = doc(db, `artifacts/${APP_ID}/users/${user.uid}/wishlist`, product.id);

    try {
      if (userWishlistIds.includes(product.id)) {
        await deleteDoc(wishlistDocRef);
        setToastMessage("Removed from favorites!");
        setToastType('success');
      } else {
        await setDoc(wishlistDocRef, {
          name: product.name,
          price: product.price,
          imageUrl: product.images.length > 0 ? product.images[0].src : null,
          origin: product.origin || 'Unknown',
        });
        setToastMessage("Added to favorites!");
        setToastType('success');
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      setToastMessage("Failed to update wishlist. Please try again.");
      setToastType('error');
    }
    setShowToast(true);
  };

  // <<< MODIFIED: Handle category selection to also update the URL
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === 'all') {
      router.push('/products'); // Go to /products if 'all' is selected
    } else {
      router.push(`/products?category=${encodeURIComponent(category)}`); // Add category query param
    }
  };

  const handleLoginClick = () => {
    router.push('/login');
  };

  const handleDashboardClick = () => {
    router.push('/dashboard');
  };

  const handleCartClick = () => {
    gsap.to('.cart-count', {
      scale: 1.5,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      ease: "power2.out",
      onComplete: () => router.push('/cart')
    });
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-void-black">
      {/* --- Embedded Header Start --- */}
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
                  href={`/#${item.toLowerCase()}`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (pathname !== '/') {
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
                onClick={handleCartClick}
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
        pathname={pathname}
      />

      {showToast && (
        <Toast message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />
      )}
      <div className="container mx-auto px-4 py-12 pt-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center text-treasure-gold">
          GLOBAL TREASURES VAULT
        </h1>

        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)} // <<< MODIFIED: Use handleCategoryChange
              className={`px-6 py-2 rounded-full font-semibold text-lg transition-colors duration-200
                          ${selectedCategory === category
                            ? 'bg-treasure-gold text-black shadow-md'
                            : 'bg-gray-800/50 text-white/80 hover:bg-gray-700/70 border border-transparent hover:border-treasure-gold/50'
                          }`}
            >
              {category === 'all' ? 'All Products' : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.length === 0 ? (
            <div className="col-span-full text-center text-white/70 text-lg py-10">
              No products found for this category.
            </div>
          ) : (
            products.map((product: Product) => (
              // <<< MODIFIED: Pass currentCategory as a query parameter to the product detail page
              <Link key={product.id} href={`/products/${product.id}?category=${encodeURIComponent(selectedCategory)}`} passHref>
                <div
                  className={`product-card bg-gray-800/60 rounded-xl p-4 shadow-xl relative overflow-hidden
                    hover:shadow-treasure-gold/40 transition-all duration-300 ease-in-out cursor-pointer group`}
                >
                  <div className="relative w-full h-48 overflow-hidden rounded-lg mb-4 flex items-center justify-center">
                    {/* Render the first image from the 'images' array or hoverImageUrl as the primary image */}
                    {(product.images && product.images.length > 0) || product.hoverImageUrl ? (
                      <Image
                        // Prioritize hoverImageUrl if it exists, otherwise use the first image from 'images'
                        src={product.hoverImageUrl || (product.images.length > 0 ? product.images[0].src : '')}
                        alt={product.images.length > 0 ? product.images[0].alt : product.name || 'Product Image'}
                        fill
                        style={{ objectFit: 'cover' }}
                        className="rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                      <div className="absolute inset-0 bg-gray-700 rounded-lg flex items-center justify-center text-white/50 text-sm">
                        No Image Available
                      </div>
                    )}
                    {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
                        <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold z-10">
                            Low Stock! ({product.stock} left)
                        </span>
                    )}
                    {product.stock === 0 && (
                        <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-semibold z-10">
                            Out of Stock
                        </span>
                    )}
                  </div>

                  <div className="text-center md:text-left">
                    <h3 className="text-xl font-bold text-treasure-gold mb-1">{product.name}</h3>
                    {product.description && <p className="text-sm text-white/80 mb-2 line-clamp-2">{product.description}</p>}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-semibold text-white">₹{product.price.toFixed(2)}</span>
                      <span className="bg-globe-blue text-black text-xs px-2 py-1 rounded-full font-semibold">
                        {product.origin.split(',')[0]}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <button
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleAddToCart(product);
                        }}
                        className="flex-1 px-4 py-2 rounded-full font-bold text-sm
                            hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                            border-2 border-globe-blue text-globe-blue bg-transparent hover:bg-globe-blue hover:text-black"
                        disabled={product.stock === 0}
                      >
                        ADD TO CART
                      </button>
                      <button
                        onClick={(e) => toggleFavorite(product, e)}
                        className="ml-2 p-2 rounded-full bg-gray-700/50 hover:bg-gray-600/70 transition-colors duration-200"
                        aria-label={userWishlistIds.includes(product.id) ? "Remove from favorites" : "Add to favorites"}
                      >
                        {userWishlistIds.includes(product.id) ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-black/90 p-6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex flex-col justify-center">
                    <h4 className="text-treasure-gold font-bold mb-2">THE STORY</h4>
                    <p className="text-white/80 text-sm">{product.story}</p>
                    <div className="mt-4 text-globe-blue flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-xs">{product.origin}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}