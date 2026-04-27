import prisma from "../../config/prisma";
import {
  CreateDeliveryInput,
  UpdateDeliveryInput,
} from "./delivery.validation";
import { queryActive } from "../../utils/softDelete";

export const deliveryService = {
  async createDelivery(data: CreateDeliveryInput) {
    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Check if delivery already exists for this order
    const existingDelivery = await prisma.delivery.findUnique({
      where: { orderId: data.orderId },
    });

    if (existingDelivery) {
      throw new Error("Delivery already exists for this order");
    }

    const delivery = await prisma.delivery.create({
      data: {
        orderId: data.orderId,
        deliveryPersonName: data.deliveryPersonName,
        vehicleType: data.vehicleType,
        deliveryDate: new Date(data.deliveryDate),
        status: data.status || "pending",
        specialNotes: data.specialNotes,
      },
      include: { order: true },
    });

    return delivery;
  },

  async getDeliveryByOrderId(orderId: string) {
    const delivery = await prisma.delivery.findFirst({
      where: queryActive({ orderId }),
      include: { order: true },
    });

    return delivery;
  },

  async getDeliveryById(id: string) {
    const delivery = await prisma.delivery.findFirst({
      where: queryActive({ id }),
      include: { order: true },
    });

    return delivery;
  },

  async updateDelivery(id: string, data: UpdateDeliveryInput) {
    const delivery = await prisma.delivery.update({
      where: { id },
      data: {
        ...(data.deliveryPersonName && {
          deliveryPersonName: data.deliveryPersonName,
        }),
        ...(data.vehicleType && { vehicleType: data.vehicleType }),
        ...(data.deliveryDate && { deliveryDate: new Date(data.deliveryDate) }),
        ...(data.status && { status: data.status }),
        ...(data.specialNotes !== undefined && {
          specialNotes: data.specialNotes,
        }),
      },
      include: { order: true },
    });

    return delivery;
  },

  async softDeleteDelivery(id: string) {
    await prisma.delivery.update({
      where: { id },
      data: { isDeleted: true },
    });
  },

  async hardDeleteDelivery(id: string) {
    await prisma.delivery.delete({
      where: { id },
    });
  },

  async getDeliveries(
    page = 1,
    limit = 10,
    status?: string,
    search?: string,
    vehicleType?: string,
    sortBy = "createdAt",
    sortOrder: "asc" | "desc" = "desc",
  ) {
    const skip = (page - 1) * limit;

    const where = {
      ...queryActive(),
      ...(status && { status }),
      ...(vehicleType && { vehicleType }),
      ...(search && {
        order: {
          is: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { customerEmail: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      }),
    } as any;

    const orderBy = { [sortBy]: sortOrder };

    const [deliveries, total] = await Promise.all([
      prisma.delivery.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { order: true },
      }),
      prisma.delivery.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    return { deliveries, total, pages };
  },
};
