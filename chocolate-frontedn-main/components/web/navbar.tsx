"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonVariants } from "../ui/button";
import { ThemeToggle } from "./theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, ShoppingCart } from "lucide-react";
import { authService } from "@/services/auth.service";
import { useCart } from "@/contexts/cart-context";

const Navbar = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const { totalItems, clearCart } = useCart();

  React.useEffect(() => {
    setMounted(true);
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  return (
    <nav className="w-full py-4 border-b bg-background sticky top-0 z-50">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="text-2xl font-bold bg-gradient-to-r from-amber-800 to-amber-600 bg-clip-text text-transparent">
            Chocó
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link className={buttonVariants({ variant: "ghost", size: "sm" })} href="/">Home</Link>
          <Link className={buttonVariants({ variant: "ghost", size: "sm" })} href="/about">About</Link>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">

          {/* Cart icon — only for authenticated users */}
          {mounted && isAuthenticated && (
            <button
              onClick={() => router.push("/cart")}
              className={`relative ${buttonVariants({ variant: "ghost", size: "icon" })}`}
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 text-[10px] font-bold text-white rounded-full flex items-center justify-center"
                  style={{ background: "#7c4a1e", minWidth: 18, minHeight: 18, fontSize: 10 }}>
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>
          )}

          {mounted && isAuthenticated ? (
            <>
              <Link className={buttonVariants({ variant: "ghost", size: "sm" })} href="/profile">
                Account
              </Link>
              <button
                className={buttonVariants({ variant: "outline", size: "sm" })}
                onClick={() => {
                  clearCart();
                  authService.logout();
                  window.location.href = "/";
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/client/login">
                Sign In
              </Link>
              <Link className={buttonVariants({ variant: "default", size: "sm" })} href="/client/register">
                Sign Up
              </Link>
            </>
          )}
          <ThemeToggle />

          {/* Mobile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <button className={buttonVariants({ variant: "ghost", size: "icon" })}>
                <Menu className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild><Link href="/">Home</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/about">About</Link></DropdownMenuItem>
              {isAuthenticated && (
                <DropdownMenuItem asChild><Link href="/cart">Cart</Link></DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;