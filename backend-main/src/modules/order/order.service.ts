import prisma from "../../config/prisma";
import { queryActive } from "../../utils/softDelete";
import { CreateOrderSchema, UpdateOrderSchema } from "./order.validation";
import { z } from "zod";

type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;

export const orderService = {
    /**
     * Creates an order and its line items in a transaction.
     * After creating each OrderItem, it increments the matching product's inStockAmount.
     */
    async createOrder(data: CreateOrderInput) {
        console.log(`[DEBUG] Creating order for customerEmail: "${data.customerEmail}"`);
        const { orderItems, ...orderData } = data;

        return prisma.$transaction(async (tx) => {
            // 1. Create the Order
            const order = await tx.order.create({ data: orderData });
            console.log(`[DEBUG] Order created with ID: ${order.id}`);

            // 2. For each order item: create the line item and bump product stock
            if (orderItems && orderItems.length > 0) {
                for (const item of orderItems) {
                    // Verify product exists
                    const product = await tx.product.findUnique({ where: { id: item.productId } });
                    if (!product || product.isDeleted) {
                        throw new Error(`Product ${item.productId} not found or has been deleted`);
                    }

                    // Create the order item
                    await tx.orderItem.create({
                        data: {
                            orderId: order.id,
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            customizations: item.customizations ?? [],
                            customerMessage: item.customerMessage ?? null,
                        },
                    });

                    // Auto-decrement product inStockAmount when order is placed (items purchased = stock reduction)
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { inStockAmount: { decrement: item.quantity } },
                    });
                }
            }

            // Return order with its items included
            return tx.order.findUnique({
                where: { id: order.id },
                include: { orderItems: { include: { product: true } } },
            });
        });
    },

    async getMyOrders(email: string, page = 1, limit = 10, status?: string) {
        console.log(`[DEBUG] Fetching My Orders for email: "${email}" (status: ${status || 'all'})`);
        const skip = (page - 1) * limit;
        const where = {
            ...queryActive(),
            customerEmail: { equals: email, mode: 'insensitive' as const },
            ...(status && { status }),
        };

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: { orderItems: { include: { product: true } } },
            }),
            prisma.order.count({ where }),
        ]);

        console.log(`[DEBUG] Found ${total} orders for "${email}"`);
        return { orders, total, pages: Math.ceil(total / limit) };
    },

    async getOrders(page = 1, limit = 10, status?: string, search?: string, isCustom?: boolean) {
        const skip = (page - 1) * limit;
        
        // For MongoDB Json array filtering, standard Prisma filters can be unreliable.
        // We'll fetch more than requested and filter in JS to ensure accuracy for this categorization.
        const [allOrders] = await Promise.all([
            prisma.order.findMany({
                where: {
                    ...queryActive(),
                    ...(status && { status }),
                    ...(search && {
                        OR: [
                            { firstName: { contains: search, mode: "insensitive" } },
                            { lastName: { contains: search, mode: "insensitive" } },
                            { customerEmail: { contains: search, mode: "insensitive" } },
                            { city: { contains: search, mode: "insensitive" } },
                        ],
                    }),
                },
                orderBy: { createdAt: "desc" },
                include: { orderItems: { include: { product: true } } },
            }),
        ]);

        let filteredOrders = allOrders;
        if (isCustom !== undefined) {
            filteredOrders = allOrders.filter(order => {
                const hasCustomItem = order.orderItems.some(item => 
                    Array.isArray(item.customizations) && (item.customizations as any[]).length > 0
                );
                
                const hasStandardItem = order.orderItems.some(item => 
                    !Array.isArray(item.customizations) || (item.customizations as any[]).length === 0
                );

                return isCustom ? hasCustomItem : hasStandardItem;
            });
        }

        const paginatedOrders = filteredOrders.slice(skip, skip + limit);
        const finalTotal = filteredOrders.length;

        return { 
            orders: paginatedOrders, 
            total: finalTotal, 
            pages: Math.ceil(finalTotal / limit) 
        };
    },

    async getOrderById(id: string) {
        return prisma.order.findFirst({
            where: queryActive({ id }),
            include: { orderItems: { include: { product: true } } },
        });
    },

    async updateOrder(id: string, data: UpdateOrderInput) {
        return prisma.order.update({ where: { id }, data });
    },

    async softDeleteOrder(id: string) {
        return prisma.order.update({ where: { id }, data: { isDeleted: true } });
    },

    async hardDeleteOrder(id: string) {
        return prisma.$transaction(async (tx) => {
            // Delete related records to bypass referential integrity errors
            await tx.orderItem.deleteMany({ where: { orderId: id } });
            
            try {
                await tx.payment.deleteMany({ where: { orderId: id } });
            } catch (e) {
                // Ignore if model does not exist or relation is not there
            }

            try {
                await tx.delivery.deleteMany({ where: { orderId: id } });
            } catch (e) {
                // Ignore if model does not exist
            }

            try {
                await tx.production.deleteMany({ where: { orderId: id } });
            } catch (e) {
                // Ignore if model does not exist 
            }

            // Finally delete the order
            return tx.order.delete({ where: { id } });
        });
    },
};
