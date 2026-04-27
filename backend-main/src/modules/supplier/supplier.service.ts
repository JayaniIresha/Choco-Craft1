import prisma from "../../config/prisma";
import { queryActive } from "../../utils/softDelete";
import { CreateSupplierSchema, UpdateSupplierSchema } from "./supplier.validation";
import { z } from "zod";

type CreateSupplierInput = z.infer<typeof CreateSupplierSchema>;
type UpdateSupplierInput = z.infer<typeof UpdateSupplierSchema>;

export const supplierService = {
    async createSupplier(data: CreateSupplierInput) {
        return prisma.supplier.create({ data });
    },

    async getSuppliers(page = 1, limit = 10, search?: string) {
        const skip = (page - 1) * limit;

        const baseQuery = queryActive();
        const where = {
            ...baseQuery,
            ...(search && {
                OR: [
                    { name: { contains: search, mode: "insensitive" } as any },
                    { email: { contains: search, mode: "insensitive" } as any },
                    { phone: { contains: search, mode: "insensitive" } as any },
                ],
            }),
        } as any;

        const [suppliers, total] = await Promise.all([
            prisma.supplier.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.supplier.count({ where }),
        ]);

        return { suppliers, total, pages: Math.ceil(total / limit) };
    },

    async getSupplierById(id: string) {
        return prisma.supplier.findFirst({
            where: queryActive({ id }),
        });
    },

    async updateSupplier(id: string, data: UpdateSupplierInput) {
        return prisma.supplier.update({
            where: { id },
            data,
        });
    },

    async softDeleteSupplier(id: string) {
        return prisma.supplier.update({
            where: { id },
            data: { isDeleted: true },
        });
    },

    async hardDeleteSupplier(id: string) {
        return prisma.$transaction(async (tx) => {
            // Find all materials assigned to this supplier
            const materials = await tx.material.findMany({ where: { supplierId: id } });
            const materialIds = materials.map(m => m.id);

            // Delete dependencies to prevent referential integrity errors
            if (materialIds.length > 0) {
                await tx.stockUsage.deleteMany({ where: { materialId: { in: materialIds } } });
            }
            await tx.purchaseOrder.deleteMany({ where: { supplierId: id } });
            await tx.material.deleteMany({ where: { supplierId: id } });

            // Finally, delete the supplier
            return tx.supplier.delete({ where: { id } });
        });
    }
};
