"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ShoppingCart,
  DollarSign,
  Package,
  Warehouse,

  Factory,
  AlertTriangle,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardApiService } from "@/services/dashboard.service";
import type { DashboardStats, SalesData } from "@/types/dashboard.types";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [salesDays, setSalesDays] = useState(30);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, sales] = await Promise.all([
        dashboardApiService.getStats(),
        dashboardApiService.getSales(salesDays),
      ]);
      setStats(statsData);
      setSalesData(sales);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  }, [salesDays]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Processing":
        return "bg-blue-100 text-blue-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const statCards = [
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Revenue",
      value: `${(stats?.totalRevenue || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Products",
      value: stats?.totalProducts || 0,
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Total Suppliers",
      value: stats?.totalSuppliers || 0,
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Materials in Stock",
      value: stats?.totalMaterials || 0,
      icon: Warehouse,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Total Production",
      value: stats?.totalProduction || 0,
      icon: Factory,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
  ];

  const maxRevenue = Math.max(...salesData.map((d) => d.revenue), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-stone-600 dark:text-stone-400 mt-1">
          Welcome to your dashboard. Here&apos;s an overview of your business.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-stone-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order Status & Sales Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Order Overview
            </CardTitle>
            <CardDescription>Current status of all orders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-stone-700 dark:text-stone-300">Pending Orders</span>
                </div>
                <span className="font-semibold text-stone-900 dark:text-white">
                  {stats?.pendingOrders || 0}
                </span>
              </div>
              <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${stats ? (stats.pendingOrders / Math.max(stats.totalOrders, 1)) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-stone-700 dark:text-stone-300">Completed Orders</span>
                </div>
                <span className="font-semibold text-stone-900 dark:text-white">
                  {stats?.completedOrders || 0}
                </span>
              </div>
              <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${stats ? (stats.completedOrders / Math.max(stats.totalOrders, 1)) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-stone-600 dark:text-stone-400">Pending</span>
                  <span className="ml-auto font-semibold">{stats?.pendingOrders || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-stone-600 dark:text-stone-400">Completed</span>
                  <span className="ml-auto font-semibold">{stats?.completedOrders || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Sales Overview
                </CardTitle>
                <CardDescription>Revenue over the last {salesDays} days</CardDescription>
              </div>
              <select
                value={salesDays}
                onChange={(e) => setSalesDays(Number(e.target.value))}
                className="px-3 py-1.5 text-sm border rounded-md bg-background"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {salesData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-stone-500">
                No sales data available
              </div>
            ) : (
              <div className="h-64 flex items-end gap-1">
                {salesData.slice(-14).map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-amber-500 rounded-t transition-all duration-300 hover:bg-amber-600"
                      style={{
                        height: `${(day.revenue / maxRevenue) * 100}%`,
                        minHeight: day.revenue > 0 ? "4px" : "0",
                      }}
                      title={`$${day.revenue.toLocaleString()}`}
                    ></div>
                    <span className="text-[10px] text-stone-500 rotate-45 origin-left">
                      {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {salesData.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-600 dark:text-stone-400">Total Revenue</span>
                  <span className="font-semibold text-stone-900 dark:text-white">
                    ${salesData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>Materials that need restocking</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.lowStockMaterials && stats.lowStockMaterials.length === 0 ? (
              <div className="text-center py-8 text-stone-500">
                <Warehouse className="w-12 h-12 mx-auto mb-3 text-stone-300" />
                <p>All materials are well stocked</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.lowStockMaterials.slice(0, 5).map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <div>
                        <p className="font-medium text-stone-900 dark:text-white">
                          {material.name}
                        </p>
                        <p className="text-sm text-stone-500">
                          Min level: {material.minimumLevel}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">
                        {material.quantity} left
                      </p>
                      <p className="text-xs text-stone-500">{material.supplierName}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Recent Orders
            </CardTitle>
            <CardDescription>Latest customer orders</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentOrders && stats.recentOrders.length === 0 ? (
              <div className="text-center py-8 text-stone-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-stone-300" />
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.recentOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-stone-900 dark:text-white">
                        {order.customerName}
                      </p>
                      <p className="text-sm text-stone-500">
                        {order.orderItems?.[0]?.product?.name || "Order"}
                        {order.orderItems && order.orderItems.length > 1
                          ? ` + ${order.orderItems.length - 1} more`
                          : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-stone-900 dark:text-white">
                        ${order.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded-full ${getStatusBadgeColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
