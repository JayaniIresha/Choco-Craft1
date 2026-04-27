import { Request, Response } from "express";
import { z } from "zod";
import { productionService } from "./production.service";
import { CreateProductionSchema, UpdateProductionSchema } from "./production.validation";

export const createProduction = async (req: Request, res: Response) => {
    try {
        const data = CreateProductionSchema.parse(req.body);
        const result = await productionService.createProduction(data);
        res.status(201).json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        // Return standard error message (e.g. "Insufficient raw materials")
        res.status(400).json({ error: error.message });
    }
};

export const getProductions = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const status = (req.query.status as string) || undefined;

        const result = await productionService.getProductions(page, limit, status);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getProductionById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const result = await productionService.getProductionById(id);
        if (!result) {
            return res.status(404).json({ error: "Production Order not found" });
        }
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateProduction = async (req: Request, res: Response) => {
    try {
        const data = UpdateProductionSchema.parse(req.body);
        const id = req.params.id as string;
        const result = await productionService.updateProduction(id, data);
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(400).json({ error: error.message });
    }
};

export const softDeleteProduction = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await productionService.softDeleteProduction(id);
        res.json({ message: "Production order deleted successfully" });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const hardDeleteProduction = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await productionService.hardDeleteProduction(id);
        res.json({ message: "Production order permanently deleted" });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
