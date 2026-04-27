"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface CartItem {
    productId: string;
    name: string;
    imageUrl?: string;
    unitPrice: number;
    quantity: number;
    maxStock: number; // inStockAmount — upper bound for validation
    customizations?: any[]; // For custom orders
}

interface CartContextType {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    addItem: (item: CartItem) => void;
    removeItem: (productId: string, customizations?: any[]) => void;
    updateQuantity: (productId: string, quantity: number, customizations?: any[]) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);
const CART_KEY = "choco_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>(() => {
        if (typeof window === "undefined") return [];
        try {
            const stored = localStorage.getItem(CART_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(CART_KEY, JSON.stringify(items));
    }, [items]);

    const addItem = useCallback((item: CartItem) => {
        setItems((prev) => {
            // Uniquely identify item by ID + selections
            const itemKey = (i: CartItem) => i.productId + (i.customizations ? JSON.stringify(i.customizations) : "");
            const newKey = itemKey(item);
            
            const existingIndex = prev.findIndex((i) => itemKey(i) === newKey);
            
            if (existingIndex > -1) {
                const existing = prev[existingIndex];
                const newQty = existing.quantity + item.quantity;
                const capped = Math.min(newQty, item.maxStock);
                
                if (capped <= existing.quantity) {
                    window.dispatchEvent(
                        new CustomEvent("cart:max-stock", { detail: { name: item.name, max: item.maxStock } })
                    );
                    return prev;
                }
                
                const next = [...prev];
                next[existingIndex] = { ...existing, quantity: capped };
                return next;
            }
            
            return [...prev, { ...item, quantity: Math.min(item.quantity, item.maxStock) }];
        });
    }, []);

    const removeItem = useCallback((productId: string, customizations?: any[]) => {
        const key = productId + (customizations ? JSON.stringify(customizations) : "");
        const itemKey = (i: CartItem) => i.productId + (i.customizations ? JSON.stringify(i.customizations) : "");
        setItems((prev) => prev.filter((i) => itemKey(i) !== key));
    }, []);

    const updateQuantity = useCallback((productId: string, quantity: number, customizations?: any[]) => {
        const key = productId + (customizations ? JSON.stringify(customizations) : "");
        const itemKey = (i: CartItem) => i.productId + (i.customizations ? JSON.stringify(i.customizations) : "");
        
        if (quantity <= 0) {
            setItems((prev) => prev.filter((i) => itemKey(i) !== key));
        } else {
            setItems((prev) =>
                prev.map((i) => {
                    if (itemKey(i) !== key) return i;
                    const capped = Math.min(quantity, i.maxStock);
                    return { ...i, quantity: capped };
                })
            );
        }
    }, []);

    const clearCart = useCallback(() => setItems([]), []);

    const calculateItemExtras = (customizations?: any[]) => {
        if (!customizations || !catalog) return 0;
        const allOptions = [...catalog.base, ...catalog.toppings, ...catalog.fillings];
        return customizations.reduce((sum, sel) => {
            const opt = allOptions.find(o => o.id === sel.id);
            return sum + (opt?.price ?? 0) * (sel.quantity || 1);
        }, 0);
    };

    const [catalog, setCatalog] = useState<any>(null);
    useEffect(() => {
        import("@/services/order.service").then(m => m.orderApiService.getCustomizations()).then(setCatalog).catch(() => {});
    }, []);

    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = items.reduce((sum, i) => {
        const extras = calculateItemExtras(i.customizations);
        return sum + (i.unitPrice + extras) * i.quantity;
    }, 0);

    return (
        <CartContext.Provider value={{ items, totalItems, totalPrice, addItem, removeItem, updateQuantity, clearCart }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used within CartProvider");
    return ctx;
}
