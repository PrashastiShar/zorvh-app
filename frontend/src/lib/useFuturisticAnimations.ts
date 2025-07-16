// frontend/src/lib/useFuturisticAnimations.ts
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const useFuturisticAnimations = () => {
  const createHologramEffect = (element: HTMLElement) => {
    gsap.to(element, {
      duration: 3,
      opacity: 0.7,
      yoyo: true,
      repeat: -1,
      ease: "power1.inOut"
    });
  };

  const createParticleField = (container: HTMLElement, count = 50) => {
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'absolute w-1 h-1 bg-cyber-teal rounded-full';
      
      gsap.set(particle, {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        scale: Math.random() * 0.5 + 0.5
      });
      
      gsap.to(particle, {
        duration: Math.random() * 5 + 5,
        x: '+=100',
        y: '+=50',
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
      
      container.appendChild(particle);
    }
  };

  return { createHologramEffect, createParticleField };
};

export default useFuturisticAnimations;