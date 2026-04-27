"use client";

import { useState, useEffect } from "react";
import {
  PurchaseOrder,
  PurchaseOrderSchema,
} from "@/validations/purchaseOrder.validation";
import { purchaseOrderService } from "@/services/purchaseOrder.service";
import { inventoryService } from "@/services/inventory.service";
import { Supplier, Material } from "@/types/inventory.types";
import { toast } from "sonner";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PurchaseOrderDialogProps {
  onSuccess: () => void;
  order?: PurchaseOrder; // Edit mode if provided
  trigger?: React.ReactNode;
}

export function PurchaseOrderDialog({
  onSuccess,
  order,
  trigger,
}: PurchaseOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  useEffect(() => {
    if (open) {
      const fetchOptions = async () => {
        try {
          const [suppliersRes, materialsRes] = await Promise.all([
            inventoryService.getSuppliers(),
            inventoryService.getMaterials(1, 100),
          ]);
          setSuppliers(suppliersRes);
          setMaterials(materialsRes.materials);
        } catch {
          toast.error("Failed to load options");
        }
      };
      fetchOptions();
    }
  }, [open]);

  const isEdit = !!order;

  const form = useForm<z.infer<typeof PurchaseOrderSchema>>({
    resolver: zodResolver(PurchaseOrderSchema) as Resolver<
      z.infer<typeof PurchaseOrderSchema>
    >,
    defaultValues: {
      supplierId: order?.supplierId || "",
      materialId: order?.materialId || "",
      quantity: order?.quantity || 1,
      status: order?.status || "Pending",
    },
  });

  const onSubmit = async (data: z.infer<typeof PurchaseOrderSchema>) => {
    try {
      setIsSubmitting(true);
      if (isEdit && order?.id) {
        // Technically status updates are all we do, but full object support is safe
        await purchaseOrderService.updatePurchaseOrder(order.id, data);
        toast.success("Purchase Order updated successfully");
      } else {
        await purchaseOrderService.createPurchaseOrder(data);
        toast.success("Purchase Order created successfully");
      }
      setOpen(false);
      form.reset();
      onSuccess();
    } catch (error: unknown) {
      toast.error(
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "An error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 bg-amber-600 hover:bg-amber-700">
            <Plus className="h-4 w-4" />
            Add Order
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Purchase Order" : "New Purchase Order"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update details for this specific order."
              : "Raise a manual restock order for a material."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <Controller
            name="supplierId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Supplier</FieldLabel>
                <Select
                  disabled={isEdit}
                  value={field.value || ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
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
            name="materialId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Material</FieldLabel>
                <Select
                  disabled={isEdit}
                  value={field.value || ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select Material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
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
            name="quantity"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Quantity</FieldLabel>
                <Input
                  aria-invalid={fieldState.invalid}
                  type="number"
                  min={1}
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {isEdit && (
            <Controller
              name="status"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Status</FieldLabel>
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                form.reset();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isSubmitting
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Create Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
