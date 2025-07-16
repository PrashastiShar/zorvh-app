// frontend/src/components/FuturisticButton.tsx
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const FuturisticButton = ({ children }: { children: React.ReactNode }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        boxShadow: '0 0 15px #00f7ff',
        duration: 2,
        repeat: -1,
        yoyo: true
      });
    }
  }, []);
  
  return (
    <button
      ref={buttonRef}
      className="px-6 py-3 bg-transparent border-2 border-cyber-teal rounded-full 
                text-cyber-teal font-bold text-lg uppercase tracking-wider
                transition-all duration-300 hover:bg-cyber-teal/10
                animate-neon-border"
    >
      <span className="glitch-text">{children}</span>
    </button>
  );
};

export default FuturisticButton;