"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Search, Download, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { orderApiService } from "@/services/order.service";
import {
  UpdateOrderSchema,
  type UpdateOrderInput,
} from "@/validations/order.validation";
import type { Order } from "@/types/order.types";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);

  const statusForm = useForm<UpdateOrderInput>({
    resolver: zodResolver(UpdateOrderSchema),
    defaultValues: {
      status: "Pending",
    },
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const result = await orderApiService.getOrders(
        page,
        10,
        statusFilter === "all" ? undefined : statusFilter,
        search || undefined,
      );
      setOrders(result.orders);
      setTotalPages(result.pages);
      setTotal(result.total);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (data: UpdateOrderInput) => {
    if (!editingOrder) return;

    try {
      setSubmitting(true);
      await orderApiService.updateOrder(editingOrder.id, data);
      toast.success("Order status updated successfully");
      setStatusDialogOpen(false);
      setEditingOrder(null);
      statusForm.reset();
      fetchOrders();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to update order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOrder = async (orderOverride?: Order) => {
    const orderToDelete = orderOverride || deletingOrder;
    if (!orderToDelete) return;

    try {
      setSubmitting(true);
      await orderApiService.hardDeleteOrder(orderToDelete.id);
      toast.success("Order deleted successfully");
      setDeletingOrder(null);
      fetchOrders();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to delete order");
    } finally {
      setSubmitting(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Orders Report", 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableData = orders.map((order) => [
      `$${order.id.slice(-8)}`,
      [order.firstName, order.lastName].filter(Boolean).join(" ") ||
        order.customerEmail ||
        "N/A",
      order.customerEmail,
      order.status,
      `$${order.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      new Date(order.createdAt).toLocaleDateString(),
    ]);

    autoTable(doc, {
      head: [["Order ", "Customer", "Email", "Status", "Total", "Date"]],
      body: tableData,
      startY: 35,
      theme: "striped",
      headStyles: { fillColor: [217, 119, 6] }, // amber-600
    });

    doc.save(`orders-report-${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF exported successfully");
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Processing":
        return "bg-blue-100 text-blue-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 dark:text-white">
            Orders Management
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">
            Total orders: {total}
          </p>
        </div>
        <Button onClick={exportToPDF} disabled={orders.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-2">
                Search by Customer Name or Email
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                <Input
                  placeholder=" or john@example.com"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-2">
                Filter by Status
              </label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-stone-600 dark:text-stone-400">
              No orders found
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-100 dark:bg-stone-900">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900 dark:text-white">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900 dark:text-white">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900 dark:text-white">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900 dark:text-white">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900 dark:text-white">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900 dark:text-white">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-stone-50 dark:hover:bg-stone-900"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-stone-900 dark:text-white">
                      {order.id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600 dark:text-stone-400">
                      {[order.firstName, order.lastName]
                        .filter(Boolean)
                        .join(" ") || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600 dark:text-stone-400">
                      {order.customerEmail}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge className={getStatusBadgeColor(order.status)}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-stone-900 dark:text-white">
                      ${" "}
                      {order.totalPrice.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600 dark:text-stone-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <>
                        {order.status !== "Cancelled" && (
                          <Dialog
                            open={
                              statusDialogOpen && editingOrder?.id === order.id
                            }
                            onOpenChange={(open) => {
                              setStatusDialogOpen(open);
                              if (!open) {
                                setEditingOrder(null);
                                statusForm.reset();
                              }
                            }}
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingOrder(order);
                                statusForm.reset({
                                  status:
                                    order.status as UpdateOrderInput["status"],
                                });
                                setStatusDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Status
                            </Button>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update Order Status</DialogTitle>
                                <DialogDescription>
                                  Change the status for order 
                                  {order.id.slice(-8)}
                                </DialogDescription>
                              </DialogHeader>
                              <form
                                onSubmit={statusForm.handleSubmit(
                                  handleUpdateStatus,
                                )}
                                className="space-y-4"
                              >
                                <Controller
                                  name="status"
                                  control={statusForm.control}
                                  render={({ field, fieldState }) => (
                                    <Field>
                                      <FieldLabel>New Status</FieldLabel>
                                      <Select
                                        value={field.value || ""}
                                        onValueChange={field.onChange}
                                      >
                                        <SelectTrigger
                                          aria-invalid={fieldState.invalid}
                                        >
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Pending">
                                            Pending
                                          </SelectItem>
                                          <SelectItem value="Processing">
                                            Processing
                                          </SelectItem>
                                          <SelectItem value="Completed">
                                            Completed
                                          </SelectItem>
                                          <SelectItem value="Cancelled">
                                            Cancelled
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                      {fieldState.invalid && (
                                        <FieldError
                                          errors={[fieldState.error]}
                                        />
                                      )}
                                    </Field>
                                  )}
                                />
                                <DialogFooter>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      setStatusDialogOpen(false);
                                      setEditingOrder(null);
                                      statusForm.reset();
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button type="submit" disabled={submitting}>
                                    {submitting ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Updating...
                                      </>
                                    ) : (
                                      "Update Status"
                                    )}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Order</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete order 
                                {order.id.slice(-8)}? This action cannot be
                                undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  handleDeleteOrder(order);
                                }}
                                disabled={submitting}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {submitting ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
