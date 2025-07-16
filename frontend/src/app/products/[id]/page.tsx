// frontend/src/app/products/[id]/page.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, usePathname, useSearchParams } from 'next/navigation'; // Import useSearchParams
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { Product, CartItem, ProductImage, DeliveryStatus } from '@/types/index';
import { useFirebase, APP_ID } from '@/components/FirebaseProvider';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot
} from 'firebase/firestore';

import { Heart } from 'lucide-react';

import Header from '@/components/header';

// --- Toast Component (No Changes Needed) ---
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

// --- ProductPage Component ---
export default function ProductPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { cart, addToCart } = useCart();
  const params = useParams();
  const searchParams = useSearchParams(); // <<< ADDED: Get search parameters
  const id = params.id as string;

  // Destructure currentUser and isAuthReady from useFirebase
  const { db, loadingFirebase, currentUser, isAuthReady } = useFirebase();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [userWishlistIds, setUserWishlistIds] = useState<string[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // <<< ADDED: State to store the category from the previous page's URL
  const [previousCategory, setPreviousCategory] = useState<string | null>(null);

  // <<< ADDED: Effect to read the category from URL search params
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl) {
      setPreviousCategory(decodeURIComponent(categoryFromUrl)); // Decode if it was encoded
    }
  }, [searchParams]);

  // Effect to listen for changes in the user's Firestore wishlist
  useEffect(() => {
    if (!db || !currentUser?.uid || !isAuthReady) {
      setUserWishlistIds([]);
      console.log("Skipping wishlist ID fetch on product page: DB unavailable, user not logged in, or auth not ready.");
      return;
    }

    const wishlistCollectionRef = collection(db, `artifacts/${APP_ID}/users/${currentUser.uid}/wishlist`);
    const unsubscribeWishlist = onSnapshot(wishlistCollectionRef, (snapshot) => {
      const fetchedWishlistIds: string[] = snapshot.docs.map(doc => doc.id);
      setUserWishlistIds(fetchedWishlistIds);
      console.log("Fetched wishlist IDs for product page:", fetchedWishlistIds);
    }, (err) => {
      console.error("Error fetching user wishlist IDs on product page:", err);
    });

    return () => unsubscribeWishlist();
  }, [db, currentUser, isAuthReady, APP_ID]);

  useEffect(() => {
    if (!db || loadingFirebase) {
      return;
    }

    const fetchProduct = async () => {
      try {
        const productDocRef = doc(db, `artifacts/${APP_ID}/products`, id);
        const productDocSnap = await getDoc(productDocRef);

        if (productDocSnap.exists()) {
          const data = productDocSnap.data();

          let fetchedImages: ProductImage[] = [];

          // Prioritize 'images' array if it exists and has content (new structure)
          if (data.images && Array.isArray(data.images) && data.images.length > 0) {
            fetchedImages = data.images.map((img: any, index: number) => ({
              id: img.id || `${id}-img-${index}`,
              src: img.src || img, // Handles both object {src, alt} and direct string URL
              alt: img.alt || `${data.name || 'Product'} Image ${index + 1}`
            }));
          }
          // Fallback to 'imageUrl' array if 'images' is not present or empty (your current structure)
          else if (data.imageUrl && Array.isArray(data.imageUrl) && data.imageUrl.length > 0) {
            fetchedImages = data.imageUrl.map((url: string, index: number) => ({
              id: `${id}-main-${index}`, // Unique ID for each fallback image
              src: url,
              alt: `${data.name || 'Product'} Image ${index + 1}`
            }));
          }
          // Fallback for single 'imageUrl' string (older structure or single image products)
          else if (data.imageUrl && typeof data.imageUrl === 'string') {
            fetchedImages.push({
              id: `${id}-main-single`,
              src: data.imageUrl,
              alt: `${data.name || 'Product'} Main Image`
            });
          }

          const fetchedProduct: Product = {
            id: productDocSnap.id,
            name: data.name as string,
            price: data.price as number,
            category: data.category as string,
            origin: data.origin as string,
            story: data.story as string,
            images: fetchedImages, // Use the processed 'fetchedImages' array
            stock: data.stock as number,

            description: data.description as string || undefined,
            details: data.details as string || undefined,
            sizes: data.sizes as string[] || undefined, // Ensure this matches your Firebase field (should be 'sizes' array)
            attributes: data.attributes || undefined,
            hoverImageUrl: data.hoverImageUrl as string || undefined,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : undefined,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined,
          };

          setProduct(fetchedProduct);

          if (fetchedProduct.sizes && fetchedProduct.sizes.length > 0) {
            setSelectedSize(fetchedProduct.sizes.includes('M') ? 'M' : fetchedProduct.sizes[0]);
          } else {
            setSelectedSize('One Size');
          }

        } else {
          console.error("Product not found for ID:", id);
          setProduct(null);
          router.push('/404');
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setProduct(null);
        router.push('/error');
      }
    };

    fetchProduct();
  }, [id, db, loadingFirebase, router, APP_ID]);

  const images: ProductImage[] = product?.images || [];

  const handleFavoriteToggle = async () => {
    if (!product) return;

    if (!db || !currentUser?.uid) {
      setToastMessage("Please log in to add items to your wishlist.");
      setToastType('error');
      setShowToast(true);
      return;
    }

    const wishlistDocRef = doc(db, `artifacts/${APP_ID}/users/${currentUser.uid}/wishlist`, product.id);

    try {
      if (userWishlistIds.includes(product.id)) {
        await deleteDoc(wishlistDocRef);
        setToastMessage("Removed from favorites!");
        setToastType('success');
      } else {
        await setDoc(wishlistDocRef, {
          name: product.name,
          price: product.price,
          imageUrl: product.images[0]?.src || null, // Use the first image from the 'images' array
          origin: product.origin || 'Unknown',
        });
        setToastMessage("Added to favorites!");
        setToastType('success');
      }
    } catch (error) {
      console.error("Error toggling favorite on product detail page:", error);
      setToastMessage("Failed to update wishlist. Please try again.");
      setToastType('error');
    }
    setShowToast(true);
  };

  const handleAddToCart = () => {
    if (!product) return;

    const currentCartItem = cart.find((item: CartItem) => item.id === product.id && item.size === selectedSize);
    const quantityInCart = currentCartItem ? currentCartItem.quantity : 0;

    if (product.stock !== undefined && (quantityInCart + quantity) > product.stock) {
      setToastMessage(`Cannot add ${quantity} more. Only ${product.stock - quantityInCart} left in stock!`);
      setToastType('error');
      setShowToast(true);
      return;
    }

    addToCart(product, selectedSize, quantity);
    setToastMessage("Item added to cart!");
    setToastType('success');
    setShowToast(true);
    router.push('/cart');
  };

  // <<< ADDED: Function to determine the correct back path
  const getBackPath = () => {
    if (previousCategory && previousCategory !== 'All') { // 'All' is often a default, treat it as general products
      return `/products?category=${encodeURIComponent(previousCategory)}`;
    }
    return '/products'; // Default to the general products page
  };

  if (loadingFirebase || !product) {
    return (
      <div className="min-h-screen bg-void-black text-white flex items-center justify-center text-xl">
        Loading product...
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-void-black">
      <Header />
      {showToast && (
        <Toast message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />
      )}
      <div className="container mx-auto px-4 py-12 pt-20">
        <button
          onClick={() => router.push(getBackPath())} // <<< MODIFIED: Use router.push with dynamic path
          className="mb-8 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
          aria-label={`Back to ${previousCategory ? previousCategory + ' Products' : 'Products'}`} // <<< MODIFIED: Dynamic aria-label
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to {previousCategory ? `${previousCategory} Products` : 'Products'} {/* <<< MODIFIED: Dynamic text */}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images Section */}
          <div>
            <div className="bg-gray-800/50 rounded-xl h-96 mb-6 relative flex items-center justify-center overflow-hidden">
              {images.length > 0 && images[selectedImage].src ? (
                <Image
                  src={images[selectedImage].src}
                  alt={images[selectedImage].alt}
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
            </div>

            <div className="grid grid-cols-4 gap-4">
              {images.map((image: ProductImage, index: number) => (
                <div
                  key={image.id}
                  className={`bg-gray-800/50 rounded-lg h-24 relative flex items-center justify-center cursor-pointer border-2 ${selectedImage === index ? 'border-treasure-gold' : 'border-transparent'} transition-all duration-200`}
                  onClick={() => setSelectedImage(index)}
                  aria-label={`View image ${index + 1} of ${product.name}`}
                >
                  {image.src ? (
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      style={{ objectFit: 'cover' }}
                      className="rounded-lg"
                      sizes="(max-width: 768px) 25vw, 10vw"
                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.classList.add('bg-gray-700', 'text-white/50', 'flex', 'items-center', 'justify-center', 'text-xs');
                            parent.textContent = 'Error';
                          }
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gray-700 rounded-lg flex items-center justify-center text-white/50 text-xs">
                      No Thumb
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Product Details Section */}
          <div>
            <div className="mb-6">
              <span className="bg-globe-blue text-black text-xs px-2 py-1 rounded-full font-semibold">
                {product.origin.split(',')[0]}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-treasure-gold">{product.name}</h1>
            <p className="text-treasure-gold text-2xl font-bold mb-6">₹{product.price.toFixed(2)}</p>

            {product.description && <p className="text-gray-300 mb-8 leading-relaxed">{product.description}</p>}

            {/* Size selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-3 text-white">Size</h3>
                <div className="flex gap-3">
                  {product.sizes.map(s => (
                    <button
                      key={s}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-all duration-200
                                ${selectedSize === s ? 'bg-treasure-gold text-black shadow-lg' : 'bg-gray-800/50 text-white/80 hover:bg-gray-700'}`}
                      onClick={() => setSelectedSize(s)}
                      aria-pressed={selectedSize === s}
                      aria-label={`Select size ${s}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity selection */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-3 text-white">Quantity</h3>
              <div className="flex items-center">
                <button
                  className="bg-gray-800/50 w-12 h-12 rounded-l-lg flex items-center justify-center hover:bg-gray-700 transition-colors duration-200"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <div className="bg-gray-800/50 w-16 h-12 flex items-center justify-center text-xl font-bold">
                  {quantity}
                </div>
                <button
                  className="bg-gray-800/50 w-12 h-12 rounded-r-lg flex items-center justify-center hover:bg-gray-700 transition-colors duration-200"
                  onClick={() => setQuantity(q => q + 1)}
                  aria-label="Increase quantity"
                  disabled={product.stock !== undefined && quantity >= product.stock}
                >
                  +
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 mb-8">
              <button
                className="flex-1 py-4 bg-gradient-to-r from-treasure-gold to-amber-500 rounded-full font-bold text-black hover:scale-105 transition-transform duration-300 ease-out shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleAddToCart}
                aria-label="Add to cart"
                disabled={product.stock <= 0}
              >
                {product.stock <= 0 ? 'OUT OF STOCK' : 'ADD TO CART'}
              </button>
              <button
                className={`w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors duration-200 ${userWishlistIds.includes(product.id) ? 'text-red-500' : 'text-white/60'}`}
                onClick={handleFavoriteToggle}
                aria-label={userWishlistIds.includes(product.id) ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart size={24} fill={userWishlistIds.includes(product.id) ? "currentColor" : "none"} />
              </button>
            </div>

            {/* New: Stock Information */}
            {product.stock !== undefined && (
              <div className="mb-8 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 flex items-center text-white">
                <span className="mr-2">📦</span>
                {product.stock > 10 && <span className="text-green-400">In Stock: {product.stock} units available.</span>}
                {product.stock <= 10 && product.stock > 0 && <span className="text-orange-400">Low Stock: Only {product.stock} units left!</span>}
                {product.stock === 0 && <span className="text-red-400">Currently Out of Stock.</span>}
              </div>
            )}

            {/* New: Product Specifications/Attributes (Example) */}
            {product.attributes && Object.keys(product.attributes).length > 0 && (
              <div className="mb-8 p-6 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <h3 className="text-xl font-bold mb-3 text-treasure-gold">Specifications</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  {Object.entries(product.attributes).map(([key, value]) => (
                    <li key={key}>
                      <span className="font-semibold capitalize">{key}:</span> {value}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.details && (
              <div className="mb-8 p-6 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <h3 className="text-xl font-bold mb-3 text-treasure-gold">Product Details</h3>
                <p className="text-gray-300 leading-relaxed">{product.details}</p>
              </div>
            )}

            {product.story && (
              <div className="mb-8 p-6 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <h3 className="text-xl font-bold mb-3 text-treasure-gold">The Story</h3>
                <p className="text-gray-300 leading-relaxed">{product.story}</p>
              </div>
            )}

            {/* Origin */}
            <div className="flex items-center text-globe-blue text-lg font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{product.origin}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}