import api from "@/lib/api";
import type {
  Material,
  MaterialFormData,
  StockUsage,
  StockUsageFormData,
  MaterialsResponse,
  StockUsageResponse,
  Supplier,
  Production,
} from "@/types/inventory.types";

export const inventoryService = {
  async getMaterials(
    page = 1,
    limit = 10,
    search?: string,
    sortBy?: string,
    sortOrder?: string,
    lowStock?: boolean
  ): Promise<MaterialsResponse> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) params.append("search", search);
    if (sortBy) params.append("sortBy", sortBy);
    if (sortOrder) params.append("sortOrder", sortOrder);
    if (lowStock) params.append("lowStock", "true");

    const response = await api.get(`/inventory/materials?${params.toString()}`);
    return response.data;
  },

  async getMaterialById(id: string): Promise<Material> {
    const response = await api.get(`/inventory/materials/${id}`);
    return response.data;
  },

  async createMaterial(data: MaterialFormData): Promise<Material> {
    const response = await api.post("/inventory/materials", data);
    return response.data;
  },

  async updateMaterial(id: string, data: Partial<MaterialFormData>): Promise<Material> {
    const response = await api.put(`/inventory/materials/${id}`, data);
    return response.data;
  },

  async softDeleteMaterial(id: string): Promise<void> {
    await api.delete(`/inventory/materials/${id}`);
  },

  async hardDeleteMaterial(id: string): Promise<void> {
    await api.delete(`/inventory/materials/hard/${id}`);
  },

  async getStockUsage(
    page = 1,
    limit = 10,
    search?: string,
    sortBy?: string,
    sortOrder?: string,
    materialId?: string
  ): Promise<StockUsageResponse> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) params.append("search", search);
    if (sortBy) params.append("sortBy", sortBy);
    if (sortOrder) params.append("sortOrder", sortOrder);
    if (materialId) params.append("materialId", materialId);

    const response = await api.get(`/inventory/stock-usage?${params.toString()}`);
    return response.data;
  },

  async getStockUsageById(id: string): Promise<StockUsage> {
    const response = await api.get(`/inventory/stock-usage/${id}`);
    return response.data;
  },

  async createStockUsage(data: StockUsageFormData): Promise<StockUsage> {
    const response = await api.post("/inventory/stock-usage", data);
    return response.data;
  },

  async updateStockUsage(id: string, data: Partial<StockUsageFormData>): Promise<StockUsage> {
    const response = await api.put(`/inventory/stock-usage/${id}`, data);
    return response.data;
  },

  async softDeleteStockUsage(id: string): Promise<void> {
    await api.delete(`/inventory/stock-usage/${id}`);
  },

  async getSuppliers(): Promise<Supplier[]> {
    const response = await api.get("/inventory/suppliers");
    return response.data;
  },

  async getProduction(): Promise<Production[]> {
    const response = await api.get("/inventory/production");
    return response.data;
  },
};
