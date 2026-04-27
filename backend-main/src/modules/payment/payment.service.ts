// backend-main/modules/payment/payment.service.ts
import prisma from "../../config/prisma";
import { CreatePaymentInput, UpdatePaymentInput } from "./payment.validation";
import { queryActive } from "../../utils/softDelete";

export const paymentService = {
  // Create payment (with order relation)
  async createPayment(data: CreatePaymentInput) {
    // Ensure order exists
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
    });
    if (!order) throw new Error("Order not found");

    // Upsert: create if not exists, update if already exists
    const payment = await prisma.payment.upsert({
      where: { orderId: data.orderId },
      update: {
        amount: data.amount,
        method: data.method,
        status: data.status || "pending",
        imageUrl: data.imageUrl,
      },
      create: {
        amount: data.amount,
        method: data.method,
        status: data.status || "pending",
        imageUrl: data.imageUrl,
        order: { connect: { id: data.orderId } }, // Attach order relation
      },
    });

    console.log("Payment saved to database:", payment.id);
    return payment;
  },

  // Get all payments with pagination and optional filtering
  async getPayments(
    page = 1,
    limit = 10,
    status?: string,
    method?: string,
    search?: string,
    sortBy = "createdAt",
    sortOrder: "asc" | "desc" = "desc"
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      ...queryActive(),
      order: {
        isDeleted: false
      },
      ...(status && { status }),
      ...(method && { method }),
      ...(search && {
        order: {
          is: {
            isDeleted: false,
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { customerEmail: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      }),
    };

    const orderBy = { [sortBy]: sortOrder };

    // Fetch all active payments to calculate accurate stats (bypassing groupBy limitations with relations)
    const allActivePayments = await prisma.payment.findMany({
      where: {
        isDeleted: false,
        order: { isDeleted: false }
      },
      include: { order: true }
    });

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { order: true },
      }),
      prisma.payment.count({ where }),
    ]);

    const methodAnalysis = {
      credit_card: allActivePayments.filter(p => p.method === 'credit_card').length,
      bank_transfer: allActivePayments.filter(p => p.method === 'bank_transfer').length,
      cash_on_delivery: allActivePayments.filter(p => p.method === 'cash_on_delivery').length,
    };

    const statusAnalysis = {
      pending: allActivePayments.filter(p => p.status === 'pending').length,
      completed: allActivePayments.filter(p => p.status === 'completed').length,
      failed: allActivePayments.filter(p => p.status === 'failed').length,
    };

    const totalRevenue = allActivePayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      payments,
      total,
      page,
      pages: Math.ceil(total / limit),
      methodAnalysis,
      statusAnalysis
    };
  },

  // Get payment by ID
  async getPaymentById(id: string) {
    const payment = await prisma.payment.findFirst({
      where: { id },
      include: { order: true },
    });
    if (!payment) throw new Error("Payment not found");
    return payment;
  },

  // Get payment by Order ID
  async getPaymentByOrderId(orderId: string) {
    const payment = await prisma.payment.findFirst({
      where: { orderId },
      include: { order: true },
    });
    if (!payment) throw new Error("Payment not found");
    return payment;
  },

  // Update payment status
  async updatePaymentStatus(id: string, status: string, imageUrl?: string) {
    const payment = await prisma.payment.update({
      where: { id },
      data: { status, ...(imageUrl && { imageUrl }) },
      include: { order: true },
    });
    return payment;
  },

  // Soft delete payment
  async softDeletePayment(id: string) {
    await prisma.payment.update({
      where: { id },
      data: { isDeleted: true },
    });
  },

  // Hard delete payment
  async hardDeletePayment(id: string) {
    await prisma.payment.delete({
      where: { id },
    });
  },
};