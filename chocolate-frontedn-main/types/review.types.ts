export interface Review {
  id: string;
  orderId: string;
  userId: string;
  rating: number;
  comment: string;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  order?: {
    id: string;
    customerName: string;
    totalPrice: number;
  };
}

export interface ReviewList {
  reviews: Review[];
  total: number;
  pages: number;
}
