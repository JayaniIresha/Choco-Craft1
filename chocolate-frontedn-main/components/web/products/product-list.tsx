"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Product } from "@/validations/product.validation";
import { productApiService } from "@/services/product.service";
import { toast } from "sonner";
import { Pencil, Trash2, FileDown, AlertTriangle, Package, Search, ArrowUpDown } from "lucide-react";
import Image from "next/image";
import { ProductDialog } from "./product-dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type SortField = "name" | "inStockAmount" | "createdAt";
type SortDir = "asc" | "desc";

const LOW_STOCK_THRESHOLD = 20;
const BASE_URL = "http://localhost:5001";

const resolveImageUrl = (url?: string | null) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `${BASE_URL}${url}`;
};

export function ProductList() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [stockFilter, setStockFilter] = useState("all");
    const [sortField, setSortField] = useState<SortField>("createdAt");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    const load = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await productApiService.getProducts(1, 200, search);
            setProducts(data.products);
        } catch {
            toast.error("Failed to load products");
        } finally {
            setIsLoading(false);
        }
    }, [search]);

    useEffect(() => {
        const t = setTimeout(load, 400);
        return () => clearTimeout(t);
    }, [load]);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this product?")) return;
        try {
            await productApiService.softDeleteProduct(id);
            toast.success("Product deleted");
            load();
        } catch {
            toast.error("Failed to delete product");
        }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDir("asc");
        }
    };

    const filteredAndSorted = useMemo(() => {
        let list = products.filter(p => !p.name.toLowerCase().includes("custom chocolate"));

        // Stock filter
        if (stockFilter === "low") list = list.filter(p => (p.inStockAmount ?? 0) < LOW_STOCK_THRESHOLD);
        else if (stockFilter === "ok") list = list.filter(p => (p.inStockAmount ?? 0) >= LOW_STOCK_THRESHOLD);
        else if (stockFilter === "zero") list = list.filter(p => (p.inStockAmount ?? 0) === 0);

        // Sort
        list.sort((a, b) => {
            let aVal: string | number | undefined | null = a[sortField] as string | number | undefined | null;
            let bVal: string | number | undefined | null = b[sortField] as string | number | undefined | null;
            if (typeof aVal === "string") aVal = aVal.toLowerCase();
            if (typeof bVal === "string") bVal = bVal.toLowerCase();
            const finalA = aVal ?? "";
            const finalB = bVal ?? "";
            if (finalA < finalB) return sortDir === "asc" ? -1 : 1;
            if (finalA > finalB) return sortDir === "asc" ? 1 : -1;
            return 0;
        });

        return list;
    }, [products, stockFilter, sortField, sortDir]);

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Product Catalog Report", 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}   Total: ${filteredAndSorted.length} products`, 14, 23);

        autoTable(doc, {
            startY: 30,
            head: [["Product Name", "Description", "In Stock", "Status"]],
            body: filteredAndSorted.map(p => [
                p.name,
                p.description ? p.description.slice(0, 40) + (p.description.length > 40 ? "…" : "") : "—",
                p.inStockAmount ?? 0,
                (p.inStockAmount ?? 0) === 0 ? "Out of Stock"
                    : (p.inStockAmount ?? 0) < LOW_STOCK_THRESHOLD ? "Low Stock"
                        : "In Stock",
            ]),
            theme: "grid",
            styles: { fontSize: 8 },
            headStyles: { fillColor: [217, 119, 6] },
            didParseCell: (data) => {
                if (data.section === "body" && data.column.index === 3) {
                    const val = data.cell.text[0];
                    if (val === "Out of Stock") data.cell.styles.textColor = [220, 38, 38];
                    else if (val === "Low Stock") data.cell.styles.textColor = [217, 119, 6];
                    else data.cell.styles.textColor = [22, 163, 74];
                }
            },
        });

        doc.save("product-catalog.pdf");
        toast.success("PDF exported");
    };

    const getStockBadge = (amount: number) => {
        if (amount === 0)
            return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 gap-1"><AlertTriangle className="h-3 w-3" /> Out of Stock</Badge>;
        if (amount < LOW_STOCK_THRESHOLD)
            return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 gap-1"><AlertTriangle className="h-3 w-3" /> Low Stock ({amount})</Badge>;
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{amount} in stock</Badge>;
    };

    const SortIcon = ({ field }: { field: SortField }) => (
        <ArrowUpDown className={`h-3 w-3 ml-1 inline ${sortField === field ? "text-amber-600" : "text-muted-foreground"}`} />
    );

    const lowStockCount = products.filter(p => (p.inStockAmount ?? 0) < LOW_STOCK_THRESHOLD && (p.inStockAmount ?? 0) > 0).length;
    const outOfStockCount = products.filter(p => (p.inStockAmount ?? 0) === 0).length;

    return (
        <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-600 rounded-lg"><Package className="h-4 w-4 text-white" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground">Total Products</p>
                                <p className="text-2xl font-bold">{products.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500 rounded-lg"><AlertTriangle className="h-4 w-4 text-white" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground">Low Stock</p>
                                <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-red-50 to-red-100">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500 rounded-lg"><AlertTriangle className="h-4 w-4 text-white" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground">Out of Stock</p>
                                <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div>
                        <CardTitle>Products</CardTitle>
                        <CardDescription>Manage your chocolate product catalog.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleExportPDF} variant="outline" className="gap-2">
                            <FileDown className="h-4 w-4" /> Export PDF
                        </Button>
                        <ProductDialog onSuccess={load} />
                    </div>
                </CardHeader>

                <CardContent>
                    {/* Filters row */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search products..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={stockFilter} onValueChange={setStockFilter}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Stock status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Products</SelectItem>
                                <SelectItem value="ok">In Stock</SelectItem>
                                <SelectItem value="low">Low Stock</SelectItem>
                                <SelectItem value="zero">Out of Stock</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead
                                        className="cursor-pointer select-none"
                                        onClick={() => handleSort("name")}
                                    >
                                        Product Name <SortIcon field="name" />
                                    </TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead
                                        className="cursor-pointer select-none"
                                        onClick={() => handleSort("inStockAmount")}
                                    >
                                        Stock <SortIcon field="inStockAmount" />
                                    </TableHead>
                                    <TableHead>Unit Price</TableHead>
                                    <TableHead
                                        className="cursor-pointer select-none"
                                        onClick={() => handleSort("createdAt")}
                                    >
                                        Added <SortIcon field="createdAt" />
                                    </TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">Loading products...</TableCell>
                                    </TableRow>
                                ) : filteredAndSorted.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-32">
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <Package className="h-10 w-10 opacity-30" />
                                                <p className="text-sm">No products found.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredAndSorted.map(product => (
                                    <TableRow key={product.id} className="hover:bg-muted/30">
                                        <TableCell className="relative w-10 h-10">
                                            {resolveImageUrl(product.imageUrl) ? (
                                                <Image
                                                    src={resolveImageUrl(product.imageUrl)!}
                                                    alt={product.name}
                                                    fill
                                                    className="rounded-md object-cover border"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-md bg-amber-100 flex items-center justify-center">
                                                    <Package className="h-5 w-5 text-amber-600" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                                            {product.description || "—"}
                                        </TableCell>
                                        <TableCell>{getStockBadge(product.inStockAmount ?? 0)}</TableCell>
                                        <TableCell className="font-medium text-sm">
                                            ${(product.unitPrice ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "—"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <ProductDialog
                                                    product={product}
                                                    onSuccess={load}
                                                    trigger={
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    }
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-600 hover:bg-red-50"
                                                    onClick={() => product.id && handleDelete(product.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {!isLoading && filteredAndSorted.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2 text-right">
                            Showing {filteredAndSorted.length} of {products.length} products
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
