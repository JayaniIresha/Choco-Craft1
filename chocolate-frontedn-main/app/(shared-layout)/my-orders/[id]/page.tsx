"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, ArrowLeft, MapPin, Phone, Mail, MessageSquare, FileText } from "lucide-react";
import { toast } from "sonner";
import { orderApiService } from "@/services/order.service";
import { paymentApiService } from "@/services/payment.service";
import type { Order, CustomizationCatalog, CustomizationOption } from "@/types/order.types";
import type { Payment } from "@/types/payment.types";

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-sm font-medium text-stone-900 dark:text-white">{value}</p>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [catalog, setCatalog] = useState<CustomizationCatalog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [orderData, catalogData] = await Promise.all([
          orderApiService.getOrderById(orderId),
          orderApiService.getCustomizations(),
        ]);
        setOrder(orderData);
        setCatalog(catalogData);

        try {
          const paymentData = await paymentApiService.getPaymentByOrderId(orderId);
          setPayment(paymentData);
        } catch {
          // no payment yet
        }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { error?: string } } };
        toast.error(err?.response?.data?.error || "Failed to fetch order");
        router.push("/my-orders");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId, router]);

  const allOptions: CustomizationOption[] = catalog
    ? [...catalog.base, ...catalog.toppings, ...catalog.fillings]
    : [];

  const resolveOption = (id: string) => allOptions.find((o) => o.id === id);

  const itemCustomizationTotal = (customizations?: { id: string; quantity: number }[]) =>
    (customizations ?? []).reduce((sum, sel) => {
      const opt = resolveOption(sel.id);
      return sum + (opt?.price ?? 0) * sel.quantity;
    }, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-stone-600 dark:text-stone-400">Order not found</p>
        </CardContent>
      </Card>
    );
  }

  const deliveryAddress = [
    order.streetAddress,
    order.streetAddress2,
    order.city,
    order.postcode,
    order.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.push("/my-orders")}
            className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Orders
          </button>
          <h1 className="text-3xl font-bold text-stone-900 dark:text-white">
            Order {order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString("en-US", { dateStyle: "long" })}
          </p>
        </div>
        <Badge className={`${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-800"} text-sm px-3 py-1`}>
          {order.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Order Items + Customizations */}
          {order.orderItems && order.orderItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Items Ordered</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {order.orderItems.map((item) => {
                  const customizations = (item.customizations ?? []) as { id: string; quantity: number }[];
                  const extraPerItem = itemCustomizationTotal(customizations);
                  const lineTotal = item.quantity * (item.unitPrice + extraPerItem);

                  const baseSelections = customizations.filter((s) => {
                    const opt = resolveOption(s.id);
                    return opt?.category === "base";
                  });
                  const toppingSelections = customizations.filter((s) => {
                    const opt = resolveOption(s.id);
                    return opt?.category === "toppings";
                  });
                  const fillingSelections = customizations.filter((s) => {
                    const opt = resolveOption(s.id);
                    return opt?.category === "fillings";
                  });

                  return (
                    <div key={item.id} className="border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
                      {/* Item header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-stone-50 dark:bg-stone-800">
                        <div className="flex items-center gap-4">
                          {item.product?.name?.toLowerCase() !== "custom dark chocolate (no filling)" && (
                            <img
                              src={
                                item.product?.imageUrl
                                  ? item.product.imageUrl.startsWith("http")
                                    ? item.product.imageUrl
                                    : `http://localhost:5001${item.product.imageUrl}`
                                  : "/placeholder.png"
                              }
                              alt={item.product?.name || "Product image"}
                              className="w-10 h-10 rounded-md object-cover border border-stone-200 dark:border-stone-600"
                            />
                          )}
                          <div>
                            <p className="font-semibold text-stone-900 dark:text-white">
                              {item.product?.name || `Product ${item.productId.slice(-6)}`}
                            </p>
                            {item.unitPrice > (itemCustomizationTotal(item.customizations as any[]) || 0) && (
                              <p className="text-xs text-stone-500 dark:text-stone-400">
                                {item.quantity} × ${(item.unitPrice - (itemCustomizationTotal(item.customizations as any[]) || 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })} (base)
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="font-semibold text-stone-900 dark:text-white">
                          ${lineTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      {/* Customizations */}
                      {customizations.length > 0 && (
                        <div className="px-4 py-3 space-y-3 border-t border-stone-100 dark:border-stone-700">
                          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                            Customizations
                          </p>

                          {baseSelections.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-stone-400 dark:text-stone-500">Base</p>
                              {baseSelections.map((sel) => {
                                const opt = resolveOption(sel.id);
                                return (
                                  <div key={sel.id} className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                                      {opt?.name ?? sel.id}
                                    </span>
                                    <span className="text-stone-500 dark:text-stone-400">
                                      {opt && opt.price > 0
                                        ? `+$${(opt.price * sel.quantity).toFixed(2)}`
                                        : "Included"}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {toppingSelections.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-stone-400 dark:text-stone-500">Toppings</p>
                              {toppingSelections.map((sel) => {
                                const opt = resolveOption(sel.id);
                                return (
                                  <div key={sel.id} className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                                      {opt?.name ?? sel.id}
                                      {sel.quantity > 1 && (
                                        <span className="text-xs text-stone-400">×{sel.quantity}</span>
                                      )}
                                    </span>
                                    <span className="text-stone-500 dark:text-stone-400">
                                      +${((opt?.price ?? 0) * sel.quantity).toFixed(2)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {fillingSelections.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-stone-400 dark:text-stone-500">Fillings</p>
                              {fillingSelections.map((sel) => {
                                const opt = resolveOption(sel.id);
                                return (
                                  <div key={sel.id} className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-pink-400 inline-block" />
                                      {opt?.name ?? sel.id}
                                      {sel.quantity > 1 && (
                                        <span className="text-xs text-stone-400">×{sel.quantity}</span>
                                      )}
                                    </span>
                                    <span className="text-stone-500 dark:text-stone-400">
                                      +${((opt?.price ?? 0) * sel.quantity).toFixed(2)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {extraPerItem > 0 && (
                            <div className="flex justify-between text-sm font-medium border-t border-stone-100 dark:border-stone-700 pt-2 text-amber-600 dark:text-amber-400">
                              <span>Customization extras</span>
                              <span>+${(extraPerItem * item.quantity).toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Per-item customer message */}
                      {item.customerMessage && (
                        <div className="px-4 py-3 border-t border-stone-100 dark:border-stone-700 flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                          <p className="text-sm text-stone-600 dark:text-stone-400 italic">
                            &ldquo;{item.customerMessage}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Billing & Delivery */}
          <Card>
            <CardHeader>
              <CardTitle>Billing & Delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Contact */}
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Full Name" value={`${order.firstName ?? ""} ${order.lastName ?? ""}`.trim() || null} />
                <DetailRow label="Email" value={order.customerEmail} />
                <DetailRow label="Sender Phone" value={order.senderPhone} />
                <DetailRow label="Recipient Phone" value={order.recipientPhone} />
              </div>

              {/* Address */}
              {deliveryAddress && (
                <div className="flex items-start gap-2 pt-1 border-t border-stone-100 dark:border-stone-700">
                  <MapPin className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-0.5">
                      Delivery Address
                    </p>
                    <p className="text-sm font-medium text-stone-900 dark:text-white">{deliveryAddress}</p>
                    {order.shipToDifferentAddress && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Ship to different address</p>
                    )}
                  </div>
                </div>
              )}

              {/* Card quote */}
              {order.cardQuote && (
                <div className="flex items-start gap-2 border-t border-stone-100 dark:border-stone-700 pt-3">
                  <Mail className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-0.5">
                      Card Quote
                    </p>
                    <p className="text-sm text-stone-900 dark:text-white italic">&ldquo;{order.cardQuote}&rdquo;</p>
                  </div>
                </div>
              )}

              {/* Order notes */}
              {order.orderNotes && (
                <div className="flex items-start gap-2 border-t border-stone-100 dark:border-stone-700 pt-3">
                  <FileText className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-0.5">
                      Order Notes
                    </p>
                    <p className="text-sm text-stone-900 dark:text-white">{order.orderNotes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-6">
          {/* Order total */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.orderItems?.map((item) => {
                const customizations = (item.customizations ?? []) as { id: string; quantity: number }[];
                const extraPerItem = itemCustomizationTotal(customizations);
                const shellPrice = item.unitPrice > extraPerItem ? item.unitPrice - extraPerItem : item.unitPrice;
                return (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-stone-600 dark:text-stone-400">
                      {item.product?.name || `Item`}
                      <span className="text-stone-400 ml-1">×{item.quantity}</span>
                    </span>
                    <span className="font-medium">
                      ${(item.quantity * (shellPrice + extraPerItem)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
              <div className="flex justify-between font-bold text-base border-t border-stone-200 dark:border-stone-700 pt-3">
                <span>Total</span>
                <span className="text-amber-600 dark:text-amber-400">
                  ${order.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {payment ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-stone-500 dark:text-stone-400">Status</p>
                    <Badge className={PAYMENT_STATUS_COLORS[payment.status] ?? "bg-gray-100 text-gray-800"}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-stone-500 dark:text-stone-400">Method</p>
                    <p className="text-sm font-medium text-stone-900 dark:text-white">
                      {payment.method === "credit_card"
                        ? "Credit Card"
                        : payment.method === "bank_transfer"
                          ? "Bank Transfer"
                          : "Cash on Delivery"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-stone-500 dark:text-stone-400">Amount</p>
                    <p className="text-sm font-medium text-stone-900 dark:text-white">
                      ${payment.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-stone-500 dark:text-stone-400">Date</p>
                    <p className="text-sm font-medium text-stone-900 dark:text-white">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {payment.imageUrl && (
                    <a
                      href={`http://localhost:5001${payment.imageUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View Receipt
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-sm text-stone-500 dark:text-stone-400">No payment recorded yet</p>
                  <Button onClick={() => router.push(`/payment/${orderId}`)} className="w-full">
                    Pay Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
