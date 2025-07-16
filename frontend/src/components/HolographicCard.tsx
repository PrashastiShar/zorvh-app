// frontend/src/components/HolographicCard.tsx
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const HolographicCard = ({ children }: { children: React.ReactNode }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        duration: 3,
        boxShadow: '0 0 30px rgba(212, 0, 255, 0.7)',
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut"
      });
    }
  }, []);
  
  return (
    <div 
      ref={cardRef}
      className="relative p-8 bg-black/30 backdrop-blur-lg border border-cyber-teal/50 rounded-xl 
                overflow-hidden animate-hologram-pulse"
      style={{
        background: 'linear-gradient(135deg, rgba(0, 247, 255, 0.1) 0%, rgba(212, 0, 255, 0.1) 100%)',
        boxShadow: '0 0 15px rgba(0, 247, 255, 0.5)'
      }}
    >
      {children}
    </div>
  );
};

export default HolographicCard;