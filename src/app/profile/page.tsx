"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, ShieldAlert, Building, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="flex h-full items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <ShieldAlert className="w-12 h-12 mb-4 opacity-50" />
        <p>Could not load profile. Are you logged in?</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-8 mt-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-6 mb-8"
      >
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary text-4xl font-bold uppercase shadow-xl border border-primary/30">
          {user.first_name?.[0] || user.username[0]}
        </div>
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            {user.first_name ? `${user.first_name} ${user.last_name}`.trim() : user.username}
          </h1>
          <p className="text-xl text-muted-foreground capitalize mt-1 flex items-center gap-2">
            <Building className="w-5 h-5" />
            Role: {user.role || "Admin"}
          </p>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass overflow-hidden">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-background/50 border border-border/50">
              <div className="p-3 bg-background rounded-full">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="text-lg font-medium">@{user.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-background/50 border border-border/50">
              <div className="p-3 bg-background rounded-full">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email Address</p>
                <p className="text-lg font-medium">{user.email || "No email provided"}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-background/50 border border-border/50">
              <div className="p-3 bg-background rounded-full">
                <ShieldAlert className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account Status</p>
                <p className="text-lg font-medium text-emerald-400">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass overflow-hidden mt-6 border-indigo-200 shadow-sm shadow-indigo-100">
          <CardHeader className="bg-indigo-50/50 pb-4 border-b border-indigo-100">
            <CardTitle className="text-indigo-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> Team Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm text-slate-600 mb-4">
              As an administrator, you can create and manage user accounts for your company, assign roles (like Manager or Staff), and revoke access.
            </p>
            <Link href="/users">
              <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-semibold">
                <ShieldAlert className="w-4 h-4" /> Manage Users & Roles
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
