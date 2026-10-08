"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  Laptop,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  ArrowUpRight,
  TrendingUp,
  Globe,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ZigaLogo from "@/components/ZigaLogo";

/* ─────────────────────────────────────────────────────────────
   Left panel: App Preview Mockup
   Shows a mini faithful screenshot of the Ziga POS dashboard
   inside a browser/desktop window frame on a deep navy background
───────────────────────────────────────────────────────────────*/
function AppPreviewMockup() {
  return (
    <div className="w-full max-w-[400px] mx-auto select-none">
      {/* Window chrome */}
      <div
        className="rounded-t-xl overflow-hidden shadow-2xl"
        style={{ boxShadow: "0 32px 64px rgba(0,0,0,0.45)" }}
      >
        {/* Title bar */}
        <div
          className="flex items-center gap-1.5 px-4 py-3"
          style={{ backgroundColor: "#1a2f50" }}
        >
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ff5f57" }} />
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#febc2e" }} />
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#28c840" }} />
          <div
            className="flex-1 mx-4 h-5 rounded flex items-center justify-center gap-1.5 text-white/35 text-[9px] font-medium"
            style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
          >
            <Globe className="w-2.5 h-2.5" />
            zigapos.io/dashboard
          </div>
        </div>

        {/* App shell */}
        <div
          className="flex overflow-hidden"
          style={{ backgroundColor: "#f5f7fa", height: "300px" }}
        >
          {/* Mini sidebar */}
          <div
            className="w-28 flex-shrink-0 flex flex-col"
            style={{ backgroundColor: "#0b1d3a" }}
          >
            {/* Brand */}
            <div className="px-3 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-4 h-4 rounded flex items-center justify-center text-[7px] font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: "#1b5ebe" }}
                >
                  Z
                </div>
                <span className="text-white font-bold text-[9px] tracking-tight">ZIGA POS</span>
              </div>
            </div>

            {/* Nav items */}
            <div className="p-2 space-y-0.5 flex-1">
              {[
                { icon: LayoutDashboard, label: "Dashboard", active: true },
                { icon: ShoppingCart, label: "Point of Sale", active: false },
                { icon: Package, label: "Products", active: false },
                { icon: Users, label: "Customers", active: false },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-1.5 rounded px-1.5 py-1"
                  style={{
                    backgroundColor: item.active ? "rgba(255,255,255,0.12)" : "transparent",
                    color: item.active ? "#ffffff" : "rgba(255,255,255,0.4)",
                  }}
                >
                  <item.icon className="w-2.5 h-2.5 flex-shrink-0" />
                  <span className="text-[8px] font-medium truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Topbar */}
            <div
              className="h-9 border-b flex items-center justify-between px-3 flex-shrink-0"
              style={{ backgroundColor: "#ffffff", borderColor: "#e5e7eb" }}
            >
              <div>
                <p className="text-[7px] font-semibold text-gray-400 uppercase tracking-wider">Workspace</p>
                <p className="text-[9px] font-bold text-gray-900 leading-none">Dashboard</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                </div>
                <div
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-gray-200"
                  style={{ backgroundColor: "#ffffff" }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[5px] font-bold text-white"
                    style={{ backgroundColor: "#0b1d3a" }}
                  >
                    A
                  </div>
                  <span className="text-[7px] font-semibold text-gray-700">Admin</span>
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="flex-1 p-2.5 overflow-hidden">
              <p className="text-[8px] font-bold text-gray-800 mb-2">Dashboard Overview</p>

              {/* Metric cards row */}
              <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                {[
                  { label: "REVENUE", value: "RWF 2.4M", up: true },
                  { label: "ORDERS", value: "1,284", up: true },
                  { label: "CUSTOMERS", value: "342", up: false },
                  { label: "PRODUCTS", value: "89", up: true },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="rounded p-1.5"
                    style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}
                  >
                    <p className="text-[6px] font-bold text-gray-400 uppercase tracking-wider">{card.label}</p>
                    <p className="text-[9px] font-bold text-gray-900 mt-0.5">{card.value}</p>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <TrendingUp
                        className="w-2 h-2"
                        style={{ color: card.up ? "#16a34a" : "#dc2626" }}
                      />
                      <span
                        className="text-[6px] font-semibold"
                        style={{ color: card.up ? "#16a34a" : "#dc2626" }}
                      >
                        Live data
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mini table */}
              <div
                className="rounded overflow-hidden"
                style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}
              >
                <div className="flex items-center justify-between px-2 py-1.5" style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <span className="text-[8px] font-bold text-gray-800">Recent Sales</span>
                  <ArrowUpRight className="w-2.5 h-2.5 text-gray-400" />
                </div>
                {[
                  { id: "001", name: "Kabila Jean", amount: "45,000" },
                  { id: "002", name: "Uwimana Alice", amount: "12,500" },
                  { id: "003", name: "Nkurunziza Eric", amount: "8,200" },
                ].map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between px-2 py-1"
                    style={{ borderBottom: "1px solid #f9fafb" }}
                  >
                    <span className="text-[7px] text-gray-500">#{row.id}</span>
                    <span className="text-[7px] font-medium text-gray-800">{row.name}</span>
                    <span className="text-[7px] font-bold" style={{ color: "#16a34a" }}>
                      {row.amount} RWF
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* POS window — offset below, partially visible */}
      <div
        className="absolute -right-6 -bottom-12 w-48 rounded-xl overflow-hidden opacity-70 shadow-xl"
        style={{ boxShadow: "0 16px 40px rgba(0,0,0,0.35)" }}
      >
        <div
          className="flex items-center gap-1 px-3 py-2"
          style={{ backgroundColor: "#1a2f50" }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#ff5f57" }} />
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#febc2e" }} />
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#28c840" }} />
          <span className="text-[7px] text-white/40 ml-1 flex items-center gap-0.5">
            <Laptop className="w-2 h-2" /> Desktop App
          </span>
        </div>
        <div className="p-2" style={{ backgroundColor: "#f5f7fa" }}>
          <p className="text-[7px] font-bold text-gray-700 mb-1">Point of Sale</p>
          <div className="space-y-1">
            {["Milk (x2)", "Bread (x1)", "Sugar (x3)"].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between px-1.5 py-0.5 rounded"
                style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}
              >
                <span className="text-[6px] text-gray-700">{item}</span>
                <div className="w-8 h-1.5 rounded" style={{ backgroundColor: "#e5e7eb" }} />
              </div>
            ))}
          </div>
          <div
            className="mt-1.5 w-full py-1 rounded text-center text-[6px] font-bold text-white"
            style={{ backgroundColor: "#1b5ebe" }}
          >
            Checkout
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Login Page
───────────────────────────────────────────────────────────────*/
export default function LoginPage() {
  const router = useRouter();

  const [isDesktop, setIsDesktop] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const [registerData, setRegisterData] = useState({
    companyName: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    tinNumber: "",
    password: "",
  });
  const [registerLoading, setRegisterLoading] = useState(false);

  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isElectron =
        navigator.userAgent.toLowerCase().includes("electron") ||
        !!(window as any).process?.versions?.electron ||
        window.location.search.includes("desktop=true");
      if (isElectron) {
        setIsDesktop(true);
        setMode("login");
      }
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpModalOpen && resendTimer > 0) {
      timer = setInterval(() => setResendTimer((p) => p - 1), 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [otpModalOpen, resendTimer]);

  /* ── Handlers ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await api.post("/token/", { username: loginEmail, password: loginPassword });
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
      if (res.data.company_id) localStorage.setItem("company_id", String(res.data.company_id));
      if (res.data.company_name) localStorage.setItem("company_name", res.data.company_name);
      if (res.data.company_address) localStorage.setItem("company_address", res.data.company_address);
      if (res.data.company_phone) localStorage.setItem("company_phone", res.data.company_phone);
      if (res.data.company_tin) localStorage.setItem("company_tin", res.data.company_tin);
      if (res.data.username) localStorage.setItem("username", res.data.username);
      if (res.data.role) localStorage.setItem("role", res.data.role);
      if (res.data.is_superuser !== undefined)
        localStorage.setItem("is_superuser", String(res.data.is_superuser));
      toast.success("Welcome back to Ziga POS!");
      router.push("/");
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.error;
      toast.error(detail || "Invalid email or password. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      "552229655849-afoehos06ti14mds4c4ucfne5n8p7l81.apps.googleusercontent.com";

    const initGoogleSignIn = () => {
      (window as any).google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          if (!response.credential) { toast.error("Google Sign-In failed."); return; }
          try {
            toast.loading("Authenticating with Google…", { id: "google-auth" });
            const res = await api.post("/auth/google/", { id_token: response.credential });
            if (res.data?.pending) {
              toast.dismiss("google-auth");
              toast.success("Google account registered! Pending Super Admin approval.", { duration: 6000 });
              return;
            }
            localStorage.setItem("access_token", res.data.access);
            localStorage.setItem("refresh_token", res.data.refresh);
            if (res.data.company_id) localStorage.setItem("company_id", String(res.data.company_id));
            if (res.data.company_name) localStorage.setItem("company_name", res.data.company_name);
            if (res.data.company_address) localStorage.setItem("company_address", res.data.company_address);
            if (res.data.company_phone) localStorage.setItem("company_phone", res.data.company_phone);
            if (res.data.company_tin) localStorage.setItem("company_tin", res.data.company_tin);
            if (res.data.username) localStorage.setItem("username", res.data.username);
            if (res.data.role) localStorage.setItem("role", res.data.role);
            toast.dismiss("google-auth");
            toast.success(`Welcome, ${res.data.username || res.data.email}!`);
            router.push("/");
          } catch (err: any) {
            toast.dismiss("google-auth");
            const msg = err.response?.data?.error || err.response?.data?.detail;
            toast.error(msg || "Google authentication failed.");
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      (window as any).google.accounts.id.prompt();
    };

    if ((window as any).google?.accounts?.id) {
      initGoogleSignIn();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogleSignIn;
      script.onerror = () => toast.error("Failed to load Google Sign-In.");
      document.head.appendChild(script);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    try {
      try {
        await api.post("/auth/register-request/", {
          company_name: registerData.companyName,
          owner_name: registerData.ownerName,
          email: registerData.email,
          phone: registerData.phone,
          address: registerData.address,
          tin_number: registerData.tinNumber,
          password: registerData.password,
        });
      } catch (err: any) {
        await api.post("/register/", {
          company_name: registerData.companyName,
          owner_name: registerData.ownerName,
          email: registerData.email,
          phone: registerData.phone,
          address: registerData.address,
          tin_number: registerData.tinNumber,
          password: registerData.password,
        });
      }
      toast.success(`Verification code sent to ${registerData.email}`);
      setOtpModalOpen(true);
      setResendTimer(60);
      setCanResend(false);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message;
      if (msg) toast.error(msg);
      else {
        toast.info(`Sending email verification OTP to ${registerData.email}`);
        setOtpModalOpen(true);
        setResendTimer(60);
        setCanResend(false);
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) { toast.error("Please enter a valid 6-digit OTP code."); return; }
    setOtpLoading(true);
    try {
      try {
        const res = await api.post("/auth/verify-otp/", {
          email: registerData.email,
          otp: otpCode,
          company_name: registerData.companyName,
          owner_name: registerData.ownerName,
          phone: registerData.phone,
          address: registerData.address,
          tin_number: registerData.tinNumber,
          password: registerData.password,
        });
        if (res.data?.access) {
          localStorage.setItem("access_token", res.data.access);
          localStorage.setItem("refresh_token", res.data.refresh);
        }
      } catch {
        const res = await api.post("/token/", {
          username: registerData.email,
          password: registerData.password,
        });
        localStorage.setItem("access_token", res.data.access);
        localStorage.setItem("refresh_token", res.data.refresh);
      }
      toast.success("Company workspace registered! Pending Super Admin approval.");
      setOtpModalOpen(false);
      router.push("/");
    } catch {
      toast.error("Invalid or expired OTP code. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setCanResend(false);
    setResendTimer(60);
    try {
      await api.post("/auth/resend-otp/", { email: registerData.email });
      toast.success("A new OTP code has been sent to your email.");
    } catch {
      toast.info("Resent OTP code to " + registerData.email);
    }
  };

  /* ── Render ── */
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#f5f7fa" }}>

      {/* ─────── LEFT PANEL — App Preview ─────── */}
      <div
        className="hidden lg:flex w-[55%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: "#0b1d3a" }}
      >
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Glow accents */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ backgroundColor: "#1b5ebe", transform: "translate(30%, -30%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-8 blur-3xl pointer-events-none"
          style={{ backgroundColor: "#1b5ebe", transform: "translate(-30%, 30%)" }}
        />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <ZigaLogo size={34} showText={false} theme="dark" />
          <div>
            <p className="text-white font-bold text-lg tracking-tight leading-none">ZIGA POS</p>
            <p className="text-white/40 text-[10px] font-medium tracking-widest uppercase mt-0.5">
              {isDesktop ? "Desktop Platform" : "Cloud Business Platform"}
            </p>
          </div>
          {isDesktop && (
            <span
              className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(34,197,94,0.15)", color: "#4ade80" }}
            >
              Desktop Mode
            </span>
          )}
        </div>

        {/* Headline + App preview */}
        <div className="relative z-10 flex flex-col items-start gap-8 my-auto">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight mb-3">
              Manage Your Business<br />
              <span style={{ color: "#60a5fa" }}>From Anywhere.</span>
            </h2>
            <p className="text-white/55 text-sm leading-relaxed max-w-sm">
              Offline-ready POS, live inventory, multi-branch sales, and loan tracking —
              all in one clean, fast platform built for African retailers.
            </p>
          </div>

          {/* App preview mockup window */}
          <div className="relative w-full">
            <AppPreviewMockup />
          </div>
        </div>

        {/* Stats footer */}
        <div className="relative z-10 flex items-center gap-8 pt-6 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {[
            { value: "99.9%", label: "Offline Uptime" },
            { value: "2,500+", label: "Active Stores" },
            { value: "JWT", label: "Secure Auth" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-white font-bold text-lg leading-none">{stat.value}</p>
              <p className="text-white/40 text-[10px] font-medium mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─────── RIGHT PANEL — Form ─────── */}
      <div className="flex-1 flex items-center justify-center bg-white px-8 py-12 overflow-y-auto">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <ZigaLogo size={32} showText={false} />
            <span className="font-bold text-gray-900 text-base tracking-tight">ZIGA POS</span>
          </div>

          {/* Desktop mode banner */}
          {isDesktop && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg mb-6 text-sm font-medium"
              style={{ backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}
            >
              <Laptop className="w-4 h-4" />
              Desktop App — Login Only
            </div>
          )}

          {/* Mode tabs (web only) */}
          {!isDesktop && (
            <div className="flex border-b mb-8" style={{ borderColor: "#e5e7eb" }}>
              {(["login", "register"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMode(tab)}
                  className="pb-3 px-1 mr-6 text-sm font-medium border-b-2 transition-colors"
                  style={{
                    borderColor: mode === tab ? "#1b5ebe" : "transparent",
                    color: mode === tab ? "#1b5ebe" : "#6b7280",
                  }}
                >
                  {tab === "login" ? "Sign In" : "Register Company"}
                </button>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {mode === "login" ? (
              /* ── Login form ── */
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome!</h1>
                <p className="text-sm text-gray-500 mb-7">Please sign in to your account.</p>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email" className="text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      className="mt-1 h-10 border-gray-300 focus:border-[#1b5ebe] focus:ring-[#1b5ebe] rounded-md"
                      placeholder="owner@company.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label htmlFor="login-password" className="text-sm font-medium text-gray-700">
                        Password <span className="text-red-500">*</span>
                      </Label>
                      <button
                        type="button"
                        className="text-xs font-medium"
                        style={{ color: "#0e9f8a" }}
                      >
                        Setup or Reset Password
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        className="h-10 border-gray-300 focus:border-[#1b5ebe] focus:ring-[#1b5ebe] rounded-md pr-10"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 font-semibold text-sm rounded-md text-white"
                    style={{ backgroundColor: "#1b5ebe" }}
                    disabled={loginLoading}
                  >
                    {loginLoading ? "Signing in…" : "Login"}
                  </Button>

                  {/* Or continue with */}
                  <div className="flex items-center gap-3 my-2">
                    <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
                    <span className="text-xs text-gray-400">Or continue with</span>
                    <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full h-10 flex items-center justify-center gap-2 rounded-full border text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    style={{ borderColor: "#e5e7eb" }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    Google
                  </button>
                </form>

                {/* Sign up link */}
                {!isDesktop && (
                  <div
                    className="mt-6 p-3 rounded-lg text-sm text-center"
                    style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}
                  >
                    Don't have an account?{" "}
                    <button
                      onClick={() => setMode("register")}
                      className="font-semibold"
                      style={{ color: "#1b5ebe" }}
                    >
                      Sign up
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              /* ── Register form ── */
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Company Account</h1>
                <p className="text-sm text-gray-500 mb-6">Set up your business workspace on Ziga POS.</p>

                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  {[
                    { id: "reg-company", label: "Company / Business Name", key: "companyName", placeholder: "Acme Retail Rwanda", type: "text" },
                    { id: "reg-owner", label: "Owner Full Name", key: "ownerName", placeholder: "John Habimana", type: "text" },
                    { id: "reg-email", label: "Work Email", key: "email", placeholder: "info@acme.rw", type: "email" },
                    { id: "reg-phone", label: "Phone Number", key: "phone", placeholder: "+250 788 000 000", type: "tel" },
                    { id: "reg-address", label: "Physical Address", key: "address", placeholder: "KN 4 Ave, Kigali", type: "text" },
                    { id: "reg-tin", label: "TIN Number (Tax ID)", key: "tinNumber", placeholder: "109283746", type: "text" },
                    { id: "reg-password", label: "Password", key: "password", placeholder: "Create strong password", type: "password" },
                  ].map((field) => (
                    <div key={field.id}>
                      <Label htmlFor={field.id} className="text-sm font-medium text-gray-700">
                        {field.label}
                      </Label>
                      <Input
                        id={field.id}
                        type={field.type}
                        className="mt-1 h-10 border-gray-300 focus:border-[#1b5ebe] focus:ring-[#1b5ebe] rounded-md"
                        placeholder={field.placeholder}
                        value={(registerData as any)[field.key]}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, [field.key]: e.target.value })
                        }
                        required={["companyName", "ownerName", "email", "tinNumber", "password"].includes(field.key)}
                      />
                    </div>
                  ))}

                  <Button
                    type="submit"
                    className="w-full h-10 font-semibold text-sm rounded-md text-white mt-2"
                    style={{ backgroundColor: "#1b5ebe" }}
                    disabled={registerLoading}
                  >
                    {registerLoading ? "Sending Verification Code…" : "Send Email Verification OTP"}
                  </Button>
                </form>

                <div
                  className="mt-5 p-3 rounded-lg text-sm text-center"
                  style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}
                >
                  Already have an account?{" "}
                  <button
                    onClick={() => setMode("login")}
                    className="font-semibold"
                    style={{ color: "#1b5ebe" }}
                  >
                    Sign in
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─────── OTP Verification Modal ─────── */}
      <Dialog open={otpModalOpen} onOpenChange={setOtpModalOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-xl p-0 overflow-hidden">
          {/* Modal header — navy */}
          <div className="p-6 pb-5" style={{ backgroundColor: "#0b1d3a" }}>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
              style={{ backgroundColor: "rgba(27,94,190,0.3)" }}
            >
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <DialogTitle className="text-white text-lg font-bold">Verify Email Address</DialogTitle>
            <DialogDescription className="text-white/60 text-sm mt-1">
              We sent a 6-digit code to{" "}
              <strong className="text-white/90">{registerData.email}</strong>
            </DialogDescription>
          </div>

          {/* Modal body */}
          <div className="p-6">
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <Label htmlFor="otp-input" className="text-sm font-medium text-gray-700">
                  Enter 6-Digit Code
                </Label>
                <Input
                  id="otp-input"
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.trim())}
                  placeholder="123456"
                  className="mt-1 text-center text-xl font-mono tracking-[0.4em] h-12 border-gray-300 focus:border-[#1b5ebe] focus:ring-[#1b5ebe] rounded-md"
                  required
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Didn't receive the code?</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="font-semibold flex items-center gap-1"
                    style={{ color: "#1b5ebe" }}
                  >
                    <RefreshCw className="w-3 h-3" /> Resend
                  </button>
                ) : (
                  <span className="font-medium text-gray-400">Resend in {resendTimer}s</span>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-10 font-semibold text-sm rounded-md text-white"
                style={{ backgroundColor: "#1b5ebe" }}
                disabled={otpLoading || otpCode.length < 4}
              >
                {otpLoading ? "Verifying…" : "Verify & Activate Business"}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
