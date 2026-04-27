export interface Material {
  id: string;
  name: string;
  quantity: number;
  minimumLevel: number;
  supplierName: string;
  isLowStock: boolean;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalMaterials: number;
  totalSuppliers: number;
  totalProduction: number;
  pendingOrders: number;
  completedOrders: number;
  lowStockMaterials: Material[];
  recentOrders: Array<{
    id: string;
    customerName: string;
    customerEmail: string;
    status: string;
    totalPrice: number;
    createdAt: string;
    orderItems?: Array<{
      id: string;
      quantity: number;
      unitPrice: number;
      product?: {
        name: string;
      };
    }>;
  }>;
}

export interface SalesData {
  date: string;
  revenue: number;
}

export interface InventoryStats {
  totalMaterials: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  materials: Material[];
}
