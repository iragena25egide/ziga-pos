"use client";

import React from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  CreditCard,
  FileText,
  Wallet,
  UserCheck,
  UserCircle,
  Trash2,
  Bell,
  Headphones,
  Download,
  ArrowUpRight,
  Monitor,
  Printer,
  WifiOff,
  Zap,
  DollarSign,
} from "lucide-react";

interface OfficialDashboardMockupProps {
  className?: string;
  variant?: "compact" | "full";
}

export default function OfficialDashboardMockup({
  className = "",
  variant = "full",
}: OfficialDashboardMockupProps) {
  const isCompact = variant === "compact";

  return (
    <div
      className={`w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 bg-[#091528] text-slate-100 font-sans select-none ${className}`}
    >
      {/* Window Browser Chrome Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#06101e] border-b border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          <span className="ml-2 font-mono text-[10px] text-slate-400">
            pos.zigga.io/dashboard
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Workspace</span>
        </div>
      </div>

      {/* Main Workspace: Left Nav + Right Content */}
      <div className="flex bg-[#f8fafc] text-slate-800 text-left min-h-[520px]">
        {/* ──────── Dark Blue Official Sidebar ──────── */}
        <aside
          className={`${
            isCompact ? "w-44" : "w-56 md:w-60"
          } shrink-0 bg-[#071731] text-slate-300 flex flex-col justify-between p-3.5 border-r border-[#0e2346]`}
        >
          <div className="space-y-4">
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-1 py-1">
              <div className="w-7 h-7 rounded-lg bg-[#1b5ebe] flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                Z
              </div>
              <div className="leading-none">
                <span className="text-white font-black text-xs tracking-wider">ZIGA POS</span>
                <span className="block text-[8px] font-bold text-blue-300/80 tracking-widest uppercase mt-0.5">
                  PLATFORM
                </span>
              </div>
            </div>

            {/* Navigation Section */}
            <div>
              <p className="px-2 text-[8px] font-bold tracking-wider text-slate-400/90 uppercase mb-1.5">
                NAVIGATION
              </p>
              <nav className="space-y-0.5 text-xs">
                {[
                  { label: "Dashboard", icon: LayoutDashboard, active: true },
                  { label: "Point of Sale", icon: ShoppingCart, active: false },
                  { label: "Customers", icon: Users, active: false },
                  { label: "Products", icon: Package, active: false },
                  { label: "Loans", icon: CreditCard, active: false },
                  { label: "Payments", icon: Wallet, active: false },
                  { label: "Reports", icon: FileText, active: false },
                  { label: "Balance", icon: FileText, active: false },
                  { label: "Team & Roles", icon: UserCheck, active: false },
                  { label: "My Profile", icon: UserCircle, active: false },
                  { label: "Recycle Bin", icon: Trash2, active: false },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-default ${
                      item.active
                        ? "bg-[#14284b] text-white font-semibold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <item.icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          item.active ? "text-[#3b82f6]" : "text-slate-400"
                        }`}
                      />
                      <span className="truncate text-[11px]">{item.label}</span>
                    </div>
                    {item.active && (
                      <div className="w-1 h-3.5 bg-[#3b82f6] rounded-full" />
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>

          {/* Bottom Sidebar: Support & Online Indicator */}
          <div className="pt-3 border-t border-[#0e2346] space-y-2">
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#0e2244] border border-[#17325f] text-slate-200">
              <div className="flex items-center gap-2">
                <Headphones className="w-3.5 h-3.5 text-[#3b82f6]" />
                <span className="text-[10px] font-medium">Support & Help</span>
              </div>
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                1
              </span>
            </div>
            <div className="flex items-center gap-2 px-2 text-[10px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Online</span>
            </div>
          </div>
        </aside>

        {/* ──────── Content Area ──────── */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
          {/* Top Header */}
          <header className="h-12 bg-white border-b border-slate-200 px-5 flex items-center justify-between shrink-0">
            <div>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">WORKSPACE</p>
              <h1 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">Dashboard</h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-white border border-slate-200 shadow-2xs">
                <div className="w-6 h-6 rounded-full bg-[#1b5ebe] text-white flex items-center justify-center text-[10px] font-bold">
                  K
                </div>
                <div className="text-left leading-none">
                  <p className="text-[10px] font-bold text-slate-900">Kigali Supermart</p>
                  <p className="text-[8px] font-medium text-slate-400 uppercase mt-0.5">COMPANY_ADMIN</p>
                </div>
              </div>
            </div>
          </header>

          {/* Body Content */}
          <div className="p-4 sm:p-5 space-y-4 overflow-hidden">
            {/* Title */}
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Dashboard Overview</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Platform-wide analytics and key metrics.
              </p>
            </div>

            {/* Desktop Setup Banner */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1b5ebe] shrink-0">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">Ziga POS Desktop Setup</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      v1.1.0 Ready
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 max-w-xl">
                    Install official desktop application for high-speed thermal printing, offline local caching, and instant launch.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <Printer className="w-3.5 h-3.5 text-emerald-600" /> Thermal Direct
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-700">
                      <WifiOff className="w-3.5 h-3.5 text-emerald-600" /> Offline Auto-Sync
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-amber-600">
                      <Zap className="w-3.5 h-3.5 text-amber-500" /> Ultra Fast
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div className="flex-1 md:flex-none px-3.5 py-2 rounded-lg bg-[#1b5ebe] text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-xs">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download for Mac (.dmg)</span>
                </div>
                <div className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-medium bg-white">
                  Other Platforms
                </div>
              </div>
            </div>

            {/* 4 Analytics Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  title: "TOTAL REVENUE",
                  value: "RWF 3,850,000",
                  sub: "Completed sales",
                  icon: <DollarSign className="w-4 h-4 text-white" />,
                },
                {
                  title: "ACTIVE CUSTOMERS",
                  value: "42",
                  sub: "Registered clients",
                  icon: <Users className="w-4 h-4 text-white" />,
                },
                {
                  title: "TOTAL PRODUCTS",
                  value: "186",
                  sub: "In inventory",
                  icon: <Package className="w-4 h-4 text-white" />,
                },
                {
                  title: "TOTAL ORDERS",
                  value: "124",
                  sub: "Processed receipts",
                  icon: <ShoppingCart className="w-4 h-4 text-white" />,
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-start justify-between shadow-2xs"
                >
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">
                      {card.title}
                    </p>
                    <p className="text-base sm:text-lg font-extrabold text-slate-900">
                      {card.value}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {card.sub}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-[#071731] flex items-center justify-center shrink-0 shadow-xs">
                    {card.icon}
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Sales & Recent Loans Side-by-Side Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Recent Sales Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <span className="text-xs sm:text-sm font-bold text-slate-900">Recent Sales</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="px-3.5 py-2">RECEIPT #</th>
                      <th className="px-3.5 py-2">CUSTOMER</th>
                      <th className="px-3.5 py-2 text-right">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {[
                      { id: "#128", customer: "Mugisha Eric", date: "10/8/2026", amount: "450,000.00 RWF" },
                      { id: "#127", customer: "Keza Diane", date: "10/8/2026", amount: "185,500.00 RWF" },
                      { id: "#126", customer: "Gasana Alexis", date: "10/8/2026", amount: "920,000.00 RWF" },
                    ].map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-3.5 py-2.5 font-mono text-slate-400 text-[10px] whitespace-nowrap">
                          {row.id}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <p className="font-semibold text-slate-800 text-xs">{row.customer}</p>
                          <p className="text-[9px] text-slate-400">{row.date}</p>
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-emerald-600 text-xs whitespace-nowrap">
                          {row.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Recent Loans Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <span className="text-xs sm:text-sm font-bold text-slate-900">Recent Loans</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="px-3.5 py-2">CUSTOMER</th>
                      <th className="px-3.5 py-2 text-right">OUTSTANDING</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {[
                      { customer: "Mutabazi Patrick", date: "10/8/2026", amount: "150,000.00 RWF" },
                      { customer: "Umutoni Sandrine", date: "10/8/2026", amount: "85,000.00 RWF" },
                      { customer: "Habimana Claude", date: "10/8/2026", amount: "420,000.00 RWF" },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-3.5 py-2.5">
                          <p className="font-semibold text-slate-800 text-xs">{row.customer}</p>
                          <p className="text-[9px] text-slate-400">{row.date}</p>
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-rose-600 text-xs whitespace-nowrap">
                          {row.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Notice */}
            <p className="text-center text-[10px] text-slate-400 pt-1">
              © 2026 Ziga POS. All rights reserved.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
