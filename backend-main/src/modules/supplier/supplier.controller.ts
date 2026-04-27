import { Request, Response } from "express";
import { z } from "zod";
import { supplierService } from "./supplier.service";
import { CreateSupplierSchema, UpdateSupplierSchema } from "./supplier.validation";

export const createSupplier = async (req: Request, res: Response) => {
    try {
        const data = CreateSupplierSchema.parse(req.body);
        const result = await supplierService.createSupplier(data);
        res.status(201).json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(400).json({ error: error.message });
    }
};

export const getSuppliers = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = (req.query.search as string) || undefined;

        const result = await supplierService.getSuppliers(page, limit, search);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getSupplierById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const result = await supplierService.getSupplierById(id);
        if (!result) {
            return res.status(404).json({ error: "Supplier not found" });
        }
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateSupplier = async (req: Request, res: Response) => {
    try {
        const data = UpdateSupplierSchema.parse(req.body);
        const id = req.params.id as string;
        const result = await supplierService.updateSupplier(id, data);
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(400).json({ error: error.message });
    }
};

export const softDeleteSupplier = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await supplierService.softDeleteSupplier(id);
        res.json({ message: "Supplier deleted successfully" });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const hardDeleteSupplier = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await supplierService.hardDeleteSupplier(id);
        res.json({ message: "Supplier permanently deleted" });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
