// src/hooks/useClientOnly.ts
import { useEffect, useState } from 'react';

export default function useClientOnly() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

// Usage:
// const isClient = useClientOnly();
// {isClient && <ClientComponent />}