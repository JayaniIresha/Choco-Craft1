import axios from "axios";
import type { DashboardStats, SalesData, InventoryStats } from "../types/dashboard.types";

const API_URL = "http://localhost:5001/api/dashboard";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const dashboardApiService = {
  async getStats() {
    const res = await axios.get(`${API_URL}/stats`, getAuthHeaders());
    return res.data as DashboardStats;
  },

  async getSales(days: number = 30) {
    const res = await axios.get(`${API_URL}/sales?days=${days}`, getAuthHeaders());
    return res.data as SalesData[];
  },

  async getInventory() {
    const res = await axios.get(`${API_URL}/inventory`, getAuthHeaders());
    return res.data as InventoryStats;
  },
};
