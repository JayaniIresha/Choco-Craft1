"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Loader2, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

import { authService } from "@/services/auth.service";
import { orderApiService } from "@/services/order.service";
import { reviewApiService } from "@/services/review.service";
import {
  CreateReviewSchema,
  UpdateReviewSchema,
  type CreateReviewInput,
  type UpdateReviewInput,
} from "@/validations/review.validation";
import type { Order } from "@/types/order.types";
import type { Review } from "@/types/review.types";

export default function MyReviewsPage() {
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);

  const createForm = useForm<CreateReviewInput>({
    resolver: zodResolver(CreateReviewSchema),
    defaultValues: {
      orderId: "",
      rating: 5,
      comment: "",
    },
  });

  const editForm = useForm<UpdateReviewInput>({
    resolver: zodResolver(UpdateReviewSchema),
  });

  const fetchMyReviews = useCallback(async (uid: string) => {
    try {
      setLoading(true);
      const result = await reviewApiService.getReviews(1, 100, undefined, undefined, undefined, uid);
      // Filter to only own reviews
      setMyReviews(result.reviews || []);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      const result = await orderApiService.getMyOrders(1, 1000);
      // Filter to orders without reviews
      const reviewedOrderIds = myReviews.map((r) => r.orderId);
      const availableOrders = result.orders.filter(
        (order) => !reviewedOrderIds.includes(order.id)
      );
      setOrders(availableOrders);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to fetch orders");
    } finally {
      setLoadingOrders(false);
    }
  }, [myReviews]);

  useEffect(() => {
    authService.getProfile().then(profile => {
      setUserId(profile.id);
      fetchMyReviews(profile.id);
    }).catch(() => {
      toast.error("Failed to load user profile");
      setLoading(false);
    });
  }, [fetchMyReviews]);

  useEffect(() => {
    if (createDialogOpen) {
      fetchOrders();
    }
  }, [createDialogOpen, fetchOrders]);

  const handleCreateReview = async (data: CreateReviewInput) => {
    try {
      setSubmitting(true);
      await reviewApiService.createReview(data);
      toast.success("Review created successfully");
      setCreateDialogOpen(false);
      createForm.reset();
      if (userId) fetchMyReviews(userId);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to create review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditReview = async (data: UpdateReviewInput) => {
    if (!editingReview) return;

    try {
      setSubmitting(true);
      await reviewApiService.updateReview(editingReview.id, data);
      toast.success("Review updated successfully");
      setEditDialogOpen(false);
      setEditingReview(null);
      editForm.reset();
      if (userId) fetchMyReviews(userId);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to update review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!deletingReview) return;

    try {
      setSubmitting(true);
      await reviewApiService.softDeleteReview(deletingReview.id);
      toast.success("Review deleted successfully");
      setDeletingReview(null);
      if (userId) fetchMyReviews(userId);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to delete review");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, editable: boolean = false, onChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => editable && onChange?.(star)}
            disabled={!editable}
            className={`${editable ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 dark:text-white">
            My Reviews
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">
            Total reviews: {myReviews.length}
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Write Review
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Write a Review</DialogTitle>
              <DialogDescription>
                Share your experience with an order
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={createForm.handleSubmit(handleCreateReview)}
              className="space-y-4"
            >
              <Controller
                name="orderId"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Select Order</FieldLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      disabled={loadingOrders}
                    >
                      <SelectTrigger
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue
                          placeholder={
                            loadingOrders ? "Loading orders..." : "Select an order"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {orders.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            {loadingOrders
                              ? "Loading orders..."
                              : "No orders available"}
                          </div>
                        ) : (
                          orders.map((order) => (
                            <SelectItem key={order.id} value={order.id}>
                              #{order.id.slice(-8)} — {order.firstName ?? ""} {order.lastName ?? ""} (${" "}
                              {order.totalPrice.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}
                              )
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="rating"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Rating</FieldLabel>
                    <div className="mt-2">
                      {renderStars(field.value || 5, true, (rating) =>
                        field.onChange(rating)
                      )}
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="comment"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Comment</FieldLabel>
                    <Textarea
                      placeholder="Share your experience..."
                      aria-invalid={fieldState.invalid}
                      className="h-32"
                      {...field}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    createForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    "Publish Review"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
        </div>
      ) : myReviews.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-stone-600 dark:text-stone-400 mb-4">
              You haven&apos;t written any reviews yet
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              Write your first review
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {myReviews.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Order #{review.order?.id.slice(-8)}
                    </CardTitle>
                    <p className="text-sm text-stone-500 mt-1">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Dialog
                      open={editDialogOpen && editingReview?.id === review.id}
                      onOpenChange={(open) => {
                        setEditDialogOpen(open);
                        if (!open) {
                          setEditingReview(null);
                          editForm.reset();
                        }
                      }}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingReview(review);
                          editForm.reset({
                            rating: review.rating,
                            comment: review.comment,
                          });
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Review</DialogTitle>
                        </DialogHeader>
                        <form
                          onSubmit={editForm.handleSubmit(handleEditReview)}
                          className="space-y-4"
                        >
                          <Controller
                            name="rating"
                            control={editForm.control}
                            render={({ field, fieldState }) => (
                              <Field>
                                <FieldLabel>Rating</FieldLabel>
                                <div className="mt-2">
                                  {renderStars(
                                    field.value || review.rating,
                                    true,
                                    (rating) => field.onChange(rating)
                                  )}
                                </div>
                                {fieldState.invalid && (
                                  <FieldError errors={[fieldState.error]} />
                                )}
                              </Field>
                            )}
                          />

                          <Controller
                            name="comment"
                            control={editForm.control}
                            render={({ field, fieldState }) => (
                              <Field>
                                <FieldLabel>Comment</FieldLabel>
                                <Textarea
                                  aria-invalid={fieldState.invalid}
                                  className="h-32"
                                  {...field}
                                />
                                {fieldState.invalid && (
                                  <FieldError errors={[fieldState.error]} />
                                )}
                              </Field>
                            )}
                          />

                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEditDialogOpen(false);
                                setEditingReview(null);
                                editForm.reset();
                              }}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                              {submitting ? "Updating..." : "Update Review"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Review</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this review? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              setDeletingReview(review);
                              handleDeleteReview();
                            }}
                            disabled={submitting}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {submitting ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  {renderStars(review.rating)}
                  <span className="text-sm font-medium">
                    {review.rating}/5
                  </span>
                </div>
                <p className="text-stone-700 dark:text-stone-300">
                  {review.comment}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
