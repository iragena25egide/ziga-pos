"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Home, 
  Search, 
  ShoppingCart, 
  HelpCircle, 
  FileQuestion,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full text-center space-y-6"
      >
        {/* Visual Graphic */}
        <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-blue-500/10 blur-xl animate-pulse" />
          <div className="relative w-28 h-28 rounded-3xl bg-white border border-gray-100 shadow-xl flex items-center justify-center text-[#1b5ebe]">
            <FileQuestion className="w-14 h-14 stroke-[1.5]" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-2xl bg-[#0b1d3a] text-white flex items-center justify-center shadow-md">
            <span className="text-xs font-black tracking-wider">404</span>
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#1b5ebe] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Page Not Found
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0b1d3a] tracking-tight">
            Lost in the Cloud?
          </h1>
          <p className="text-xs md:text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
            The page or route you are attempting to reach does not exist, has been moved, or requires higher platform access.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="w-full sm:w-auto h-11 px-5 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-xs flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>

          <Button
            asChild
            className="w-full sm:w-auto h-11 px-6 rounded-xl bg-[#1b5ebe] hover:bg-[#164c9a] text-white font-semibold text-xs shadow-sm flex items-center gap-2"
          >
            <Link href="/">
              <Home className="w-4 h-4" />
              Return to Dashboard
            </Link>
          </Button>
        </div>

        {/* Helpful Quick Links */}
        <div className="pt-6 border-t border-gray-200/60">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Popular Destinations
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/pos"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-[#1b5ebe]/40 hover:bg-blue-50/50 text-[11px] font-medium text-gray-600 hover:text-[#1b5ebe] transition-colors shadow-xs"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              POS Terminal
            </Link>
            <Link
              href="/sales"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-[#1b5ebe]/40 hover:bg-blue-50/50 text-[11px] font-medium text-gray-600 hover:text-[#1b5ebe] transition-colors shadow-xs"
            >
              <Search className="w-3.5 h-3.5" />
              Sales History
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-[#1b5ebe]/40 hover:bg-blue-50/50 text-[11px] font-medium text-gray-600 hover:text-[#1b5ebe] transition-colors shadow-xs"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Account Profile
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
