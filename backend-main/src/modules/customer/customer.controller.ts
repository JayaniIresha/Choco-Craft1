import { Request, Response } from "express";
import { customerService } from "./customer.service";
import { AuthRequest } from "../../middleware/auth.middleware";

const getIdParam = (params: AuthRequest["params"]): string => {
  return Array.isArray(params.id) ? params.id[0] : params.id;
};

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;
    const role = req.query.role as string | undefined;

    const result = await customerService.getCustomers(page, limit, search, role);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error in getCustomers:", error);
    res.status(400).json({ error: error.message });
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response) => {
  try {
    const customer = await customerService.getCustomerById(getIdParam(req.params));
    res.status(200).json(customer);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const customer = await customerService.updateCustomer(getIdParam(req.params), req.body);
    res.status(200).json(customer);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteCustomer = async (req: AuthRequest, res: Response) => {
  try {
    await customerService.deleteCustomer(getIdParam(req.params));
    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
