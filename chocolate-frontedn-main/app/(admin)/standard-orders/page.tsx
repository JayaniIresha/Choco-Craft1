"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Search, Download, Edit, Trash2, Loader2, Package, Info } from "lucide-react";
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
  DialogTrigger,
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

export default function StandardOrdersPage() {
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
        false // ONLY STANDARD ORDERS
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
    doc.text("Standard Orders Report", 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableData = orders.map((order) => [
      `${order.id.slice(-8)}`,
      [order.firstName, order.lastName].filter(Boolean).join(" ") || "N/A",
      order.customerEmail,
      order.status,
      `$${(order.orderItems
        ?.filter((item) => (item.customizations as any[] || []).length === 0)
        .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) || 0)
        .toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      new Date(order.createdAt).toLocaleDateString(),
    ]);

    autoTable(doc, {
      head: [["Order", "Customer", "Email", "Status", "Total", "Date"]],
      body: tableData,
      startY: 35,
      theme: "striped",
      headStyles: { fillColor: [153, 51, 0] }, // darker cocoa brown
    });

    doc.save(`standard-orders-report-${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF exported successfully");
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-amber-100 text-amber-800";
      case "Processing": return "bg-sky-100 text-sky-800";
      case "Completed": return "bg-emerald-100 text-emerald-800";
      case "Cancelled": return "bg-rose-100 text-rose-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 dark:text-white flex items-center gap-3">
            <Package className="h-8 w-8 text-amber-800" /> Standard Orders
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">
            "Already Made" products and inventory stock orders.
          </p>
        </div>
        <Button onClick={exportToPDF} disabled={orders.length === 0} variant="outline" className="border-amber-200 text-amber-900 hover:bg-amber-50">
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-2">Search Orders</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                <Input
                  placeholder="Customer, email, or order ID..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-10 focus-visible:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-2">Status</label>
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col justify-end">
              <div className="text-sm font-bold text-amber-900 bg-amber-50 rounded-lg p-3 border border-amber-100 text-center">
                Total: {total} Orders
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>
      ) : orders.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-12 text-center text-stone-400"><p>No standard orders found</p></CardContent></Card>
      ) : (
        <>
          <div className="bg-white dark:bg-stone-950 border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-stone-50 dark:bg-stone-900 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-stone-500">Order ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-stone-500">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-stone-500">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-stone-500">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-stone-500 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-amber-50/30 dark:hover:bg-stone-900/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-stone-900 dark:text-white">{order.id.slice(-8).toUpperCase()}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-stone-900 dark:text-white">
                        {[order.firstName, order.lastName].filter(Boolean).join(" ") || "Customer"}
                      </div>
                      <div className="text-xs text-stone-500">{order.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className={getStatusBadgeColor(order.status)}>{order.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-stone-900 dark:text-white">
                      ${order.orderItems
                        ?.filter(item => (item.customizations as any[] || []).length === 0)
                        .reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
                        .toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                       <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                            <Info className="h-4 w-4" />
                            Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[400px]">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Package className="h-5 w-5 text-amber-800" />
                              Standard Item Details
                            </DialogTitle>
                            <DialogDescription>
                              Order ID: {order.id.slice(-8).toUpperCase()}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                            {order.orderItems
                              ?.filter(item => (item.customizations as any[] || []).length === 0)
                              .map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 rounded-lg border bg-stone-50">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-stone-900">{item.product?.name}</span>
                                    <span className="text-xs text-stone-500">${item.unitPrice.toFixed(2)} each</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-800 rounded">Qty: {item.quantity}</span>
                                    <span className="font-bold text-stone-900">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                                  </div>
                                </div>
                              ))}
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => {}}>Close</Button>
                          </DialogFooter>
                        </DialogContent>
                       </Dialog>

                       <Dialog
                          open={statusDialogOpen && editingOrder?.id === order.id}
                          onOpenChange={(op) => { setStatusDialogOpen(op); if(!op) setEditingOrder(null); }}
                        >
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setEditingOrder(order); statusForm.reset({ status: order.status as any }); setStatusDialogOpen(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Order Status</DialogTitle>
                              <DialogDescription>Change status for standard order {order.id.slice(-8)}</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={statusForm.handleSubmit(handleUpdateStatus)} className="space-y-4">
                              <Controller
                                name="status"
                                control={statusForm.control}
                                render={({ field, fieldState }) => (
                                  <Field>
                                    <FieldLabel>New Status</FieldLabel>
                                    <Select value={field.value || ""} onValueChange={field.onChange}>
                                      <SelectTrigger aria-invalid={fieldState.invalid}><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Processing">Processing</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                  </Field>
                                )}
                              />
                              <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => { setStatusDialogOpen(false); setEditingOrder(null); statusForm.reset(); }}>Cancel</Button>
                                <Button type="submit" disabled={submitting}>
                                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Update Status"}
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                       </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Delete Order?</AlertDialogTitle><AlertDialogDescription>Delete {order.id.slice(-8)}? Action is irreversible.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>No</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteOrder(order)} className="bg-rose-600">Delete</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center gap-1 mt-6">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page-1)}>Prev</Button>
              <div className="flex items-center px-4 text-sm font-bold">{page} / {totalPages}</div>
              <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(page+1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
