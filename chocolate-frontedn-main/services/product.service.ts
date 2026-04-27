import axios from "axios";
import { Product, CreateProductInput } from "../validations/product.validation";

const API_URL = "http://localhost:5001/api/products";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
};

export const productApiService = {
    async getProducts(page = 1, limit = 20, search = "") {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        if (search) params.append("search", search);
        const res = await axios.get(`${API_URL}?${params}`, getAuthHeaders());
        return res.data as { products: Product[]; total: number; pages: number };
    },

    async getProductById(id: string) {
        const res = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
        return res.data as Product;
    },

    async createProduct(data: CreateProductInput) {
        const res = await axios.post(API_URL, data, getAuthHeaders());
        return res.data as Product;
    },

    async updateProduct(id: string, data: Partial<CreateProductInput>) {
        const res = await axios.put(`${API_URL}/${id}`, data, getAuthHeaders());
        return res.data as Product;
    },

    async softDeleteProduct(id: string) {
        const res = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
        return res.data;
    },
};
