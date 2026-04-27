"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { reviewApiService } from "@/services/review.service";
import { orderApiService } from "@/services/order.service";
import type { Review } from "@/types/review.types";
import type { Order } from "@/types/order.types";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [ratingFilter, setRatingFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const minRating =
        ratingFilter === "all" ? undefined : parseInt(ratingFilter);
      const maxRating = minRating ? minRating : undefined;

      const result = await reviewApiService.getReviews(
        page,
        10,
        undefined,
        minRating,
        maxRating
      );
      setReviews(result.reviews || []);
      setTotalPages(result.pages);
      setTotal(result.total);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  }, [page, ratingFilter]);

  const handleViewOrder = async (orderId: string) => {
    try {
      setLoadingOrder(true);
      const order = await orderApiService.getOrderById(orderId);
      setSelectedOrder(order);
      setOrderDialogOpen(true);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to fetch order");
    } finally {
      setLoadingOrder(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
              }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-stone-900 dark:text-white">
          Reviews
        </h1>
        <p className="text-stone-600 dark:text-stone-400 mt-1">
          Total reviews: {total}
        </p>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
              Filter by Rating:
            </label>
            <Select value={ratingFilter} onValueChange={(value) => {
              setRatingFilter(value);
              setPage(1);
            }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4+ Stars</SelectItem>
                <SelectItem value="3">3+ Stars</SelectItem>
                <SelectItem value="2">2+ Stars</SelectItem>
                <SelectItem value="1">1+ Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-stone-600 dark:text-stone-400">
              No reviews found
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-stone-900 dark:text-white">
                        {review.user?.name || "Unknown User"}
                      </h3>
                      <span className="text-xs text-stone-500">
                        {review.user?.email}
                      </span>
                    </div>
                    <p className="text-sm text-stone-500 mt-1">
                      <button
                        onClick={() => handleViewOrder(review.orderId)}
                        className="hover:underline text-primary font-medium"
                        disabled={loadingOrder}
                      >
                        Order #{review.order?.id.slice(-8)}
                      </button>{" "}
                      • {review.order?.customerName} (${review.order?.totalPrice.toLocaleString("en-US")}) •{" "}
                      {new Date(review.createdAt).toLocaleDateString()} at{" "}
                      {new Date(review.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      {renderStars(review.rating)}
                      <span className="font-semibold text-stone-900 dark:text-white">
                        {review.rating}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                  {review.comment}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex items-center gap-2"
          >
            Previous
          </Button>
          <div className="flex items-center gap-2 px-4">
            <span className="text-sm text-stone-600 dark:text-stone-400">
              Page {page} of {totalPages}
            </span>
          </div>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="flex items-center gap-2"
          >
            Next
          </Button>
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {loadingOrder ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
            </div>
          ) : selectedOrder ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-medium">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{selectedOrder.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer Name</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer Email</p>
                  <p className="font-medium">{selectedOrder.customerEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Product Type</p>
                  <p className="font-medium">{selectedOrder.productType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium">{selectedOrder.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Price</p>
                  <p className="font-medium">${selectedOrder.totalPrice.toLocaleString("en-US")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(selectedOrder.createdAt).toLocaleDateString()} at{" "}
                    {new Date(selectedOrder.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              {selectedOrder.customMessage && (
                <div>
                  <p className="text-sm text-muted-foreground">Custom Message</p>
                  <p className="font-medium">{selectedOrder.customMessage}</p>
                </div>
              )}
              {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Order Items</p>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2">Product</th>
                          <th className="text-right p-2">Qty</th>
                          <th className="text-right p-2">Unit Price</th>
                          <th className="text-right p-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.orderItems.map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="p-2">{item.product?.name || "Unknown"}</td>
                            <td className="text-right p-2">{item.quantity}</td>
                            <td className="text-right p-2">${item.unitPrice.toLocaleString("en-US")}</td>
                            <td className="text-right p-2">${(item.quantity * item.unitPrice).toLocaleString("en-US")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No order data available</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
