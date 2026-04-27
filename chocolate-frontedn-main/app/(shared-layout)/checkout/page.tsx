"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/cart-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, ChevronDown, ChevronUp, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { orderApiService } from "@/services/order.service";
import { authService } from "@/services/auth.service";
import type { CreateOrderInput } from "@/validations/order.validation";
import type { CustomizationCatalog, CustomizationOption } from "@/types/order.types";

// ── Form schema ───────────────────────────────────────────────────────────────

const CheckoutFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  customerEmail: z.string().email("Invalid email address"),
  country: z.string().optional(),
  streetAddress: z.string().min(1, "Street address is required"),
  streetAddress2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  postcode: z.string().regex(/^\d{5}$/, "Postcode must be 5 digits").optional().or(z.literal("")),
  senderPhone: z
    .string()
    .regex(/^0\d{9}$/, "Phone number must be 10 digits starting with 0"),
  recipientPhone: z
    .string()
    .regex(/^0\d{9}$/, "Phone number must be 10 digits starting with 0"),
  cardQuote: z.string().max(300).optional(),
  orderNotes: z.string().max(500).optional(),
  shipToDifferentAddress: z.boolean().default(false),
}).refine(
  (data) => {
    if (data.shipToDifferentAddress && (!data.orderNotes || data.orderNotes.trim() === "")) {
      return false;
    }
    return true;
  },
  {
    message: "Shipping address is required in order notes",
    path: ["orderNotes"],
  }
);

type CheckoutFormValues = z.infer<typeof CheckoutFormSchema>;

type Selection = { id: string; quantity: number };
type ItemCustomization = { selections: Selection[]; customerMessage: string };

// ── Reusable field wrapper ────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm";

// ── Main component ────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice: cartTotal, clearCart } = useCart();
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(CheckoutFormSchema),
    mode: "onSubmit",
    defaultValues: {
      firstName: "",
      lastName: "",
      customerEmail: "",
      country: "Sri Lanka",
      streetAddress: "",
      city: "",
      senderPhone: "",
      recipientPhone: "",
      shipToDifferentAddress: false,
    },
  });

  const [catalog, setCatalog] = useState<any>(null);
  useEffect(() => {
    orderApiService.getCustomizations().then(setCatalog).catch(console.error);
  }, []);

  const calculateItemExtras = (customizations?: any[]) => {
    if (!customizations || !catalog) return 0;
    const all = [...(catalog.base || []), ...(catalog.toppings || []), ...(catalog.fillings || [])];
    return customizations.reduce((sum, sel) => {
      const opt = all.find(o => o.id === sel.id);
      return sum + (opt?.price || 0) * (sel.quantity || 1);
    }, 0);
  };

  const shipToDifferent = watch("shipToDifferentAddress");

  useEffect(() => {
    if (authService.isAuthenticated()) {
      authService.getProfile().then((profile) => {
        const [first, ...last] = profile.name.split(" ");
        setValue("firstName", first || "");
        setValue("lastName", last.join(" ") || "");
        setValue("customerEmail", profile.email);
      }).catch(console.error);
    }
  }, [setValue]);

  if (!mounted) {
    return (
      <div className="py-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-stone-600 dark:text-stone-400 mb-4">Your cart is empty</p>
            <Button onClick={() => router.push("/")}>Continue Shopping</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = async (data: CheckoutFormValues) => {
    try {
      setSubmitting(true);
      const orderData: CreateOrderInput = {
        ...data,
        status: "Pending",
        totalPrice: cartTotal,
        orderItems: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          customizations: item.customizations, // Send the selections to the backend
        })),
      };
      const order = await orderApiService.createOrder(orderData);
      toast.success("Order created successfully!");
      clearCart();
      router.push(`/payment/${order.id}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: unknown } } };
      const raw = err?.response?.data?.error;
      toast.error(typeof raw === "string" ? raw : "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold text-stone-900 dark:text-white mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <section>
              <h2 className="text-lg font-bold text-stone-900 dark:text-white border-b border-stone-200 dark:border-stone-700 pb-2 mb-5">
                Billing details
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="First name" required error={errors.firstName?.message}>
                    <input {...register("firstName")} className={inputCls} />
                  </Field>
                  <Field label="Last name" required error={errors.lastName?.message}>
                    <input {...register("lastName")} className={inputCls} />
                  </Field>
                </div>

                <Field label="Country / Region" error={errors.country?.message}>
                  <select {...register("country")} className={inputCls}>
                    <option value="Sri Lanka">Sri Lanka</option>
                    <option value="India">India</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                    <option value="Australia">Australia</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>

                <Field label="Street address" required error={errors.streetAddress?.message}>
                  <input
                    {...register("streetAddress")}
                    placeholder="House number and street name"
                    className={inputCls}
                  />
                </Field>
                <div>
                  <input
                    {...register("streetAddress2")}
                    placeholder="Apartment, suite, unit, etc. (optional)"
                    className={inputCls}
                  />
                </div>

                <Field label="Town / City" required error={errors.city?.message}>
                  <input {...register("city")} className={inputCls} />
                </Field>

                <Field label="Postcode / ZIP" error={errors.postcode?.message}>
                  <input {...register("postcode")} className={inputCls} />
                </Field>

                <Field label="Sender Phone number" required error={errors.senderPhone?.message}>
                  <input
                    {...register("senderPhone")}
                    type="tel"
                    placeholder="Your phone no"
                    className={inputCls}
                  />
                </Field>
                <Field label="Recipient phone number" required error={errors.recipientPhone?.message}>
                  <input
                    {...register("recipientPhone")}
                    type="tel"
                    placeholder="Receiver's phone no"
                    className={inputCls}
                  />
                </Field>

                <Field label="Email address" required error={errors.customerEmail?.message}>
                  <input
                    {...register("customerEmail")}
                    type="email"
                    placeholder="you@example.com"
                    className={inputCls}
                  />
                </Field>

                <Field label="Quote to write in card (if any)" error={errors.cardQuote?.message}>
                  <input
                    {...register("cardQuote")}
                    placeholder="A message or wish that needs to be written on the card"
                    className={inputCls}
                  />
                </Field>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    {...register("shipToDifferentAddress")}
                    type="checkbox"
                    className="w-4 h-4 rounded border-stone-300 accent-amber-600"
                  />
                  <span className="font-semibold text-stone-800 dark:text-stone-200 text-sm">
                    Ship to a different address?
                  </span>
                </label>

                {shipToDifferent && (
                  <div className="pl-6 border-l-2 border-amber-300 dark:border-amber-700 space-y-4">
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Please specify the delivery address in the order notes below.
                    </p>
                  </div>
                )}

                <Field label="Order Notes" error={errors.orderNotes?.message}>
                  <textarea
                    {...register("orderNotes")}
                    placeholder="Notes about your order, e.g. special notes for delivery."
                    rows={3}
                    className={`${inputCls} resize-none`}
                  />
                </Field>
              </div>
            </section>

            <div className="lg:hidden">
              <PlaceOrderButton submitting={submitting} />
            </div>
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                <div className="flex justify-between text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide pb-2 border-b border-stone-200 dark:border-stone-700">
                  <span>Product</span>
                  <span>Subtotal</span>
                </div>

                <div className="space-y-0 max-h-80 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.productId} className="py-3 border-b border-stone-100 dark:border-stone-800">
                      <div className="flex justify-between items-start gap-3">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl.startsWith("http") ? item.imageUrl : `http://localhost:5001${item.imageUrl.startsWith("/") ? "" : "/"}${item.imageUrl}`}
                            alt={item.name}
                            className="w-10 h-10 rounded-md object-cover border border-stone-100 dark:border-stone-800"
                          />
                        ) : (
                          <img src="/placeholder.png" alt="Placeholder" className="w-10 h-10 rounded-md object-cover border border-stone-100 dark:border-stone-800" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-stone-400">× {item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium text-stone-900 dark:text-white">
                          ${(item.quantity * (item.unitPrice + calculateItemExtras(item.customizations))).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600 dark:text-stone-400">Subtotal</span>
                    <span className="font-medium">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600 dark:text-stone-400">Shipment</span>
                    <span className="font-medium">Free</span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t border-stone-200 dark:border-stone-700 pt-2">
                    <span>Total</span>
                    <span className="text-amber-600 dark:text-amber-400">
                      ${cartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="pt-4 hidden lg:block">
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <PlaceOrderButton submitting={submitting} />
                  </form>
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" className="w-full" onClick={() => router.push("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaceOrderButton({ submitting }: { submitting: boolean }) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={submitting}>
      {submitting ? (
        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Placing Order...</>
      ) : (
        "PLACE ORDER"
      )}
    </Button>
  );
}
