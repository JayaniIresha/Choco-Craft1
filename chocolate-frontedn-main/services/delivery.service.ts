import axios from "axios";
import { Delivery, DeliveryList } from "../types/delivery.types";
import {
  CreateDeliveryInput,
  UpdateDeliveryInput,
} from "../validations/delivery.validation";

const API_URL = "http://localhost:5001/api/deliveries";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const deliveryApiService = {
  async getDeliveries(
    page = 1,
    limit = 10,
    status?: string,
    search?: string,
    vehicleType?: string,
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
    if (search) params.append("search", search);
    if (vehicleType) params.append("vehicleType", vehicleType);
    const res = await axios.get(`${API_URL}?${params}`, getAuthHeaders());
    return res.data as DeliveryList;
  },

  async createDelivery(data: CreateDeliveryInput) {
    const res = await axios.post(API_URL, data, getAuthHeaders());
    return res.data as Delivery;
  },

  async getDeliveryByOrderId(orderId: string) {
    const res = await axios.get(`${API_URL}/order/${orderId}`, getAuthHeaders());
    return res.data as Delivery;
  },

  async getDeliveryById(id: string) {
    const res = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
    return res.data as Delivery;
  },

  async updateDelivery(id: string, data: UpdateDeliveryInput) {
    const res = await axios.put(`${API_URL}/${id}`, data, getAuthHeaders());
    return res.data as Delivery;
  },

  async softDeleteDelivery(id: string) {
    const res = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
    return res.data;
  },

  async hardDeleteDelivery(id: string) {
    const res = await axios.delete(`${API_URL}/hard/${id}`, getAuthHeaders());
    return res.data;
  },
};
