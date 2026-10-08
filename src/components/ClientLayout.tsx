"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Building2,
  FileText,
  CreditCard,
  LogOut,
  UserCircle,
  Wallet,
  ShieldCheck,
  Trash2,
  ChevronDown,
  Bell,
  Headphones,
} from "lucide-react";
import api from "@/lib/api";
import { OfflineIndicator, OfflineSyncProvider } from "./OfflineSync";
import LiveHelpChat from "./LiveHelpChat";
import ZigaLogo from "./ZigaLogo";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Admin Hub", href: "/admin", icon: ShieldCheck, roles: ["super_admin"] },
  { name: "Point of Sale", href: "/pos", icon: ShoppingCart },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Products", href: "/products", icon: Package },
  { name: "Companies", href: "/companies", icon: Building2 },
  { name: "Sales", href: "/sales", icon: FileText },
  { name: "Loans", href: "/loans", icon: CreditCard },
  { name: "Payments", href: "/payments", icon: Wallet },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Balance", href: "/balance", icon: FileText },
  { name: "My Profile", href: "/profile", icon: UserCircle },
  { name: "Users", href: "/users", icon: Users },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isPublicPage =
    pathname === "/login" ||
    pathname?.startsWith("/login") ||
    pathname === "/presentation" ||
    pathname?.startsWith("/presentation");

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("access_token");
      if (!token && !isPublicPage) {
        router.push("/login");
        return;
      }
      if (token && !isPublicPage) {
        try {
          const res = await api.get("/users/me/");
          setUser(res.data);
        } catch (err: any) {
          console.error("Failed to fetch user", err);
          if (err.response?.status === 401) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            router.push("/login");
          }
        }
      }
    };

    fetchUser();

    const handleUnauthorized = () => router.push("/login");
    window.addEventListener("unauthorized_access", handleUnauthorized);
    const timer = setTimeout(() => setLoading(false), 900);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("unauthorized_access", handleUnauthorized);
    };
  }, [isPublicPage, router]);

  const isSuperAdmin = Boolean(user?.is_superuser || user?.role === "super_admin");

  // Automatically redirect Super Admin away from store-level pages to /admin
  useEffect(() => {
    if (!loading && user && isSuperAdmin && !isPublicPage) {
      const storeOnlyRoutes = ["/", "/pos", "/customers", "/products", "/sales", "/loans", "/payments", "/balance", "/trash"];
      if (storeOnlyRoutes.includes(pathname)) {
        router.replace("/admin");
      }
    }
  }, [loading, user, isSuperAdmin, pathname, isPublicPage, router]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/login");
  };

  const navItems = isSuperAdmin
    ? [
        { name: "Admin Hub", href: "/admin", icon: ShieldCheck },
        { name: "Live Support", href: "/admin?tab=support", icon: Headphones },
        { name: "Companies", href: "/companies", icon: Building2 },
        { name: "Users", href: "/users", icon: Users },
        { name: "System Reports", href: "/reports", icon: FileText },
        { name: "My Profile", href: "/profile", icon: UserCircle },
      ]
    : [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Point of Sale", href: "/pos", icon: ShoppingCart },
        { name: "Customers", href: "/customers", icon: Users },
        { name: "Products", href: "/products", icon: Package },
        { name: "Sales", href: "/sales", icon: FileText },
        { name: "Loans", href: "/loans", icon: CreditCard },
        { name: "Payments", href: "/payments", icon: Wallet },
        { name: "Reports", href: "/reports", icon: FileText },
        { name: "Balance", href: "/balance", icon: FileText },
        { name: "My Profile", href: "/profile", icon: UserCircle },
        { name: "Users", href: "/users", icon: Users },
      ];

  const currentPage = navItems.find((n) => n.href === pathname)?.name ?? (isSuperAdmin ? "Admin Hub" : "Dashboard");
  const userInitials = user
    ? (user.first_name?.[0] ?? user.username?.[0] ?? "U").toUpperCase()
    : "SA";
  const userDisplayName =
    user ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.username : (isSuperAdmin ? "Super Admin" : "User");

  return (
    <OfflineSyncProvider>
      <AnimatePresence mode="wait">
        {loading ? (
          /* ─── Preloader ─── */
          <motion.div
            key="preloader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white"
          >
            <div className="flex flex-col items-center gap-5">
              {/* Logo mark */}
              <div className="flex items-center gap-3">
                <ZigaLogo size={36} showText={false} />
                <div>
                  <p className="text-[#0b1d3a] font-bold text-xl tracking-tight leading-none">ZIGA POS</p>
                  <p className="text-[#6b7280] text-[10px] font-medium tracking-widest uppercase mt-0.5">
                    Business Platform
                  </p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-40 h-0.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.9, ease: "easeInOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: "#1b5ebe" }}
                />
              </div>
              <p className="text-[#9ca3af] text-[11px] font-medium">Loading workspace…</p>
            </div>
          </motion.div>
        ) : (
          /* ─── Main Shell ─── */
          <motion.div
            key="main-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="h-screen flex overflow-hidden"
            style={{ backgroundColor: "#f5f7fa" }}
          >
            {/* ── Desktop Sidebar ── */}
            {!isPublicPage && (
              <div
                className="hidden md:flex w-56 flex-col relative z-10 flex-shrink-0"
                style={{ backgroundColor: "#0b1d3a" }}
              >
                {/* Brand */}
                <div className="h-16 flex items-center px-5 border-b border-white/8 flex-shrink-0">
                  <ZigaLogo size={26} showText={false} theme="dark" className="mr-2.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-bold text-sm tracking-tight leading-none">ZIGA POS</p>
                    <p className="text-white/40 text-[9px] font-medium tracking-widest uppercase mt-0.5">
                      Platform
                    </p>
                  </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto sidebar-scroll py-4 px-3 space-y-0.5">
                  <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest mb-3 px-2">
                    Navigation
                  </p>
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-all duration-150 ${
                          isActive
                            ? "bg-white/12 text-white"
                            : "text-white/55 hover:bg-white/6 hover:text-white/90"
                        }`}
                      >
                        <item.icon
                          className={`h-4 w-4 flex-shrink-0 ${
                            isActive ? "text-white" : "text-white/45 group-hover:text-white/80"
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                        {isActive && (
                          <span
                            className="ml-auto w-1 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: "#1b5ebe" }}
                          />
                        )}
                      </Link>
                    );
                  })}

                  {!isSuperAdmin && (
                    <div className="pt-3 mt-3 border-t border-white/8">
                      <Link
                        href="/trash"
                        className={`group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-all duration-150 ${
                          pathname === "/trash"
                            ? "bg-red-500/20 text-red-300"
                            : "text-white/40 hover:bg-red-500/10 hover:text-red-300"
                        }`}
                      >
                        <Trash2 className="h-4 w-4 flex-shrink-0" />
                        <span>Recycle Bin</span>
                      </Link>
                    </div>
                  )}
                </nav>

                {/* Offline status */}
                <div className="p-4 border-t border-white/8 flex-shrink-0">
                  <OfflineIndicator />
                </div>
              </div>
            )}

            {/* ── Mobile Bottom Nav ── */}
            {!isPublicPage && (
              <div
                className="md:hidden fixed bottom-0 left-0 right-0 h-14 border-t z-50 flex items-center gap-1 overflow-x-auto px-2"
                style={{
                  backgroundColor: "#0b1d3a",
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              >
                {navItems.slice(0, 5).map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex flex-col items-center justify-center shrink-0 px-3 py-1.5 rounded-md transition-all ${
                        isActive ? "text-white bg-white/12" : "text-white/45 hover:text-white/80"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="text-[8px] mt-0.5 font-medium truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* ── Main Content Area ── */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              {/* Topbar */}
              {!isPublicPage && (
                <div
                  className="h-16 flex items-center justify-between px-6 border-b flex-shrink-0"
                  style={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e5e7eb",
                  }}
                >
                  {/* Page title */}
                  <div>
                    <p className="text-[#6b7280] text-[10px] font-medium uppercase tracking-wider">
                      Workspace
                    </p>
                    <p className="text-[#111827] text-sm font-semibold leading-none mt-0.5">
                      {currentPage}
                    </p>
                  </div>

                  {/* Right actions */}
                  <div className="flex items-center gap-2">
                    {/* Bell */}
                    <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                      <Bell className="w-3.5 h-3.5" />
                    </button>

                    {/* Profile */}
                    <div className="relative">
                      <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                          style={{ backgroundColor: "#0b1d3a" }}
                        >
                          {userInitials}
                        </div>
                        <div className="text-left hidden sm:block">
                          <p className="text-[#111827] text-[11px] font-semibold leading-tight">
                            {userDisplayName}
                          </p>
                          <p className="text-[#6b7280] text-[9px] uppercase leading-tight">
                            {user?.role ?? "Admin"}
                          </p>
                        </div>
                        <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      </button>

                      <AnimatePresence>
                        {showProfileMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.97 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-50"
                          >
                            <Link
                              href="/profile"
                              className="flex items-center gap-2 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                              onClick={() => setShowProfileMenu(false)}
                            >
                              <UserCircle className="w-3.5 h-3.5 text-gray-400" />
                              My Profile
                            </Link>
                            <div className="my-1 border-t border-gray-100" />
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 rounded-md transition-colors text-left"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              Sign Out
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )}

              {/* Page content */}
              <main
                className={`flex-1 overflow-y-auto overflow-x-hidden pb-16 md:pb-6 ${
                  isPublicPage ? "" : "px-6 md:px-8 py-6"
                }`}
              >
                {children}
              </main>
            </div>

            {/* Live Help Chat */}
            {!isPublicPage && <LiveHelpChat currentUser={user} />}
          </motion.div>
        )}
      </AnimatePresence>
    </OfflineSyncProvider>
  );
}
