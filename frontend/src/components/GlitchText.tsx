// components/GlitchText.tsx
'use client';
import { useEffect, useState } from 'react';

export default function GlitchText({ text }: { text: string }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="relative inline-block">
      <span className="opacity-100 group-hover:opacity-0 transition-opacity">
        {text}
      </span>
      {isClient && (
        <span 
          className="absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity glitch-text"
          data-text={text}
        >
          {text}
        </span>
      )}
    </div>
  );
}