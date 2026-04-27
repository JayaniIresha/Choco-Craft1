"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RecipeSchema, Recipe, INGREDIENT_UNITS } from "@/validations/recipe.validation";
import { recipeService } from "@/services/recipe.service";
import { inventoryService } from "@/services/inventory.service";
import { Material } from "@/types/inventory.types";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

interface RecipeDialogProps {
    recipe?: Recipe;
    onSuccess: () => void;
    trigger?: React.ReactNode;
}

export function RecipeDialog({ recipe, onSuccess, trigger }: RecipeDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [materials, setMaterials] = useState<Material[]>([]);
    const isEdit = !!recipe;

    const form = useForm<z.infer<typeof RecipeSchema>>({
        resolver: zodResolver(RecipeSchema),
        defaultValues: {
            name: recipe?.name || "",
            ingredients: recipe?.ingredients || [{ materialId: "", quantity: 1, unit: "grams" }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "ingredients",
    });

    useEffect(() => {
        if (open) {
            inventoryService.getMaterials(1, 200).then(res => setMaterials(res.materials));
        }
    }, [open]);

    const onSubmit = async (data: z.infer<typeof RecipeSchema>) => {
        try {
            setIsSubmitting(true);
            if (isEdit && recipe?.id) {
                await recipeService.updateRecipe(recipe.id, data);
                toast.success("Recipe updated successfully");
            } else {
                await recipeService.createRecipe(data);
                toast.success("Recipe created successfully");
            }
            setOpen(false);
            form.reset();
            onSuccess();
        } catch (error: unknown) {
            toast.error((error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to save recipe");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="gap-2 bg-amber-600 hover:bg-amber-700">
                        <Plus className="h-4 w-4" /> New Recipe
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Recipe" : "New Recipe"}</DialogTitle>
                    <DialogDescription>
                        Define a recipe with the ingredient quantities needed per unit produced.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                    <Controller
                        name="name"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field>
                                <FieldLabel>Recipe Name</FieldLabel>
                                <Input aria-invalid={fieldState.invalid} placeholder="e.g. Milk Chocolate" {...field} />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />

                    <div className="space-y-2">
                        <FieldLabel>Ingredients <span className="text-muted-foreground text-xs">(per unit)</span></FieldLabel>
                        {fields.map((fieldItem, index) => (
                            <div key={fieldItem.id} className="flex items-center gap-2">
                                <Controller
                                    name={`ingredients.${index}.materialId`}
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Select value={field.value || ""} onValueChange={field.onChange}>
                                            <SelectTrigger aria-invalid={fieldState.invalid} className="flex-1 min-w-0">
                                                <SelectValue placeholder="Select Material" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {materials.map((m) => (
                                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                <Controller
                                    name={`ingredients.${index}.quantity`}
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Input
                                            aria-invalid={fieldState.invalid}
                                            type="number"
                                            min={1}
                                            placeholder="Qty"
                                            className="w-20"
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                        />
                                    )}
                                />
                                <Controller
                                    name={`ingredients.${index}.unit`}
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Select value={field.value || "grams"} onValueChange={field.onChange}>
                                            <SelectTrigger aria-invalid={fieldState.invalid} className="w-28">
                                                <SelectValue placeholder="Unit" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {INGREDIENT_UNITS.map((u) => (
                                                    <SelectItem key={u} value={u}>
                                                        {u}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                                    onClick={() => fields.length > 1 && remove(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        {form.formState.errors.ingredients && (
                            <FieldError errors={[form.formState.errors.ingredients]} />
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={() => append({ materialId: "", quantity: 1, unit: "grams" as const })}
                        >
                            <Plus className="h-3 w-3" /> Add Ingredient
                        </Button>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => { setOpen(false); form.reset(); }}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700">
                            {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Recipe"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
