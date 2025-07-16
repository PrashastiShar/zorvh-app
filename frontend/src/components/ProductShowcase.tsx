'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import Image from 'next/image';

gsap.registerPlugin(ScrollTrigger);

// Dummy product data
const products = [
  {
    id: 1,
    name: 'Neo-Glow Jacket',
    image: '/images/product-1.webp', // Placeholder
    alt: 'Neo-Glow Jacket',
    price: '₹4,999',
    description: 'Iridescent fabric with integrated light strips. The ultimate statement piece.',
    colors: ['#FF007F', '#00FFFF', '#8A2BE2'],
  },
  {
    id: 2,
    name: 'Cybernetic Hoodie',
    image: '/images/product-2.webp', // Placeholder
    alt: 'Cybernetic Hoodie',
    price: '₹3,499',
    description: 'Comfort meets tech. Breathable material with responsive thermal zones.',
    colors: ['#00FF00', '#4A90E2', '#E0E0E0'],
  },
  {
    id: 3,
    name: 'Quantum Knit Tee',
    image: '/images/product-3.webp', // Placeholder
    alt: 'Quantum Knit Tee',
    price: '₹1,999',
    description: 'Soft, adaptive fabric that reacts to your environment. Seamless design.',
    colors: ['#FFD700', '#FF007F', '#1A1A1A'],
  },
];

const ProductShowcase = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 100 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          stagger: 0.2,
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 80%', // When top of container hits 80% of viewport
            end: 'bottom 20%',
            toggleActions: 'play none none reverse', // Play on enter, reverse on leave
          },
        }
      );
    }
  }, []);

  return (
    <section className="w-full py-20 px-4 md:px-16 bg-futuristic-gray text-futuristic-light-gray">
      <h2 className="text-3xl sm:text-5xl font-display font-bold text-center mb-16
                     bg-clip-text text-transparent bg-gradient-to-r from-futuristic-green to-futuristic-blue
                     animate-fade-in-up">
        Our Latest Drops
      </h2>

      <div
        ref={containerRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto"
      >
        {products.map((product) => (
          <motion.div
            key={product.id}
            className="bg-futuristic-gray border border-futuristic-purple/30 rounded-xl p-6 shadow-xl relative
                       overflow-hidden group hover:shadow-futuristic-pink/40 transition-shadow duration-300 ease-in-out"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.17, 0.67, 0.83, 0.67] }} // Custom easing
          >
            {/* Background glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-futuristic-purple/20 to-futuristic-pink/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl z-0"></div>

            <div className="relative z-10">
              <Image
                src={product.image}
                alt={product.alt}
                width={500}
                height={500}
                className="w-full h-auto object-cover rounded-md mb-4 transform group-hover:scale-102 transition-transform duration-300"
              />
              <h3 className="text-2xl font-display font-semibold mb-2">{product.name}</h3>
              <p className="text-futuristic-light-gray/70 text-sm mb-4">{product.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-futuristic-green text-xl font-bold">{product.price}</span>
                <div className="flex space-x-2">
                  {product.colors.map((color, idx) => (
                    <span
                      key={idx}
                      className="w-5 h-5 rounded-full border border-futuristic-light-gray/30"
                      style={{ backgroundColor: color }}
                      title={color}
                    ></span>
                  ))}
                </div>
              </div>
              <button className="mt-6 w-full bg-futuristic-pink text-white py-2 rounded-full font-medium
                                 hover:bg-futuristic-green transition-colors duration-300 ease-in-out">
                View Details
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default ProductShowcase;