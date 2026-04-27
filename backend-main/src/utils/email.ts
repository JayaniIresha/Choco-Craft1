import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email error:", error);
    throw error;
  }
};

export const sendOrderStatusEmail = (customerEmail: string, status: string) => {
  return sendEmail(
    customerEmail,
    `Order Status Update: ${status}`,
    `<h2>Your order status has been updated to: ${status}</h2>`
  );
};

export const sendLowStockEmail = (supplierId: string, materialName: string) => {
  return sendEmail(
    supplierId,
    `Low Stock Alert: ${materialName}`,
    `<h2>Stock for ${materialName} is running low. Please reorder.</h2>`
  );
};

export const sendLowStockProductEmail = (adminEmail: string, productName: string, currentStock: number) => {
  return sendEmail(
    adminEmail,
    `⚠️ Low Product Stock Alert: ${productName}`,
    `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #d97706;">⚠️ Low Stock Warning</h2>
        <p>The following product is running low on stock:</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 400px;">
          <tr style="background-color: #fef3c7;">
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Product</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${productName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Current Stock</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; color: #dc2626; font-weight: bold;">${currentStock} units</td>
          </tr>
          <tr style="background-color: #fef3c7;">
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Alert Threshold</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">20 units</td>
          </tr>
        </table>
        <p style="margin-top: 16px; color: #6b7280;">Please restock this product at your earliest convenience.</p>
        <p style="color: #6b7280;">— Chocolate ERP System</p>
      </div>
    `
  );
};

