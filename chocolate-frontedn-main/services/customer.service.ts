import api from "@/lib/api";

export interface Customer {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    orders: number;
    reviews: number;
  };
}

export interface GetCustomersResult {
  customers: Customer[];
  total: number;
  page: number;
  pages: number;
}

export interface GetCustomerByIdResult extends Customer {
  orders?: {
    id: string;
    status: string;
    totalPrice: number;
    createdAt: string;
  }[];
  reviews?: {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
  }[];
}

interface GetCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

export const customerApiService = {
  async getCustomers(params: GetCustomersParams = {}): Promise<GetCustomersResult> {
    const { page = 1, limit = 10, search, role } = params;
    const response = await api.get("/customers", {
      params: { page, limit, search, role },
    });
    return response.data;
  },

  async getCustomerById(id: string): Promise<GetCustomerByIdResult> {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  async updateCustomer(id: string, data: { name?: string; email?: string; role?: string }): Promise<Customer> {
    const response = await api.patch(`/customers/${id}`, data);
    return response.data;
  },

  async deleteCustomer(id: string): Promise<void> {
    await api.delete(`/customers/${id}`);
  },
};
