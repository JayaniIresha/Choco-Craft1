import prisma from "../../config/prisma";

export const getDashboardStats = async () => {
  const [
    totalOrders,
    totalRevenue,
    totalProducts,
    totalMaterials,
    totalSuppliers,
    totalProduction,
    pendingOrders,
    completedOrders,
    lowStockMaterials,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({
      where: { isDeleted: false },
    }),
    prisma.order.aggregate({
      where: { isDeleted: false },
      _sum: { totalPrice: true },
    }),
    prisma.product.count({
      where: { isDeleted: false },
    }),
    prisma.material.count({
      where: { isDeleted: false },
    }),
    prisma.supplier.count({
      where: { isDeleted: false },
    }),
    prisma.production.count({
      where: { isDeleted: false },
    }),
    prisma.order.count({
      where: { isDeleted: false, status: "pending" },
    }),
    prisma.order.count({
      where: { isDeleted: false, status: "completed" },
    }),
    prisma.material.findMany({
      where: { isDeleted: false },
    }),
    prisma.order.findMany({
      where: { isDeleted: false },
      include: {
        orderItems: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    totalOrders,
    totalRevenue: totalRevenue._sum.totalPrice || 0,
    totalProducts,
    totalMaterials,
    totalSuppliers,
    totalProduction,
    pendingOrders,
    completedOrders,
    lowStockMaterials: lowStockMaterials.filter(
      (mat) => mat.quantity <= mat.minimumLevel
    ),
    recentOrders,
  };
};

export const getSalesData = async (days: number = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const orders = await prisma.order.findMany({
    where: {
      isDeleted: false,
      createdAt: { gte: startDate },
    },
    select: {
      createdAt: true,
      totalPrice: true,
    },
  });

  const salesByDay: Record<string, number> = {};
  
  orders.forEach((order) => {
    const dateKey = order.createdAt.toISOString().split("T")[0];
    salesByDay[dateKey] = (salesByDay[dateKey] || 0) + order.totalPrice;
  });

  return Object.entries(salesByDay).map(([date, revenue]) => ({
    date,
    revenue,
  }));
};

export const getInventoryStats = async () => {
  const materials = await prisma.material.findMany({
    where: { isDeleted: false },
    include: { supplier: true },
  });

  const totalValue = materials.reduce((sum, mat) => {
    return sum + mat.quantity * 10; 
  }, 0);

  const lowStock = materials.filter(
    (mat) => mat.quantity <= mat.minimumLevel
  );

  const outOfStock = materials.filter((mat) => mat.quantity === 0);

  return {
    totalMaterials: materials.length,
    totalValue,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    materials: materials.map((m) => ({
      id: m.id,
      name: m.name,
      quantity: m.quantity,
      minimumLevel: m.minimumLevel,
      supplierName: m.supplier.name,
      isLowStock: m.quantity <= m.minimumLevel,
    })),
  };
};
