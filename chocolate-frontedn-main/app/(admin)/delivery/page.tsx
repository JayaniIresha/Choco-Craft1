"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  Loader2,
  Navigation,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { deliveryApiService } from "@/services/delivery.service";
import { orderApiService } from "@/services/order.service";
import { orderTrackingService } from "@/services/order-tracking.service";
import RiderTrackingModal from "@/components/web/rider-tracking-modal";
import {
  CreateDeliverySchema,
  UpdateDeliverySchema,
  type CreateDeliveryInput,
  type UpdateDeliveryInput,
} from "@/validations/delivery.validation";
import type { Delivery } from "@/types/delivery.types";
import type { Order } from "@/types/order.types";

export default function AdminDeliveryPage() {
  const today = new Date().toISOString().split("T")[0];

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const [deletingDelivery, setDeletingDelivery] = useState<Delivery | null>(
    null,
  );
  const [trackingDelivery, setTrackingDelivery] = useState<Delivery | null>(
    null,
  );

  const createForm = useForm<CreateDeliveryInput>({
    resolver: zodResolver(CreateDeliverySchema),
    defaultValues: {
      orderId: "",
      deliveryPersonName: "",
      vehicleType: "car",
      deliveryDate: "",
      status: "pending",
      specialNotes: "",
    },
  });

  const editForm = useForm<UpdateDeliveryInput>({
    resolver: zodResolver(UpdateDeliverySchema),
  });

  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      const result = await deliveryApiService.getDeliveries(
        page,
        10,
        statusFilter === "all" ? undefined : statusFilter,
        search || undefined,
        vehicleFilter === "all" ? undefined : vehicleFilter,
      );
      setDeliveries(result.deliveries);
      setTotalPages(result.pages);
      setTotal(result.total);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to fetch deliveries");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, vehicleFilter]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      const result = await orderApiService.getOrders(1, 1000);
      setOrders(result.orders);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to fetch orders");
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
    fetchOrders();
  }, [fetchDeliveries, fetchOrders]);

  const handleCreateDelivery = async (data: CreateDeliveryInput) => {
    try {
      setSubmitting(true);
      await deliveryApiService.createDelivery(data);

      // Mark order as Driver Assigned
      await orderApiService.updateOrder(data.orderId, {
        status: "Driver Assigned",
      });

      // Initialise Firestore tracking doc at shop location
      await orderTrackingService.initTracking(data.orderId);

      toast.success("Delivery created & driver assigned");
      setCreateDialogOpen(false);
      createForm.reset();
      setPage(1);
      fetchDeliveries();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to create delivery");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditDelivery = async (data: UpdateDeliveryInput) => {
    if (!editingDelivery) return;

    try {
      setSubmitting(true);
      await deliveryApiService.updateDelivery(editingDelivery.id, data);
      toast.success("Delivery updated successfully");
      setEditDialogOpen(false);
      setEditingDelivery(null);
      editForm.reset();
      fetchDeliveries();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to update delivery");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDelivery = async (deliveryOverride?: Delivery) => {
    const deliveryToDelete = deliveryOverride || deletingDelivery;
    if (!deliveryToDelete) return;

    try {
      setSubmitting(true);
      await deliveryApiService.hardDeleteDelivery(deliveryToDelete.id);
      toast.success("Delivery deleted successfully");
      setDeletingDelivery(null);
      fetchDeliveries();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to delete delivery");
    } finally {
      setSubmitting(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Deliveries Report", 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableData = deliveries.map((delivery) => [
      `#${delivery.id.slice(-8)}`,
      `#${delivery.orderId.slice(-8)}`,
      delivery.order
        ? delivery.order.customerName ||
          delivery.order.customerEmail ||
          "-"
        : "-",
      delivery.deliveryPersonName,
      getVehicleLabel(delivery.vehicleType),
      new Date(delivery.deliveryDate).toLocaleDateString(),
      delivery.status,
    ]);

    autoTable(doc, {
      head: [
        [
          "Delivery #",
          "Order #",
          "Customer",
          "Person",
          "Vehicle",
          "Date",
          "Status",
        ],
      ],
      body: tableData,
      startY: 35,
      theme: "striped",
      headStyles: { fillColor: [217, 119, 6] }, // amber-600
    });

    doc.save(`deliveries-report-${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF exported successfully");
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "dispatched":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getVehicleLabel = (vehicleType: string) => {
    switch (vehicleType) {
      case "car":
        return "🚗 Car";
      case "three_wheel":
        return "🛺 Three-Wheel";
      case "bike":
        return "🏍️ Bike";
      default:
        return vehicleType;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 dark:text-white">
            Delivery Management
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">
            Total deliveries: {total}
          </p>
        </div>
        <div className="space-x-2">
          <Button onClick={exportToPDF} disabled={deliveries.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Delivery
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Delivery</DialogTitle>
                <DialogDescription>
                  Add a new delivery record for an order
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={createForm.handleSubmit(handleCreateDelivery)}
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
                        <SelectTrigger aria-invalid={fieldState.invalid}>
                          <SelectValue
                            placeholder={
                              loadingOrders
                                ? "Loading orders..."
                                : "Select an order"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const availableOrders = orders.filter(
                              (order) =>
                                !deliveries.some(
                                  (delivery) => delivery.orderId === order.id,
                                ),
                            );

                            if (availableOrders.length === 0) {
                              return (
                                <div className="p-2 text-sm text-stone-500">
                                  {loadingOrders
                                    ? "Loading orders..."
                                    : "No orders available"}
                                </div>
                              );
                            }

                            return availableOrders.map((order) => (
                              <SelectItem key={order.id} value={order.id}>
                                #{order.id.slice(-8)} - {order.firstName}{" "}
                                {order.lastName} ($ {" "}
                                {order.totalPrice.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                })}
                                )
                              </SelectItem>
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="deliveryPersonName"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Delivery Person Name</FieldLabel>
                      <Input
                        placeholder=""
                        aria-invalid={fieldState.invalid}
                        {...field}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="vehicleType"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Vehicle Type</FieldLabel>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger aria-invalid={fieldState.invalid}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="car">Car</SelectItem>
                          <SelectItem value="three_wheel">
                            Three-Wheel
                          </SelectItem>
                          <SelectItem value="bike">Bike</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="deliveryDate"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Delivery Date</FieldLabel>
                      <Input
                        type="date"
                        min={today}
                        aria-invalid={fieldState.invalid}
                        {...field}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="status"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Status</FieldLabel>
                      <Select
                        value={field.value || "pending"}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger aria-invalid={fieldState.invalid}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="dispatched">Dispatched</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="specialNotes"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Special Notes (Optional)</FieldLabel>
                      <Textarea
                        placeholder="Add any special delivery notes..."
                        aria-invalid={fieldState.invalid}
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
                        Creating...
                      </>
                    ) : (
                      "Create Delivery"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="dispatched">Dispatched</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-2">
                Filter by Vehicle Type
              </label>
              <Select
                value={vehicleFilter}
                onValueChange={(value) => {
                  setVehicleFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="three_wheel">Three-Wheel</SelectItem>
                  <SelectItem value="bike">Bike</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deliveries Table */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
        </div>
      ) : deliveries.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-stone-600 dark:text-stone-400">
              No deliveries found
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
                    Delivery ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900 dark:text-white">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900 dark:text-white">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900 dark:text-white">
                    Person
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900 dark:text-white">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900 dark:text-white">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900 dark:text-white">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
                {deliveries.map((delivery) => (
                  <tr
                    key={delivery.id}
                    className="hover:bg-stone-50 dark:hover:bg-stone-900"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-stone-900 dark:text-white">
                      {delivery.id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600 dark:text-stone-400">
                      {delivery.orderId.slice(-8)}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600 dark:text-stone-400">
                      {delivery.order
                        ? delivery.order.customerName ||
                          delivery.order.customerEmail ||
                          "-"
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600 dark:text-stone-400">
                      {delivery.deliveryPersonName}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600 dark:text-stone-400">
                      {getVehicleLabel(delivery.vehicleType)}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600 dark:text-stone-400">
                      {new Date(delivery.deliveryDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge className={getStatusBadgeColor(delivery.status)}>
                        {delivery.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-amber-600 border-amber-300 hover:bg-amber-50"
                        onClick={() => setTrackingDelivery(delivery)}
                      >
                        <Navigation className="w-4 h-4 mr-1" />
                        Track
                      </Button>

                      <Dialog
                        open={
                          editDialogOpen && editingDelivery?.id === delivery.id
                        }
                        onOpenChange={(open) => {
                          setEditDialogOpen(open);
                          if (!open) {
                            setEditingDelivery(null);
                            editForm.reset();
                          }
                        }}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingDelivery(delivery);
                            editForm.reset({
                              deliveryPersonName: delivery.deliveryPersonName,
                              vehicleType: delivery.vehicleType,
                              deliveryDate: delivery.deliveryDate.split("T")[0],
                              status:
                                delivery.status as UpdateDeliveryInput["status"],
                              specialNotes: delivery.specialNotes,
                            });
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Delivery</DialogTitle>
                            <DialogDescription>
                              Update delivery details for #
                              {delivery.id.slice(-8)}
                            </DialogDescription>
                          </DialogHeader>
                          <form
                            onSubmit={editForm.handleSubmit(handleEditDelivery)}
                            className="space-y-4"
                          >
                            <Controller
                              name="deliveryPersonName"
                              control={editForm.control}
                              render={({ field, fieldState }) => (
                                <Field>
                                  <FieldLabel>Delivery Person Name</FieldLabel>
                                  <Input
                                    placeholder=""
                                    aria-invalid={fieldState.invalid}
                                    {...field}
                                  />
                                  {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                  )}
                                </Field>
                              )}
                            />

                            <Controller
                              name="vehicleType"
                              control={editForm.control}
                              render={({ field, fieldState }) => (
                                <Field>
                                  <FieldLabel>Vehicle Type</FieldLabel>
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
                                      <SelectItem value="car">Car</SelectItem>
                                      <SelectItem value="three_wheel">
                                        Three-Wheel
                                      </SelectItem>
                                      <SelectItem value="bike">Bike</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                  )}
                                </Field>
                              )}
                            />

                            <Controller
                              name="deliveryDate"
                              control={editForm.control}
                              render={({ field, fieldState }) => (
                                <Field>
                                  <FieldLabel>Delivery Date</FieldLabel>
                                  <Input
                                    type="date"
                                    min={today}
                                    aria-invalid={fieldState.invalid}
                                    {...field}
                                  />
                                  {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                  )}
                                </Field>
                              )}
                            />

                            <Controller
                              name="status"
                              control={editForm.control}
                              render={({ field, fieldState }) => (
                                <Field>
                                  <FieldLabel>Status</FieldLabel>
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
                                      <SelectItem value="pending">
                                        Pending
                                      </SelectItem>
                                      <SelectItem value="dispatched">
                                        Dispatched
                                      </SelectItem>
                                      <SelectItem value="delivered">
                                        Delivered
                                      </SelectItem>
                                      <SelectItem value="failed">
                                        Failed
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                  )}
                                </Field>
                              )}
                            />

                            <Controller
                              name="specialNotes"
                              control={editForm.control}
                              render={({ field, fieldState }) => (
                                <Field>
                                  <FieldLabel>
                                    Special Notes (Optional)
                                  </FieldLabel>
                                  <Textarea
                                    placeholder="Add any special delivery notes..."
                                    aria-invalid={fieldState.invalid}
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
                                  setEditingDelivery(null);
                                  editForm.reset();
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
                                  "Update Delivery"
                                )}
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
                            <AlertDialogTitle>Delete Delivery</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete delivery #
                              {delivery.id.slice(-8)}? This action cannot be
                              undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                handleDeleteDelivery(delivery);
                              }}
                              disabled={submitting}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {submitting ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
      {/* Rider tracking modal */}
      {trackingDelivery && (
        <RiderTrackingModal
          open={!!trackingDelivery}
          onClose={() => setTrackingDelivery(null)}
          orderId={trackingDelivery.orderId}
          label={trackingDelivery.deliveryPersonName}
        />
      )}
    </div>
  );
}
