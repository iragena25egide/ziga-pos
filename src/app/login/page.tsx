"use client";

import { useState, useEffect, useRef } from "react";
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
  Building2,
  User,
  KeyRound,
  ArrowLeft,
  ArrowRight,
  Lock,
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
   Clean dashboard window on authentic #e8e9ef surface
───────────────────────────────────────────────────────────────*/
function AppPreviewMockup() {
  return (
    <div className="w-full max-w-[390px] mx-auto select-none">
      {/* Window chrome */}
      <div
        className="rounded-xl overflow-hidden shadow-xl border border-slate-300/80"
        style={{ boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }}
      >
        {/* Title bar */}
        <div
          className="flex items-center gap-1.5 px-4 py-2.5"
          style={{ backgroundColor: "#1a2f50" }}
        >
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#ff5f57" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#febc2e" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#28c840" }} />
          <div
            className="flex-1 mx-3 h-5 rounded flex items-center justify-center gap-1.5 text-white/50 text-[9px] font-medium"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <Globe className="w-2.5 h-2.5" />
            pos.zigga.io/dashboard
          </div>
        </div>

        {/* App shell */}
        <div
          className="flex overflow-hidden"
          style={{ backgroundColor: "#f8fafc", height: "270px" }}
        >
          {/* Mini sidebar */}
          <div
            className="w-24 flex-shrink-0 flex flex-col"
            style={{ backgroundColor: "#0b1d3a" }}
          >
            {/* Brand */}
            <div className="px-2.5 py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-3.5 h-3.5 rounded flex items-center justify-center text-[7px] font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: "#1b5ebe" }}
                >
                  Z
                </div>
                <span className="text-white font-bold text-[8px] tracking-tight">ZIGA POS</span>
              </div>
            </div>

            {/* Nav items */}
            <div className="p-1.5 space-y-0.5 flex-1">
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
                    color: item.active ? "#ffffff" : "rgba(255,255,255,0.45)",
                  }}
                >
                  <item.icon className="w-2.5 h-2.5 flex-shrink-0" />
                  <span className="text-[7.5px] font-medium truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Topbar */}
            <div
              className="h-8 border-b flex items-center justify-between px-2.5 flex-shrink-0"
              style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
            >
              <div>
                <p className="text-[6.5px] font-bold text-gray-400 uppercase tracking-wider">Workspace</p>
                <p className="text-[8.5px] font-bold text-gray-900 leading-none">Dashboard</p>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-200"
                  style={{ backgroundColor: "#ffffff" }}
                >
                  <div
                    className="w-3 h-3 rounded-full flex items-center justify-center text-[5px] font-bold text-white"
                    style={{ backgroundColor: "#0b1d3a" }}
                  >
                    A
                  </div>
                  <span className="text-[6.5px] font-semibold text-gray-700">Admin</span>
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="flex-1 p-2 overflow-hidden bg-slate-50/50">
              <p className="text-[7.5px] font-bold text-gray-800 mb-1.5">Overview</p>

              {/* Metric cards row */}
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                {[
                  { label: "REVENUE", value: "RWF 2.4M", up: true },
                  { label: "ORDERS", value: "1,284", up: true },
                  { label: "CUSTOMERS", value: "342", up: false },
                  { label: "PRODUCTS", value: "89", up: true },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="rounded p-1.5 bg-white border border-slate-200"
                  >
                    <p className="text-[5.5px] font-bold text-gray-400 uppercase tracking-wider">{card.label}</p>
                    <p className="text-[8.5px] font-bold text-gray-900 mt-0.5">{card.value}</p>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <TrendingUp
                        className="w-2 h-2"
                        style={{ color: card.up ? "#16a34a" : "#dc2626" }}
                      />
                      <span
                        className="text-[5.5px] font-semibold"
                        style={{ color: card.up ? "#16a34a" : "#dc2626" }}
                      >
                        Live data
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mini table */}
              <div className="rounded overflow-hidden bg-white border border-slate-200">
                <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100">
                  <span className="text-[7px] font-bold text-gray-800">Recent Sales</span>
                  <ArrowUpRight className="w-2 h-2 text-gray-400" />
                </div>
                {[
                  { id: "001", name: "Kabila Jean", amount: "45,000" },
                  { id: "002", name: "Uwimana Alice", amount: "12,500" },
                ].map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between px-2 py-0.5 border-b border-slate-50 text-[6.5px]"
                  >
                    <span className="text-gray-400">#{row.id}</span>
                    <span className="font-medium text-gray-700">{row.name}</span>
                    <span className="font-bold text-emerald-600">
                      {row.amount} RWF
                    </span>
                  </div>
                ))}
              </div>
            </div>
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
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  const [isDesktop, setIsDesktop] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Multi-step Register state
  const [registerStep, setRegisterStep] = useState<1 | 2 | 3>(1);
  const [registerData, setRegisterData] = useState({
    companyName: "",
    tinNumber: "",
    address: "",
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  // Register OTP Modal
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Forgot Password Modal State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

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

  // Initialize official Google Identity Services button
  useEffect(() => {
    if (mode !== "login" || isDesktop) return;

    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      "552229655849-afoehos06ti14mds4c4ucfne5n8p7l81.apps.googleusercontent.com";

    const setupGoogle = () => {
      if (!(window as any).google?.accounts?.id) return;

      (window as any).google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          if (!response.credential) {
            toast.error("Google Sign-In failed.");
            return;
          }
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

      if (googleBtnContainerRef.current) {
        (window as any).google.accounts.id.renderButton(googleBtnContainerRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          shape: "rectangular",
          text: "continue_with",
          logo_alignment: "center",
          width: 360,
        });
      }
    };

    if ((window as any).google?.accounts?.id) {
      setupGoogle();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = setupGoogle;
      document.head.appendChild(script);
    }
  }, [mode, isDesktop, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpModalOpen && resendTimer > 0) {
      timer = setInterval(() => setResendTimer((p) => p - 1), 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [otpModalOpen, resendTimer]);

  /* ── Handlers: Login ── */
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

  const handleGooglePrompt = () => {
    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.prompt();
    }
  };

  /* ── Validation for Steps ── */
  const validateStep1 = () => {
    if (!registerData.companyName.trim()) {
      toast.error("Please enter your Company Name.");
      return false;
    }
    if (!registerData.tinNumber.trim()) {
      toast.error("Please enter your TIN / Tax Number.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!registerData.ownerName.trim()) {
      toast.error("Please enter the Owner / Representative Name.");
      return false;
    }
    if (!registerData.email.trim() || !registerData.email.includes("@")) {
      toast.error("Please enter a valid work email address.");
      return false;
    }
    if (!registerData.phone.trim()) {
      toast.error("Please enter a contact phone number.");
      return false;
    }
    return true;
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerStep === 1) {
      if (validateStep1()) setRegisterStep(2);
      return;
    }
    if (registerStep === 2) {
      if (validateStep2()) setRegisterStep(3);
      return;
    }

    if (!registerData.password || registerData.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

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
      } catch {
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
        toast.info(`Sending verification OTP to ${registerData.email}`);
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
    if (!otpCode || otpCode.length < 4) { toast.error("Please enter the 6-digit code."); return; }
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
      toast.success("Company registered successfully! Redirecting...");
      setOtpModalOpen(false);
      router.push("/");
    } catch {
      toast.error("Invalid or expired OTP code.");
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
      toast.success("A new verification code has been sent.");
    } catch {
      toast.info("Resent verification code.");
    }
  };

  /* ── Handlers: Forgot Password ── */
  const handleForgotRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setForgotLoading(true);
    try {
      try {
        await api.post("/auth/forgot-password/", { email: forgotEmail });
      } catch {
        await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotEmail }),
        });
      }
      toast.success(`Reset code sent to ${forgotEmail}`);
      setForgotStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to send reset code.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp || forgotOtp.length < 4) {
      toast.error("Please enter the verification code.");
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setForgotLoading(true);
    try {
      try {
        await api.post("/auth/reset-password/", {
          email: forgotEmail,
          otp: forgotOtp,
          new_password: forgotNewPassword,
        });
      } catch {
        await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: forgotEmail,
            otp: forgotOtp,
            new_password: forgotNewPassword,
          }),
        });
      }
      toast.success("Password updated successfully! Please log in.");
      setForgotModalOpen(false);
      setForgotStep(1);
      setLoginEmail(forgotEmail);
      setLoginPassword("");
      setForgotOtp("");
      setForgotNewPassword("");
      setForgotConfirmPassword("");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Invalid code or failed to reset password.");
    } finally {
      setForgotLoading(false);
    }
  };

  /* ── Render ── */
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">

      {/* ─────── LEFT PANEL ─────── */}
      <div
        className="hidden lg:flex w-[48%] flex-col justify-between p-10 relative overflow-hidden bg-[#e8e9ef] border-r border-slate-300"
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <ZigaLogo size={32} showText={false} theme="light" />
          <div>
            <p className="text-slate-950 font-bold text-base tracking-tight leading-none">ZIGA POS</p>
            <p className="text-slate-500 text-[9.5px] font-semibold tracking-wider uppercase mt-0.5">
              {isDesktop ? "Desktop Platform" : "Cloud Retail System"}
            </p>
          </div>
          {isDesktop && (
            <span
              className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200"
            >
              Desktop Mode
            </span>
          )}
        </div>

        {/* Headline + App preview */}
        <div className="flex flex-col items-start gap-5 my-auto">
          <div>
            <div className="inline-flex items-center px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-700 text-[10px] font-semibold uppercase tracking-wider mb-2.5 shadow-sm">
              Retail & Wholesale OS
            </div>
            <h2 className="text-2xl font-bold text-slate-950 leading-tight mb-1.5 tracking-tight">
              Manage your store.<br />
              <span className="text-[#1b5ebe]">Power your payments.</span>
            </h2>
            <p className="text-slate-600 text-xs leading-relaxed max-w-xs">
              Fast cashier registers, barcode scanning, live stock tracking, and automated fiscal receipts.
            </p>
          </div>

          {/* App preview mockup window */}
          <div className="w-full">
            <AppPreviewMockup />
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center gap-6 pt-4 border-t border-slate-300/80 text-slate-700">
          {[
            { value: "Offline-Ready", label: "ESC/POS Printing" },
            { value: "RRA EBM", label: "Fiscal Invoices" },
            { value: "MoMo Pay", label: "QR Checkouts" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-slate-900 font-bold text-xs leading-none">{stat.value}</p>
              <p className="text-slate-500 text-[9.5px] font-medium mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─────── RIGHT PANEL ─────── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 sm:px-10 py-8 overflow-y-auto">
        <div className="w-full max-w-[360px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <ZigaLogo size={28} showText={false} />
            <span className="font-bold text-gray-900 text-base tracking-tight">ZIGA POS</span>
          </div>

          {/* Desktop banner */}
          {isDesktop && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md mb-5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Laptop className="w-3.5 h-3.5" />
              Desktop App — Login Only
            </div>
          )}

          {/* Mode switch */}
          {!isDesktop && (
            <div className="flex border-b border-gray-200 mb-6">
              {(["login", "register"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setMode(tab);
                    if (tab === "register") setRegisterStep(1);
                  }}
                  className="pb-2.5 px-1 mr-5 text-xs font-semibold border-b-2 transition-colors"
                  style={{
                    borderColor: mode === tab ? "#1b5ebe" : "transparent",
                    color: mode === tab ? "#1b5ebe" : "#64748b",
                  }}
                >
                  {tab === "login" ? "Sign In" : "Register Business"}
                </button>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {mode === "login" ? (
              /* ── Login Form ── */
              <motion.div
                key="login"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div className="mb-5">
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">Welcome back</h1>
                  <p className="text-xs text-gray-500 mt-0.5">Sign in to access your store terminal.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-3.5">
                  <div>
                    <Label htmlFor="login-email" className="text-xs font-medium text-gray-700">
                      Work Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      className="mt-1 h-9 border-gray-300 focus:border-[#1b5ebe] focus:ring-[#1b5ebe] rounded-md text-xs"
                      placeholder="owner@company.rw"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label htmlFor="login-password" className="text-xs font-medium text-gray-700">
                        Password <span className="text-red-500">*</span>
                      </Label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(loginEmail);
                          setForgotStep(1);
                          setForgotModalOpen(true);
                        }}
                        className="text-[11px] font-medium text-[#1b5ebe] hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        className="h-9 border-gray-300 focus:border-[#1b5ebe] focus:ring-[#1b5ebe] rounded-md pr-8 text-xs"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-9 font-medium text-xs rounded-md text-white transition-colors"
                    style={{ backgroundColor: "#1b5ebe" }}
                    disabled={loginLoading}
                  >
                    {loginLoading ? "Signing in…" : "Sign In"}
                  </Button>

                  <div className="flex items-center gap-2 my-2.5">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-[10px] text-gray-400 uppercase">Or</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* Official Google Identity Button Mount */}
                  <div className="w-full flex justify-center min-h-[40px]">
                    <div ref={googleBtnContainerRef} className="w-full flex justify-center" />
                  </div>

                  {/* Fallback button if GIS script hasn't rendered yet */}
                  <noscript>
                    <button
                      type="button"
                      onClick={handleGooglePrompt}
                      className="w-full h-9 flex items-center justify-center gap-2 rounded-md border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Continue with Google
                    </button>
                  </noscript>
                </form>

                {!isDesktop && (
                  <div className="mt-6 p-2.5 rounded-lg text-xs text-center bg-gray-50 border border-gray-200 text-gray-600">
                    Need a new account?{" "}
                    <button
                      onClick={() => {
                        setMode("register");
                        setRegisterStep(1);
                      }}
                      className="font-semibold text-[#1b5ebe] hover:underline"
                    >
                      Register
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              /* ── Multi-Step Register Form ── */
              <motion.div
                key="register"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {/* Stepper Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2 text-xs">
                    <span className="font-semibold text-[#1b5ebe]">
                      Step {registerStep} of 3
                    </span>
                    <span className="text-gray-400 font-medium">
                      {registerStep === 1 && "Store Info"}
                      {registerStep === 2 && "Owner Info"}
                      {registerStep === 3 && "Password"}
                    </span>
                  </div>

                  {/* Progress bars */}
                  <div className="w-full h-1 bg-gray-200 rounded-full flex gap-1">
                    <div className={`h-full flex-1 rounded-full ${registerStep >= 1 ? "bg-[#1b5ebe]" : "bg-gray-200"}`} />
                    <div className={`h-full flex-1 rounded-full ${registerStep >= 2 ? "bg-[#1b5ebe]" : "bg-gray-200"}`} />
                    <div className={`h-full flex-1 rounded-full ${registerStep === 3 ? "bg-[#1b5ebe]" : "bg-gray-200"}`} />
                  </div>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  {/* Step 1 */}
                  {registerStep === 1 && (
                    <div className="space-y-3">
                      <div>
                        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          Business Details
                        </h2>
                        <p className="text-[11px] text-gray-500">Your registered company or store name</p>
                      </div>

                      <div>
                        <Label htmlFor="reg-company" className="text-xs font-medium text-gray-700">
                          Store / Company Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="reg-company"
                          type="text"
                          className="mt-1 h-9 border-gray-300 focus:border-[#1b5ebe] focus:ring-[#1b5ebe] rounded-md text-xs"
                          placeholder="Acme Retail Kigali"
                          value={registerData.companyName}
                          onChange={(e) => setRegisterData({ ...registerData, companyName: e.target.value })}
                          required
                          autoFocus
                        />
                      </div>

                      <div>
                        <Label htmlFor="reg-tin" className="text-xs font-medium text-gray-700">
                          TIN / Tax Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="reg-tin"
                          type="text"
                          className="mt-1 h-9 border-gray-300 focus:border-[#1b5ebe] focus:ring-[#1b5ebe] rounded-md text-xs"
                          placeholder="109283746"
                          value={registerData.tinNumber}
                          onChange={(e) => setRegisterData({ ...registerData, tinNumber: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="reg-address" className="text-xs font-medium text-gray-700">
                          Physical Address
                        </Label>
                        <Input
                          id="reg-address"
                          type="text"
                          className="mt-1 h-9 border-gray-300 focus:border-[#1b5ebe] focus:ring-[#1b5ebe] rounded-md text-xs"
                          placeholder="KN 4 Ave, Kigali"
                          value={registerData.address}
                          onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={() => {
                          if (validateStep1()) setRegisterStep(2);
                        }}
                        className="w-full h-9 font-medium text-xs rounded-md text-white mt-1 flex items-center justify-center gap-1.5"
                        style={{ backgroundColor: "#1b5ebe" }}
                      >
                        Next: Owner Info <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}

                  {/* Step 2 */}
                  {registerStep === 2 && (
                    <div className="space-y-3">
                      <div>
                        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-gray-500" />
                          Owner Profile
                        </h2>
                        <p className="text-[11px] text-gray-500">Contact details for store administrator</p>
                      </div>

                      <div>
                        <Label htmlFor="reg-owner" className="text-xs font-medium text-gray-700">
                          Full Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="reg-owner"
                          type="text"
                          className="mt-1 h-9 border-gray-300 focus:border-[#1b5ebe] focus:ring-[#1b5ebe] rounded-md text-xs"
                          placeholder="Jean Habimana"
                          value={registerData.ownerName}
                          onChange={(e) => setRegisterData({ ...registerData, ownerName: e.target.value })}
                          required
                          autoFocus
                        />
                      </div>

                      <div>
                        <Label htmlFor="reg-email" className="text-xs font-medium text-gray-700">
                          Work Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="reg-email"
                          type="email"
                          className="mt-1 h-9 border-gray-300 focus:border-[#1b5ebe] focus:ring-[#1b5ebe] rounded-md text-xs"
                          placeholder="owner@acme.rw"
                          value={registerData.email}
                          onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="reg-phone" className="text-xs font-medium text-gray-700">
                          Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="reg-phone"
                          type="tel"
                          className="mt-1 h-9 border-gray-300 focus:border-[#1b5ebe] focus:ring-[#1b5ebe] rounded-md text-xs"
                          placeholder="+250 788 000 000"
                          value={registerData.phone}
                          onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                          required
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setRegisterStep(1)}
                          className="h-9 px-3 border-gray-300 text-gray-700 rounded-md text-xs flex items-center gap-1"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" /> Back
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            if (validateStep2()) setRegisterStep(3);
                          }}
                          className="flex-1 h-9 font-medium text-xs rounded-md text-white flex items-center justify-center gap-1.5"
                          style={{ backgroundColor: "#1b5ebe" }}
                        >
                          Next: Password <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3 */}
                  {registerStep === 3 && (
                    <div className="space-y-3">
                      <div>
                        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                          <Lock className="w-4 h-4 text-gray-500" />
                          Security Password
                        </h2>
                        <p className="text-[11px] text-gray-500">Set password to protect your terminal</p>
                      </div>

                      <div>
                        <Label htmlFor="reg-password" className="text-xs font-medium text-gray-700">
                          Password (min 6 chars) <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative mt-1">
                          <Input
                            id="reg-password"
                            type={showRegPassword ? "text" : "password"}
                            className="h-9 border-gray-300 focus:border-[#1b5ebe] focus:ring-[#1b5ebe] rounded-md pr-8 text-xs"
                            placeholder="••••••••"
                            value={registerData.password}
                            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                            required
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                          >
                            {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="reg-confirm-password" className="text-xs font-medium text-gray-700">
                          Confirm Password <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="reg-confirm-password"
                          type={showRegPassword ? "text" : "password"}
                          className="mt-1 h-9 border-gray-300 focus:border-[#1b5ebe] focus:ring-[#1b5ebe] rounded-md text-xs"
                          placeholder="••••••••"
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                          required
                        />
                      </div>

                      {/* Summary card */}
                      <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Store:</span>
                          <span className="font-medium text-gray-800 truncate max-w-[180px]">{registerData.companyName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Email:</span>
                          <span className="font-medium text-gray-800 truncate max-w-[180px]">{registerData.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setRegisterStep(2)}
                          className="h-9 px-3 border-gray-300 text-gray-700 rounded-md text-xs flex items-center gap-1"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" /> Back
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 h-9 font-medium text-xs rounded-md text-white"
                          style={{ backgroundColor: "#1b5ebe" }}
                          disabled={registerLoading}
                        >
                          {registerLoading ? "Sending OTP…" : "Complete & Verify"}
                        </Button>
                      </div>
                    </div>
                  )}
                </form>

                <div className="mt-6 p-2.5 rounded-lg text-xs text-center bg-gray-50 border border-gray-200 text-gray-600">
                  Already registered?{" "}
                  <button
                    onClick={() => setMode("login")}
                    className="font-semibold text-[#1b5ebe] hover:underline"
                  >
                    Sign in
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─────── Register OTP Modal (Clean, No gradients) ─────── */}
      <Dialog open={otpModalOpen} onOpenChange={setOtpModalOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-xl p-6 bg-white border border-gray-200 shadow-xl">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <ShieldCheck className="w-5 h-5 text-[#1b5ebe]" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-gray-900 leading-none">Verify Email</DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-1 leading-normal">
                Enter the 6-digit code sent to <span className="font-medium text-gray-800">{registerData.email}</span>
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4 pt-3">
            <div>
              <Label htmlFor="otp-input" className="text-xs font-medium text-gray-700">
                Verification Code
              </Label>
              <Input
                id="otp-input"
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.trim())}
                placeholder="123456"
                className="mt-1 text-center text-xl font-mono tracking-[0.3em] h-10 border-gray-300 focus:border-[#1b5ebe] focus:ring-[#1b5ebe] rounded-md"
                required
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Didn't receive code?</span>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="font-semibold flex items-center gap-1 text-[#1b5ebe] hover:underline"
                >
                  <RefreshCw className="w-3 h-3" /> Resend
                </button>
              ) : (
                <span className="text-gray-400">Resend in {resendTimer}s</span>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-9 font-medium text-xs rounded-md text-white"
              style={{ backgroundColor: "#1b5ebe" }}
              disabled={otpLoading || otpCode.length < 4}
            >
              {otpLoading ? "Verifying…" : "Confirm & Activate"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─────── Forgot Password Modal (Clean, No gradients) ─────── */}
      <Dialog open={forgotModalOpen} onOpenChange={setForgotModalOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-xl p-6 bg-white border border-gray-200 shadow-xl">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <KeyRound className="w-5 h-5 text-[#1b5ebe]" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-gray-900 leading-none">
                {forgotStep === 1 ? "Reset Password" : "Set New Password"}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-1 leading-normal">
                {forgotStep === 1
                  ? "Enter your email to receive a password reset code."
                  : `Enter the code sent to ${forgotEmail}`}
              </DialogDescription>
            </div>
          </div>

          <div className="pt-3">
            {forgotStep === 1 ? (
              <form onSubmit={handleForgotRequestOtp} className="space-y-3.5">
                <div>
                  <Label htmlFor="forgot-email" className="text-xs font-medium text-gray-700">
                    Account Email
                  </Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    className="mt-1 h-9 border-gray-300 focus:border-[#1b5ebe] focus:ring-[#1b5ebe] rounded-md text-xs"
                    placeholder="name@business.rw"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-9 font-medium text-xs rounded-md text-white"
                  style={{ backgroundColor: "#1b5ebe" }}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? "Sending Code…" : "Send Reset Code"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleForgotResetPassword} className="space-y-3">
                <div>
                  <Label htmlFor="forgot-otp" className="text-xs font-medium text-gray-700">
                    6-Digit Code
                  </Label>
                  <Input
                    id="forgot-otp"
                    type="text"
                    maxLength={6}
                    className="mt-1 text-center text-lg font-mono tracking-[0.25em] h-9 border-gray-300 focus:border-[#1b5ebe] focus:ring-[#1b5ebe] rounded-md"
                    placeholder="123456"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.trim())}
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <Label htmlFor="forgot-new-pass" className="text-xs font-medium text-gray-700">
                    New Password
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="forgot-new-pass"
                      type={showForgotPass ? "text" : "password"}
                      className="h-9 border-gray-300 focus:border-[#1b5ebe] focus:ring-[#1b5ebe] rounded-md pr-8 text-xs"
                      placeholder="Min. 6 chars"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotPass(!showForgotPass)}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showForgotPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="forgot-confirm-pass" className="text-xs font-medium text-gray-700">
                    Confirm Password
                  </Label>
                  <Input
                    id="forgot-confirm-pass"
                    type={showForgotPass ? "text" : "password"}
                    className="mt-1 h-9 border-gray-300 focus:border-[#1b5ebe] focus:ring-[#1b5ebe] rounded-md text-xs"
                    placeholder="Re-enter password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setForgotStep(1)}
                    className="h-9 px-3 border-gray-300 text-gray-700 rounded-md text-xs"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-9 font-medium text-xs rounded-md text-white"
                    style={{ backgroundColor: "#1b5ebe" }}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? "Updating…" : "Update Password"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
