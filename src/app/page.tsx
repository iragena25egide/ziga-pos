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
  Monitor,
  Download,
  Laptop,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Printer,
  WifiOff,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const NAVY = "#0b1d3a";
const BLUE = "#1b5ebe";

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [desktopModalOpen, setDesktopModalOpen] = useState(false);
  const [isDesktopApp, setIsDesktopApp] = useState(false);
  const [userPlatform, setUserPlatform] = useState<"win" | "mac" | "linux">("win");

  useEffect(() => {
    fetchStats();
    if (typeof window !== "undefined") {
      const isElectron =
        navigator.userAgent.toLowerCase().includes("electron") ||
        !!(window as any).process?.versions?.electron ||
        window.location.search.includes("desktop=true");
      setIsDesktopApp(isElectron);

      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes("mac")) {
        setUserPlatform("mac");
      } else if (ua.includes("linux")) {
        setUserPlatform("linux");
      } else {
        setUserPlatform("win");
      }
    }
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

      {/* Desktop App Download Setup Card */}
      {!isDesktopApp && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <Monitor className="w-5 h-5 text-[#1b5ebe]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">
                    Ziga POS Desktop Setup
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    v1.1.0 Ready
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 max-w-xl">
                  Install the official desktop application for high-speed thermal printing, offline local caching, and instant launch.
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-gray-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Printer className="w-3.5 h-3.5 text-emerald-600" /> Thermal Printer Direct
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <WifiOff className="w-3.5 h-3.5 text-emerald-600" /> Offline Auto-Sync
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> Ultra Fast
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
              <a
                href={
                  userPlatform === "mac"
                    ? "https://github.com/iragena25egide/ziga-pos/releases/latest/download/Ziga-POS-1.1.0.dmg"
                    : "https://github.com/iragena25egide/ziga-pos/releases/latest/download/ZigaPOS-Setup-1.1.0.exe"
                }
                download
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-[#1b5ebe] hover:bg-[#154ca0] text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                Download {userPlatform === "mac" ? "for Mac (.dmg)" : "for Windows (.exe)"}
              </a>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setDesktopModalOpen(true)}
                className="flex-1 sm:flex-none text-xs border-gray-200 text-gray-700 hover:bg-gray-50 h-[38px] px-3 font-medium"
              >
                Other Platforms
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* When running on Desktop App */}
      {isDesktopApp && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">Ziga POS Desktop App v1.1.0</span>
            <span className="text-emerald-700 hidden sm:inline">— Hardware accelerated & offline enabled.</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-200/60 rounded text-emerald-800">
            Active
          </span>
        </div>
      )}

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

      {/* ── Desktop Setup Download Modal ── */}
      <Dialog open={desktopModalOpen} onOpenChange={setDesktopModalOpen}>
        <DialogContent className="sm:max-w-md p-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
              <Monitor className="w-4 h-4" /> Official Desktop Release
            </div>
            <DialogTitle className="text-xl font-bold">
              Install Ziga POS Desktop Setup
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-xs text-slate-500 leading-relaxed">
              Choose your operating system to download the standalone installer. The desktop version runs locally and supports ESC/POS thermal printers.
            </p>

            {/* Platform download buttons */}
            <div className="space-y-2">
              <a
                href="https://github.com/iragena25egide/ziga-pos/releases/latest/download/ZigaPOS-Setup-1.1.0.exe"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold group-hover:text-primary transition-colors">
                      Windows Installer (.exe)
                    </p>
                    <p className="text-[11px] text-slate-400">Windows 10 / 11 (64-bit) • Setup v1.1.0</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                  <Download className="w-3.5 h-3.5" /> Download
                </div>
              </a>

              <a
                href="https://github.com/iragena25egide/ziga-pos/releases/latest/download/Ziga-POS-1.1.0.dmg"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold group-hover:text-primary transition-colors">
                      macOS Package (.dmg)
                    </p>
                    <p className="text-[11px] text-slate-400">Apple Silicon & Intel • Setup v1.1.0</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  <Download className="w-3.5 h-3.5" /> Download
                </div>
              </a>

              <a
                href="https://github.com/iragena25egide/ziga-pos/releases/latest/download/Ziga-POS-1.1.0.AppImage"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold group-hover:text-primary transition-colors">
                      Linux AppImage (.AppImage)
                    </p>
                    <p className="text-[11px] text-slate-400">Ubuntu, Debian, Fedora • Universal</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  <Download className="w-3.5 h-3.5" /> Download
                </div>
              </a>
            </div>

            {/* Quick 3-step setup guide */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Easy 3-Step Setup:
              </p>
              <ol className="list-decimal list-inside space-y-0.5 text-[11px]">
                <li>Download the setup file for your OS above.</li>
                <li>Run the installer and follow the quick setup wizard.</li>
                <li>Sign in with your Ziga account or Google to start selling!</li>
              </ol>
            </div>

            <div className="text-center pt-1">
              <a
                href="https://github.com/iragena25egide/ziga-pos/releases"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium"
              >
                View all releases on GitHub
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
