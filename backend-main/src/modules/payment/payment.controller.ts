import { Request, Response } from "express";
import { paymentService } from "./payment.service";
import { CreatePaymentSchema, UpdatePaymentSchema } from "./payment.validation";

export async function createPayment(req: Request, res: Response) {
  try {
    console.log("Creating payment with data:", req.body);
    const data = CreatePaymentSchema.parse(req.body);
    const payment = await paymentService.createPayment(data);
    console.log("Payment created successfully:", payment.id);
    res.status(201).json(payment);
  } catch (error: any) {
    console.error("Create payment error:", error.message);
    res.status(400).json({ error: error.message });
  }
}

export async function getPaymentByOrderId(req: Request, res: Response) {
  try {
    const { orderId } = req.params as { orderId: string };
    const payment = await paymentService.getPaymentByOrderId(orderId);

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json(payment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function getPaymentById(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const payment = await paymentService.getPaymentById(id);

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json(payment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function updatePaymentStatus(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    console.log("Updating payment status:", id, req.body);
    const data = UpdatePaymentSchema.parse(req.body);
    const payment = await paymentService.updatePaymentStatus(
      id,
      data.status || "pending",
      data.imageUrl
    );
    console.log("Payment status updated successfully:", payment.id, payment.status);
    res.json(payment);
  } catch (error: any) {
    console.error("Update payment status error:", error.message);
    res.status(400).json({ error: error.message });
  }
}

export async function softDeletePayment(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    await paymentService.softDeletePayment(id);
    res.json({ message: "Payment soft deleted" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function hardDeletePayment(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    await paymentService.hardDeletePayment(id);
    res.json({ message: "Payment hard deleted" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function getPayments(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = (req.query.status as string) || undefined;
    const method = (req.query.method as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";

    const result = await paymentService.getPayments(
      page,
      limit,
      status,
      method,
      search,
      sortBy,
      sortOrder
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
