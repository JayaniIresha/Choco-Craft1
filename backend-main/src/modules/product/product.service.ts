import prisma from "../../config/prisma";
import { queryActive } from "../../utils/softDelete";
import { CreateProductSchema, UpdateProductSchema } from "./product.validation";
import { sendLowStockProductEmail } from "../../utils/email";
import { z } from "zod";

type CreateProductInput = z.infer<typeof CreateProductSchema>;
type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

const LOW_STOCK_THRESHOLD = 20;

async function checkAndNotifyLowStock(product: { id: string; name: string; inStockAmount: number }) {
    if (product.inStockAmount < LOW_STOCK_THRESHOLD) {
        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
        if (adminEmail) {
            sendLowStockProductEmail(adminEmail, product.name, product.inStockAmount).catch((err) =>
                console.error("[Low Stock Email] Failed for product " + product.name + ":", err)
            );
        }
        console.log("Low stock alert: " + product.name + " has only " + product.inStockAmount + " units left.");
    }
}

export const productService = {
    async createProduct(data: CreateProductInput) {
        return prisma.product.create({ data });
    },

    async getProducts(page = 1, limit = 10, search?: string) {
        const skip = (page - 1) * limit;

        const where = {
            ...queryActive(),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: "insensitive" } as any },
                    { description: { contains: search, mode: "insensitive" } as any },
                ],
            }),
        } as any;

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.product.count({ where }),
        ]);

        return { products, total, pages: Math.ceil(total / limit) };
    },

    async getProductById(id: string) {
        return prisma.product.findFirst({ where: queryActive({ id }) });
    },

    async updateProduct(id: string, data: UpdateProductInput) {
        const updated = await prisma.product.update({ where: { id }, data });
        await checkAndNotifyLowStock(updated);
        return updated;
    },

    async softDeleteProduct(id: string) {
        return prisma.product.update({ where: { id }, data: { isDeleted: true } });
    },

    async hardDeleteProduct(id: string) {
        return prisma.product.delete({ where: { id } });
    },

    async incrementStock(productId: string, quantity: number) {
        const updated = await prisma.product.update({
            where: { id: productId },
            data: { inStockAmount: { increment: quantity } },
        });
        await checkAndNotifyLowStock(updated);
        return updated;
    },
};
