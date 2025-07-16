// src/context/CartContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Product, CartItem } from '@/types/index';

// Type definition for CartContextType
type CartContextType = {
    cart: CartItem[];
    addToCart: (product: Product, size: string, quantityToAdd?: number) => boolean;
    // FIX: Changed id to string for removeFromCart and updateQuantity
    removeFromCart: (id: string, size: string) => void;
    updateQuantity: (id: string, size: string, quantity: number) => void;
    cartCount: number;
    cartTotal: number;
    clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                try {
                    const parsedCart = JSON.parse(savedCart) as CartItem[];
                    // FIX: Validate cart items to ensure id is a string
                    const validatedCart = parsedCart.filter(
                        item => item.id && typeof item.id === 'string' && item.name && item.price && item.quantity && item.size
                    ) as CartItem[];
                    setCart(validatedCart);
                } catch (e) {
                    console.error("Failed to parse cart from localStorage, clearing it:", e);
                    localStorage.removeItem('cart');
                }
            }
        }
        setIsInitialized(true);
    }, []);

    // Save cart to localStorage when it changes
    useEffect(() => {
        if (isInitialized && typeof window !== 'undefined') {
            localStorage.setItem('cart', JSON.stringify(cart));
        }
    }, [cart, isInitialized]);

    // REMOVED: The `ensureNumberId` function is no longer needed
    // as all product IDs will be treated as strings.

    // Calculate total number of items in cart
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

    // Calculate total price of all items in cart
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Add item to cart with stock validation
    const addToCart = useCallback((
        product: Product,
        size: string,
        quantityToAdd: number = 1
    ): boolean => {
        // Product ID is already a string here (product.id)
        let success = true;

        setCart(prev => {
            // Find existing item with same ID and size
            const existingItem = prev.find(
                // FIX: Compare item.id (string) directly with product.id (string)
                item => item.id === product.id && item.size === size
            );

            // Calculate new total quantity
            const currentQty = existingItem ? existingItem.quantity : 0;
            const newQty = currentQty + quantityToAdd;

            // Check stock availability
            if (product.stock !== undefined && newQty > product.stock) {
                console.warn(`Cannot add ${quantityToAdd} more of ${product.name} (Size: ${size}). Only ${product.stock - currentQty} left in stock.`);
                success = false;
                return prev;
            }

            if (existingItem) {
                // Update existing item quantity
                return prev.map(item =>
                    // FIX: Compare item.id (string) directly with product.id (string)
                    item.id === product.id && item.size === size
                        ? { ...item, quantity: newQty }
                        : item
                );
            } else {
                // Add new item to cart with string ID
                const newItem: CartItem = {
                    ...product,
                    // FIX: Assign product.id (which is already a string) directly
                    id: product.id,
                    quantity: quantityToAdd,
                    size
                };
                return [...prev, newItem];
            }
        });

        return success;
    }, []);

    // Remove item from cart
    const removeFromCart = useCallback((id: string, size: string) => { // FIX: id is string
        setCart(prev =>
            prev.filter(item =>
                // FIX: Compare item.id (string) directly with id (string)
                !(item.id === id && item.size === size)
            )
        );
    }, []);

    // Update item quantity in cart
    const updateQuantity = useCallback((
        id: string, // FIX: id is string
        size: string,
        quantity: number
    ) => {
        if (quantity <= 0) {
            removeFromCart(id, size); // FIX: Pass string id
            return;
        }

        setCart(prev =>
            prev.map(item =>
                // FIX: Compare item.id (string) directly with id (string)
                item.id === id && item.size === size
                    ? { ...item, quantity }
                    : item
            )
        );
    }, [removeFromCart]); // Dependency is correct

    // Clear entire cart
    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                updateQuantity,
                cartCount,
                cartTotal,
                clearCart
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}