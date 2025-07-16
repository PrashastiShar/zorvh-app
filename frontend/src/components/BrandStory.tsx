'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';

gsap.registerPlugin(ScrollTrigger);

const BrandStory = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sectionRef.current && textRef.current && imageRef.current) {
      gsap.fromTo(
        textRef.current,
        { opacity: 0, x: -100 },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      gsap.fromTo(
        imageRef.current,
        { opacity: 0, x: 100 },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }
  }, []);

  return (
    <section ref={sectionRef} className="w-full py-20 px-4 md:px-16 bg-futuristic-gray text-futuristic-light-gray">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div ref={textRef} className="order-2 md:order-1">
          <h2 className="text-3xl sm:text-5xl font-display font-bold mb-6
                         bg-clip-text text-transparent bg-gradient-to-r from-futuristic-pink to-futuristic-purple">
            Our Humanistic Vision
          </h2>
          <p className="text-lg leading-relaxed mb-6 opacity-90">
            At SynthThreads, we believe fashion is more than just clothing – it's a reflection of who you are,
            your aspirations, and your connection to the world. We craft pieces that empower individuality
            and celebrate the human spirit.
          </p>
          <p className="text-lg leading-relaxed opacity-90">
            Our commitment extends to ethical sourcing and sustainable practices, ensuring that
            every thread tells a story of care, innovation, and a brighter future.
          </p>
        </div>
        <div ref={imageRef} className="order-1 md:order-2 relative group flex justify-center items-center">
          <Image
            src="/images/brand-story.webp" // Placeholder for a human-centric image
            alt="SynthThreads brand story"
            width={600}
            height={400}
            className="rounded-xl shadow-2xl transition-transform duration-500 group-hover:scale-105"
          />
          {/* Subtle overlay on hover */}
          <div className="absolute inset-0 bg-futuristic-green/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      </div>
    </section>
  );
};

export default BrandStory;