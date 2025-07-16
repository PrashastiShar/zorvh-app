// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { FirebaseProvider } from '../components/FirebaseProvider'; // Import your FirebaseProvider
import { AuthProvider } from '../context/AuthContext'; // Import your AuthProvider

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ZORVH - Global Treasures Vault',
  description: 'Authentic fashion finds from around the world',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Wrap your application with FirebaseProvider first */}
        <FirebaseProvider>
          {/* Then wrap with AuthProvider, which consumes FirebaseProvider's context */}
          <AuthProvider>
            {/* Keep your existing CartProvider inside */}
            <CartProvider>
              {children}
            </CartProvider>
          </AuthProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}
