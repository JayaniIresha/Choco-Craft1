"use client";

import { useState, useEffect, useCallback } from "react";
import { PurchaseOrder } from "@/validations/purchaseOrder.validation";
import { purchaseOrderService } from "@/services/purchaseOrder.service";
import { toast } from "sonner";
import { PurchaseOrderDialog } from "./purchase-order-dialog";
import { FileDown, CheckCircle, Clock, Truck, ShieldAlert, Pencil, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export function PurchaseOrderList() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("All");

    const loadOrders = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await purchaseOrderService.getPurchaseOrders(1, 100, statusFilter);
            setOrders(data.orders);
        } catch {
            toast.error("Failed to load purchase orders");
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    // Handle PDF Export
    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text("Purchase Orders Report", 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);
        doc.text(`Filtered by status: ${statusFilter}`, 14, 28);

        const tableData = orders.map((o) => [
            o.id?.slice(-6) || "N/A",
            "Supplier ID: " + o.supplierId.slice(-6),
            "Material ID: " + o.materialId.slice(-6),
            o.quantity.toString(),
            o.status,
            new Date(o.createdAt || Date.now()).toLocaleDateString()
        ]);

        autoTable(doc, {
            startY: 35,
            head: [["Order ID", "Supplier", "Material", "Qty", "Status", "Date created"]],
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [217, 119, 6] } // amber-600
        });

        doc.save("purchase-orders-report.pdf");
        toast.success("PDF generated successfully");
    };

    const updateStatus = async (id: string, newStatus: "Pending" | "Approved" | "Delivered") => {
        try {
            await purchaseOrderService.updatePurchaseOrder(id, { status: newStatus });
            toast.success(`Order marked as ${newStatus}`);
            loadOrders(); // Refresh table
        } catch {
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this purchase order?")) {
            try {
                await purchaseOrderService.softDeletePurchaseOrder(id);
                toast.success("Purchase order deleted successfully");
                loadOrders();
            } catch {
                toast.error("Failed to delete purchase order");
            }
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Pending":
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 flex gap-1 items-center"><Clock className="w-3 h-3" /> Pending</Badge>;
            case "Approved":
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 flex gap-1 items-center"><CheckCircle className="w-3 h-3" /> Approved</Badge>;
            case "Delivered":
                return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 flex gap-1 items-center"><Truck className="w-3 h-3" /> Delivered</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    return (
        <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                    <CardTitle>Purchase Orders</CardTitle>
                    <CardDescription>Track automated and manual restock orders.</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleExportPDF} variant="outline" className="gap-2">
                        <FileDown className="h-4 w-4" />
                        Export PDF
                    </Button>
                    <PurchaseOrderDialog onSuccess={loadOrders} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filter Status:</span>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Orders</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Approved">Approved</SelectItem>
                                <SelectItem value="Delivered">Delivered</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>Order ID</TableHead>
                                <TableHead>Supplier Ref</TableHead>
                                <TableHead>Material Ref</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead>Date Created</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">
                                        Loading purchase orders...
                                    </TableCell>
                                </TableRow>
                            ) : orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground flex flex-col justify-center items-center gap-2">
                                        <ShieldAlert className="h-8 w-8 text-muted-foreground/50" />
                                        No purchase orders found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => (
                                    <TableRow key={order.id} className="hover:bg-muted/30">
                                        <TableCell className="font-mono text-xs">{order.id?.slice(-6).toUpperCase()}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">ID: {order.supplierId.slice(-6)}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">ID: {order.materialId.slice(-6)}</TableCell>
                                        <TableCell className="text-right font-medium">{order.quantity}</TableCell>
                                        <TableCell>{new Date(order.createdAt || "").toLocaleDateString()}</TableCell>
                                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                                        <TableCell className="text-right flex items-center justify-end gap-2">
                                            {order.status === "Pending" && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                                                    onClick={() => order.id && updateStatus(order.id, "Approved")}
                                                >
                                                    Approve
                                                </Button>
                                            )}
                                            {order.status === "Approved" && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-xs bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                                                    onClick={() => order.id && updateStatus(order.id, "Delivered")}
                                                >
                                                    Mark Delivered
                                                </Button>
                                            )}
                                            <PurchaseOrderDialog
                                                order={order}
                                                onSuccess={loadOrders}
                                                trigger={
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                }
                                            />
                                            {order.status === "Pending" && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => order.id && handleDelete(order.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
