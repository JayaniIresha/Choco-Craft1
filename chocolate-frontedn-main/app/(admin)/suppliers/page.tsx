import { SupplierList } from "@/components/web/suppliers/supplier-list";

export default function SuppliersPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Suppliers</h2>
      </div>
      <SupplierList />
    </div>
  );
}
