export interface CustomizationOption {
  id: string;
  category: "base" | "toppings" | "fillings";
  name: string;
  description?: string;
  price: number;
  maxQuantity: number;
}

export interface CustomizationCatalog {
  base: CustomizationOption[];
  toppings: CustomizationOption[];
  fillings: CustomizationOption[];
}

export interface CustomizationSelection {
  id: string;
  quantity: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  customizations?: CustomizationSelection[];
  customerMessage?: string;
  product?: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  firstName: string;
  lastName: string;
  customerEmail: string;
  country?: string;
  streetAddress: string;
  streetAddress2?: string;
  city: string;
  postcode?: string;
  senderPhone: string;
  recipientPhone: string;
  cardQuote?: string;
  orderNotes?: string;
  shipToDifferentAddress: boolean;
  status: "Pending" | "Processing" | "Completed" | "Cancelled" | "Driver Assigned";
  totalPrice: number;
  orderItems?: OrderItem[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderList {
  orders: Order[];
  total: number;
  pages: number;
}

export interface OrderFormData {
  firstName: string;
  lastName: string;
  customerEmail: string;
  country?: string;
  streetAddress: string;
  streetAddress2?: string;
  city: string;
  postcode?: string;
  senderPhone: string;
  recipientPhone: string;
  cardQuote?: string;
  orderNotes?: string;
  shipToDifferentAddress: boolean;
  totalPrice: number;
  orderItems?: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
}
