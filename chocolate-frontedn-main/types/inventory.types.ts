export interface Material {
  id: string;
  name: string;
  quantity: number;
  minimumLevel: number;
  supplierId: string;
  supplierName?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialFormData {
  name: string;
  quantity: number;
  minimumLevel: number;
  supplierId: string;
}

export interface StockUsage {
  id: string;
  materialId: string;
  materialName?: string;
  usedQty: number;
  productionId: string;
  productionData?: {
    id: string;
    orderId: string;
    status: string;
  } | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockUsageFormData {
  materialId: string;
  usedQty: number;
  productionId: string;
}

export interface MaterialsResponse {
  materials: Material[];
  total: number;
  pages: number;
}

export interface StockUsageResponse {
  usage: StockUsage[];
  total: number;
  pages: number;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface Production {
  id: string;
  orderId: string;
  status: string;
}

export interface InventoryFilters {
  search?: string;
  lowStock?: boolean;
  sortBy?: "name" | "quantity" | "createdAt";
  sortOrder?: "asc" | "desc";
}
