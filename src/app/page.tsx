"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { fetchWithCache } from "@/lib/offlineCache";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  DollarSign,
  Users,
  Package,
  ShoppingCart,
  ArrowUpRight,
} from "lucide-react";

const NAVY = "#0b1d3a";
const BLUE = "#1b5ebe";

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await fetchWithCache("/dashboard/stats/", "nexus_cached_stats");
      setStats(data);
    } catch {
      toast.error("Failed to fetch dashboard stats.");
    } finally {
      setLoading(false);
    }
  };

  const stagger: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 26 } },
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-8 animate-pulse">
        <div>
          <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 h-28" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Page heading */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h2>
        <p className="text-sm text-gray-500 mt-0.5">Platform-wide analytics and key metrics.</p>
      </motion.div>

      {/* Metric cards */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        {[
          {
            title: "Total Revenue",
            value: `RWF ${Number(stats?.total_revenue || 0).toLocaleString()}`,
            icon: <DollarSign className="h-5 w-5 text-white" />,
            sub: Number(stats?.total_revenue || 0) > 0 ? "Completed sales" : "No sales recorded yet",
          },
          {
            title: "Active Customers",
            value: Number(stats?.total_customers ?? 0).toLocaleString(),
            icon: <Users className="h-5 w-5 text-white" />,
            sub: Number(stats?.total_customers ?? 0) > 0 ? "Registered clients" : "No customers added yet",
          },
          {
            title: "Total Products",
            value: Number(stats?.total_products ?? 0).toLocaleString(),
            icon: <Package className="h-5 w-5 text-white" />,
            sub: Number(stats?.total_products ?? 0) > 0 ? "In inventory" : "Add products to begin",
          },
          {
            title: "Total Orders",
            value: Number(stats?.total_sales ?? 0).toLocaleString(),
            icon: <ShoppingCart className="h-5 w-5 text-white" />,
            sub: Number(stats?.total_sales ?? 0) > 0 ? "Processed receipts" : "Ready for checkout",
          },
        ].map((card) => (
          <motion.div key={card.title} variants={item}>
            <div
              className="bg-white rounded-lg p-5 flex items-start justify-between"
              style={{ border: "1px solid #e5e7eb" }}
            >
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 tracking-tight">{card.value}</p>
                <p className="text-[11px] font-medium text-gray-500">
                  {card.sub}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: NAVY }}
              >
                {card.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Tables */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2"
      >
        {/* Recent Sales */}
        <motion.div variants={item}>
          <div className="bg-white rounded-lg overflow-hidden" style={{ border: "1px solid #e5e7eb" }}>
            <div
              className="flex items-center justify-between px-5 py-4 border-b cursor-pointer hover:bg-gray-50 transition-colors"
              style={{ borderColor: "#e5e7eb" }}
              onClick={() => router.push("/sales")}
            >
              <p className="font-semibold text-gray-900 text-sm">Recent Sales</p>
              <ArrowUpRight className="w-4 h-4 text-gray-400" />
            </div>
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: "#f3f4f6" }}>
                  <TableHead className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Receipt #</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.recent_sales?.length > 0 ? (
                  stats.recent_sales.map((sale: any) => (
                    <TableRow
                      key={sale.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      style={{ borderColor: "#f9fafb" }}
                      onClick={() => router.push("/sales")}
                    >
                      <TableCell className="text-xs text-gray-400 font-mono">#{sale.id}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-gray-900">{sale.customer_name}</p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(sale.created_at).toLocaleDateString()}
                        </p>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm" style={{ color: "#16a34a" }}>
                        {sale.total_amount} RWF
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10 text-gray-400 text-sm">
                      No sales recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </motion.div>

        {/* Recent Loans */}
        <motion.div variants={item}>
          <div className="bg-white rounded-lg overflow-hidden" style={{ border: "1px solid #e5e7eb" }}>
            <div
              className="flex items-center justify-between px-5 py-4 border-b cursor-pointer hover:bg-gray-50 transition-colors"
              style={{ borderColor: "#e5e7eb" }}
              onClick={() => router.push("/loans")}
            >
              <p className="font-semibold text-gray-900 text-sm">Recent Loans</p>
              <ArrowUpRight className="w-4 h-4 text-gray-400" />
            </div>
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: "#f3f4f6" }}>
                  <TableHead className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Outstanding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.recent_loans?.length > 0 ? (
                  stats.recent_loans.map((loan: any) => (
                    <TableRow
                      key={loan.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      style={{ borderColor: "#f9fafb" }}
                      onClick={() => router.push("/loans")}
                    >
                      <TableCell>
                        <p className="text-sm font-medium text-gray-900">{loan.customer_name}</p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(loan.updated_at).toLocaleDateString()}
                        </p>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm text-red-600">
                        {loan.total_debt} RWF
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-10 text-gray-400 text-sm">
                      No active loans yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      </motion.div>

      <p className="text-center text-xs text-gray-400 pt-4">
        © {new Date().getFullYear()} Ziga POS. All rights reserved.
      </p>
    </div>
  );
}
