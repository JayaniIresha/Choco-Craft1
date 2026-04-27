"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShoppingCart, Star, Package, ChevronDown, Award, Leaf, Clock, Heart } from "lucide-react";
import { authService } from "@/services/auth.service";
import { productApiService } from "@/services/product.service";
import { Product } from "@/validations/product.validation";
import { useCart } from "@/contexts/cart-context";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const BASE_URL = "http://localhost:5001";
const resolveImg = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

// Typed easing (avoids framer-motion string literal error)
const EASE = [0.25, 0.1, 0.25, 1] as const;

const features = [
    { icon: Award, title: "Premium Quality", desc: "Crafted from finest cacao beans sourced globally" },
    { icon: Leaf, title: "All-Natural", desc: "Zero artificial preservatives or flavours" },
    { icon: Clock, title: "Fresh Daily", desc: "Made fresh every morning for peak flavour" },
    { icon: Heart, title: "Made with Love", desc: "Every piece handcrafted by our master chocolatiers" },
];

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function ProductCard({ product, isAuth }: { product: Product; isAuth: boolean }) {
    const [added, setAdded] = useState(false);
    const { addItem } = useCart();
    const router = useRouter();
    const img = resolveImg(product.imageUrl);
    const outOfStock = (product.inStockAmount ?? 0) === 0;

    // Show a toast when cart context signals stock limit reached for this product
    useEffect(() => {
        const handler = (e: Event) => {
            const { name, max } = (e as CustomEvent).detail;
            if (name === product.name)
                toast.warning(`Only ${max} in stock — can't add more`, { duration: 2500 });
        };
        window.addEventListener("cart:max-stock", handler);
        return () => window.removeEventListener("cart:max-stock", handler);
    }, [product.name]);

    const handleAddToCart = () => {
        if (!isAuth) { router.push("/client/login"); return; }
        if (outOfStock) return;
        addItem({
            productId: product.id!,
            name: product.name,
            imageUrl: product.imageUrl,
            unitPrice: product.unitPrice ?? 0,
            quantity: 1,
            maxStock: product.inStockAmount ?? 0,
        });
        toast.success(`${product.name} added to cart!`, { duration: 2000 });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    return (
        <motion.div
            variants={cardVariants}
            className="group bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
        >
            {/* Image */}
            <div className="relative h-48 overflow-hidden bg-amber-50">
                {img ? (
                    <Image src={img} alt={product.name} fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <Image src="/placeholder.png" alt="Chocolate Placeholder" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                )}
                {outOfStock && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Badge className="bg-red-600 text-white text-xs px-3 py-1">Out of Stock</Badge>
                    </div>
                )}
                {!outOfStock && (product.inStockAmount ?? 0) < 20 && (
                    <div className="absolute top-2 right-2">
                        <Badge className="bg-orange-500 text-white text-[10px]">Low Stock</Badge>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-4">
                <h3 className="font-semibold text-stone-900 text-sm leading-snug">{product.name}</h3>
                {product.description && (
                    <p className="text-xs text-stone-400 mt-1 line-clamp-2">{product.description}</p>
                )}
                <div className="flex items-center justify-between mt-auto pt-3">
                    <div>
                        <p className="text-xs text-stone-400 mb-0.5">Unit Price</p>
                        <p className="text-base font-bold" style={{ color: "#7c4a1e" }}>
                            $ {(product.unitPrice ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <button
                        onClick={handleAddToCart}
                        disabled={outOfStock}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200
              ${outOfStock
                                ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                                : added
                                    ? "bg-green-500 text-white scale-95"
                                    : "text-white hover:scale-105 active:scale-95"}`}
                        style={!outOfStock && !added ? { background: "#7c4a1e" } : {}}
                    >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        {added ? "Added!" : isAuth ? "Add" : "Sign in"}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}


export default function HomePage() {
    const { addItem } = useCart();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuth] = useState(() => authService.isAuthenticated());
    const productsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        productApiService.getProducts(1, 100)
            .then((d) => setProducts(d.products))
            .catch(() => toast.error("Failed to load products"))
            .finally(() => setIsLoading(false));
    }, []);

    const scrollToProducts = () =>
        productsRef.current?.scrollIntoView({ behavior: "smooth" });

    return (
        <div className="w-full pb-20">
            {/* ─── HERO SECTION ─── */}
            <section
                className="relative -mx-4 md:-mx-6 lg:-mx-8 min-h-[100vh] flex flex-col items-center justify-center text-center overflow-hidden"
                style={{ background: "linear-gradient(160deg, #1a0a00 0%, #3d1a0a 40%, #6b3318 75%, #8b5e3c 100%)" }}
            >
                {/* Decorative blobs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10"
                        style={{ background: "radial-gradient(circle, #d4813a, transparent)" }} />
                    <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full opacity-10"
                        style={{ background: "radial-gradient(circle, #d4813a, transparent)" }} />
                </div>

                <div className="relative z-10 max-w-3xl px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0, ease: EASE }}
                    >
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-6"
                            style={{ background: "rgba(212,129,58,0.2)", color: "#f5c97a", border: "1px solid rgba(212,129,58,0.3)" }}>
                            <Star className="h-3 w-3 fill-current" /> Artisan Chocolates since 1998
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.1, ease: EASE }}
                        className="text-5xl md:text-7xl font-black tracking-tight text-white leading-none mb-6"
                    >
                        Pure Chocolate,<br />
                        <span style={{ color: "#f5c97a" }}>Pure Bliss.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.2, ease: EASE }}
                        className="text-base md:text-lg mb-8 max-w-xl mx-auto"
                        style={{ color: "rgba(255,255,255,0.65)" }}
                    >
                        Handcrafted from the world&apos;s finest cacao beans. Every bite tells a story of passion, tradition, and uncompromising quality.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.3, ease: EASE }}
                        className="flex flex flex-row gap-3 justify-center"
                    >
                        <button
                            onClick={scrollToProducts}
                            className="px-8 py-3 rounded-full font-semibold text-sm transition-all hover:scale-105 active:scale-95"
                            style={{ background: "#d4813a", color: "white" }}
                        >
                            Shop Collection
                        </button>
                        <button
                            onClick={() => router.push("/customization")}
                            className="px-8 py-3 rounded-full font-semibold text-sm border-2 border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:scale-105 active:scale-95"
                        >
                            Customize Now
                        </button>
                    </motion.div>

                    {/* Feature pills */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.45, ease: EASE }}
                        className="flex flex-wrap justify-center gap-3 mt-12"
                    >
                        {features.map((f) => (
                            <div key={f.title}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
                                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}>
                                <f.icon className="h-3 w-3" style={{ color: "#f5c97a" }} />
                                {f.title}
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Scroll cue */}
                <motion.button
                    onClick={scrollToProducts}
                    animate={{ y: [0, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-50 hover:opacity-80 text-white"
                >
                    <ChevronDown className="h-6 w-6" />
                </motion.button>
            </section>

            {/* ─── PRODUCTS SECTION ─── */}
            <section ref={productsRef} className="py-20">
                <div className="text-center mb-12">
                    <motion.p
                        initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }} transition={{ duration: 0.4 }}
                        className="text-xs font-semibold uppercase tracking-widest mb-2"
                        style={{ color: "#d4813a" }}
                    >
                        Our Collection
                    </motion.p>
                    <motion.h2
                        initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.05 }}
                        className="text-3xl md:text-4xl font-black"
                        style={{ color: "#3d1a0a" }}
                    >
                        Discover Our Chocolates
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.1 }}
                        className="text-stone-500 text-sm mt-2 max-w-md mx-auto"
                    >
                        Every piece is handcrafted with care. Find your favourite or try something new.
                    </motion.p>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="bg-stone-100 rounded-2xl h-64 animate-pulse" />
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 text-stone-400">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No products available yet.</p>
                    </div>
                ) : (
                    <motion.div
                        variants={{
                            hidden: {},
                            show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
                        }}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.1 }}
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
                    >

                        {products
                            .filter(product => !product.name?.toLowerCase().includes("custom chocolate"))
                            .map((product) => (
                                <ProductCard key={product.id} product={product} isAuth={isAuth} />
                            ))}
                    </motion.div>
                )}
            </section>
        </div>
    );
}