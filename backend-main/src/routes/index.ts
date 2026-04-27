import express from "express";
import authRoutes from "../modules/auth/auth.routes";
import uploadRoutes from "../modules/upload/upload.routes";
import inventoryRoutes from "../modules/inventory/inventory.routes";
import supplierRoutes from "../modules/supplier/supplier.routes";
import purchaseOrderRoutes from "../modules/supplier/purchaseOrder.routes";
import productionRoutes from "../modules/production/production.routes";
import recipeRoutes from "../modules/production/recipe.routes";
import productRoutes from "../modules/product/product.routes";
import orderRoutes from "../modules/order/order.routes";
import paymentRoutes from "../modules/payment/payment.routes";
import deliveryRoutes from "../modules/delivery/delivery.routes";
import reviewRoutes from "../modules/review/review.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import customerRoutes from "../modules/customer/customer.routes";
import expenseRoutes from "../modules/expense/expense.routes";

const router = express.Router();


router.get("/", (req, res) => {
  res.json({ message: "Chocolate ERP Backend API" });
});

// Auth routes
router.use("/auth", authRoutes);

// File upload routes
router.use("/files", uploadRoutes);

router.use("/inventory", inventoryRoutes);

// Supplier routes
router.use("/suppliers", supplierRoutes);
router.use("/purchase-orders", purchaseOrderRoutes);


// Product routes
router.use("/products", productRoutes);

// Order routes
router.use("/orders", orderRoutes);

// Payment routes
router.use("/payments", paymentRoutes);

// Review routes
router.use("/reviews", reviewRoutes);

// Expense routes
router.use("/expenses", expenseRoutes);

// Finance routes (placeholder - uses expenses module)
router.use("/finance", expenseRoutes);



// Delivery routes
router.use("/deliveries", deliveryRoutes);

// Production routes
router.use("/production", productionRoutes);
router.use("/recipes", recipeRoutes);

// Dashboard routes
router.use("/dashboard", dashboardRoutes);

// Customer routes
router.use("/customers", customerRoutes);





export default router;
