"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Package,
  ArrowUpDown,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

import { inventoryService } from "@/services/inventory.service";
import {
  materialSchema,
  updateMaterialSchema,
  stockUsageSchema,
  type MaterialFormData,
  type UpdateMaterialFormData,
  type StockUsageFormData,
} from "@/validations/inventory.validation";
import type {
  Material,
  StockUsage,
  Supplier,
  Production,
} from "@/types/inventory.types";

type SortField = "name" | "quantity" | "createdAt";
type SortOrder = "asc" | "desc";

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<"materials" | "usage">(
    "materials",
  );
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stockUsage, setStockUsage] = useState<StockUsage[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [lowStockFilter, setLowStockFilter] = useState(false);

  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [stockUsageDialogOpen, setStockUsageDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(
    null,
  );

  const materialForm = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema) as Resolver<MaterialFormData>,
    defaultValues: {
      name: "",
      quantity: 0,
      minimumLevel: 0,
      supplierId: "",
    },
  });

  const updateMaterialForm = useForm<UpdateMaterialFormData>({
    resolver: zodResolver(
      updateMaterialSchema,
    ) as Resolver<UpdateMaterialFormData>,
    defaultValues: {
      name: "",
      quantity: 0,
      minimumLevel: 0,
      supplierId: "",
    },
  });

  const stockUsageForm = useForm<StockUsageFormData>({
    resolver: zodResolver(stockUsageSchema) as Resolver<StockUsageFormData>,
    defaultValues: {
      materialId: "",
      usedQty: 0,
      productionId: "",
    },
  });

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const result = await inventoryService.getMaterials(
        page,
        10,
        search || undefined,
        sortBy,
        sortOrder,
        lowStockFilter,
      );
      setMaterials(result.materials);
      setTotalPages(result.pages);
      setTotal(result.total);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to fetch materials");
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, sortOrder, lowStockFilter]);

  const fetchStockUsage = useCallback(async () => {
    try {
      setLoading(true);
      const result = await inventoryService.getStockUsage(page, 10);
      setStockUsage(result.usage);
      setTotalPages(result.pages);
      setTotal(result.total);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to fetch stock usage");
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchSuppliers = useCallback(async () => {
    try {
      const result = await inventoryService.getSuppliers();
      setSuppliers(result);
    } catch {
      toast.error("Failed to fetch suppliers");
    }
  }, []);

  const fetchProductions = useCallback(async () => {
    try {
      const result = await inventoryService.getProduction();
      setProductions(result);
    } catch {
      toast.error("Failed to fetch production orders");
    }
  }, []);

  useEffect(() => {
    if (activeTab === "materials") {
      fetchMaterials();
    } else {
      fetchStockUsage();
    }
  }, [activeTab, fetchMaterials, fetchStockUsage]);

  useEffect(() => {
    fetchSuppliers();
    fetchProductions();
  }, [fetchSuppliers, fetchProductions]);

  const handleCreateMaterial = async (data: MaterialFormData) => {
    try {
      setSubmitting(true);
      await inventoryService.createMaterial(data);
      toast.success("Material created successfully");
      setMaterialDialogOpen(false);
      materialForm.reset();
      fetchMaterials();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to create material");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateMaterial = async (data: UpdateMaterialFormData) => {
    if (!editingMaterial) return;
    try {
      setSubmitting(true);
      await inventoryService.updateMaterial(editingMaterial.id, data);
      toast.success("Material updated successfully");
      setMaterialDialogOpen(false);
      setEditingMaterial(null);
      updateMaterialForm.reset();
      fetchMaterials();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to update material");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMaterial = async (materialOverride?: Material) => {
    const materialToDelete = materialOverride || deletingMaterial;
    if (!materialToDelete) return;
    try {
      setSubmitting(true);
      await inventoryService.hardDeleteMaterial(materialToDelete.id);
      toast.success("Material deleted successfully");
      setDeletingMaterial(null);
      fetchMaterials();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to delete material");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateStockUsage = async (data: StockUsageFormData) => {
    try {
      setSubmitting(true);
      await inventoryService.createStockUsage(data);
      toast.success("Stock usage recorded successfully");
      setStockUsageDialogOpen(false);
      stockUsageForm.reset();
      fetchMaterials();
      fetchStockUsage();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to record stock usage");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    updateMaterialForm.reset({
      name: material.name,
      quantity: material.quantity,
      minimumLevel: material.minimumLevel,
      supplierId: material.supplierId,
    });
    setMaterialDialogOpen(true);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    if (activeTab === "materials") {
      doc.setFontSize(18);
      doc.text("Inventory Report - Materials", 14, 22);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

      const tableData = materials.map((m) => [
        m.name,
        m.quantity.toString(),
        m.minimumLevel.toString(),
        m.supplierName || "N/A",
        m.quantity < m.minimumLevel ? "Low Stock" : "In Stock",
      ]);

      autoTable(doc, {
        head: [["Name", "Quantity", "Min Level", "Supplier", "Status"]],
        body: tableData,
        startY: 35,
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246] },
      });
    } else {
      doc.setFontSize(18);
      doc.text("Inventory Report - Stock Usage", 14, 22);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

      const tableData = stockUsage.map((u) => [
        u.materialName || "N/A",
        u.usedQty.toString(),
        new Date(u.createdAt).toLocaleDateString(),
      ]);

      autoTable(doc, {
        head: [["Material", "Used Quantity", "Date"]],
        body: tableData,
        startY: 35,
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246] },
      });
    }

    doc.save(
      `inventory-${activeTab}-${new Date().toISOString().split("T")[0]}.pdf`,
    );
    toast.success("PDF exported successfully");
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage raw materials and track stock usage
          </p>
        </div>
        <Button onClick={exportToPDF} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <Button
          variant={activeTab === "materials" ? "default" : "outline"}
          onClick={() => setActiveTab("materials")}
        >
          <Package className="mr-2 h-4 w-4" />
          Raw Materials
        </Button>
        <Button
          variant={activeTab === "usage" ? "default" : "outline"}
          onClick={() => setActiveTab("usage")}
        >
          <ArrowUpDown className="mr-2 h-4 w-4" />
          Stock Usage
        </Button>
      </div>

      {activeTab === "materials" && (
        <>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={lowStockFilter ? "true" : "false"}
              onValueChange={(value) => {
                setLowStockFilter(value === "true");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">All Materials</SelectItem>
                <SelectItem value="true">Low Stock</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(value) => {
                const [field, order] = value.split("-") as [
                  SortField,
                  SortOrder,
                ];
                setSortBy(field);
                setSortOrder(order);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="quantity-asc">
                  Quantity (Low-High)
                </SelectItem>
                <SelectItem value="quantity-desc">
                  Quantity (High-Low)
                </SelectItem>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
            <Dialog
              open={materialDialogOpen}
              onOpenChange={(open) => {
                setMaterialDialogOpen(open);
                if (!open) {
                  setEditingMaterial(null);
                  materialForm.reset();
                  updateMaterialForm.reset();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingMaterial(null);
                    materialForm.reset();
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Material
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingMaterial ? "Edit Material" : "Add New Material"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingMaterial
                      ? "Update the material details below."
                      : "Enter the details for the new material."}
                  </DialogDescription>
                </DialogHeader>
                {editingMaterial ? (
                  <form
                    onSubmit={updateMaterialForm.handleSubmit(
                      handleUpdateMaterial,
                    )}
                  >
                    <div className="grid gap-4 py-4">
                      <Controller
                        name="name"
                        control={updateMaterialForm.control}
                        render={({ field, fieldState }) => (
                          <Field>
                            <FieldLabel>Name</FieldLabel>
                            <Input
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
                        name="quantity"
                        control={updateMaterialForm.control}
                        render={({ field, fieldState }) => (
                          <Field>
                            <FieldLabel>Quantity</FieldLabel>
                            <Input
                              type="number"
                              min="0"
                              aria-invalid={fieldState.invalid}
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.valueAsNumber)
                              }
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                      <Controller
                        name="minimumLevel"
                        control={updateMaterialForm.control}
                        render={({ field, fieldState }) => (
                          <Field>
                            <FieldLabel>Minimum Level</FieldLabel>
                            <Input
                              type="number"
                              min="0"
                              aria-invalid={fieldState.invalid}
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.valueAsNumber)
                              }
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                      <Controller
                        name="supplierId"
                        control={updateMaterialForm.control}
                        render={({ field, fieldState }) => (
                          <Field>
                            <FieldLabel>Supplier</FieldLabel>
                            <Select
                              value={field.value || ""}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger aria-invalid={fieldState.invalid}>
                                <SelectValue placeholder="Select supplier" />
                              </SelectTrigger>
                              <SelectContent>
                                {suppliers.map((supplier) => (
                                  <SelectItem
                                    key={supplier.id}
                                    value={supplier.id}
                                  >
                                    {supplier.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? "Saving..." : "Save Changes"}
                      </Button>
                    </DialogFooter>
                  </form>
                ) : (
                  <form
                    onSubmit={materialForm.handleSubmit(handleCreateMaterial)}
                  >
                    <div className="grid gap-4 py-4">
                      <Controller
                        name="name"
                        control={materialForm.control}
                        render={({ field, fieldState }) => (
                          <Field>
                            <FieldLabel>Name</FieldLabel>
                            <Input
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
                        name="quantity"
                        control={materialForm.control}
                        render={({ field, fieldState }) => (
                          <Field>
                            <FieldLabel>Quantity</FieldLabel>
                            <Input
                              type="number"
                              min="0"
                              aria-invalid={fieldState.invalid}
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.valueAsNumber)
                              }
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                      <Controller
                        name="minimumLevel"
                        control={materialForm.control}
                        render={({ field, fieldState }) => (
                          <Field>
                            <FieldLabel>Minimum Level</FieldLabel>
                            <Input
                              type="number"
                              min="0"
                              aria-invalid={fieldState.invalid}
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.valueAsNumber)
                              }
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                      <Controller
                        name="supplierId"
                        control={materialForm.control}
                        render={({ field, fieldState }) => (
                          <Field>
                            <FieldLabel>Supplier</FieldLabel>
                            <Select
                              value={field.value || ""}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger aria-invalid={fieldState.invalid}>
                                <SelectValue placeholder="Select supplier" />
                              </SelectTrigger>
                              <SelectContent>
                                {suppliers.map((supplier) => (
                                  <SelectItem
                                    key={supplier.id}
                                    value={supplier.id}
                                  >
                                    {supplier.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? "Creating..." : "Create Material"}
                      </Button>
                    </DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Materials</CardTitle>
              <CardDescription>
                {total} material{total !== 1 ? "s" : ""} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : materials.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No materials found
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="pb-3 text-left font-medium">Name</th>
                          <th className="pb-3 text-left font-medium">
                            Quantity
                          </th>
                          <th className="pb-3 text-left font-medium">
                            Min Level
                          </th>
                          <th className="pb-3 text-left font-medium">
                            Supplier
                          </th>
                          <th className="pb-3 text-left font-medium">Status</th>
                          <th className="pb-3 text-right font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {materials.map((material) => (
                          <tr key={material.id} className="border-b">
                            <td className="py-3">{material.name}</td>
                            <td className="py-3">{material.quantity}</td>
                            <td className="py-3">{material.minimumLevel}</td>
                            <td className="py-3">
                              {material.supplierName || "N/A"}
                            </td>
                            <td className="py-3">
                              {material.quantity < material.minimumLevel ? (
                                <Badge variant="destructive">
                                  <AlertTriangle className="mr-1 h-3 w-3" />
                                  Low Stock
                                </Badge>
                              ) : (
                                <Badge variant="secondary">In Stock</Badge>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditMaterial(material)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete Material
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete &quot;
                                        {material.name}&quot;? This action
                                        cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => {
                                          handleDeleteMaterial(material);
                                        }}
                                        disabled={submitting}
                                      >
                                        {submitting ? "Deleting..." : "Delete"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <Button
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === "usage" && (
        <>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search usage..." className="pl-10" />
            </div>
            <Dialog
              open={stockUsageDialogOpen}
              onOpenChange={(open) => {
                setStockUsageDialogOpen(open);
                if (!open) {
                  stockUsageForm.reset();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Record Usage
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Stock Usage</DialogTitle>
                  <DialogDescription>
                    Record how much material was used in production.
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={stockUsageForm.handleSubmit(handleCreateStockUsage)}
                >
                  <div className="grid gap-4 py-4">
                    <Controller
                      name="materialId"
                      control={stockUsageForm.control}
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel>Material</FieldLabel>
                          <Select
                            value={field.value || ""}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger aria-invalid={fieldState.invalid}>
                              <SelectValue placeholder="Select material" />
                            </SelectTrigger>
                            <SelectContent>
                              {materials.map((material) => (
                                <SelectItem
                                  key={material.id}
                                  value={material.id}
                                >
                                  {material.name} (Available:{" "}
                                  {material.quantity})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name="usedQty"
                      control={stockUsageForm.control}
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel>Used Quantity</FieldLabel>
                          <Input
                            type="number"
                            aria-invalid={fieldState.invalid}
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber)
                            }
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name="productionId"
                      control={stockUsageForm.control}
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel>Production Order</FieldLabel>
                          <Select
                            value={field.value || ""}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger aria-invalid={fieldState.invalid}>
                              <SelectValue placeholder="Select production order" />
                            </SelectTrigger>
                            <SelectContent>
                              {productions.map((production) => (
                                <SelectItem
                                  key={production.id}
                                  value={production.id}
                                >
                                  {production.id.slice(-8)} -{" "}
                                  {production.status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Recording..." : "Record Usage"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Stock Usage History</CardTitle>
              <CardDescription>
                {total} record{total !== 1 ? "s" : ""} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : stockUsage.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No stock usage records found
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="pb-3 text-left font-medium">
                            Material
                          </th>
                          <th className="pb-3 text-left font-medium">
                            Used Quantity
                          </th>
                          <th className="pb-3 text-left font-medium">
                            Production Status
                          </th>
                          <th className="pb-3 text-left font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockUsage.map((usage) => (
                          <tr key={usage.id} className="border-b">
                            <td className="py-3">
                              {usage.materialName || "N/A"}
                            </td>
                            <td className="py-3">{usage.usedQty}</td>
                            <td className="py-3">
                              {usage.productionData ? (
                                <Badge
                                  variant={
                                    usage.productionData.status === "Completed"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {usage.productionData.status}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">
                                  N/A
                                </span>
                              )}
                            </td>
                            <td className="py-3">
                              {new Date(usage.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <Button
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
