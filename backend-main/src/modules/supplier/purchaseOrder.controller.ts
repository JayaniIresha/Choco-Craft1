import { Request, Response } from "express";
import { z } from "zod";
import { purchaseOrderService } from "./purchaseOrder.service";
import { CreatePurchaseOrderSchema, UpdatePurchaseOrderSchema } from "./purchaseOrder.validation";

export const createPurchaseOrder = async (req: Request, res: Response) => {
    try {
        const data = CreatePurchaseOrderSchema.parse(req.body);
        const result = await purchaseOrderService.createPurchaseOrder(data);
        res.status(201).json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(400).json({ error: error.message });
    }
};

export const getPurchaseOrders = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const status = (req.query.status as string) || undefined;

        const result = await purchaseOrderService.getPurchaseOrders(page, limit, status);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getPurchaseOrderById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const result = await purchaseOrderService.getPurchaseOrderById(id);
        if (!result) {
            return res.status(404).json({ error: "Purchase Order not found" });
        }
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updatePurchaseOrder = async (req: Request, res: Response) => {
    try {
        const data = UpdatePurchaseOrderSchema.parse(req.body);
        const id = req.params.id as string;
        const result = await purchaseOrderService.updatePurchaseOrder(id, data);
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(400).json({ error: error.message });
    }
};

export const softDeletePurchaseOrder = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await purchaseOrderService.softDeletePurchaseOrder(id);
        res.json({ message: "Purchase Order deleted successfully" });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const hardDeletePurchaseOrder = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await purchaseOrderService.hardDeletePurchaseOrder(id);
        res.json({ message: "Purchase Order permanently deleted" });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
