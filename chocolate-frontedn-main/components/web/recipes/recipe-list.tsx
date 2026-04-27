"use client";

import { useState, useEffect, useCallback } from "react";
import { Recipe, Ingredient } from "@/validations/recipe.validation";
import { recipeService } from "@/services/recipe.service";
import { toast } from "sonner";
import { Pencil, Trash2, Eye, Package } from "lucide-react";
import { RecipeDialog } from "./recipe-dialog";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { inventoryService } from "@/services/inventory.service";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function RecipeList() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [viewRecipe, setViewRecipe] = useState<Recipe | null>(null);
    const [materialsMap, setMaterialsMap] = useState<Record<string, string>>({});

    const loadRecipes = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await recipeService.getRecipes(1, 100, search);
            setRecipes(data.recipes);
        } catch {
            toast.error("Failed to load recipes");
        } finally {
            setIsLoading(false);
        }
    }, [search]);

    useEffect(() => {
        const t = setTimeout(() => loadRecipes(), 400);
        return () => clearTimeout(t);
    }, [loadRecipes]);

    useEffect(() => {
        inventoryService.getMaterials(1, 500).then((res) => {
            const map: Record<string, string> = {};
            res.materials.forEach((m) => { map[m.id] = m.name; });
            setMaterialsMap(map);
        }).catch(() => { });
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this recipe? This will permanently remove it from the database.")) return;
        try {
            await recipeService.hardDeleteRecipe(id);
            toast.success("Recipe permanently deleted");
            loadRecipes();
        } catch {
            toast.error("Failed to delete recipe");
        }
    };

    return (
        <>
            {/* View Recipe Dialog */}
            <Dialog open={!!viewRecipe} onOpenChange={(open) => !open && setViewRecipe(null)}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-amber-600" />
                            {viewRecipe?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Created: {viewRecipe?.createdAt ? new Date(viewRecipe.createdAt).toLocaleDateString() : "—"}
                            {" · "}{(viewRecipe?.ingredients || []).length} ingredient{(viewRecipe?.ingredients || []).length !== 1 ? "s" : ""}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-lg border overflow-hidden mt-2">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Material</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead>Unit</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(viewRecipe?.ingredients || []).map((ing: Ingredient, i: number) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium">{materialsMap[ing.materialId] ?? (
                                            <span className="text-xs font-mono text-muted-foreground">{ing.materialId.slice(-8)}</span>
                                        )}</TableCell>
                                        <TableCell className="text-right font-semibold">{ing.quantity}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="text-xs capitalize">{ing.unit}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>

            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div>
                        <CardTitle>Recipes</CardTitle>
                        <CardDescription>Manage product ingredient formulas.</CardDescription>
                    </div>
                    <RecipeDialog onSuccess={loadRecipes} />
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <Input
                            placeholder="Search recipes..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Recipe Name</TableHead>
                                    <TableHead>Ingredients</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">Loading recipes...</TableCell>
                                    </TableRow>
                                ) : recipes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No recipes found.</TableCell>
                                    </TableRow>
                                ) : (
                                    recipes.map((recipe) => (
                                        <TableRow key={recipe.id} className="hover:bg-muted/30">
                                            <TableCell className="font-medium">{recipe.name}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {(recipe.ingredients || []).map((ing: Ingredient, i: number) => (
                                                        <Badge key={i} variant="secondary" className="text-xs">
                                                            {materialsMap[ing.materialId] ?? ing.materialId.slice(-6)}: {ing.quantity} {ing.unit}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {recipe.createdAt ? new Date(recipe.createdAt).toLocaleDateString() : "—"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                                                        onClick={() => setViewRecipe(recipe)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <RecipeDialog
                                                        recipe={recipe}
                                                        onSuccess={loadRecipes}
                                                        trigger={
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        }
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-600 hover:bg-red-50"
                                                        onClick={() => recipe.id && handleDelete(recipe.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
