'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles } from 'lucide-react'; // Example icon

gsap.registerPlugin(ScrollTrigger);

const HeroSection = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (heroRef.current && titleRef.current && subtitleRef.current && ctaRef.current) {
      const tl = gsap.timeline();

      tl.fromTo(
        heroRef.current,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 1.5, ease: 'power3.out' }
      )
      .fromTo(
        titleRef.current.children,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          stagger: 0.1, // Animate words individually
        },
        "-=0.8" // Start title animation before hero ends
      )
      .fromTo(
        subtitleRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
        "-=0.5"
      )
      .fromTo(
        ctaRef.current,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' },
        "-=0.3"
      );

      // Parallax effect on scroll
      gsap.to(heroRef.current, {
        yPercent: 20, // Moves 20% of its height
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative w-full h-[80vh] flex flex-col items-center justify-center text-center overflow-hidden
                 bg-gradient-to-br from-futuristic-blue to-futuristic-purple text-white shadow-2xl rounded-lg
                 p-8 sm:p-16 mb-24 animate-[glow_3s_ease-in-out_infinite_alternate]" // Subtle glow animation
    >
      <div className="absolute inset-0 bg-pattern-futuristic opacity-20 z-0"></div> {/* Abstract pattern overlay */}

      <h1 ref={titleRef} className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold mb-6 z-10 leading-tight">
        {/* Split words for individual animation */}
        {'SYNTH THREADS'.split(' ').map((word, index) => (
          <span key={index} className="inline-block mx-1">
            {word}
          </span>
        ))}
      </h1>
      <p ref={subtitleRef} className="text-lg sm:text-xl md:text-2xl mb-10 max-w-3xl z-10 text-futuristic-light-gray opacity-80">
        Discover **futuristic apparel** designed for the next generation. <br /> Express your unique vibe.
      </p>
      <button
        ref={ctaRef}
        className="bg-futuristic-pink text-white py-3 px-8 rounded-full text-lg font-semibold
                   hover:scale-105 transition-all duration-300 ease-in-out relative z-10
                   overflow-hidden group"
      >
        <span className="relative z-10">Shop the Future</span>
        <span className="absolute inset-0 bg-futuristic-green opacity-0 group-hover:opacity-100
                         transition-opacity duration-300 transform scale-x-0 group-hover:scale-x-100 origin-left"></span>
        <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 text-white opacity-0 group-hover:opacity-100
                              transition-opacity duration-300" size={20} />
      </button>
    </section>
  );
};

export default HeroSection;