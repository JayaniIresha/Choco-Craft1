import api from "@/lib/api";
import { Payment } from "../types/payment.types";
import { CreatePaymentInput, UpdatePaymentInput } from "../validations/payment.validation";

const API_URL = "/payments";

export const paymentApiService = {
  async getPayments(
    page = 1,
    limit = 10,
    status?: string,
    method?: string,
    search?: string,
    sortBy = "createdAt",
    sortOrder: "asc" | "desc" = "desc"
  ) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder,
    });
    if (status) params.append("status", status);
    if (method) params.append("method", method);
    if (search) params.append("search", search);
    const res = await api.get(`${API_URL}?${params}`);
    return res.data as { 
      payments: Payment[]; 
      total: number; 
      pages: number;
      methodAnalysis: {
        credit_card: number;
        bank_transfer: number; 
        cash_on_delivery: number; 
      };
      statusAnalysis: {
        pending: number;
        completed: number;
        failed: number;
      };
    };
  },

  async createPayment(data: CreatePaymentInput) {
    const res = await api.post(API_URL, data);
    return res.data as Payment;
  },

  async getPaymentByOrderId(orderId: string) {
    const res = await api.get(`${API_URL}/order/${orderId}`);
    return res.data as Payment;
  },

  async getPaymentById(id: string) {
    const res = await api.get(`${API_URL}/${id}`);
    return res.data as Payment;
  },

  async updatePaymentStatus(id: string, data: UpdatePaymentInput) {
    const res = await api.put(`${API_URL}/${id}`, data);
    return res.data as Payment;
  },

  async softDeletePayment(id: string) {
    const res = await api.delete(`${API_URL}/${id}`);
    return res.data;
  },

  async hardDeletePayment(id: string) {
    const res = await api.delete(`${API_URL}/hard/${id}`);
    return res.data;
  },
};
