import { Request, Response } from "express";
import { deliveryService } from "./delivery.service";
import { CreateDeliverySchema, UpdateDeliverySchema } from "./delivery.validation";

export async function createDelivery(req: Request, res: Response) {
  try {
    const data = CreateDeliverySchema.parse(req.body);
    const delivery = await deliveryService.createDelivery(data);
    res.status(201).json(delivery);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function getDeliveryByOrderId(req: Request, res: Response) {
  try {
    const { orderId } = req.params as { orderId: string };
    const delivery = await deliveryService.getDeliveryByOrderId(orderId);

    if (!delivery) {
      return res.status(404).json({ error: "Delivery not found" });
    }

    res.json(delivery);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function getDeliveryById(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const delivery = await deliveryService.getDeliveryById(id);

    if (!delivery) {
      return res.status(404).json({ error: "Delivery not found" });
    }

    res.json(delivery);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function updateDelivery(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const data = UpdateDeliverySchema.parse(req.body);
    const delivery = await deliveryService.updateDelivery(id, data);

    res.json(delivery);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function softDeleteDelivery(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    await deliveryService.softDeleteDelivery(id);
    res.json({ message: "Delivery soft deleted" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function hardDeleteDelivery(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    await deliveryService.hardDeleteDelivery(id);
    res.json({ message: "Delivery hard deleted" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function getDeliveries(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const vehicleType = (req.query.vehicleType as string) || undefined;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";

    const result = await deliveryService.getDeliveries(
      page,
      limit,
      status,
      search,
      vehicleType,
      sortBy,
      sortOrder
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
