import { z } from "zod";

export const CreateDeliverySchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  deliveryPersonName: z.string().min(1, "Delivery person name is required"),
  vehicleType: z.enum(["car", "three_wheel", "bike"], {
    message: "Invalid vehicle type",
  }),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  status: z
    .enum(["pending", "dispatched", "delivered", "failed"])
    .default("pending"),
  specialNotes: z.string().optional(),
});

export const UpdateDeliverySchema = CreateDeliverySchema.partial().omit({
  orderId: true,
});

export type CreateDeliveryInput = z.input<typeof CreateDeliverySchema>;
export type UpdateDeliveryInput = z.input<typeof UpdateDeliverySchema>;
