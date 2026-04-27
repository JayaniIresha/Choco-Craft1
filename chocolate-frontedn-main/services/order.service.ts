import api from "@/lib/api";
import { Order, OrderList, CustomizationCatalog } from "../types/order.types";
import { CreateOrderInput, UpdateOrderInput } from "../validations/order.validation";

const API_URL = "/orders";

export const orderApiService = {
  async getMyOrders(page = 1, limit = 10, status?: string) {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (status) params.append("status", status);
    const res = await api.get(`${API_URL}/my-orders?${params}`);
    return res.data as OrderList;
  },

  async getOrders(page = 1, limit = 10, status?: string, search?: string, isCustom?: boolean) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) params.append("status", status);
    if (search) params.append("search", search);
    if (isCustom !== undefined) params.append("isCustom", isCustom.toString());
    const res = await api.get(`${API_URL}?${params}`);
    return res.data as OrderList;
  },

  async getOrderById(id: string) {
    const res = await api.get(`${API_URL}/${id}`);
    return res.data as Order;
  },

  async createOrder(data: CreateOrderInput) {
    const res = await api.post(API_URL, data);
    return res.data as Order;
  },

  async updateOrder(id: string, data: UpdateOrderInput) {
    const res = await api.put(`${API_URL}/${id}`, data);
    return res.data as Order;
  },

  async getCustomizations() {
    const res = await api.get(`${API_URL}/customizations`);
    return res.data as CustomizationCatalog;
  },

  async softDeleteOrder(id: string) {
    const res = await api.delete(`${API_URL}/${id}`);
    return res.data;
  },

  async hardDeleteOrder(id: string) {
    const res = await api.delete(`${API_URL}/hard/${id}`);
    return res.data;
  },
};
