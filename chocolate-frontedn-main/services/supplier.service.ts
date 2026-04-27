import axios from "axios";
import { Supplier } from "../validations/supplier.validation";

const API_URL = "http://localhost:5001/api/suppliers";

// Configure default axios headers for authentication if needed
const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

export const supplierService = {
    // Get paginated and searchable suppliers
    async getSuppliers(page = 1, limit = 10, search = "") {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        if (search) {
            params.append("search", search);
        }

        const response = await axios.get(`${API_URL}?${params.toString()}`, getAuthHeaders());
        return response.data;
    },

    // Get single supplier
    async getSupplierById(id: string) {
        const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
        return response.data;
    },

    // Create new supplier
    async createSupplier(data: Supplier) {
        const response = await axios.post(API_URL, data, getAuthHeaders());
        return response.data;
    },

    // Update existing supplier
    async updateSupplier(id: string, data: Partial<Supplier>) {
        const response = await axios.put(`${API_URL}/${id}`, data, getAuthHeaders());
        return response.data;
    },

    // Soft delete supplier
    async softDeleteSupplier(id: string) {
        const response = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
        return response.data;
    },

    // Hard delete supplier
    async hardDeleteSupplier(id: string) {
        const response = await axios.delete(`${API_URL}/hard/${id}`, getAuthHeaders());
        return response.data;
    }
};
