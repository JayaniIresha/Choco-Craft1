export type VehicleType = "car" | "three_wheel" | "bike";
export type DeliveryStatus = "pending" | "dispatched" | "delivered" | "failed";

export interface Delivery {
  id: string;
  orderId: string;
  deliveryPersonName: string;
  vehicleType: VehicleType;
  deliveryDate: string;
  status: DeliveryStatus;
  specialNotes?: string;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
  order?: {
    id: string;
    customerName: string;
    customerEmail: string;
    totalPrice: number;
  };
}

export interface DeliveryList {
  deliveries: Delivery[];
  total: number;
  pages: number;
}
