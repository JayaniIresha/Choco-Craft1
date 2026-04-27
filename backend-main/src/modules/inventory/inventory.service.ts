import prisma from "../../config/prisma";
import { queryActive } from "../../utils/softDelete";
import { purchaseOrderService } from "../supplier/purchaseOrder.service";
import {
  CreateMaterialSchema,
  UpdateMaterialSchema,
  CreateStockUsageSchema,
  UpdateStockUsageSchema,
} from "./inventory.validation";
import { z } from "zod";
import { sendLowStockEmail } from "../../utils/email";

type CreateMaterialInput = z.infer<typeof CreateMaterialSchema>;
type UpdateMaterialInput = z.infer<typeof UpdateMaterialSchema>;
type CreateStockUsageInput = z.infer<typeof CreateStockUsageSchema>;
type UpdateStockUsageInput = z.infer<typeof UpdateStockUsageSchema>;

export const inventoryService = {
  async createMaterial(data: CreateMaterialInput) {
    return prisma.material.create({ data });
  },

  async getMaterials(
    page = 1,
    limit = 10,
    search?: string,
    sortBy?: string,
    sortOrder?: string,
    lowStock?: boolean,
  ) {
    const skip = (page - 1) * limit;

    const baseQuery = queryActive();
    const where = {
      ...baseQuery,
      supplier: { isDeleted: false },
      ...(search && {
        OR: [{ name: { contains: search, mode: "insensitive" } as any }],
      }),
    } as any;

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || "asc";
    } else {
      orderBy.createdAt = "desc";
    }

    let allMaterials = await prisma.material.findMany({
      where,
      include: {
        supplier: true,
      },
      orderBy,
    });

    if (lowStock) {
      allMaterials = allMaterials.filter(
        (m: any) => m.quantity < m.minimumLevel,
      );
    }

    const total = allMaterials.length;
    const paginatedMaterials = allMaterials.slice(skip, skip + limit);

    const materialsWithSupplier = paginatedMaterials.map((m: any) => ({
      ...m,
      supplierName: m.supplier?.name || "Unknown",
    }));

    return {
      materials: materialsWithSupplier,
      total,
      pages: Math.ceil(total / limit),
    };
  },

  async getMaterialById(id: string) {
    return prisma.material.findFirst({
      where: queryActive({ id }),
    });
  },

  async updateMaterial(id: string, data: UpdateMaterialInput) {
    return prisma.material.update({
      where: { id },
      data,
    });
  },

  async softDeleteMaterial(id: string) {
    return prisma.material.update({
      where: { id },
      data: { isDeleted: true },
    });
  },

  async hardDeleteMaterial(id: string) {
    return prisma.material.delete({ where: { id } });
  },

  async createStockUsage(data: CreateStockUsageInput) {
    const material = await prisma.material.findFirst({
      where: queryActive({ id: data.materialId }),
    });

    if (!material) {
      throw new Error("Material not found");
    }

    if (material.quantity < data.usedQty) {
      throw new Error(`Insufficient stock. Available: ${material.quantity}`);
    }

    const usage = await prisma.stockUsage.create({ data });

    const newQuantity = material.quantity - data.usedQty;
    await prisma.material.update({
      where: { id: material.id },
      data: { quantity: newQuantity },
    });

    const updatedMaterial = await prisma.material.findFirst({
      where: { id: material.id },
    });

    if (
      updatedMaterial &&
      updatedMaterial.quantity < updatedMaterial.minimumLevel
    ) {
      console.log(
        `⚠️ Low stock alert for: ${updatedMaterial.name}. Triggering auto-PO.`,
      );

      // Auto-PO logic checking for existing "Pending" POs
      const existingPendingPO = await prisma.purchaseOrder.findFirst({
        where: {
          materialId: material.id,
          status: "Pending",
          isDeleted: false,
        },
      });

      if (!existingPendingPO && material.supplierId) {
        // Create an auto PO for a standard restock amount (e.g. 50 units or to reach minimumLevel + buffer)
        const restockQuantity = Math.max(50, updatedMaterial.minimumLevel * 2);

        await purchaseOrderService.createPurchaseOrder({
          supplierId: material.supplierId,
          materialId: material.id,
          quantity: restockQuantity,
          status: "Pending", // Will be reviewed by admin
        });

        // Send email to supplier
        const supplier = await prisma.supplier.findFirst({
          where: { id: material.supplierId, isDeleted: false },
        });

        if (supplier) {
          sendLowStockEmail(supplier.email, updatedMaterial.name).catch(
            (err) => {
              console.error("Failed to send low stock email to supplier:", err);
            },
          );
        }
      }
    }

    return usage;
  },

  async getStockUsage(
    page = 1,
    limit = 10,
    search?: string,
    sortBy?: string,
    sortOrder?: string,
    materialId?: string,
  ) {
    const skip = (page - 1) * limit;

    const baseQuery = queryActive();
    const where = {
      ...baseQuery,
      ...(materialId && { materialId }),
      material: { isDeleted: false },
      production: { isDeleted: false },
    } as any;

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || "asc";
    } else {
      orderBy.createdAt = "desc";
    }

    const allUsage = await prisma.stockUsage.findMany({
      where,
      orderBy,
      include: {
        material: true,
        production: true,
      },
    });

    let filteredUsage = allUsage;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsage = allUsage.filter((u: any) =>
        u.material?.name?.toLowerCase().includes(searchLower),
      );
    }

    const total = filteredUsage.length;
    const paginatedUsage = filteredUsage.slice(skip, skip + limit);

    const usageWithMaterial = paginatedUsage.map((u: any) => ({
      ...u,
      materialName: u.material?.name || "Unknown",
      productionData: u.production
        ? {
            id: u.production.id,
            orderId: u.production.orderId,
            status: u.production.status,
          }
        : null,
    }));

    return { usage: usageWithMaterial, total, pages: Math.ceil(total / limit) };
  },

  async getStockUsageById(id: string) {
    return prisma.stockUsage.findFirst({
      where: queryActive({ id }),
    });
  },

  async updateStockUsage(id: string, data: UpdateStockUsageInput) {
    return prisma.stockUsage.update({
      where: { id },
      data,
    });
  },

  async softDeleteStockUsage(id: string) {
    return prisma.stockUsage.update({
      where: { id },
      data: { isDeleted: true },
    });
  },

  async getSuppliers() {
    return prisma.supplier.findMany({
      where: { isDeleted: false },
      orderBy: { name: "asc" },
    });
  },

  async getProduction() {
    return prisma.production.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
    });
  },
};
