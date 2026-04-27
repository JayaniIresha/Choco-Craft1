"use client";

import { useCart } from "@/contexts/cart-context";
import { ShoppingCart, ArrowLeft, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const BASE_URL = "http://localhost:5001";
const resolveImg = (url?: string) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function CartPage() {
    const { items, totalItems, totalPrice, updateQuantity, removeItem } = useCart();
    const router = useRouter();

    const [catalog, setCatalog] = (require("react").useState)(null);
    require("react").useEffect(() => {
        import("@/services/order.service").then(m => m.orderApiService.getCustomizations()).then(setCatalog).catch(console.error);
    }, []);

    const calculateItemExtras = (customizations?: any[]) => {
        if (!customizations || !catalog) return 0;
        const all = [...(catalog.base || []), ...(catalog.toppings || []), ...(catalog.fillings || [])];
        return customizations.reduce((sum, sel) => {
            const opt = all.find(o => o.id === sel.id);
            return sum + (opt?.price || 0) * (sel.quantity || 1);
        }, 0);
    };

    return (
        <div className="min-h-[80vh] py-10 max-w-2xl mx-auto px-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-stone-100 transition-colors">
                    <ArrowLeft className="h-5 w-5 text-stone-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: "#3d1a0a" }}>Your Cart</h1>
                    <p className="text-sm text-stone-500">{totalItems} item{totalItems !== 1 ? "s" : ""}</p>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                        <ShoppingCart className="h-10 w-10 text-amber-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-stone-800 mb-2">Your cart is empty</h2>
                    <p className="text-stone-500 text-sm mb-6">Browse our chocolates and add something delicious!</p>
                    <Button onClick={() => router.push("/")} className="gap-2" style={{ background: "#7c4a1e" }}>
                        <Package className="h-4 w-4" /> Browse Products
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {items.map((item) => (
                        <div key={item.productId} className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
                            {/* Image */}
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-amber-50 shrink-0 border border-amber-100 relative">
                                {item.name?.toLowerCase() !== "custom dark chocolate (no filling)" && (
                                    resolveImg(item.imageUrl) ? (
                                        <Image src={resolveImg(item.imageUrl)!} alt={item.name} fill unoptimized className="object-cover" />
                                    ) : (
                                        <Image src="/placeholder.png" alt="Chocolate Placeholder" fill className="object-cover" />
                                    )
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-stone-800 text-sm truncate">{item.name}</p>
                                {item.customizations && item.customizations.length > 0 && (
                                    <p className="text-[10px] text-stone-400 mt-0.5 line-clamp-1 italic">
                                        Custom blend ingredients applied
                                    </p>
                                )}
                                <p className="text-xs text-stone-500 mt-0.5">${(item.unitPrice + calculateItemExtras(item.customizations)).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                            </div>

                            {/* Quantity */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => updateQuantity(item.productId, item.quantity - 1, item.customizations)}
                                    className="w-7 h-7 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 text-sm font-bold"
                                >−</button>
                                <span className="text-sm font-semibold w-5 text-center text-stone-900">{item.quantity}</span>
                                <button
                                    onClick={() => updateQuantity(item.productId, item.quantity + 1, item.customizations)}
                                    className="w-7 h-7 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 text-sm font-bold"
                                >+</button>
                            </div>

                            {/* Subtotal + Remove */}
                            <div className="text-right shrink-0">
                                <p className="text-sm font-bold" style={{ color: "#7c4a1e" }}>
                                    ${((item.unitPrice + calculateItemExtras(item.customizations)) * item.quantity).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </p>
                                <button onClick={() => removeItem(item.productId, item.customizations)} className="text-xs text-red-400 hover:text-red-600 mt-1">Remove</button>
                            </div>
                        </div>
                    ))}

                    {/* Order Summary */}
                    <div className="rounded-2xl border border-stone-200 bg-white p-5 mt-6 shadow-sm">
                        <h3 className="font-semibold text-stone-800 mb-3">Order Summary</h3>
                        <div className="flex justify-between text-sm text-stone-600 mb-1">
                            <span>Subtotal ({totalItems} items)</span>
                            <span>${totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="border-t border-stone-100 mt-3 pt-3 flex justify-between font-bold text-stone-900">
                            <span>Total</span>
                            <span style={{ color: "#7c4a1e" }}>${totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <Button
                            onClick={() => router.push("/checkout")}
                            className="w-full mt-4 text-white"
                            style={{ background: "#3d1a0a" }}
                        >
                            Proceed to Checkout
                        </Button>
                        <button onClick={() => router.push("/")} className="w-full mt-2 text-sm text-stone-500 hover:text-stone-700 transition-colors">
                            ← Continue Shopping
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
