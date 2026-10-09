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
}

export default function OfficialDashboardMockup({
  className = "",
}: OfficialDashboardMockupProps) {
  return (
    <div
      className={`w-full rounded-xl overflow-hidden shadow-2xl border border-slate-700/80 bg-[#091528] text-slate-100 font-sans select-none ${className}`}
    >
      {/* Window Browser Chrome Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#06101e] border-b border-slate-800/80 text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
          <span className="ml-2 font-mono text-[9px] text-slate-400">
            pos.zigga.io/dashboard
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Workspace</span>
        </div>
      </div>

      {/* Main Workspace: Left Nav + Right Content */}
      <div className="flex bg-[#f8fafc] text-slate-800 text-left">
        {/* ──────── Dark Blue Official Sidebar ──────── */}
        <aside className="w-32 sm:w-36 shrink-0 bg-[#071731] text-slate-300 flex flex-col justify-between p-2 border-r border-[#0e2346]">
          <div className="space-y-2.5">
            {/* Logo */}
            <div className="flex items-center gap-1.5 px-1 py-0.5">
              <div className="w-5 h-5 rounded bg-[#1b5ebe] flex items-center justify-center text-white font-extrabold text-[10px] shadow-sm">
                Z
              </div>
              <div className="leading-none">
                <span className="text-white font-black text-[10px] tracking-wider">ZIGA POS</span>
                <span className="block text-[6.5px] font-bold text-blue-300/80 tracking-widest uppercase mt-0.5">
                  PLATFORM
                </span>
              </div>
            </div>

            {/* Navigation Section */}
            <div>
              <p className="px-1.5 text-[6.5px] font-bold tracking-wider text-slate-400 uppercase mb-1">
                NAVIGATION
              </p>
              <nav className="space-y-0.5">
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
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between px-1.5 py-1 rounded transition-colors ${
                      item.active
                        ? "bg-[#14284b] text-white font-semibold"
                        : "text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <item.icon
                        className={`w-2.5 h-2.5 shrink-0 ${
                          item.active ? "text-[#3b82f6]" : "text-slate-400"
                        }`}
                      />
                      <span className="truncate text-[8px]">{item.label}</span>
                    </div>
                    {item.active && (
                      <div className="w-0.5 h-2.5 bg-[#3b82f6] rounded-full" />
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>

          {/* Bottom Sidebar: Support & Online Indicator */}
          <div className="pt-2 border-t border-[#0e2346] space-y-1">
            <div className="flex items-center justify-between px-1.5 py-1 rounded bg-[#0e2244] text-slate-200 text-[7.5px]">
              <div className="flex items-center gap-1">
                <Headphones className="w-2.5 h-2.5 text-[#3b82f6]" />
                <span>Support & Help</span>
              </div>
              <span className="w-3 h-3 rounded-full bg-rose-500 text-white text-[7px] font-bold flex items-center justify-center">
                1
              </span>
            </div>
            <div className="flex items-center gap-1 px-1.5 text-[7.5px] text-slate-400">
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              <span>Online</span>
            </div>
          </div>
        </aside>

        {/* ──────── Content Area ──────── */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] p-2.5 space-y-2">
          {/* Top Header */}
          <header className="h-7 bg-white border border-slate-200 rounded-lg px-2.5 flex items-center justify-between shrink-0">
            <div>
              <p className="text-[6px] font-bold text-slate-400 uppercase leading-none">WORKSPACE</p>
              <h1 className="text-[8.5px] font-bold text-slate-900 leading-none mt-0.5">Dashboard</h1>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500">
                <Bell className="w-2 h-2" />
              </div>
              <div className="flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded-full bg-white border border-slate-200">
                <div className="w-3.5 h-3.5 rounded-full bg-[#1b5ebe] text-white flex items-center justify-center text-[7px] font-bold">
                  K
                </div>
                <div className="text-left leading-none">
                  <p className="text-[7.5px] font-bold text-slate-900">Kigali Supermart</p>
                  <p className="text-[6px] font-medium text-slate-400 uppercase">COMPANY_ADMIN</p>
                </div>
              </div>
            </div>
          </header>

          {/* Desktop Setup Banner */}
          <div className="bg-white rounded-lg border border-slate-200 p-2 shadow-2xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1b5ebe] shrink-0">
                <Monitor className="w-3 h-3" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-[8.5px] font-bold text-slate-900">Ziga POS Desktop Setup</span>
                  <span className="px-1 py-0.2 rounded-full text-[6.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    v1.1.0
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[6.5px] text-slate-500 mt-0.5">
                  <span className="flex items-center gap-0.5 text-emerald-700">
                    <Printer className="w-2 h-2" /> Thermal
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-emerald-700">
                    <WifiOff className="w-2 h-2" /> Offline
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-amber-600">
                    <Zap className="w-2 h-2" /> Fast
                  </span>
                </div>
              </div>
            </div>

            <div className="px-2 py-1 rounded bg-[#1b5ebe] text-white text-[7.5px] font-semibold flex items-center gap-1 shrink-0">
              <Download className="w-2 h-2" />
              <span>Download (.dmg)</span>
            </div>
          </div>

          {/* 4 Analytics Metric Cards */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { title: "REVENUE", value: "3.85M RWF", icon: <DollarSign className="w-2.5 h-2.5 text-white" /> },
              { title: "CUSTOMERS", value: "42", icon: <Users className="w-2.5 h-2.5 text-white" /> },
              { title: "PRODUCTS", value: "186", icon: <Package className="w-2.5 h-2.5 text-white" /> },
              { title: "ORDERS", value: "124", icon: <ShoppingCart className="w-2.5 h-2.5 text-white" /> },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-white rounded-lg border border-slate-200 p-1.5 flex items-start justify-between shadow-2xs"
              >
                <div>
                  <p className="text-[6px] font-bold text-slate-400 tracking-wider uppercase leading-none">
                    {card.title}
                  </p>
                  <p className="text-[9px] font-extrabold text-slate-900 mt-0.5 leading-none">
                    {card.value}
                  </p>
                </div>
                <div className="w-4 h-4 rounded bg-[#071731] flex items-center justify-center shrink-0">
                  {card.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Side-by-side Tables: Recent Sales & Recent Loans */}
          <div className="grid grid-cols-2 gap-1.5">
            {/* Recent Sales Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
              <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100">
                <span className="text-[7.5px] font-bold text-slate-900">Recent Sales</span>
                <ArrowUpRight className="w-2 h-2 text-slate-400" />
              </div>
              <div className="divide-y divide-slate-50 text-[7px]">
                {[
                  { id: "#128", customer: "Mugisha Eric", amount: "450,000 RWF" },
                  { id: "#127", customer: "Keza Diane", amount: "185,500 RWF" },
                  { id: "#126", customer: "Gasana Alexis", amount: "920,000 RWF" },
                ].map((row) => (
                  <div key={row.id} className="flex items-center justify-between px-2 py-1">
                    <span className="text-slate-400 font-mono">{row.id}</span>
                    <span className="font-semibold text-slate-800">{row.customer}</span>
                    <span className="font-bold text-emerald-600">{row.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Loans Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
              <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100">
                <span className="text-[7.5px] font-bold text-slate-900">Recent Loans</span>
                <ArrowUpRight className="w-2 h-2 text-slate-400" />
              </div>
              <div className="divide-y divide-slate-50 text-[7px]">
                {[
                  { customer: "Mutabazi P.", amount: "150,000 RWF" },
                  { customer: "Umutoni S.", amount: "85,000 RWF" },
                  { customer: "Habimana C.", amount: "420,000 RWF" },
                ].map((row, idx) => (
                  <div key={idx} className="flex items-center justify-between px-2 py-1">
                    <span className="font-semibold text-slate-800">{row.customer}</span>
                    <span className="font-bold text-rose-600">{row.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
