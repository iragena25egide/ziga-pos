"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import {
  User as UserIcon,
  Mail,
  ShieldCheck,
  Building,
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/users/me/");
        setUser(res.data);
      } catch (err) {
        console.error("Error loading profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-muted-foreground">
        <ShieldAlert className="w-10 h-10 mb-3 opacity-50 text-amber-500" />
        <p className="text-sm font-medium">Could not load profile. Please sign in again.</p>
      </div>
    );
  }

  const storedAvatar =
    typeof window !== "undefined"
      ? localStorage.getItem("user_avatar") ||
        (user?.email ? localStorage.getItem(`user_avatar_${user.email.toLowerCase()}`) : null)
      : null;
  const emailAvatar = user?.email
    ? `https://unavatar.io/${encodeURIComponent(user.email)}?fallback=false`
    : null;
  const avatarUrl = user?.avatar || storedAvatar || emailAvatar;

  const displayName = user.first_name
    ? `${user.first_name} ${user.last_name || ""}`.trim()
    : user.username;
  const roleLabel =
    user.role === "super_admin"
      ? "Super Admin"
      : user.role === "company_admin"
      ? "Company Admin"
      : user.role === "cashier"
      ? "Cashier"
      : user.role || "Admin";

  const companyName = user.company_name || user.company?.name || "Main Workspace";

  return (
    <div className="max-w-xl mx-auto py-3 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-3.5"
      >
        {/* ── Compact Profile Header ── */}
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="relative shrink-0">
            {avatarUrl && !imgError ? (
              <img
                src={avatarUrl}
                alt={displayName}
                onError={() => setImgError(true)}
                className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 shadow-md ring-2 ring-white dark:ring-slate-800"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold uppercase shadow-md border border-white/20"
                style={{ backgroundColor: "#0b1d3a" }}
              >
                {user.first_name?.[0] || user.username?.[0] || "U"}
              </div>
            )}
            <span
              title="Active account"
              className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                {displayName}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
                {roleLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5">@{user.username}</p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Account Active</span>
            </div>
          </div>
        </div>

        {/* ── Compact Account Information Grid ── */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-2xs shrink-0">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Email</p>
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {user.email || "No email"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-2xs shrink-0">
                <Building className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Business / Store</p>
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {companyName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-2xs shrink-0">
                <UserIcon className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Username</p>
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  @{user.username}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-2xs shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Access Level</p>
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {roleLabel}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Team Management Quick Banner (if admin) ── */}
        {(user.is_superuser || user.role === "company_admin" || user.role === "super_admin") && (
          <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white">Team & Roles</p>
                <p className="text-[11px] text-slate-500 truncate">
                  Manage employee accounts and access
                </p>
              </div>
            </div>
            <Link href="/users">
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 px-3 rounded-lg gap-1 shrink-0 font-medium"
              >
                Manage
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
