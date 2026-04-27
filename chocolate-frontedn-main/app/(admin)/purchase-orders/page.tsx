import { PurchaseOrderList } from "@/components/web/purchase-orders/purchase-order-list";

export default function PurchaseOrdersPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Purchase Orders</h2>
            </div>
            <PurchaseOrderList />
        </div>
    );
}
