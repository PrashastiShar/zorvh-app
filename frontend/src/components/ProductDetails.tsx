'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types/index';
// REMOVED: import { dummyProducts } from '@/data/products'; // This line is removed
import Image from 'next/image';
import Link from 'next/link';

// Import Firebase hooks and Firestore functions
import { useFirebase, APP_ID } from '@/components/FirebaseProvider';
import { doc, getDoc } from 'firebase/firestore';

export default function ProductDetails({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [error, setError] = useState<string | null>(null);
  const { addToCart: addToCartContext } = useCart();

  // Get Firebase instances from context
  const { db, loadingFirebase } = useFirebase();

  useEffect(() => {
    // Only proceed if Firebase is initialized, not loading, and we have a productId
    if (!db || loadingFirebase || !productId) {
      // If Firebase is loading or productId is missing, keep loading state
      if (!productId) {
        setError('Product ID is missing.');
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);

    const fetchProduct = async () => {
      try {
        // Reference to the product document in Firestore
        const productDocRef = doc(db, `artifacts/${APP_ID}/products`, productId);
        const productDocSnap = await getDoc(productDocRef);

        if (productDocSnap.exists()) {
          const data = productDocSnap.data();
          const fetchedProduct: Product = {
            id: productDocSnap.id,
            name: data.name as string,
            price: data.price as number,
            category: data.category as string,
            origin: data.origin as string,
            story: data.story as string,
            imageUrl: data.imageUrl as string,
            stock: data.stock as number,
            description: data.description as string || undefined,
            details: data.details as string || undefined,
            sizes: data.sizes as string[] || undefined,
            attributes: data.attributes || undefined,
            hoverImageUrl: data.hoverImageUrl as string || undefined,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : undefined,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined,
          };
          setProduct(fetchedProduct);

          // Set initial selected size
          if (fetchedProduct.sizes && fetchedProduct.sizes.length > 0) {
            setSelectedSize(
              fetchedProduct.sizes.includes('M')
                ? 'M'
                : fetchedProduct.sizes[0]
            );
          } else {
            setSelectedSize('One Size'); // Default if no sizes are available
          }
        } else {
          setError('Product not found');
        }
      } catch (err) {
        console.error("Error fetching product details from Firestore:", err);
        setError('Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, db, loadingFirebase]); // Removed APP_ID from dependencies as it's a constant

  const addToCart = () => {
    if (!product) return;
    addToCartContext(product, selectedSize, 1); // Assuming quantity is 1 for direct add
    // You might want to add a toast message here
  };

  if (loading || loadingFirebase) { // Account for Firebase loading state too
    return (
      <div className="min-h-screen flex items-center justify-center bg-void-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-treasure-gold mx-auto mb-4"></div>
          <p className="text-xl">Unearthing treasure details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void-black text-white">
        <div className="text-center max-w-md">
          <h2 className="text-3xl font-bold text-red-500 mb-4">Treasure Lost!</h2>
          <p className="text-xl mb-2">We couldn&apos;t find this artifact.</p> {/* Fixed unescaped apostrophe */}
          <p className="text-white/70 mb-8">
            The product you&apos;re looking for might have been moved or is no longer available. {/* Fixed unescaped apostrophe */}
          </p>
          <Link
            href="/products"
            className="px-6 py-3 bg-treasure-gold rounded-full font-bold text-black hover:bg-amber-500 transition-colors text-lg"
          >
            Explore Other Treasures
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void-black text-white py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <Link
            href="/products"
            className="inline-flex items-center text-globe-blue hover:text-treasure-gold transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Marketplace
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="relative h-80 md:h-[500px] rounded-xl overflow-hidden shadow-2xl border border-treasure-gold/30 flex items-center justify-center"> {/* Added flex/items/justify for fallback */}
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill // Use fill instead of layout="fill"
                style={{ objectFit: 'cover' }} // Use style instead of objectFit prop directly
                className="transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw" // Example sizes prop for responsive image
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none'; // Hide the broken image
                    const parent = target.parentElement;
                    if (parent) {
                      parent.classList.add('bg-gray-700', 'text-white/50', 'flex', 'items-center', 'justify-center', 'text-sm');
                      parent.textContent = 'Image Load Error';
                    }
                }}
              />
            ) : (
              <div className="absolute inset-0 bg-gray-700 rounded-xl flex items-center justify-center text-white/50 text-sm">
                No Image Available
              </div>
            )}
            {product.stock <= 0 && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <span className="text-2xl font-bold text-white bg-red-600 px-6 py-3 rounded-full animate-pulse-slow">
                  SOLD OUT
                </span>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div>
            <div className="mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">{product.name}</h1>
                  <div className="flex items-center mb-4">
                    <div className="flex text-treasure-gold">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-5 w-5 ${i < 4 ? 'text-treasure-gold' : 'text-gray-600'}`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-2 text-white/70">(24 reviews)</span>
                  </div>
                </div>
                <div className={`text-lg px-4 py-2 rounded-full font-semibold ${product.stock <= 1 ? 'bg-red-600 animate-pulse-slow' : 'bg-globe-blue'}`}>
                  {product.stock <= 0 ? 'SOLD OUT' : product.stock === 1 ? 'LAST ONE!' : `${product.stock} in vault`}
                </div>
              </div>
              
              <p className="text-treasure-gold text-3xl font-bold mb-6">
                ₹{product.price.toFixed(2)}
              </p>
              
              <p className="text-white/80 mb-8 text-lg leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-white mb-3">Select Size:</h3>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-5 py-2 rounded-full font-medium transition-all ${
                        selectedSize === size
                          ? 'bg-treasure-gold text-black'
                          : 'bg-gray-800 text-white hover:bg-gray-700'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Origin Story */}
            <div className="mb-10">
              <h3 className="text-xl font-bold text-treasure-gold mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Origin Story
              </h3>
              <p className="text-white/80 bg-gray-900/50 p-6 rounded-xl border border-treasure-gold/20">
                {product.story}
              </p>
              <div className="mt-3 text-globe-blue font-medium">
                Discovered in: <span className="font-bold">{product.origin}</span>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={addToCart}
                disabled={product.stock === 0}
                className={`px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-transform flex-1 flex items-center justify-center gap-3 ${
                  product.stock === 0
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-treasure-gold text-black hover:bg-amber-500 hover:scale-[1.03]'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /> {/* Fixed duplicate strokeLinecap */}
                </svg>
                {product.stock === 0 ? 'Out of Stock' : 'Add to Treasure Chest'}
              </button>
              
              <button className="px-6 py-4 border-2 border-globe-blue rounded-full font-bold text-globe-blue hover:bg-globe-blue/10 transition-colors flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Save for Later
              </button>
            </div>

            {/* Product Details */}
            <div className="mt-10 pt-8 border-t border-treasure-gold/20">
              <h3 className="text-xl font-bold text-treasure-gold mb-4">Artifact Details</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <li className="flex">
                  <span className="w-32 text-white/70">Material</span>
                  <span className="text-white">Handwoven Cotton</span>
                </li>
                <li className="flex">
                  <span className="w-32 text-white/70">Care</span>
                  <span className="text-white">Hand Wash Only</span>
                </li>
                <li className="flex">
                  <span className="w-32 text-white/70">Weight</span>
                  <span className="text-white">0.4 kg</span>
                </li>
                <li className="flex">
                  <span className="w-32 text-white/70">Dimensions</span>
                  <span className="text-white">30 x 40 cm</span>
                </li>
                <li className="flex">
                  <span className="w-32 text-white/70">Artisan</span>
                  <span className="text-white">Maria&apos;s Collective</span> {/* Fixed unescaped apostrophe */}
                </li>
                <li className="flex">
                  <span className="w-32 text-white/70">Age</span>
                  <span className="text-white">Vintage (20+ years)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-treasure-gold mb-8 text-center">More Treasures You Might Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* This section will need to fetch related products from Firestore */}
            {/* For now, it will be empty as dummyProducts is removed */}
            <p className="col-span-full text-center text-white/70">Related products coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
