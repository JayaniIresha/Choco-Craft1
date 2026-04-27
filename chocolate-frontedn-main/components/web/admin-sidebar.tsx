"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Factory,
  Boxes,
  DollarSign,
  Store,
  Users,
  LogOut,
  Star,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Catalog",
    items: [
      {
        label: "Products",
        href: "/products",
        icon: <Package className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        label: "Custom Orders",
        href: "/custom-orders",
        icon: <ShoppingCart className="h-4 w-4" />,
      },
      {
        label: "Standard Orders",
        href: "/standard-orders",
        icon: <Package className="h-4 w-4" />,
      },
      {
        label: "Delivery",
        href: "/delivery",
        icon: <Truck className="h-4 w-4" />,
      },
      {
        label: "Production",
        href: "/production",
        icon: <Factory className="h-4 w-4" />,
      },
      {
        label: "Recipes",
        href: "/recipes",
        icon: <Boxes className="h-4 w-4" />,
      },
      {
        label: "Purchase Orders",
        href: "/purchase-orders",
        icon: <ShoppingCart className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        label: "Inventory",
        href: "/inventory",
        icon: <Boxes className="h-4 w-4" />,
      },
      {
        label: "Finance",
        href: "/finance",
        icon: <DollarSign className="h-4 w-4" />,
      },
      {
        label: "Suppliers",
        href: "/suppliers",
        icon: <Store className="h-4 w-4" />,
      },
      {
        label: "Customers",
        href: "/customers",
        icon: <Users className="h-4 w-4" />,
      },
      {
        label: "Reviews",
        href: "/reviews",
        icon: <Star className="h-4 w-4" />,
      },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    authService.logout();
    window.location.href = "/admin/login";
  };

  return (
    <aside className="w-64 shrink-0 border-r bg-card flex flex-col h-screen sticky top-0 overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="text-xl font-bold bg-gradient-to-r from-amber-700 to-amber-600 bg-clip-text text-transparent">
            Chocó Admin
          </div>
        </Link>
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 p-4">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-2">
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Divider */}
      <Separator className="mx-4" />

      {/* Logout Button */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className={buttonVariants({
            variant: "outline",
            className: "w-full justify-start gap-2",
          })}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
