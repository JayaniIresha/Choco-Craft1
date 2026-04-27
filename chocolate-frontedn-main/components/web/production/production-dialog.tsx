"use client";

import { useState, useEffect } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductionSchema } from "@/validations/production.validation";
import { productionService } from "@/services/production.service";
import { recipeService } from "@/services/recipe.service";
import { inventoryService } from "@/services/inventory.service";
import { orderApiService } from "@/services/order.service";
import { Recipe, Ingredient } from "@/validations/recipe.validation";
import { Material } from "@/types/inventory.types";
import type { Order } from "@/types/order.types";
import { toast } from "sonner";
import { Plus, AlertTriangle, CheckCircle2, Calculator } from "lucide-react";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

interface IngredientCheck {
  materialId: string;
  materialName: string;
  required: number;
  available: number;
  sufficient: boolean;
}

interface ProductionDialogProps {
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function ProductionDialog({
  onSuccess,
  trigger,
}: ProductionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [materialsMap, setMaterialsMap] = useState<Record<string, Material>>(
    {},
  );
  const [ingredientChecks, setIngredientChecks] = useState<IngredientCheck[]>(
    [],
  );
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const form = useForm<z.infer<typeof ProductionSchema>>({
    resolver: zodResolver(ProductionSchema) as Resolver<
      z.infer<typeof ProductionSchema>
    >,
    defaultValues: {
      orderId: "",
      recipeId: "",
      quantity: 1,
      status: "Planned",
    },
  });

  useEffect(() => {
    if (open) {
      setLoadingOrders(true);
      Promise.all([
        recipeService.getRecipes(1, 200),
        inventoryService.getMaterials(1, 200),
        orderApiService.getOrders(1, 1000, undefined, undefined, true),
      ])
        .then(([recipesRes, materialsRes, ordersRes]) => {
          setRecipes(recipesRes.recipes);
          setOrders(ordersRes.orders);
          const map: Record<string, Material> = {};
          materialsRes.materials.forEach((m) => {
            map[m.id] = m;
          });
          setMaterialsMap(map);
          setLoadingOrders(false);
        })
        .catch(() => {
          setLoadingOrders(false);
        });
    } else {
      // Reset checks on close
      setIngredientChecks([]);
      setSelectedRecipe(null);
      setOrders([]);
    }
  }, [open]);

  // Recompute ingredient checks whenever recipe or quantity changes
  useEffect(() => {
    if (!selectedRecipe || !quantity || quantity <= 0) {
      setIngredientChecks([]);
      return;
    }
    const checks: IngredientCheck[] = (
      selectedRecipe.ingredients as Ingredient[]
    ).map((ing) => {
      const material = materialsMap[ing.materialId];
      const required = ing.quantity * quantity;
      return {
        materialId: ing.materialId,
        materialName: material?.name ?? ing.materialId.slice(-6),
        required,
        available: material?.quantity ?? 0,
        sufficient: (material?.quantity ?? 0) >= required,
      };
    });
    setIngredientChecks(checks);
  }, [selectedRecipe, quantity, materialsMap]);

  const allSufficient =
    ingredientChecks.length > 0 && ingredientChecks.every((c) => c.sufficient);
  const anyInsufficient = ingredientChecks.some((c) => !c.sufficient);

  const onSubmit = async (data: z.infer<typeof ProductionSchema>) => {
    if (anyInsufficient) {
      toast.error(
        "Cannot start production — insufficient stock for one or more ingredients.",
      );
      return;
    }
    try {
      setIsSubmitting(true);
      await productionService.createProduction(data);
      toast.success("Production order created successfully");
      setOpen(false);
      form.reset();
      onSuccess();
    } catch (error: unknown) {
      // Surface the backend's error message (e.g. "Insufficient raw materials...")
      toast.error(
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to create production order",
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
            <Plus className="h-4 w-4" /> New Production Run
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Production Order</DialogTitle>
          <DialogDescription>
            Select a recipe and quantity. The system will automatically
            calculate and verify ingredient requirements.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <Controller
            name="orderId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Order</FieldLabel>
                <Select
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  disabled={loadingOrders}
                >
                  <SelectTrigger aria-invalid={fieldState.invalid}>
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
                          {order.id.slice(-8)} — {order.firstName}{" "}
                          {order.lastName} (${" "}
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
            name="recipeId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Recipe</FieldLabel>
                <Select
                  value={field.value || ""}
                  onValueChange={(val) => {
                    field.onChange(val);
                    const r = recipes.find((r) => r.id === val) || null;
                    setSelectedRecipe(r);
                  }}
                >
                  <SelectTrigger aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select a recipe..." />
                  </SelectTrigger>
                  <SelectContent>
                    {recipes.map((r) => (
                      <SelectItem key={r.id} value={r.id!}>
                        {r.name}
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
                <FieldLabel>
                  Quantity{" "}
                  <span className="text-muted-foreground text-xs">
                    (units to produce)
                  </span>
                </FieldLabel>
                <Input
                  aria-invalid={fieldState.invalid}
                  type="number"
                  min={1}
                  {...field}
                  onChange={(e) => {
                    const val = e.target.valueAsNumber;
                    field.onChange(val);
                    setQuantity(val || 0);
                  }}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {/* ---- Auto-Ingredient Calculation Preview ---- */}
          {ingredientChecks.length > 0 && (
            <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calculator className="h-4 w-4 text-amber-600" />
                Ingredient Requirements for{" "}
                <span className="font-bold">{quantity}</span> units
              </div>
              <div className="space-y-1.5">
                {ingredientChecks.map((check, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between rounded-md px-3 py-1.5 text-sm ${
                      check.sufficient
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {check.sufficient ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                      )}
                      <span
                        className={
                          check.sufficient
                            ? "text-green-800"
                            : "text-red-800 font-medium"
                        }
                      >
                        {check.materialName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">
                        Need: <strong>{check.required}</strong>
                      </span>
                      <Badge
                        variant="secondary"
                        className={
                          check.sufficient
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        In stock: {check.available}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              {anyInsufficient && (
                <p className="text-xs font-medium text-red-600 flex items-center gap-1 pt-1">
                  <AlertTriangle className="h-3 w-3" />
                  Production cannot proceed with insufficient raw materials.
                </p>
              )}
              {allSufficient && (
                <p className="text-xs font-medium text-green-600 flex items-center gap-1 pt-1">
                  <CheckCircle2 className="h-3 w-3" />
                  All materials are sufficient. Ready to produce!
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
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
              disabled={isSubmitting || anyInsufficient}
              className={`${anyInsufficient ? "opacity-50 cursor-not-allowed" : ""} bg-amber-600 hover:bg-amber-700`}
            >
              {isSubmitting ? "Creating..." : "Start Production"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
