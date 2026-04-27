import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { inventoryService } from "./inventory.service";
import {
  CreateMaterialSchema,
  UpdateMaterialSchema,
  CreateStockUsageSchema,
  UpdateStockUsageSchema,
} from "./inventory.validation";

const ADMIN_ROLES = ["admin", "inventory"];

export const createMaterial = async (req: AuthRequest, res: Response) => {
  try {
    console.log("Creating material with data:", req.body);
    const data = CreateMaterialSchema.parse(req.body);
    const material = await inventoryService.createMaterial(data);
    console.log("Material created:", material.id);
    res.status(201).json(material);
  } catch (error: any) {
    console.error("Create material error:", error.message);
    res.status(400).json({ error: error.message });
  }
};

export const getMaterials = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = req.query.sortOrder as string | undefined;
    const lowStock = req.query.lowStock === "true";
    const result = await inventoryService.getMaterials(page, limit, search, sortBy, sortOrder, lowStock);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getMaterialById = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const material = await inventoryService.getMaterialById(id);
    if (!material) {
      return res.status(404).json({ error: "Material not found" });
    }
    res.status(200).json(material);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    console.log(`Updating material ${id} with data:`, req.body);
    const data = UpdateMaterialSchema.parse(req.body);
    const material = await inventoryService.updateMaterial(id, data);
    console.log("Material updated successfully");
    res.status(200).json(material);
  } catch (error: any) {
    console.error(`Update material ${req.params.id} error:`, error.message);
    res.status(400).json({ error: error.message });
  }
};

export const softDeleteMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    console.log(`Deleting material ${id}`);
    await inventoryService.softDeleteMaterial(id);
    console.log("Material deleted successfully");
    res.status(200).json({ message: "Material deleted" });
  } catch (error: any) {
    console.error(`Delete material ${req.params.id} error:`, error.message);
    res.status(400).json({ error: error.message });
  }
};

export const hardDeleteMaterial = async (req: AuthRequest, res: Response) => {
  try {
    if (!ADMIN_ROLES.includes(req.user?.role || "")) {
      return res.status(403).json({ error: "Only admins or inventory users can hard delete" });
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await inventoryService.hardDeleteMaterial(id);
    res.status(200).json({ message: "Material permanently deleted" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const createStockUsage = async (req: AuthRequest, res: Response) => {
  try {
    if (!ADMIN_ROLES.includes(req.user?.role || "")) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const data = CreateStockUsageSchema.parse(req.body);
    const usage = await inventoryService.createStockUsage(data);
    res.status(201).json(usage);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getStockUsage = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = req.query.sortOrder as string | undefined;
    const materialId = req.query.materialId as string | undefined;
    const result = await inventoryService.getStockUsage(page, limit, search, sortBy, sortOrder, materialId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getStockUsageById = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const usage = await inventoryService.getStockUsageById(id);
    if (!usage) {
      return res.status(404).json({ error: "Stock usage not found" });
    }
    res.status(200).json(usage);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateStockUsage = async (req: AuthRequest, res: Response) => {
  try {
    if (!ADMIN_ROLES.includes(req.user?.role || "")) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = UpdateStockUsageSchema.parse(req.body);
    const usage = await inventoryService.updateStockUsage(id, data);
    res.status(200).json(usage);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const softDeleteStockUsage = async (req: AuthRequest, res: Response) => {
  try {
    if (!ADMIN_ROLES.includes(req.user?.role || "")) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await inventoryService.softDeleteStockUsage(id);
    res.status(200).json({ message: "Stock usage deleted" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getSuppliers = async (req: AuthRequest, res: Response) => {
  try {
    const suppliers = await inventoryService.getSuppliers();
    res.status(200).json(suppliers);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getProduction = async (req: AuthRequest, res: Response) => {
  try {
    const production = await inventoryService.getProduction();
    res.status(200).json(production);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
