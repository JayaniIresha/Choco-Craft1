import Navbar from '@/components/web/navbar'
import Footer from '@/components/web/footer'
import ReviewsSection from '@/components/web/reviews-section'
import React from 'react'
import { CartProvider } from '@/contexts/cart-context'

export default function SharedLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <CartProvider>
            <div className="flex flex-col min-h-screen">
                <div className="max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-8 flex-1">
                    <Navbar />
                    {children}
                </div>
                <ReviewsSection />
                <Footer />
            </div>
        </CartProvider>
    )
}