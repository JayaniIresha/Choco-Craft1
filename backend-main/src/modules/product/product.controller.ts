import { Request, Response } from "express";
import { z } from "zod";
import { productService } from "./product.service";
import { CreateProductSchema, UpdateProductSchema } from "./product.validation";

export const createProduct = async (req: Request, res: Response) => {
    try {
        const data = CreateProductSchema.parse(req.body);
        const result = await productService.createProduct(data);
        res.status(201).json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
        res.status(400).json({ error: error.message });
    }
};

export const getProducts = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = (req.query.search as string) || undefined;

        const result = await productService.getProducts(page, limit, search);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getProductById = async (req: Request, res: Response) => {
    try {
        const result = await productService.getProductById(req.params.id as string);
        if (!result) return res.status(404).json({ error: "Product not found" });
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const data = UpdateProductSchema.parse(req.body);
        const result = await productService.updateProduct(req.params.id as string, data);
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
        res.status(400).json({ error: error.message });
    }
};

export const softDeleteProduct = async (req: Request, res: Response) => {
    try {
        await productService.softDeleteProduct(req.params.id as string);
        res.json({ message: "Product deleted successfully" });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const hardDeleteProduct = async (req: Request, res: Response) => {
    try {
        await productService.hardDeleteProduct(req.params.id as string);
        res.json({ message: "Product permanently deleted" });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
