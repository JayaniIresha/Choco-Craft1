import { Request, Response } from "express";
import { z } from "zod";
import { orderService } from "./order.service";
import { CreateOrderSchema, UpdateOrderSchema } from "./order.validation";
import { sendOrderStatusEmail } from "../../utils/email";
import { getCustomizationsByCategory } from "./order.customizations";

const STATUSES_TO_NOTIFY = ["Processing", "Dispatched", "Delivered", "Completed", "Cancelled"];

export const getCustomizations = (_req: Request, res: Response) => {
    res.json(getCustomizationsByCategory());
};

export const createOrder = async (req: Request, res: Response) => {
    try {
        const data = CreateOrderSchema.parse(req.body);

        // Ensure order is linked to the authenticated user's email if logged in
        const authEmail = (req as any).user?.email;
        if (authEmail) {
            console.log(`[DEBUG] Force-linking order to authenticated user: ${authEmail}`);
            data.customerEmail = authEmail;
        }

        const result = await orderService.createOrder(data);
        res.status(201).json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0]?.message ?? "Validation error" });
        res.status(400).json({ error: error.message });
    }
};

export const getMyOrders = async (req: Request, res: Response) => {
    try {
        const email = (req as any).user?.email;
        if (!email) return res.status(401).json({ error: "Unauthorized" });
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const status = (req.query.status as string) || undefined;
        res.json(await orderService.getMyOrders(email, page, limit, status));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getOrders = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const status = (req.query.status as string) || undefined;
        const search = (req.query.search as string) || undefined;
        const isCustom = req.query.isCustom === 'true' ? true : req.query.isCustom === 'false' ? false : undefined;
        res.json(await orderService.getOrders(page, limit, status, search, isCustom));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getOrderById = async (req: Request, res: Response) => {
    try {
        const result = await orderService.getOrderById(req.params.id as string);
        if (!result) return res.status(404).json({ error: "Order not found" });
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateOrder = async (req: Request, res: Response) => {
    try {
        const data = UpdateOrderSchema.parse(req.body);
        
        const existingOrder = await orderService.getOrderById(req.params.id as string);
        if (!existingOrder) {
            return res.status(404).json({ error: "Order not found" });
        }

        const result = await orderService.updateOrder(req.params.id as string, data);

        if (data.status && STATUSES_TO_NOTIFY.includes(data.status) && existingOrder.customerEmail) {
            sendOrderStatusEmail(existingOrder.customerEmail, data.status).catch((err) => {
                console.error("Failed to send order status email:", err);
            });
        }

        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0]?.message ?? "Validation error" });
        res.status(400).json({ error: error.message });
    }
};

export const softDeleteOrder = async (req: Request, res: Response) => {
    try {
        await orderService.softDeleteOrder(req.params.id as string);
        res.json({ message: "Order deleted successfully" });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const hardDeleteOrder = async (req: Request, res: Response) => {
    try {
        await orderService.hardDeleteOrder(req.params.id as string);
        res.json({ message: "Order permanently deleted" });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
