// src/types/index.ts
export interface ProductImage {
  id: string;
  src: string;
  alt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: string;
  origin: string;
  story: string;
  details?: string;
  // **REMOVE THIS LINE:** imageUrl: string;
  images: ProductImage[]; // **ADD THIS LINE:** Array of ProductImage objects
  stock: number;
  sizes?: string[];
  attributes?: { [key: string]: string | number };
  createdAt?: Date;
  updatedAt?: Date;
  hoverImageUrl?: string; // Keep this as discussed, if needed for card hovers
}

export interface CartItem extends Product {
  quantity: number;
  size: string;
}

export interface DeliveryStatus {
  status: 'pending' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  expectedDelivery: string;
  lastUpdated: string;
  trackingNumber?: string;
}