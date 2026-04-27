import axios from "axios";
import { PurchaseOrder } from "../validations/purchaseOrder.validation";

const API_URL = "http://localhost:5001/api/purchase-orders";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

export const purchaseOrderService = {
    // Get paginated and filtered purchase orders
    async getPurchaseOrders(page = 1, limit = 10, status = "") {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        if (status && status !== "All") {
            params.append("status", status);
        }

        const response = await axios.get(`${API_URL}?${params.toString()}`, getAuthHeaders());
        return response.data;
    },

    // Get single purchase order
    async getPurchaseOrderById(id: string) {
        const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
        return response.data;
    },

    // Create new purchase order manually
    async createPurchaseOrder(data: PurchaseOrder) {
        const response = await axios.post(API_URL, data, getAuthHeaders());
        return response.data;
    },

    // Update existing purchase order (usually just status)
    async updatePurchaseOrder(id: string, data: Partial<PurchaseOrder>) {
        const response = await axios.put(`${API_URL}/${id}`, data, getAuthHeaders());
        return response.data;
    },

    // Soft delete purchase order
    async softDeletePurchaseOrder(id: string) {
        const response = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
        return response.data;
    },

    // Hard delete purchase order
    async hardDeletePurchaseOrder(id: string) {
        const response = await axios.delete(`${API_URL}/hard/${id}`, getAuthHeaders());
        return response.data;
    }
};
