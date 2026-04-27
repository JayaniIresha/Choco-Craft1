"use client";

import { useState } from "react";
import { Supplier, SupplierSchema } from "@/validations/supplier.validation";
import { supplierService } from "@/services/supplier.service";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
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

interface SupplierDialogProps {
    onSuccess: () => void;
    supplier?: Supplier; // If provided, it's an Edit dialog. If not, it's an Add dialog.
    trigger?: React.ReactNode;
}

export function SupplierDialog({ onSuccess, supplier, trigger }: SupplierDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEdit = !!supplier;

    const form = useForm<z.infer<typeof SupplierSchema>>({
        resolver: zodResolver(SupplierSchema),
        defaultValues: {
            name: supplier?.name || "",
            email: supplier?.email || "",
            phone: supplier?.phone || "",
            address: supplier?.address || "",
        },
    });

    const onSubmit = async (data: z.infer<typeof SupplierSchema>) => {
        try {
            setIsSubmitting(true);
            if (isEdit && supplier?.id) {
                await supplierService.updateSupplier(supplier.id, data);
                toast.success("Supplier updated successfully");
            } else {
                await supplierService.createSupplier(data);
                toast.success("Supplier created successfully");
            }
            setOpen(false);
            form.reset();
            onSuccess();
        } catch (error: unknown) {
            toast.error((error as { response?: { data?: { error?: string } } })?.response?.data?.error || "An error occurred");
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
                        Add Supplier
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Update the details for this supplier."
                            : "Enter the details for the new raw material supplier."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <Controller
                        name="name"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field>
                                <FieldLabel>Company Name</FieldLabel>
                                <Input aria-invalid={fieldState.invalid} placeholder="ABC Raw Materials" {...field} />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />

                    <Controller
                        name="email"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field>
                                <FieldLabel>Email Address</FieldLabel>
                                <Input aria-invalid={fieldState.invalid} type="email" placeholder="contact@supplier.com" {...field} />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />

                    <Controller
                        name="phone"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field>
                                <FieldLabel>Phone Number</FieldLabel>
                                <Input aria-invalid={fieldState.invalid} placeholder="+94 77 123 4567" {...field} />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />

                    <Controller
                        name="address"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field>
                                <FieldLabel>Address</FieldLabel>
                                <Input aria-invalid={fieldState.invalid} placeholder="123 Industrial Park, Colombo" {...field} />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />

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
                        <Button type="submit" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700">
                            {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Supplier"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
