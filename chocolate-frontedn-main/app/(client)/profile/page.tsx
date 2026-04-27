"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "motion/react";
import {
  ArrowLeft,
  LogOut,
  Trash2,
  ShoppingBag,
  Star,
  Shield,
  CalendarDays,
  ChevronRight,
  Loader2,
  Settings,
} from "lucide-react";

import {
  UpdateProfileSchema,
  type UpdateProfileInput,
} from "@/validations/auth.validation";
import { authService } from "@/services/auth.service";
import type { User as UserType } from "@/types/auth.types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const fade = {
  hidden: { opacity: 0, y: 12 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35 },
  }),
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: { name: "", email: "" },
  });

  useEffect(() => {
    (async () => {
      try {
        const profile = await authService.getProfile();
        setUser(profile);
        form.reset({ name: profile.name, email: profile.email });
      } catch (error: unknown) {
        const err = error as { response?: { data?: { error?: string } } };
        toast.error(err?.response?.data?.error || "Failed to load profile");
        router.push("/client/login");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [form, router]);

  async function onSubmit(data: UpdateProfileInput) {
    try {
      setIsSaving(true);
      await authService.updateProfile(data);
      toast.success("Profile updated!");
      const profile = await authService.getProfile();
      setUser(profile);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAccount() {
    try {
      setIsDeleting(true);
      await authService.deleteAccount();
    } finally {
      authService.logout();
      toast.success("Account deleted.");
      router.push("/client/login");
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#faf8f5" }}
      >
        <Loader2
          className="h-8 w-8 animate-spin"
          style={{ color: "#7c4a1e" }}
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #faf8f5 0%, #f5ede0 50%, #faf7f2 100%)",
      }}
    >
      {/* Top nav bar */}
      <div
        className="sticky top-0 z-20 border-b border-stone-200/60 backdrop-blur-sm"
        style={{ background: "rgba(250,248,245,0.9)" }}
      >
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </button>
          <span className="text-sm font-semibold" style={{ color: "#5c3317" }}>
            My Account
          </span>
          <button
            onClick={() => {
              authService.logout();
              toast.success("Logged out");
              router.push("/client/login");
            }}
            className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {/* Profile Hero */}
        <motion.div variants={fade} initial="hidden" animate="show" custom={0}>
          <div
            className="rounded-2xl p-6 flex items-center gap-5"
            style={{
              background:
                "linear-gradient(135deg, #3d1a0a 0%, #6b3318 60%, #8b4513 100%)",
            }}
          >
            {/* Avatar */}
            <div
              className="shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-xl"
              style={{
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(8px)",
                border: "1.5px solid rgba(255,255,255,0.25)",
              }}
            >
              {user && getInitials(user.name)}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white truncate">
                {user?.name}
              </h1>
              <p
                className="text-sm mt-0.5 truncate"
                style={{ color: "rgba(255,255,255,0.65)" }}
              >
                {user?.email}
              </p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    color: "#fcd5a0",
                  }}
                >
                  <Shield className="h-3 w-3" />
                  {user?.role || "customer"}
                </span>
                <span
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  <CalendarDays className="h-3 w-3" />
                  Since{" "}
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={fade} initial="hidden" animate="show" custom={1}>
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2 px-1">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: ShoppingBag,
                label: "My Orders",
                sub: "View order history",
                href: "/my-orders",
                color: "#7c4a1e",
              },
              {
                icon: Star,
                label: "My Reviews",
                sub: "Ratings & feedback",
                href: "/my-reviews",
                color: "#b05c2a",
              },
            ].map((action, i) => (
              <motion.button
                key={action.href}
                variants={fade}
                initial="hidden"
                animate="show"
                custom={1.5 + i * 0.5}
                onClick={() => router.push(action.href)}
                className="group bg-white rounded-xl p-4 text-left border border-stone-200 hover:border-amber-300 hover:shadow-md transition-all duration-200"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110"
                  style={{ background: `${action.color}18` }}
                >
                  <action.icon
                    className="h-5 w-5"
                    style={{ color: action.color }}
                  />
                </div>
                <p className="text-sm font-semibold text-stone-800">
                  {action.label}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">{action.sub}</p>
                <div className="flex justify-end mt-1">
                  <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Edit Profile */}
        <motion.div variants={fade} initial="hidden" animate="show" custom={3}>
          <Card className="border border-stone-200 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "#f5ece0" }}
                >
                  <Settings
                    className="h-3.5 w-3.5"
                    style={{ color: "#7c4a1e" }}
                  />
                </div>
                <div>
                  <CardTitle className="text-sm">
                    Personal Information
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Update your profile details
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-3"
              >
                <Field>
                  <FieldLabel className="text-xs font-medium text-stone-600">
                    Full Name
                  </FieldLabel>
                  <Input
                    placeholder=""
                    {...form.register("name")}
                    className="bg-stone-50 border-stone-200 text-sm"
                  />
                  {form.formState.errors.name && (
                    <FieldError>
                      {form.formState.errors.name.message}
                    </FieldError>
                  )}
                </Field>
                <Field>
                  <FieldLabel className="text-xs font-medium text-stone-600">
                    Email
                  </FieldLabel>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    {...form.register("email")}
                    className="bg-stone-50 border-stone-200 text-sm"
                  />
                  {form.formState.errors.email && (
                    <FieldError>
                      {form.formState.errors.email.message}
                    </FieldError>
                  )}
                </Field>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full text-white text-sm mt-1"
                  style={{ background: "#7c4a1e" }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          variants={fade}
          initial="hidden"
          animate="show"
          custom={4}
          className="pb-8"
        >
          <Card className="border border-red-100 shadow-sm rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-700">
                Danger Zone
              </CardTitle>
              <CardDescription className="text-xs">
                These actions are permanent and cannot be reversed
              </CardDescription>
            </CardHeader>
            <Separator className="mb-4" />
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-stone-800">
                    Delete Account
                  </p>
                  <p className="text-xs text-stone-400">
                    Removes all your data permanently
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="shrink-0 gap-1.5 text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your account, orders,
                        reviews and all personal data.
                        <strong className="block mt-2 text-red-600">
                          This action cannot be undone.
                        </strong>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {isDeleting ? "Deleting..." : "Yes, delete my account"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
