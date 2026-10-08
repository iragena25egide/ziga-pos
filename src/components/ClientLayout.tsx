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
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Download,
} from "lucide-react";
import api from "@/lib/api";
import { OfflineIndicator, OfflineSyncProvider } from "./OfflineSync";
import LiveHelpChat from "./LiveHelpChat";
import ZigaLogo from "./ZigaLogo";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";

interface AppNotification {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  type: "message" | "approval" | "system";
  actionHref?: string;
}

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

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

  // Real-time notifications listener via Socket.IO
  useEffect(() => {
    if (isPublicPage || !user) return;
    const socket = getSocket();
    const isSuper = Boolean(user?.is_superuser || user?.role === "super_admin");
    const userCompanyId = user?.company?.id ?? user?.company;

    const handleConnect = () => {
      if (isSuper) {
        socket.emit("join_admin");
        socket.emit("join_admin_hub");
      }
      if (userCompanyId) {
        socket.emit("join_company", { company_id: userCompanyId });
      }
    };

    const handleNewMessage = (msg: any) => {
      // If admin and message is from customer, or if merchant and message is from admin
      const isFromAdmin = Boolean(msg.is_admin);
      const shouldNotify = isSuper ? !isFromAdmin : isFromAdmin;

      if (shouldNotify) {
        const text = msg.message || "Sent an attachment";
        const sender = msg.sender_name || (isFromAdmin ? "Support Admin" : (msg.company_name || "Customer"));
        
        const newNotif: AppNotification = {
          id: `msg-${Date.now()}-${Math.random()}`,
          title: isSuper ? `Support message from ${sender}` : `New message from Support`,
          description: text.length > 55 ? `${text.slice(0, 52)}...` : text,
          timestamp: new Date(),
          read: false,
          type: "message",
          actionHref: isSuper ? "/admin?tab=support" : undefined,
        };

        setNotifications((prev) => [newNotif, ...prev.slice(0, 19)]);
        toast.info(`🔔 ${newNotif.title}: "${newNotif.description}"`, {
          duration: 5000,
        });
      }
    };

    const handleCompanyRegistered = (data: any) => {
      if (isSuper) {
        const newNotif: AppNotification = {
          id: `reg-${Date.now()}`,
          title: "New Store Registration",
          description: `"${data.company_name}" requested approval.`,
          timestamp: new Date(),
          read: false,
          type: "system",
          actionHref: "/admin?tab=approvals",
        };
        setNotifications((prev) => [newNotif, ...prev.slice(0, 19)]);
        toast.info(`🔔 New store registration: "${data.company_name}". Pending approval.`);
      }
    };

    const handleApprovalChanged = (data: any) => {
      // When admin approves or toggles merchant's company
      if (userCompanyId && String(data.company_id) === String(userCompanyId)) {
        const isApproved = Boolean(data.is_approved);
        const newNotif: AppNotification = {
          id: `appr-${Date.now()}`,
          title: isApproved ? "Account Approved & Activated! 🎉" : "Account Suspended",
          description: isApproved
            ? "Your store account has been reviewed and approved by Super Admin. You have full system access."
            : "Your company access has been temporarily suspended by Super Admin.",
          timestamp: new Date(),
          read: false,
          type: "approval",
        };

        setNotifications((prev) => [newNotif, ...prev.slice(0, 19)]);
        if (isApproved) {
          toast.success("🎉 Congratulations! Your store has been approved by Super Admin!");
        } else {
          toast.warning("Notice: Your store account status was updated by Super Admin.");
        }
        // Update local user state
        setUser((prev: any) => prev ? { ...prev, is_approved: isApproved } : prev);
      }
    };

    socket.on("connect", handleConnect);
    socket.on("new_message", handleNewMessage);
    socket.on("company_registered", handleCompanyRegistered);
    socket.on("company_approval_changed", handleApprovalChanged);

    if (socket.connected) handleConnect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("new_message", handleNewMessage);
      socket.off("company_registered", handleCompanyRegistered);
      socket.off("company_approval_changed", handleApprovalChanged);
    };
  }, [user, isPublicPage]);

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
      ];

  const [navAvatarErr, setNavAvatarErr] = useState(false);
  const storedAvatar = typeof window !== "undefined" ? (localStorage.getItem("user_avatar") || (user?.email ? localStorage.getItem(`user_avatar_${user.email.toLowerCase()}`) : null)) : null;
  const userAvatarUrl = user?.avatar || storedAvatar || (user?.email ? `https://unavatar.io/${encodeURIComponent(user.email)}?fallback=false` : null);

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
                    {/* Bell Notification Center */}
                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowNotifications(!showNotifications);
                          setShowProfileMenu(false);
                        }}
                        className="relative w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                        title="Notifications"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        {notifications.filter((n) => !n.read).length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-extrabold rounded-full px-1 py-0.2 min-w-[17px] h-[17px] flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                            {notifications.filter((n) => !n.read).length > 9
                              ? "9+"
                              : `+${notifications.filter((n) => !n.read).length}`}
                          </span>
                        )}
                      </button>

                      <AnimatePresence>
                        {showNotifications && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.97 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-2xl p-0 z-50 overflow-hidden"
                          >
                            <div className="px-4 py-3 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Bell className="w-4 h-4 text-indigo-600" />
                                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                                  Notifications
                                </span>
                                {notifications.filter((n) => !n.read).length > 0 && (
                                  <span className="bg-red-50 text-red-600 font-bold text-[10px] px-2 py-0.5 rounded-full border border-red-200">
                                    {notifications.filter((n) => !n.read).length} new
                                  </span>
                                )}
                              </div>
                              {notifications.length > 0 && (
                                <button
                                  onClick={() =>
                                    setNotifications((prev) =>
                                      prev.map((n) => ({ ...n, read: true }))
                                    )
                                  }
                                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                                >
                                  Mark all read
                                </button>
                              )}
                            </div>

                            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                              {notifications.length === 0 ? (
                                <div className="py-8 text-center text-gray-400">
                                  <Bell className="w-7 h-7 mx-auto opacity-30 mb-2" />
                                  <p className="text-xs font-medium text-gray-500">No notifications yet</p>
                                  <p className="text-[11px] text-gray-400 mt-0.5">
                                    You will be alerted instantly when events occur.
                                  </p>
                                </div>
                              ) : (
                                notifications.map((notif) => (
                                  <div
                                    key={notif.id}
                                    onClick={() => {
                                      setNotifications((prev) =>
                                        prev.map((n) =>
                                          n.id === notif.id ? { ...n, read: true } : n
                                        )
                                      );
                                      if (notif.actionHref) {
                                        router.push(notif.actionHref);
                                        setShowNotifications(false);
                                      }
                                    }}
                                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                                      notif.read ? "bg-white hover:bg-gray-50" : "bg-indigo-50/40 hover:bg-indigo-50/70"
                                    }`}
                                  >
                                    <div
                                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                        notif.type === "approval"
                                          ? "bg-emerald-100 text-emerald-600"
                                          : notif.type === "system"
                                          ? "bg-amber-100 text-amber-600"
                                          : "bg-indigo-100 text-indigo-600"
                                      }`}
                                    >
                                      {notif.type === "approval" ? (
                                        <CheckCircle2 className="w-4 h-4" />
                                      ) : notif.type === "system" ? (
                                        <AlertCircle className="w-4 h-4" />
                                      ) : (
                                        <Headphones className="w-4 h-4" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-1">
                                        <p className="text-xs font-semibold text-gray-900 truncate">
                                          {notif.title}
                                        </p>
                                        {!notif.read && (
                                          <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                                        )}
                                      </div>
                                      <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">
                                        {notif.description}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400">
                                        <Clock className="w-3 h-3" />
                                        <span>
                                          {new Date(notif.timestamp).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
                                        {notif.actionHref && (
                                          <span className="text-indigo-600 font-semibold flex items-center gap-0.5 hover:underline ml-auto">
                                            View <ExternalLink className="w-2.5 h-2.5" />
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Profile */}
                    <div className="relative">
                      <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                      >
                        {userAvatarUrl && !navAvatarErr ? (
                          <img
                            src={userAvatarUrl}
                            alt="Avatar"
                            onError={() => setNavAvatarErr(true)}
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-gray-200"
                          />
                        ) : (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                            style={{ backgroundColor: "#0b1d3a" }}
                          >
                            {userInitials}
                          </div>
                        )}
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
                            <a
                              href="https://github.com/iragena25egide/ziga-pos/releases"
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                              onClick={() => setShowProfileMenu(false)}
                            >
                              <Download className="w-3.5 h-3.5 text-gray-400" />
                              Desktop App
                            </a>
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
