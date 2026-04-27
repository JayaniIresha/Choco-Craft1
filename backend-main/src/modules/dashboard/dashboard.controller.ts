import { Request, Response } from "express";
import { getDashboardStats, getSalesData, getInventoryStats } from "./dashboard.service";

export const getStats = async (req: Request, res: Response) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};

export const getSales = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const sales = await getSalesData(days);
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sales data" });
  }
};

export const getInventory = async (req: Request, res: Response) => {
  try {
    const inventory = await getInventoryStats();
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch inventory stats" });
  }
};
