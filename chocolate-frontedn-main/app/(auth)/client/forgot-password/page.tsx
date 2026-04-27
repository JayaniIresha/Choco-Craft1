"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "motion/react";

import { ForgotPasswordSchema, type ForgotPasswordInput } from "@/validations/auth.validation";
import { authService } from "@/services/auth.service";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Field, FieldLabel, FieldError } from "@/components/ui/field";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotPasswordInput) {
    try {
      setIsLoading(true);
      await authService.forgotPassword(data.email);
      setSubmitted(true);
      toast.success("Check your email for reset instructions");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.96, y: 24 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -8 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.07, duration: 0.3 },
    }),
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950 dark:via-amber-900 dark:to-rose-950">
      <motion.div
        className="w-full max-w-4xl overflow-hidden rounded-2xl shadow-2xl flex bg-white dark:bg-card"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Brand Panel */}
        <div className="hidden md:flex w-2/5 flex-col justify-between bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 text-white p-10">
          <div>
            <h2 className="text-4xl font-bold mb-4">Reset your access</h2>
            <p className="text-amber-100 text-lg mb-8">Secure account recovery</p>
            <ul className="space-y-4 text-amber-100">
              <li className="flex items-start gap-3">
                <span className="text-amber-300 font-bold">•</span>
                <span>Your account security is our priority</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-300 font-bold">•</span>
                <span>We&apos;ll send you a secure password reset link</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-300 font-bold">•</span>
                <span>The link expires in 24 hours</span>
              </li>
            </ul>
          </div>
          <div className="text-amber-200 text-sm">
            <p className="italic">&quot;We&apos;re here to help you get back on track.&quot;</p>
          </div>
        </div>

        {/* Content Panel */}
        <div className="flex-1 p-8 md:p-10">
          <motion.div
            className="max-w-sm mx-auto"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } },
            }}
          >
            {submitted ? (
              <>
                <motion.div className="text-center" custom={0} variants={itemVariants}>
                  <motion.div
                    className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"
                    animate={{ scale: [0.8, 1.1, 1] }}
                    transition={{ duration: 0.5 }}
                  >
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                  <h1 className="text-3xl font-bold mb-2">Check your email</h1>
                </motion.div>

                <motion.div className="space-y-4" custom={1} variants={itemVariants}>
                  <p className="text-center text-sm text-muted-foreground">
                    We&apos;ve sent a password reset link to your email address. Please check your inbox and follow the
                    instructions.
                  </p>
                  <p className="text-center text-sm text-muted-foreground">
                    Didn&apos;t receive an email? Check your spam folder or try again.
                  </p>
                </motion.div>

                <motion.div className="mt-8" custom={2} variants={itemVariants}>
                  <Link
                    href="/client/login"
                    className="block text-center text-sm font-semibold text-primary hover:underline"
                  >
                    Back to login
                  </Link>
                </motion.div>
              </>
            ) : (
              <>
                <motion.h1 className="text-3xl font-bold mb-2" custom={0} variants={itemVariants}>
                  Reset Password
                </motion.h1>
                <motion.p className="text-muted-foreground mb-6" custom={1} variants={itemVariants}>
                  Enter your email to receive a reset link
                </motion.p>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <motion.div custom={2} variants={itemVariants}>
                    <Controller
                      name="email"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel>Email</FieldLabel>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            aria-invalid={fieldState.invalid}
                            {...field}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </motion.div>

                  <motion.div custom={3} variants={itemVariants} whileTap={{ scale: 0.97 }}>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Sending..." : "Send reset link"}
                    </Button>
                  </motion.div>
                </form>

                <motion.div className="mt-8" custom={4} variants={itemVariants}>
                  <Link
                    href="/client/login"
                    className="block text-center text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Back to login
                  </Link>
                </motion.div>
              </>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
