"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Search,
  Download,
  Edit,
  Trash2,
  Loader2,
  Eye,
  DollarSign,
  CreditCard,
  TrendingUp,
  FileDown,
  Package,
  ChevronDown,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { paymentApiService } from "@/services/payment.service";
import { expenseService, type FinanceStats } from "@/services/expense.service";
import {
  UpdatePaymentSchema,
  type UpdatePaymentInput,
} from "@/validations/payment.validation";
import type { Payment } from "@/types/payment.types";

export default function AdminFinancePage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [financeStats, setFinanceStats] = useState<FinanceStats | null>(null);
  const [methodAnalysis, setMethodAnalysis] = useState({ credit_card: 0, bank_transfer: 0, cash_on_delivery: 0 });
  const [statusAnalysis, setStatusAnalysis] = useState({ pending: 0, completed: 0, failed: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [orderDetailPayment, setOrderDetailPayment] = useState<Payment | null>(
    null,
  );
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);

  const statusForm = useForm<UpdatePaymentInput>({
    resolver: zodResolver(UpdatePaymentSchema),
    defaultValues: {
      status: "pending",
    },
  });

  const fetchFinanceStats = useCallback(async () => {
    try {
      const stats = await expenseService.getFinanceStats();
      setFinanceStats(stats);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(
        err?.response?.data?.error || "Failed to fetch finance stats",
      );
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const result = await paymentApiService.getPayments(
        page,
        10,
        statusFilter === "all" ? undefined : statusFilter,
        methodFilter === "all" ? undefined : methodFilter,
        search || undefined,
        sortBy,
        sortOrder,
      );
      setPayments(result.payments);
      setTotalPages(result.pages);
      setTotal(result.total);
      if (result.methodAnalysis) setMethodAnalysis(result.methodAnalysis);
      if (result.statusAnalysis) setStatusAnalysis(result.statusAnalysis);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, methodFilter, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchPayments();
    fetchFinanceStats();
  }, [fetchPayments, fetchFinanceStats]);

  const handleUpdateStatus = async (data: UpdatePaymentInput) => {
    if (!editingPayment) return;

    try {
      setSubmitting(true);
      await paymentApiService.updatePaymentStatus(editingPayment.id, data);
      toast.success("Payment status updated successfully");
      setStatusDialogOpen(false);
      setEditingPayment(null);
      statusForm.reset();
      fetchPayments();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to update payment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!deletingPayment) return;

    try {
      setSubmitting(true);
      await paymentApiService.softDeletePayment(deletingPayment.id);
      toast.success("Payment deleted successfully");
      setDeletingPayment(null);
      fetchPayments();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to delete payment");
    } finally {
      setSubmitting(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Payments Report", 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableData = payments.map((payment) => [
      `#${payment.id.slice(-8)}`,
      `#${payment.order?.id.slice(-8) || "N/A"}`,
      [payment.order?.firstName, payment.order?.lastName].filter(Boolean).join(" ") || payment.order?.customerEmail || "N/A",
      payment.method === "credit_card"
        ? "Card"
        : payment.method === "bank_transfer"
          ? "Bank Transfer"
          : "COD",
      `$${payment.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      payment.status,
      new Date(payment.createdAt).toLocaleDateString(),
    ]);

    autoTable(doc, {
      head: [
        [
          "Payment #",
          "Order #",
          "Customer",
          "Method",
          "Amount",
          "Status",
          "Date",
        ],
      ],
      body: tableData,
      startY: 35,
      theme: "striped",
      headStyles: { fillColor: [217, 119, 6] },
    });

    doc.save(`payments-report-${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF exported successfully");
  };

  const downloadReceipt = async (payment: Payment) => {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [139, 90, 43];
    const lightBrown: [number, number, number] = [245, 235, 220];
    const darkGray: [number, number, number] = [50, 50, 50];
    const mediumGray: [number, number, number] = [120, 120, 120];

    // Header background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 38, "F");

    // Brand title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("ChocoCraft", 14, 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(240, 220, 195);
    doc.text("Premium Chocolate Factory", 14, 23);

    // Receipt title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("PAYMENT RECEIPT", 210 - 14, 16, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(240, 220, 195);
    doc.text(
      `Date: ${new Date(payment.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`,
      210 - 14,
      23,
      { align: "right" },
    );

    // Receipt IDs section
    doc.setFillColor(...lightBrown);
    doc.roundedRect(14, 44, 182, 22, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...mediumGray);
    doc.text("PAYMENT ID", 20, 51);
    doc.text("ORDER ID", 110, 51);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...darkGray);
    doc.text(`#${payment.id.slice(-12).toUpperCase()}`, 20, 59);
    doc.text(`#${payment.order?.id.slice(-12).toUpperCase() || "N/A"}`, 110, 59);

    // Divider
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(14, 72, 196, 72);

    // Customer details
    let y = 80;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.text("Customer Information", 14, y);

    y += 8;
    const customerName =
      [payment.order?.firstName, payment.order?.lastName]
        .filter(Boolean)
        .join(" ") || "N/A";

    const fields: [string, string][] = [
      ["Name", customerName],
      ["Email", payment.order?.customerEmail || "N/A"],
    ];

    fields.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...mediumGray);
      doc.text(label.toUpperCase(), 14, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...darkGray);
      doc.text(value, 70, y);
      y += 8;
    });

    // Divider
    y += 2;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(14, y, 196, y);
    y += 8;

    // Payment details
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.text("Payment Details", 14, y);
    y += 8;

    const paymentFields: [string, string][] = [
      [
        "Method",
        payment.method === "credit_card"
          ? "Credit Card"
          : payment.method === "bank_transfer"
            ? "Bank Transfer"
            : "Cash on Delivery",
      ],
      ["Status", payment.status.charAt(0).toUpperCase() + payment.status.slice(1)],
      [
        "Amount",
        `$${payment.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      ],
      [
        "Order Total",
        payment.order?.totalPrice
          ? `$${payment.order.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
          : "N/A",
      ],
    ];

    paymentFields.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...mediumGray);
      doc.text(label.toUpperCase(), 14, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      // Colour the status
      if (label === "Status") {
        if (payment.status === "completed") doc.setTextColor(22, 163, 74);
        else if (payment.status === "failed") doc.setTextColor(220, 38, 38);
        else doc.setTextColor(202, 138, 4);
      } else if (label === "Amount") {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...primaryColor);
      } else {
        doc.setTextColor(...darkGray);
      }
      doc.text(value, 70, y);
      doc.setFontSize(10);
      y += 8;
    });

    // Bank transfer receipt image
    if (payment.imageUrl) {
      y += 4;
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(14, y, 196, y);
      y += 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...primaryColor);
      doc.text("Bank Transfer Receipt", 14, y);
      y += 6;

      try {
        const imageUrl = payment.imageUrl.startsWith("http")
          ? payment.imageUrl
          : `http://localhost:5001${payment.imageUrl}`;

        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const reader = new FileReader();

        await new Promise<void>((resolve) => {
          reader.onload = () => {
            const base64 = reader.result as string;
            const imgFormat = blob.type.includes("png") ? "PNG" : "JPEG";
            const remaining = 277 - y;
            const maxH = Math.min(remaining, 80);
            doc.addImage(base64, imgFormat, 14, y, 100, maxH);
            resolve();
          };
          reader.readAsDataURL(blob);
        });
      } catch {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(...mediumGray);
        doc.text("(Receipt image could not be loaded)", 14, y + 6);
      }
    }

    // Footer
    doc.setFillColor(...primaryColor);
    doc.rect(0, 282, 210, 15, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(240, 220, 195);
    doc.text("ChocoCraft — Thank you for your business!", 105, 290, {
      align: "center",
    });

    doc.save(
      `receipt-${payment.id.slice(-8)}-${new Date().toISOString().split("T")[0]}.pdf`,
    );
    toast.success("Receipt downloaded successfully");
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "credit_card":
        return "Card";
      case "bank_transfer":
        return "Bank Transfer";
      case "cash_on_delivery":
        return "COD";
      default:
        return method;
    }
  };

  const stats = {
    totalRevenue: financeStats?.totalRevenue || 0,
    pending: statusAnalysis.pending,
    completed: statusAnalysis.completed,
    failed: statusAnalysis.failed,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 dark:text-white">
            Finance
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">
            Manage payments
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {financeStats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" /> Total Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-600">
                      $ {financeStats.totalRevenue.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Confirmed earnings to date
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-gradient-to-br from-green-50 to-green-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
                      <Package className="h-4 w-4" /> Completed Payments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">
                      {financeStats.revenueCount}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Successfully processed orders
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-amber-600 flex items-center gap-2">
                      <ChevronDown className="h-4 w-4 rotate-180" /> Pending Payments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-amber-600">
                      {stats.pending}
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      Awaiting manual confirmation
                    </p>
                  </CardContent>
                </Card>
              </div>
              <Card className="mt-8 border-none shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-stone-600" />
                    <div>
                      <CardTitle className="text-lg text-stone-900">Payment Methods Analysis</CardTitle>
                      <CardDescription>Breakdown of transactions by type</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    {
                      id: "credit_card",
                      label: "Card Payments",
                      icon: CreditCard,
                      color: "bg-blue-500",
                      count: methodAnalysis.credit_card,
                    },
                    {
                      id: "bank_transfer",
                      label: "Bank Transfer",
                      icon: TrendingUp,
                      color: "bg-green-500",
                      count: methodAnalysis.bank_transfer,
                    },
                    {
                      id: "cash_on_delivery",
                      label: "Cash on Delivery",
                      icon: DollarSign,
                      color: "bg-amber-500",
                      count: methodAnalysis.cash_on_delivery,
                    },
                  ].map((meth) => {
                    const totalCount = methodAnalysis.credit_card + methodAnalysis.bank_transfer + methodAnalysis.cash_on_delivery;
                    const totalForPercent = Math.max(totalCount, 1);
                    const percentage = (meth.count / totalForPercent) * 100;
                    return (
                      <div key={meth.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-stone-700">
                            <meth.icon className="w-4 h-4 text-stone-500" />
                            <span className="font-medium">{meth.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-stone-500">{meth.count} orders</span>
                            <span className="font-bold text-stone-900">{percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${meth.color} transition-all duration-700 ease-out`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </>
          )}

        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Button onClick={exportToPDF} disabled={payments.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-stone-600 dark:text-stone-400">
                  Completed Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-stone-900 dark:text-white">
                  ${" "}
                  {stats.totalRevenue.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-600">
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-600">
                  Failed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {stats.failed}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-2">
                    Search by Customer
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                    <Input
                      placeholder=" or john@example.com"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-2">
                    Filter by Status
                  </label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-2">
                    Filter by Method
                  </label>
                  <Select
                    value={methodFilter}
                    onValueChange={(value) => {
                      setMethodFilter(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="bank_transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="cash_on_delivery">
                        Cash on Delivery
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-2">
                    Sort By
                  </label>
                  <div className="flex gap-2">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">Date</SelectItem>
                        <SelectItem value="amount">Amount</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setSortOrder(sortOrder === "desc" ? "asc" : "desc")
                      }
                      title={sortOrder === "desc" ? "Descending" : "Ascending"}
                    >
                      {sortOrder === "desc" ? "↓" : "↑"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
            </div>
          ) : payments.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-stone-600 dark:text-stone-400">
                  No payments found
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-100 dark:bg-stone-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900 dark:text-white">
                        Payment ID
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900 dark:text-white">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900 dark:text-white">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900 dark:text-white">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900 dark:text-white">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900 dark:text-white">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900 dark:text-white">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900 dark:text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="hover:bg-stone-50 dark:hover:bg-stone-900"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-stone-900 dark:text-white">
                          {payment.id.slice(-8)}
                        </td>
                        <td className="px-6 py-4 text-sm text-stone-600 dark:text-stone-400">
                          {payment.order?.id.slice(-8) || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-stone-900 dark:text-white">
                          <div>
                            <p className="font-medium">
                              {[payment.order?.firstName, payment.order?.lastName].filter(Boolean).join(" ") || "N/A"}
                            </p>
                            <p className="text-xs text-stone-500 dark:text-stone-400">
                              {payment.order?.customerEmail || "N/A"}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-stone-600 dark:text-stone-400">
                          {getMethodLabel(payment.method)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-stone-900 dark:text-white">
                          $ {" "}
                          {payment.amount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Badge
                            className={getStatusBadgeColor(payment.status)}
                          >
                            {payment.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-stone-600 dark:text-stone-400">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setOrderDetailPayment(payment);
                              setOrderDetailOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingPayment(payment);
                              statusForm.reset({
                                status:
                                  payment.status as UpdatePaymentInput["status"],
                              });
                              setStatusDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {/* <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeletingPayment(payment)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Payment
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete payment #
                                  {payment.id.slice(-8)}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeletePayment}
                                  disabled={submitting}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {submitting ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog> */}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-stone-600 dark:text-stone-400">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

      </Tabs>

      {/* ── Update Payment Status Dialog ── */}
      <Dialog
        open={statusDialogOpen}
        onOpenChange={(open) => {
          setStatusDialogOpen(open);
          if (!open) {
            setEditingPayment(null);
            statusForm.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment Status</DialogTitle>
            <DialogDescription>
              Change the status for payment #
              {editingPayment?.id.slice(-8)}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={statusForm.handleSubmit(handleUpdateStatus)}
            className="space-y-4"
          >
            <Controller
              name="status"
              control={statusForm.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>New Status</FieldLabel>
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStatusDialogOpen(false);
                  setEditingPayment(null);
                  statusForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Status"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={orderDetailOpen} onOpenChange={setOrderDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order #{orderDetailPayment?.order?.id.slice(-8) || "N/A"}
            </DialogDescription>
          </DialogHeader>
          {orderDetailPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    Customer Name
                  </p>
                  <p className="font-medium text-stone-900 dark:text-white">
                    {[orderDetailPayment.order?.firstName, orderDetailPayment.order?.lastName].filter(Boolean).join(" ") || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    Email
                  </p>
                  <p className="font-medium text-stone-900 dark:text-white">
                    {orderDetailPayment.order?.customerEmail || "N/A"}
                  </p>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    Order Total
                  </p>
                  <p className="font-medium text-stone-900 dark:text-white">
                    ${" "}
                    {orderDetailPayment.order?.totalPrice.toLocaleString(
                      "en-US",
                    ) || "N/A"}
                  </p>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-stone-900 dark:text-white mb-2">
                  Payment Details
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Method</span>
                    <span className="text-stone-900 dark:text-white">
                      {getMethodLabel(orderDetailPayment.method)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Amount</span>
                    <span className="text-stone-900 dark:text-white">
                      $ {orderDetailPayment.amount.toLocaleString("en-US")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Status</span>
                    <Badge
                      className={getStatusBadgeColor(orderDetailPayment.status)}
                    >
                      {orderDetailPayment.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setOrderDetailOpen(false)}
            >
              Close
            </Button>
            {orderDetailPayment && (
              <Button
                onClick={() => downloadReceipt(orderDetailPayment)}
                className="bg-amber-700 hover:bg-amber-800 text-white gap-2"
              >
                <FileDown className="w-4 h-4" />
                Download Receipt
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
