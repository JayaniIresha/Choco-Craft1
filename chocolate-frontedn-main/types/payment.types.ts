export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: "credit_card" | "bank_transfer" | "cash_on_delivery";
  status: "pending" | "completed" | "failed";
  imageUrl?: string;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
  order?: {
    id: string;
    firstName?: string;
    lastName?: string;
    customerEmail: string;
    totalPrice: number;
  };
}

export interface PaymentFormData {
  orderId: string;
  amount: number;
  method: "credit_card" | "bank_transfer" | "cash_on_delivery";
  status?: "pending" | "completed" | "failed";
  imageUrl?: string;
}

export interface PaymentUpdateData {
  status?: "pending" | "completed" | "failed";
  imageUrl?: string;
}
