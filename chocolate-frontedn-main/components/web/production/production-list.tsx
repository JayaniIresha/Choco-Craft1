"use client";

import { useState, useEffect, useCallback } from "react";
import { Production } from "@/validations/production.validation";
import { productionService } from "@/services/production.service";
import { toast } from "sonner";
import { FileDown, Clock, PlayCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { ProductionDialog } from "./production-dialog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_TRANSITIONS: Record<string, { next: "InProgress" | "Completed"; label: string }> = {
    Planned: { next: "InProgress", label: "Start Production" },
    InProgress: { next: "Completed", label: "Mark Completed" },
};

export function ProductionList() {
    const [productions, setProductions] = useState<Production[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("All");

    const load = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await productionService.getProductions(1, 100, statusFilter === "All" ? undefined : statusFilter);
            setProductions(data.productions);
        } catch {
            toast.error("Failed to load production orders");
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => { load(); }, [load]);

    const updateStatus = async (id: string, status: "Planned" | "InProgress" | "Completed") => {
        try {
            await productionService.updateProduction(id, { status });
            toast.success(`Status updated to ${status}`);
            load();
        } catch {
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this production order?")) return;
        try {
            await productionService.softDeleteProduction(id);
            toast.success("Production order deleted");
            load();
        } catch {
            toast.error("Failed to delete");
        }
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text("Production Orders Report", 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);

        autoTable(doc, {
            startY: 30,
            head: [["ID", "Order ID", "Status", "Created"]],
            body: productions.map((p) => [
                p.id?.slice(-6).toUpperCase() ?? "—",
                p.orderId.slice(-8),
                p.status,
                p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—",
            ]),
            theme: "grid",
            styles: { fontSize: 8 },
            headStyles: { fillColor: [217, 119, 6] },
        });

        doc.save("production-report.pdf");
        toast.success("PDF exported");
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Planned": return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 flex gap-1 items-center"><Clock className="w-3 h-3" /> Planned</Badge>;
            case "InProgress": return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 flex gap-1 items-center"><PlayCircle className="w-3 h-3" /> In Progress</Badge>;
            case "Completed": return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 flex gap-1 items-center"><CheckCircle2 className="w-3 h-3" /> Completed</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                    <CardTitle>Production Orders</CardTitle>
                    <CardDescription>Track and manage chocolate production runs.</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleExportPDF} variant="outline" className="gap-2">
                        <FileDown className="h-4 w-4" /> Export PDF
                    </Button>
                    <ProductionDialog onSuccess={load} />
                </div>
            </CardHeader>

            <CardContent>
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-medium text-muted-foreground">Status:</span>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Orders</SelectItem>
                            <SelectItem value="Planned">Planned</SelectItem>
                            <SelectItem value="InProgress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>ID</TableHead>
                                <TableHead>Order Ref</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5} className="text-center h-24">Loading...</TableCell></TableRow>
                            ) : productions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <ShieldAlert className="h-8 w-8 opacity-40" />
                                            No production orders found.
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                productions.map((prod) => (
                                    <TableRow key={prod.id} className="hover:bg-muted/30">
                                        <TableCell className="font-mono text-xs">{prod.id?.slice(-6).toUpperCase()}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground font-mono">{prod.orderId.slice(-8)}</TableCell>
                                        <TableCell>{getStatusBadge(prod.status)}</TableCell>
                                        <TableCell className="text-sm">{prod.createdAt ? new Date(prod.createdAt).toLocaleDateString() : "—"}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {STATUS_TRANSITIONS[prod.status] && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className={prod.status === "Planned"
                                                            ? "text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                                                            : "text-xs bg-green-50 text-green-700 hover:bg-green-100 border-green-200"}
                                                        onClick={() => prod.id && updateStatus(prod.id, STATUS_TRANSITIONS[prod.status].next)}
                                                    >
                                                        {STATUS_TRANSITIONS[prod.status].label}
                                                    </Button>
                                                )}
                                                {prod.status === "Planned" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-600 hover:bg-red-50"
                                                        onClick={() => prod.id && handleDelete(prod.id)}
                                                    >
                                                        <span className="sr-only">Delete</span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                    </Button>
                                                )}
                                            </div>
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
