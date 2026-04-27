"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Eye, XCircle, Navigation } from "lucide-react";
import { toast } from "sonner";
import { orderApiService } from "@/services/order.service";
import { Order } from "@/types/order.types";
import RiderTrackingModal from "@/components/web/rider-tracking-modal";

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Processing: "bg-blue-100 text-blue-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
  "Driver Assigned": "bg-amber-100 text-amber-800",
};

const CANCELLABLE = ["Pending", "Processing"];

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("all");
  const [totalPages, setTotalPages] = useState(0);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [confirmOrder, setConfirmOrder] = useState<Order | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  const fetchOrders = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await orderApiService.getMyOrders(
        page,
        10,
        status === "all" ? undefined : status
      );
      console.log("[DEBUG] My Orders API response:", data);
      setOrders(data.orders);
      setTotalPages(Math.ceil(data.total / 10));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancel = async () => {
    if (!confirmOrder) return;
    try {
      setCancelling(confirmOrder.id);
      await orderApiService.updateOrder(confirmOrder.id, { status: "Cancelled" });
      toast.success(`Order #${confirmOrder.id.slice(-8).toUpperCase()} cancelled`);
      fetchOrders();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to cancel order");
    } finally {
      setCancelling(null);
      setConfirmOrder(null);
    }
  };

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900 dark:text-white mb-2">My Orders</h1>
        <p className="text-stone-600 dark:text-stone-400">Track and manage your orders</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Processing">Processing</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => router.push("/checkout")}>New Order</Button>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-stone-600 dark:text-stone-400 mb-4">No orders found</p>
            <Button
              onClick={() => router.push("/checkout")}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Create First Order
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-stone-900 dark:text-white">
                        Order #{order.id.slice(-8).toUpperCase()}
                      </h3>
                      <Badge className={STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-800"}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-stone-600 dark:text-stone-400">
                      <div>
                        <p className="font-medium text-stone-900 dark:text-white">
                          {order.firstName} {order.lastName}
                        </p>
                        <p>{order.customerEmail}</p>
                      </div>
                      <div>
                        <p className="font-medium text-stone-900 dark:text-white">
                          ${order.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                        <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {/* Item images row */}
                    {order.orderItems && order.orderItems.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {order.orderItems.map((item) => {
                          const isCustomDarkNoFilling = item.product?.name?.toLowerCase() === "custom dark chocolate (no filling)";
                          const imgUrl = item.product?.imageUrl
                            ? item.product.imageUrl.startsWith("http")
                              ? item.product.imageUrl
                              : `http://localhost:5001${item.product.imageUrl}`
                            : "/placeholder.png";
                          return (
                            <div key={item.id} className="relative group">
                              {!isCustomDarkNoFilling && (
                                <img
                                  src={imgUrl}
                                  alt={item.product?.name || "Product"}
                                  className="w-12 h-12 rounded-lg object-cover border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 transition-transform duration-200 group-hover:scale-105"
                                />
                              )}
                              <div className={`absolute -top-2 -right-2 bg-stone-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm opacity-90 ${isCustomDarkNoFilling ? "relative top-0 right-0" : ""}`}>
                                {item.quantity}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/my-orders/${order.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>

                    {order.status === "Driver Assigned" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-300 text-amber-600 hover:bg-amber-50"
                        onClick={() => setTrackingOrder(order)}
                      >
                        <Navigation className="w-4 h-4 mr-1" />
                        Track
                      </Button>
                    )}

                    {CANCELLABLE.includes(order.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                        disabled={cancelling === order.id}
                        onClick={() => setConfirmOrder(order)}
                      >
                        {cancelling === order.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-1" />
                            Cancel
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-stone-600 dark:text-stone-400">
                  Page {page} of {totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Rider tracking modal */}
      {trackingOrder && (
        <RiderTrackingModal
          open={!!trackingOrder}
          onClose={() => setTrackingOrder(null)}
          orderId={trackingOrder.id}
          label={`Order #${trackingOrder.id.slice(-8).toUpperCase()}`}
        />
      )}

      {/* Cancel confirmation dialog */}
      <AlertDialog open={!!confirmOrder} onOpenChange={(open) => { if (!open) setConfirmOrder(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              Order{" "}
              <span className="font-semibold text-stone-900 dark:text-white">
                #{confirmOrder?.id.slice(-8).toUpperCase()}
              </span>{" "}
              will be marked as <span className="font-semibold text-red-600">Cancelled</span>. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
