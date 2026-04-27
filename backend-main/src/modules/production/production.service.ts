import prisma from "../../config/prisma";
import { queryActive } from "../../utils/softDelete";
import { CreateProductionSchema, UpdateProductionSchema } from "./production.validation";
import { inventoryService } from "../inventory/inventory.service";
import { z } from "zod";

type CreateProductionInput = z.infer<typeof CreateProductionSchema>;
type UpdateProductionInput = z.infer<typeof UpdateProductionSchema>;

interface RecipeIngredient {
    materialId: string;
    quantity: number;
}

export const productionService = {
    async createProduction(data: CreateProductionInput) {
        // Determine ingredient amounts if a recipe is attached
        if (data.recipeId) {
            const recipe = await prisma.recipe.findUnique({
                where: { id: data.recipeId }
            });

            if (!recipe) {
                throw new Error("Recipe not found");
            }

            const ingredients = recipe.ingredients as unknown as RecipeIngredient[];

            // Verify sufficient stock for all ingredients
            for (const ingredient of ingredients) {
                const material = await prisma.material.findUnique({
                    where: { id: ingredient.materialId }
                });

                if (!material) {
                    throw new Error(`Material with ID ${ingredient.materialId} not found`);
                }

                const requiredMaterial = ingredient.quantity * data.quantity;
                if (material.quantity < requiredMaterial) {
                    throw new Error(`Insufficient raw materials. Need ${requiredMaterial} of ${material.name}, but only have ${material.quantity}.`);
                }
            }

            // If valid, deduct stock and log usage as part of the production creation transaction
            const production = await prisma.$transaction(async (tx) => {
                const newProduction = await tx.production.create({
                    data: {
                        orderId: data.orderId,
                        status: data.status,
                    }
                });

                // Loop through and use stock for each ingredient using the transaction context or existing inventory service logic
                for (const ingredient of ingredients) {
                    const requiredMaterial = ingredient.quantity * data.quantity;

                    await tx.material.update({
                        where: { id: ingredient.materialId },
                        data: { quantity: { decrement: requiredMaterial } }
                    });

                    await tx.stockUsage.create({
                        data: {
                            materialId: ingredient.materialId,
                            usedQty: requiredMaterial,
                            productionId: newProduction.id
                        }
                    });

                    // Re-trigger low-stock auto-PO logic manually since we bypass `inventoryService.createStockUsage` in this transaction
                    const updatedMaterial = await tx.material.findUnique({
                        where: { id: ingredient.materialId }
                    });

                    // Ensure material drops below minimum and there isn't an existing pending PO
                    if (updatedMaterial && updatedMaterial.quantity <= updatedMaterial.minimumLevel) {
                        console.log(`⚠️ Low stock alert for: ${updatedMaterial.name} during Production Order.`);
                        const pendingPO = await tx.purchaseOrder.findFirst({
                            where: {
                                materialId: ingredient.materialId,
                                status: "Pending",
                                isDeleted: false
                            }
                        });

                        if (!pendingPO && updatedMaterial.supplierId) {
                            const restockQuantity = Math.max(50, updatedMaterial.minimumLevel * 2);
                            await tx.purchaseOrder.create({
                                data: {
                                    supplierId: updatedMaterial.supplierId,
                                    materialId: ingredient.materialId,
                                    quantity: restockQuantity,
                                    status: "Pending" // Will be reviewed by admin
                                }
                            });
                            console.log(`Auto-PO Created via Production Run for ${updatedMaterial.name}`);
                        }
                    }
                }

                return newProduction;
            });

            return production;
        } else {
            // Create without recipe checking (not typical but supported by schema)
            return prisma.production.create({
                data: {
                    orderId: data.orderId,
                    status: data.status,
                }
            });
        }
    },

    async getProductions(page = 1, limit = 10, status?: string) {
        const skip = (page - 1) * limit;

        const baseQuery = queryActive();
        const where = {
            ...baseQuery,
            ...(status && { status }),
        } as any;

        const [productions, total] = await Promise.all([
            prisma.production.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.production.count({ where }),
        ]);

        return { productions, total, pages: Math.ceil(total / limit) };
    },

    async getProductionById(id: string) {
        return prisma.production.findFirst({
            where: queryActive({ id }),
        });
    },

    async updateProduction(id: string, data: UpdateProductionInput) {
        return prisma.production.update({
            where: { id },
            data,
        });
    },

    async softDeleteProduction(id: string) {
        return prisma.production.update({
            where: { id },
            data: { isDeleted: true },
        });
    },

    async hardDeleteProduction(id: string) {
        return prisma.production.delete({ where: { id } });
    }
};
