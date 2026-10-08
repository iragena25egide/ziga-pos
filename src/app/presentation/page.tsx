"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Store,
  Laptop,
  ShieldCheck,
  Zap,
  WifiOff,
  BarChart3,
  Receipt,
  Users,
  Download,
  ArrowRight,
  CheckCircle2,
  Globe,
  Sparkles,
  ChevronRight,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PresentationPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-primary selection:text-white">
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 border border-primary/40 rounded-xl flex items-center justify-center text-primary shadow-lg shadow-primary/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black tracking-wider uppercase text-white">
                ZIGA POS
              </span>
              <span className="block text-[9px] font-bold text-slate-400 tracking-widest uppercase">
                Business Platform
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-primary transition-colors">
              Features
            </a>
            <a href="#desktop" className="hover:text-primary transition-colors">
              Desktop App
            </a>
            <a href="#security" className="hover:text-primary transition-colors">
              Security
            </a>
            <a href="#pricing" className="hover:text-primary transition-colors">
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-300 hover:text-white transition-colors px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/login?mode=register"
              className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/25 transition-all hover:scale-105"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-36 pb-20 md:pt-48 md:pb-32 px-6 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 rounded-full blur-[140px] pointer-events-none z-0"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-8">
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen Point of Sale & SaaS
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] text-white mb-6">
              The Smart POS & Management Operating System for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-emerald-400">Modern Commerce</span>.
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10 font-normal">
              Run your retail store, supermarket, or enterprise business effortlessly with offline-first desktop registers, multi-tenant company isolation, thermal receipt printing, and real-time cloud sync.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login?mode=register"
                className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center gap-3 transition-all hover:scale-105 text-base"
              >
                Register Your Company <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#desktop"
                className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all text-base"
              >
                <Download className="w-5 h-5 text-primary" /> Download Desktop App
              </a>
            </div>
          </motion.div>

          {/* Product Screenshot Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 rounded-3xl border border-slate-800 bg-slate-900/60 p-3 shadow-2xl backdrop-blur-xl relative"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800/80 mb-3 text-xs text-slate-500 font-mono">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              <span className="ml-2 text-slate-400">ziga-pos-desktop.app</span>
            </div>
            <div className="aspect-[16/9] rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800/60 flex items-center justify-center p-8 overflow-hidden relative group">
              <div className="grid grid-cols-3 gap-6 w-full opacity-90">
                <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50 text-left">
                  <p className="text-xs font-semibold text-slate-400">Total Sales Today</p>
                  <p className="text-2xl font-bold text-white mt-1">1,450,000 RWF</p>
                  <span className="text-[10px] text-emerald-400 font-bold mt-2 inline-block">↑ +18.4% vs yesterday</span>
                </div>
                <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50 text-left">
                  <p className="text-xs font-semibold text-slate-400">Transactions Count</p>
                  <p className="text-2xl font-bold text-white mt-1">142 Sales</p>
                  <span className="text-[10px] text-primary font-bold mt-2 inline-block">● Real-time register</span>
                </div>
                <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50 text-left">
                  <p className="text-xs font-semibold text-slate-400">Sync Status</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">Connected</p>
                  <span className="text-[10px] text-slate-400 font-bold mt-2 inline-block">IndexedDB Local Cache</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="py-24 px-6 border-t border-slate-800/80 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
              Everything Your Company Needs to Scale.
            </h2>
            <p className="text-slate-400 text-base">
              Built for speed, reliability, and security. Ziga POS equips your management team and cashiers with institutional-grade tools.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-primary/40 transition-all group">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <WifiOff className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Offline-First Register</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Never lose a sale during internet outages. Ziga POS saves transactions locally and syncs automatically when connection is restored.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-primary/40 transition-all group">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Multi-Tenant Isolation & OTP</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Each company operates in a dedicated, isolated workspace. Email OTP verification ensures owner account security from day one.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-primary/40 transition-all group">
              <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Receipt className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Thermal Printing & Receipts</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Seamless thermal printing support with customized store headers, QR verification codes, and PDF receipt downloads.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Desktop App Download Section */}
      <section id="desktop" className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto rounded-3xl bg-gradient-to-r from-primary/20 via-slate-900 to-indigo-950 border border-slate-800 p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-xl text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary text-xs font-bold uppercase tracking-wider mb-6">
              <Laptop className="w-4 h-4" /> Desktop Application
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Download Ziga POS for Mac & Windows
            </h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-8">
              Install our dedicated desktop application for lightning-fast barcode scanning, keyboard shortcuts, offline resilience, and hardware receipt printer integration.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button className="h-12 px-6 rounded-xl font-bold text-sm bg-white text-slate-900 hover:bg-slate-100 gap-2 shadow-lg">
                <Download className="w-4 h-4" /> Download for macOS (.dmg)
              </Button>
              <Button variant="outline" className="h-12 px-6 rounded-xl font-bold text-sm border-slate-700 text-slate-200 hover:bg-slate-800 gap-2">
                <Download className="w-4 h-4" /> Download for Windows (.exe)
              </Button>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col gap-4 text-left bg-slate-950/60 p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3 text-slate-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Automatic Background Updates
            </div>
            <div className="flex items-center gap-3 text-slate-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Thermal Printer Driver Integration
            </div>
            <div className="flex items-center gap-3 text-slate-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Offline SQLite / LocalForage Vault
            </div>
            <div className="flex items-center gap-3 text-slate-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant Cloud Synchronization
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-24 px-6 border-t border-slate-800/80 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-slate-400 text-base mb-10 max-w-2xl mx-auto">
            Create your company workspace in under 2 minutes with email OTP verification.
          </p>
          <Link
            href="/login?mode=register"
            className="inline-flex items-center gap-3 px-10 py-5 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-2xl shadow-xl shadow-primary/30 transition-all hover:scale-105"
          >
            Create Company Workspace Now <ChevronRight className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-primary" />
            <span className="font-bold text-slate-300 uppercase tracking-wider">ZIGA POS</span>
          </div>
          <p>© 2026 Ziga POS System. All rights reserved.</p>
          <div className="flex items-center gap-6 text-slate-400">
            <Link href="/login" className="hover:text-white">Sign In</Link>
            <Link href="/login?mode=register" className="hover:text-white">Register</Link>
            <a href="#desktop" className="hover:text-white">Desktop App</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
