import api from "@/lib/api";
import { Production } from "@/validations/production.validation";

export const productionService = {
    async getProductions(page = 1, limit = 100, status?: string) {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (status && status !== "All") params.append("status", status);
        const res = await api.get(`/production?${params.toString()}`);
        return res.data as { productions: Production[]; total: number; pages: number };
    },

    async getProductionById(id: string) {
        const res = await api.get(`/production/${id}`);
        return res.data as Production;
    },

    async createProduction(data: Omit<Production, "id" | "createdAt" | "updatedAt" | "isDeleted">) {
        const res = await api.post("/production", data);
        return res.data as Production;
    },

    async updateProduction(id: string, data: { status: "Planned" | "InProgress" | "Completed" }) {
        const res = await api.put(`/production/${id}`, data);
        return res.data as Production;
    },

    async softDeleteProduction(id: string) {
        const res = await api.delete(`/production/${id}`);
        return res.data;
    },
};
