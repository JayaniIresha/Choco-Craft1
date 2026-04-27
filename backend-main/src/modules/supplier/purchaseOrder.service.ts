import prisma from "../../config/prisma";
import { queryActive } from "../../utils/softDelete";
import { CreatePurchaseOrderSchema, UpdatePurchaseOrderSchema } from "./purchaseOrder.validation";
import { z } from "zod";
import nodemailer from "nodemailer";

type CreatePurchaseOrderInput = z.infer<typeof CreatePurchaseOrderSchema>;
type UpdatePurchaseOrderInput = z.infer<typeof UpdatePurchaseOrderSchema>;

// Configure nodemailer transporter internally 
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.mailtrap.io",
    port: parseInt(process.env.SMTP_PORT || "2525"),
    auth: {
        user: process.env.SMTP_USER || "user",
        pass: process.env.SMTP_PASS || "pass",
    },
});

export const purchaseOrderService = {
    async createPurchaseOrder(data: CreatePurchaseOrderInput) {
        const order = await prisma.purchaseOrder.create({ data });

        // Optionally trigger async notification here if manually created
        // But usually automatic notifications are triggered from Inventory side

        return order;
    },

    async getPurchaseOrders(page = 1, limit = 10, status?: string) {
        const skip = (page - 1) * limit;

        const baseQuery = queryActive();
        const where = {
            ...baseQuery,
            ...(status && { status }),
        } as any;

        const [orders, total] = await Promise.all([
            prisma.purchaseOrder.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.purchaseOrder.count({ where }),
        ]);

        return { orders, total, pages: Math.ceil(total / limit) };
    },

    async getPurchaseOrderById(id: string) {
        return prisma.purchaseOrder.findFirst({
            where: queryActive({ id }),
        });
    },

    async updatePurchaseOrder(id: string, data: UpdatePurchaseOrderInput) {
        return prisma.purchaseOrder.update({
            where: { id },
            data,
        });
    },

    async softDeletePurchaseOrder(id: string) {
        return prisma.purchaseOrder.update({
            where: { id },
            data: { isDeleted: true },
        });
    },

    async hardDeletePurchaseOrder(id: string) {
        return prisma.purchaseOrder.delete({ where: { id } });
    },

    // Special Automation Feature Triggered By Inventory
    async autoGeneratePurchaseOrder(materialId: string, supplierId: string, shortageAmount: number) {
        // Determine standardized restock qty based on shortage (e.g min 100 units or whatever shortage + padding is)
        const restockQty = Math.max(100, shortageAmount + 50);

        const order = await prisma.purchaseOrder.create({
            data: {
                supplierId,
                materialId,
                quantity: restockQty,
                status: "Pending",
            }
        });

        try {
            // Get associated records for email
            const [supplier, material] = await Promise.all([
                prisma.supplier.findUnique({ where: { id: supplierId } }),
                prisma.material.findUnique({ where: { id: materialId } })
            ]);

            if (supplier && material && process.env.SMTP_USER) {
                await transporter.sendMail({
                    from: '"Chocolate ERP" <system@chocolate-erp.com>',
                    to: supplier.email,
                    subject: "New Purchase Order Request",
                    text: `Hello ${supplier.name},\n\nA new purchase order has been automatically generated to restock raw materials.\n\nMaterial: ${material.name}\nQuantity: ${restockQty}\nOrder ID: ${order.id}\n\nPlease process this order at your earliest convenience.\n\nThank you,\nChocolate ERP System`,
                });
                console.log(`Notification sent to supplier ${supplier.email} for PO ${order.id}`);
            }
        } catch (e) {
            console.error("Failed to send supplier notification email:", e);
        }

        return order;
    }
};
