"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "motion/react";

import {
  RegisterSchema,
  type RegisterInput,
} from "@/validations/auth.validation";
import { authService } from "@/services/auth.service";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Field, FieldLabel, FieldError } from "@/components/ui/field";

export default function ClientRegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "customer",
    },
  });

  async function onSubmit(data: RegisterInput) {
    try {
      setIsLoading(true);
      await authService.register(data);
      toast.success("Account created successfully!");
      router.push("/profile");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Registration failed");
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
            <h2 className="text-4xl font-bold mb-4">Join the family</h2>
            <p className="text-amber-100 text-lg mb-8">
              Discover the world of fine chocolate
            </p>
            <ul className="space-y-4 text-amber-100">
              <li className="flex items-start gap-3">
                <span className="text-amber-300 font-bold">•</span>
                <span>Access exclusive chocolate collections</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-300 font-bold">•</span>
                <span>Get early access to new products</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-300 font-bold">•</span>
                <span>Earn rewards on every purchase</span>
              </li>
            </ul>
          </div>
          <div className="text-amber-200 text-sm">
            <p className="italic">
              &quot;Every moment is a chance to savor something special.&quot;
            </p>
          </div>
        </div>

        {/* Form Panel */}
        <div className="flex-1 p-8 md:p-10">
          <motion.div
            className="max-w-sm mx-auto"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } },
            }}
          >
            <motion.h1
              className="text-3xl font-bold mb-2"
              custom={0}
              variants={itemVariants}
            >
              Create Account
            </motion.h1>
            <motion.p
              className="text-muted-foreground mb-6"
              custom={1}
              variants={itemVariants}
            >
              Join us and start your chocolate journey
            </motion.p>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <motion.div custom={2} variants={itemVariants}>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Full Name</FieldLabel>
                      <Input
                        type="text"
                        placeholder=""
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

              <motion.div custom={3} variants={itemVariants}>
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

              <motion.div custom={4} variants={itemVariants}>
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Password</FieldLabel>
                      <Input
                        type="password"
                        placeholder="••••••••"
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

              <motion.div
                custom={5}
                variants={itemVariants}
                whileTap={{ scale: 0.97 }}
              >
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </motion.div>
            </form>

            <motion.div className="mt-8" custom={6} variants={itemVariants}>
              <p className="text-center text-sm">
                Already have an account?{" "}
                <Link
                  href="/client/login"
                  className="font-semibold text-primary hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
