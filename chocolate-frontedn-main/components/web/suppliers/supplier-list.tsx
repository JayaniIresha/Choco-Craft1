"use client";

import { useState, useEffect, useCallback } from "react";
import { Supplier } from "@/validations/supplier.validation";
import { supplierService } from "@/services/supplier.service";
import { toast } from "sonner";
import { Search, FileDown, Pencil, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SupplierDialog } from "./supplier-dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export function SupplierList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Supplier;
    direction: "asc" | "desc";
  } | null>(null);

  // Fetch data
  const loadSuppliers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await supplierService.getSuppliers(1, 100, searchQuery); // For simplicity, loading up to 100
      setSuppliers(data.suppliers);
    } catch {
      toast.error("Failed to load suppliers");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadSuppliers();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [loadSuppliers]);

  // Handle PDF Export
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Supplier Directory Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableData = sortedSuppliers.map((s) => [
      s.name,
      s.email,
      s.phone,
      s.address,
    ]);

    autoTable(doc, {
      startY: 30,
      head: [["Name", "Email", "Phone", "Address"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [217, 119, 6] }, // amber-600
    });

    doc.save("suppliers-report.pdf");
    toast.success("PDF generated successfully");
  };

  // Delete handler
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      try {
        await supplierService.hardDeleteSupplier(id);
        toast.success("Supplier deleted successfully");
        loadSuppliers();
      } catch {
        toast.error("Failed to delete supplier");
      }
    }
  };

  // Sorting logic
  const handleSort = (key: keyof Supplier) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedSuppliers = [...suppliers].sort((a, b) => {
    if (!sortConfig) return 0;

    // Fallback strings to ensure safe comparison
    const valA = (a[sortConfig.key] || "").toString().toLowerCase();
    const valB = (b[sortConfig.key] || "").toString().toLowerCase();

    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle>Supplier Directory</CardTitle>
          <CardDescription>
            Manage your trusted raw material providers.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportPDF} variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" />
            Export PDF
          </Button>
          <SupplierDialog onSuccess={loadSuppliers} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead
                  className="cursor-pointer hover:text-amber-600"
                  onClick={() => handleSort("name")}
                >
                  Name{" "}
                  {sortConfig?.key === "name" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-amber-600"
                  onClick={() => handleSort("email")}
                >
                  Email{" "}
                  {sortConfig?.key === "email" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Loading suppliers...
                  </TableCell>
                </TableRow>
              ) : sortedSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center h-24 text-muted-foreground"
                  >
                    No suppliers found. Try adjusting your search.
                  </TableCell>
                </TableRow>
              ) : (
                sortedSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      {supplier.name}
                    </TableCell>
                    <TableCell>{supplier.email}</TableCell>
                    <TableCell>{supplier.phone}</TableCell>
                    <TableCell
                      className="max-w-[200px] truncate"
                      title={supplier.address}
                    >
                      {supplier.address}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <SupplierDialog
                          supplier={supplier}
                          onSuccess={loadSuppliers}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() =>
                            supplier.id && handleDelete(supplier.id)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
