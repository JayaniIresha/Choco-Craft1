"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, CreditCard, Building2, Truck } from "lucide-react";
import { toast } from "sonner";
import { orderApiService } from "@/services/order.service";
import { paymentApiService } from "@/services/payment.service";
import { Order } from "@/types/order.types";
import { Payment } from "@/types/payment.types";
import { CardFormSchema } from "@/validations/payment.validation";
import type { CardFormValues } from "@/validations/payment.validation";

type PaymentMethod = "credit_card" | "bank_transfer" | "cash_on_delivery";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethod>("credit_card");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const cardForm = useForm<CardFormValues>({
    resolver: zodResolver(CardFormSchema),
    mode: "onSubmit",
    defaultValues: {
      cardholderName: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
    },
  });

  useEffect(() => {
    const fetchOrderAndPayment = async () => {
      try {
        setLoading(true);
        const orderData = await orderApiService.getOrderById(orderId);
        setOrder(orderData);

        try {
          const paymentData =
            await paymentApiService.getPaymentByOrderId(orderId);
          setPayment(paymentData);
        } catch {
          // Payment doesn't exist yet
        }
      } catch {
        toast.error("Failed to load order");
        router.push("/my-orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrderAndPayment();
  }, [orderId, router]);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s/g, "");
    if (value.length > 16) value = value.slice(0, 16);
    const formatted = value.replace(/(\d{4})(?=\d)/g, "$1 ");
    cardForm.setValue("cardNumber", formatted);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setImageFile(file);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onCardSubmit = async (_data: CardFormValues) => {
    if (!order) return;
    try {
      setSubmitting(true);
      await paymentApiService.createPayment({
        orderId,
        amount: order.totalPrice,
        method: "credit_card",
        status: "completed",
      });
      toast.success("Payment successful!");
      router.push("/my-orders");
    } catch (error: unknown) {
      toast.error(
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Payment failed",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onBankTransferSubmit = async () => {
    if (!order) return;
    if (!imageFile) {
      toast.error("Please upload payment proof");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("file", imageFile);

      const uploadRes = await fetch("http://localhost:5001/api/files/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.filePath || uploadData.url;

      await paymentApiService.createPayment({
        orderId,
        amount: order.totalPrice,
        method: "bank_transfer",
        status: "pending",
        imageUrl,
      });

      toast.success("Payment proof uploaded. Awaiting verification.");
      router.push("/my-orders");
    } catch (error: unknown) {
      toast.error(
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Upload failed",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onCODSubmit = async () => {
    if (!order) return;
    try {
      setSubmitting(true);
      await paymentApiService.createPayment({
        orderId,
        amount: order.totalPrice,
        method: "cash_on_delivery",
        status: "pending",
      });
      toast.success("Order confirmed. Pay when your delivery arrives.");
      router.push("/my-orders");
    } catch (error: unknown) {
      toast.error(
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to confirm order",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-stone-600 dark:text-stone-400">Order not found</p>
        </CardContent>
      </Card>
    );
  }

  // If payment is already completed/failed
  if (payment && payment.status !== "pending") {
    return (
      <div className="py-8 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge
                className={
                  payment.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }
              >
                {payment.status === "completed"
                  ? "Payment Complete"
                  : "Payment Failed"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-stone-600 dark:text-stone-400">
              {payment.status === "completed"
                ? `Your payment of $${order.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })} was processed successfully.`
                : "Your payment could not be processed."}
            </p>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/my-orders")}>
                View Orders
              </Button>
              {payment.imageUrl && (
                <a
                  href={payment.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View Receipt
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-2xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900 dark:text-white mb-2">
          Payment
        </h1>
        <p className="text-stone-600 dark:text-stone-400">
          Amount due:{" "}
          <span className="font-bold text-lg">
            ${" "}
            {order.totalPrice.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </span>
        </p>
      </div>

      {/* Method Selection */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* Credit Card */}
        <button
          onClick={() => setSelectedMethod("credit_card")}
          className={`p-4 rounded-lg border-2 transition-all ${
            selectedMethod === "credit_card"
              ? "border-amber-600 bg-amber-50 dark:bg-amber-950"
              : "border-stone-200 dark:border-stone-700 hover:border-amber-400"
          }`}
        >
          <CreditCard className="w-6 h-6 mx-auto mb-2 text-amber-600" />
          <p className="text-sm font-medium text-stone-900 dark:text-white">
            Card
          </p>
        </button>

        {/* Bank Transfer */}
        <button
          onClick={() => setSelectedMethod("bank_transfer")}
          className={`p-4 rounded-lg border-2 transition-all ${
            selectedMethod === "bank_transfer"
              ? "border-amber-600 bg-amber-50 dark:bg-amber-950"
              : "border-stone-200 dark:border-stone-700 hover:border-amber-400"
          }`}
        >
          <Building2 className="w-6 h-6 mx-auto mb-2 text-amber-600" />
          <p className="text-sm font-medium text-stone-900 dark:text-white">
            Bank Transfer
          </p>
        </button>

        {/* Cash on Delivery */}
        <button
          onClick={() => setSelectedMethod("cash_on_delivery")}
          className={`p-4 rounded-lg border-2 transition-all ${
            selectedMethod === "cash_on_delivery"
              ? "border-amber-600 bg-amber-50 dark:bg-amber-950"
              : "border-stone-200 dark:border-stone-700 hover:border-amber-400"
          }`}
        >
          <Truck className="w-6 h-6 mx-auto mb-2 text-amber-600" />
          <p className="text-sm font-medium text-stone-900 dark:text-white">
            Cash on Delivery
          </p>
        </button>
      </div>

      {/* Payment Forms */}
      <Card>
        <CardContent className="pt-6">
          {selectedMethod === "credit_card" && (
            <form
              onSubmit={cardForm.handleSubmit(onCardSubmit)}
              className="space-y-4"
            >
              <h3 className="font-semibold text-stone-900 dark:text-white">
                Card Details
              </h3>

              <div>
                <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  {...cardForm.register("cardholderName")}
                  placeholder=""
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {cardForm.formState.errors.cardholderName && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {cardForm.formState.errors.cardholderName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  onChange={handleCardNumberChange}
                  value={cardForm.watch("cardNumber")}
                  maxLength={19}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {cardForm.formState.errors.cardNumber && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {cardForm.formState.errors.cardNumber.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    {...cardForm.register("expiryDate")}
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {cardForm.formState.errors.expiryDate && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {cardForm.formState.errors.expiryDate.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    {...cardForm.register("cvv")}
                    placeholder="123"
                    maxLength={4}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {cardForm.formState.errors.cvv && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {cardForm.formState.errors.cvv.message}
                    </p>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay $${order.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                )}
              </Button>
            </form>
          )}

          {selectedMethod === "bank_transfer" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-stone-900 dark:text-white">
                Upload Payment Proof
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                Transfer ${" "}
                {order.totalPrice.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}{" "}
                to our bank account and upload the payment proof.
              </p>

              <div>
                <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-2">
                  Payment Proof Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-stone-500 dark:text-stone-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-stone-100 dark:file:bg-stone-800
                    file:text-stone-700 dark:file:text-stone-300"
                />
                {imageFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    ✓ {imageFile.name}
                  </p>
                )}
              </div>

              <Button
                onClick={onBankTransferSubmit}
                className="w-full"
                disabled={submitting || !imageFile}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Payment Proof
                  </>
                )}
              </Button>
            </div>
          )}

          {selectedMethod === "cash_on_delivery" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-stone-900 dark:text-white">
                Cash on Delivery
              </h3>
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-md">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  You will pay ${" "}
                  {order.totalPrice.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  when your order arrives. No payment is required now.
                </p>
              </div>

              <Button
                onClick={onCODSubmit}
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  "Confirm Order"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
