"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateProductSchema, CreateProductInput, Product } from "@/validations/product.validation";
import { productApiService } from "@/services/product.service";
import { toast } from "sonner";
import { Plus, Upload, X, Loader2, ImageIcon } from "lucide-react";
import Image from "next/image";
import axios from "axios";

import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

const UPLOAD_URL = "http://localhost:5001/api/files/upload";
const BASE_URL = "http://localhost:5001";

// Handles both string errors and Zod issue-array errors from the backend
const parseApiError = (err: unknown): string => {
    const data = (err as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
    if (!data) return "Something went wrong";
    if (typeof data === "string") return data;
    if (Array.isArray(data)) return data.map((e: { message?: string }) => e.message || JSON.stringify(e)).join(", ");
    return JSON.stringify(data);
};

interface ProductDialogProps {
    product?: Product;
    onSuccess: () => void;
    trigger?: React.ReactNode;
}

export function ProductDialog({ product, onSuccess, trigger }: ProductDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isEdit = !!product;

    const form = useForm<CreateProductInput>({
        resolver: zodResolver(CreateProductSchema),
        defaultValues: {
            name: product?.name || "",
            description: product?.description || "",
            imageUrl: product?.imageUrl || "",
            unitPrice: product?.unitPrice ?? 0,
            inStockAmount: product?.inStockAmount ?? 0,
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                name: product?.name || "",
                description: product?.description || "",
                imageUrl: product?.imageUrl || "",
                unitPrice: product?.unitPrice ?? 0,
                inStockAmount: product?.inStockAmount ?? 0,
            });
            // Set preview to existing image
            const existingUrl = product?.imageUrl || "";
            setImagePreview(
                existingUrl
                    ? existingUrl.startsWith("http")
                        ? existingUrl
                        : `${BASE_URL}${existingUrl}`
                    : null
            );
        }
    }, [open, form, product]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate type and size
        if (!file.type.startsWith("image/")) {
            toast.error("Only image files are allowed");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be less than 5 MB");
            return;
        }

        // Show local preview immediately
        const localUrl = URL.createObjectURL(file);
        setImagePreview(localUrl);

        try {
            setIsUploading(true);
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append("file", file);

            const res = await axios.post(UPLOAD_URL, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            const uploadedUrl: string = res.data.url; // e.g. "/api/files/upload/filename.jpg"
            form.setValue("imageUrl", uploadedUrl);
            setImagePreview(`${BASE_URL}${uploadedUrl}`);
            toast.success("Image uploaded successfully");
        } catch (error: unknown) {
            toast.error(parseApiError(error));
            setImagePreview(null);
            form.setValue("imageUrl", "");
        } finally {
            setIsUploading(false);
        }
    };

    const clearImage = () => {
        setImagePreview(null);
        form.setValue("imageUrl", "");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const onSubmit = async (data: CreateProductInput) => {
        try {
            setIsSubmitting(true);
            if (isEdit && product?.id) {
                await productApiService.updateProduct(product.id, data);
                toast.success("Product updated successfully");
            } else {
                await productApiService.createProduct(data);
                toast.success("Product created successfully");
            }
            setOpen(false);
            form.reset();
            clearImage();
            onSuccess();
        } catch (error: unknown) {
            toast.error(parseApiError(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="gap-2 bg-amber-600 hover:bg-amber-700">
                        <Plus className="h-4 w-4" /> Add Product
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Product" : "New Product"}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? "Update product details and stock level." : "Add a new product to your catalog."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">

                    {/* Image Upload */}
                    <div className="space-y-2">
                        <FieldLabel>Product Image</FieldLabel>
                        <div
                            className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors cursor-pointer
                ${imagePreview ? "border-amber-300 bg-amber-50/30" : "border-muted-foreground/30 hover:border-amber-400 hover:bg-muted/30"}`}
                            style={{ minHeight: 140 }}
                            onClick={() => !isUploading && fileInputRef.current?.click()}
                        >
                            {imagePreview ? (
                                <>
                                    <Image
                                        src={imagePreview}
                                        alt="Product preview"
                                        width={128}
                                        height={128}
                                        className="max-h-32 max-w-full rounded-md object-contain"
                                    />
                                    <button
                                        type="button"
                                        className="absolute top-2 right-2 rounded-full bg-white border shadow p-1 text-red-500 hover:text-red-700"
                                        onClick={(e) => { e.stopPropagation(); clearImage(); }}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </>
                            ) : isUploading ? (
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                                    <p className="text-sm">Uploading...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-muted-foreground py-4">
                                    <div className="rounded-full bg-muted p-3">
                                        <ImageIcon className="h-6 w-6" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium">Click to upload image</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WEBP up to 5MB</p>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" className="gap-1.5 mt-1">
                                        <Upload className="h-3.5 w-3.5" /> Upload
                                    </Button>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                        {/* Hidden field to store the uploaded URL */}
                        <input type="hidden" {...form.register("imageUrl")} />
                    </div>

                    <Controller
                        name="name"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field>
                                <FieldLabel>Product Name <span className="text-red-500">*</span></FieldLabel>
                                <Input aria-invalid={fieldState.invalid} placeholder="e.g. Dark Chocolate Bar" {...field} />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />

                    <Controller
                        name="description"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field>
                                <FieldLabel>Description</FieldLabel>
                                <Textarea
                                    aria-invalid={fieldState.invalid}
                                    placeholder="Describe the product..."
                                    className="resize-none"
                                    rows={3}
                                    {...field}
                                />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <Controller
                            name="unitPrice"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field>
                                    <FieldLabel>Unit Price ($) <span className="text-red-500">*</span></FieldLabel>
                                    <Input
                                        aria-invalid={fieldState.invalid}
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        placeholder="0.00"
                                        {...field}
                                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                    />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />
                        <Controller
                            name="inStockAmount"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field>
                                    <FieldLabel>In-Stock Amount <span className="text-red-500">*</span></FieldLabel>
                                    <Input
                                        aria-invalid={fieldState.invalid}
                                        type="number"
                                        min={0}
                                        {...field}
                                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                    />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => { setOpen(false); form.reset(); clearImage(); }}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || isUploading}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Product"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
