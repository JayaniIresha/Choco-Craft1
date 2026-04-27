"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/cart-context";
import { orderApiService } from "@/services/order.service";
import { productApiService } from "@/services/product.service";
import type { CustomizationCatalog, CustomizationOption } from "@/types/order.types";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Minus, X, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";

export default function CustomizationPage() {
    const router = useRouter();
    const { addItem } = useCart();
    
    // Status
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [catalog, setCatalog] = useState<CustomizationCatalog | null>(null);
    const [customProduct, setCustomProduct] = useState<any>(null);

    // Selections
    const [base, setBase] = useState<string>("");
    const [filling, setFilling] = useState<string>("");
    const [toppings, setToppings] = useState<string[]>([]);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        const load = async () => {
            try {
                const [cat, items] = await Promise.all([
                    orderApiService.getCustomizations(),
                    productApiService.getProducts(1, 100)
                ]);
                setCatalog(cat);
                
                // Find the placeholder custom chocolate product
                const cp = items.products.find((p: any) => 
                    p.name?.toLowerCase().includes("custom chocolate")
                );
                if (cp) setCustomProduct(cp);
            } catch (error) {
                console.error("Failed to load data:", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // ─── MATH ──────────────────────────────────────────────────────────────────

    const getPrice = (id: string) => {
        if (!catalog) return 0;
        const all = [...catalog.base, ...catalog.toppings, ...catalog.fillings];
        return all.find(o => o.id === id)?.price ?? 0;
    };

    const getBasePrice = () => getPrice(base);
    const getFillingPrice = () => getPrice(filling);
    const getToppingsPrice = () => toppings.reduce((sum, id) => sum + getPrice(id), 0);

    // If no base is selected, we start at 0.00 to match the user's design image
    const subtotalPerUnit = base ? ((customProduct?.unitPrice ?? 0) + getBasePrice() + getFillingPrice() + getToppingsPrice()) : 0;
    const rawTotal = subtotalPerUnit * quantity;

    // VOLUME DISCOUNTS
    let discount = 0;
    if (quantity >= 100) discount = 0.15;
    else if (quantity >= 50) discount = 0.10;
    else if (quantity >= 10) discount = 0.05;

    const totalDiscountAmount = rawTotal * discount;
    const finalTotal = rawTotal - totalDiscountAmount;

    // ─── ACTION ────────────────────────────────────────────────────────────────

    const handleAddToCart = () => {
        if (!authService.isAuthenticated()) {
            toast.error("Please sign in to add custom chocolates");
            router.push("/client/login");
            return;
        }

        if (!base) {
            toast.error("Please select a chocolate base");
            return;
        }

        if (!customProduct) {
            toast.error("System error: Custom placeholder not found");
            return;
        }

        const selections = [
            { id: base, quantity: 1 },
            ...(filling ? [{ id: filling, quantity: 1 }] : []),
            ...toppings.map(id => ({ id, quantity: 1 }))
        ];

        addItem({
            productId: customProduct.id,
            name: "My Custom Chocolate",
            imageUrl: customProduct.imageUrl,
            unitPrice: (customProduct.unitPrice ?? 0) * (1 - discount), // Storing ONLY base product price
            quantity: quantity,
            maxStock: 9999,
            customizations: selections
        });

        toast.success("Added your custom chocolate to the cart!");
        router.push("/cart");
    };

    const toggleTopping = (id: string) => {
        setToppings(prev => 
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 text-stone-900 py-12 px-6">
            
            {/* Header */}
            <div className="max-w-4xl mx-auto text-center mb-12">
                <p className="text-amber-600 text-xs font-bold tracking-widest uppercase mb-2">Build Your Own</p>
                <h1 className="text-5xl font-black mb-4 text-[#3d1a0a]">Customise Your Preference</h1>
                <p className="text-stone-500 text-sm max-w-lg mx-auto">
                    Design your perfect chocolate bar — choose your base, fillings, toppings and quantity.
                </p>
                
                <button 
                    onClick={() => router.push("/")}
                    className="mt-8 flex items-center gap-2 px-6 py-2 bg-stone-200 text-stone-600 rounded-full hover:bg-stone-300 hover:text-stone-900 transition-all mx-auto font-medium"
                >
                    <X className="w-4 h-4" /> Close
                </button>
            </div>

            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 1. SELECT BASE */}
                <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="w-6 h-6 flex items-center justify-center bg-amber-500 text-white rounded-full text-xs font-black">1</span>
                        <h2 className="text-stone-800 font-bold tracking-widest uppercase text-xs">SELECT BASE</h2>
                    </div>
                    <p className="text-sm text-stone-500 font-medium">Choose your chocolate base</p>
                    <select 
                        value={base}
                        onChange={(e) => setBase(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm appearance-none outline-none"
                    >
                        <option value="">— Select base —</option>
                        {catalog?.base.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.name} (${opt.price.toFixed(2)})</option>
                        ))}
                    </select>
                </div>

                {/* 2. SELECT FILLING */}
                <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="w-6 h-6 flex items-center justify-center bg-amber-500 text-white rounded-full text-xs font-black">2</span>
                        <h2 className="text-stone-800 font-bold tracking-widest uppercase text-xs">SELECT FILLING</h2>
                    </div>
                    <p className="text-sm text-stone-500 font-medium">Choose your filling</p>
                    <select 
                        value={filling}
                        onChange={(e) => setFilling(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm appearance-none outline-none"
                    >
                        <option value="">— Select filling —</option>
                        {catalog?.fillings.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.name} (${opt.price.toFixed(2)})</option>
                        ))}
                    </select>
                </div>

                {/* 3. SELECT TOPPINGS */}
                <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="w-6 h-6 flex items-center justify-center bg-amber-500 text-white rounded-full text-xs font-black">3</span>
                        <h2 className="text-stone-800 font-bold tracking-widest uppercase text-xs">SELECT TOPPINGS <span className="opacity-50 lowercase ml-1">(choose multiple)</span></h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {catalog?.toppings.map(opt => {
                            const selected = toppings.includes(opt.id);
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => toggleTopping(opt.id)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                                        selected 
                                        ? "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200" 
                                        : "bg-white border-stone-200 text-stone-500 hover:border-amber-500/50"
                                    }`}
                                >
                                    {opt.name} {opt.price > 0 && `($${opt.price.toFixed(2)})`}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 4. QUANTITY */}
                <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="w-6 h-6 flex items-center justify-center bg-amber-500 text-white rounded-full text-xs font-black">4</span>
                        <h2 className="text-stone-800 font-bold tracking-widest uppercase text-xs">QUANTITY</h2>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                            className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-all text-stone-500 font-bold text-xl"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-3xl font-black text-stone-900">{quantity}</span>
                        <button 
                            onClick={() => setQuantity(prev => prev + 1)}
                            className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-all text-stone-500 font-bold text-xl"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-amber-600 tracking-widest uppercase">Volume Discount</p>
                        <div className="flex flex-col gap-0.5 text-xs text-stone-500 font-medium">
                            <span className={quantity >= 10 && quantity < 50 ? "text-amber-600 font-bold" : ""}>10–49 units → 5% off</span>
                            <span className={quantity >= 50 && quantity < 100 ? "text-amber-600 font-bold" : ""}>50–99 units → 10% off</span>
                            <span className={quantity >= 100 ? "text-amber-600 font-bold" : ""}>100+ units → 15% off</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* TOTALIZER SECTION */}
            <div className="max-w-5xl mx-auto mt-8">
                <div className="bg-amber-50 border border-amber-100 p-8 rounded-[40px] relative overflow-hidden group shadow-md shadow-amber-900/5">
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1fr_auto] items-end gap-6">
                        
                        <div className="space-y-4">
                            <div className="space-y-1 text-sm text-stone-600 font-medium">
                                <div className="flex justify-between max-w-xs">
                                    <span>Base</span>
                                    <span>$ {getBasePrice().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between max-w-xs">
                                    <span>Filling</span>
                                    <span>$ {getFillingPrice().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between max-w-xs">
                                    <span>Toppings</span>
                                    <span>$ {getToppingsPrice().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between max-w-xs">
                                    <span>Quantity</span>
                                    <span>× {quantity}</span>
                                </div>
                            </div>
                            
                            <div className="pt-4">
                                <p className="text-[10px] font-bold text-amber-600 tracking-[0.2em] uppercase">Total Price</p>
                                <div className="flex items-end gap-3 mt-1">
                                    <span className="text-4xl font-black text-[#3d1a0a]">${finalTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                                    {discount > 0 && (
                                        <span className="text-stone-400 line-through text-lg mb-1">${rawTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleAddToCart}
                            className="flex items-center gap-3 px-10 py-5 bg-[#3d1a0a] text-white rounded-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-stone-900/20"
                        >
                            <ShoppingCart className="w-5 h-5 text-amber-500" /> Add to Cart
                        </button>
                    </div>

                    {/* Decorative element (amber shopping cart in bg) */}
                    <div className="absolute right-0 top-0 bottom-0 w-64 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                        <ShoppingCart className="w-full h-full -rotate-12 translate-x-1/2 translate-y-1/4" />
                    </div>
                </div>
            </div>

        </div>
    );
}


