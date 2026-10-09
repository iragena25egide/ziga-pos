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
import OfficialDashboardMockup from "@/components/OfficialDashboardMockup";

/* ─────────────────────────────────────────────────────────────
   Left panel: App Preview Mockup
   Official clean Ziga POS Dashboard replica matching screen length
───────────────────────────────────────────────────────────────*/
function AppPreviewMockup() {
  return (
    <div className="w-full max-w-[440px] mx-auto select-none">
      <OfficialDashboardMockup />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Login Page
───────────────────────────────────────────────────────────────*/
export default function LoginPage() {
  const router = useRouter();
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      navigator.userAgent.toLowerCase().includes("electron") ||
      navigator.userAgent.toLowerCase().includes("zigadesktopapp") ||
      !!(window as any).process?.versions?.electron ||
      !!(window as any).electron ||
      !!(window as any).electronAPI ||
      window.location.search.includes("desktop=true")
    );
  });
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
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showForgotPass, setShowForgotPass] = useState(false);
  // Google first-time store onboarding modal
  const [googleOnboardingOpen, setGoogleOnboardingOpen] = useState(false);
  const [googleIdToken, setGoogleIdToken] = useState("");
  const [googleCompanyData, setGoogleCompanyData] = useState({
    companyName: "",
    address: "",
    tinNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [showGooglePassword, setShowGooglePassword] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const submitGoogleAuth = async (
    idToken: string,
    companyInfo?: {
      companyName: string;
      address: string;
      tinNumber: string;
      password?: string;
      confirmPassword?: string;
    }
  ) => {
    try {
      if (companyInfo) {
        if (!companyInfo.companyName?.trim()) {
          toast.error("Please enter your Store / Company Name.");
          return;
        }
        if (!companyInfo.password || companyInfo.password.length < 6) {
          toast.error("Please set a password of at least 6 characters so you can log in on the Desktop app.");
          return;
        }
        if (companyInfo.password !== companyInfo.confirmPassword) {
          toast.error("Passwords do not match. Please re-type your password.");
          return;
        }
      }

      setGoogleSubmitting(true);
      toast.loading("Saving account details and password…", { id: "google-auth" });
      const payload: any = { id_token: idToken };
      if (companyInfo?.companyName) {
        payload.company_name = companyInfo.companyName.trim();
        payload.address = companyInfo.address.trim();
        payload.tin_number = companyInfo.tinNumber.trim();
      }
      if (companyInfo?.password) {
        payload.password = companyInfo.password;
      }
      const res = await api.post("/auth/google/", payload);
      toast.dismiss("google-auth");
      if (res.data?.pending) {
        setGoogleOnboardingOpen(false);
        toast.success("Google account registered & password saved! Pending Super Admin approval.", { duration: 6000 });
        return;
      }
      // Store ONLY standard JWT access and refresh tokens — no credentials or user details
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
      setGoogleOnboardingOpen(false);
      toast.success("Password set successfully! Signed in.");
      router.push("/");
    } catch (err: any) {
      toast.dismiss("google-auth");
      const msg = err.response?.data?.error || err.response?.data?.detail;
      toast.error(msg || "Google authentication failed.");
    } finally {
      setGoogleSubmitting(false);
    }
  };

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

  // Initialize official Google Identity Services button (web only)
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
            const parts = response.credential.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
              if (payload.picture) {
                localStorage.setItem("user_avatar", payload.picture);
                if (payload.email) {
                  localStorage.setItem(`user_avatar_${payload.email.toLowerCase()}`, payload.picture);
                }
              }
            }
          } catch (e) {
            console.warn("Could not decode Google avatar", e);
          }
          setGoogleIdToken(response.credential);
          // Check if this Google user is signing in or first time registering
          setGoogleOnboardingOpen(true);
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
      // Only store JWT tokens in localStorage — zero company/user metadata leaks
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
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
      const res = await api.post("/auth/forgot-password/", { email: forgotEmail });
      toast.success(res.data?.message || `Reset code sent to ${forgotEmail}`);
      setForgotStep(2);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.detail || err.response?.data?.message;
      toast.error(msg || "Failed to send reset code.");
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
      const res = await api.post("/auth/reset-password/", {
        email: forgotEmail,
        otp: forgotOtp,
        new_password: forgotNewPassword,
      });
      toast.success(res.data?.message || "Password updated successfully! Please log in.");
      setForgotModalOpen(false);
      setForgotStep(1);
      setLoginEmail(forgotEmail);
      setLoginPassword("");
      setForgotOtp("");
      setForgotNewPassword("");
      setForgotConfirmPassword("");
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.detail || err.response?.data?.message;
      toast.error(msg || "Invalid code or failed to reset password.");
    } finally {
      setForgotLoading(false);
    }
  };

  /* ── Render ── */
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">

      {/* ─────── LEFT PANEL ─────── */}
      <div
        className="hidden lg:flex w-[48%] flex-col justify-between p-8 xl:p-10 relative overflow-hidden bg-[#e8e9ef] border-r border-slate-300"
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <ZigaLogo size={32} showText={false} theme="light" />
          <div>
            <p className="text-slate-950 font-bold text-base tracking-tight leading-none">ZIGA POS</p>
            <p className="text-slate-500 text-[9.5px] font-semibold tracking-wider uppercase mt-0.5">
              Cloud Retail System
            </p>
          </div>
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

          {/* Mode switch (Web only) */}
          {isDesktop ? (
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-[#1b5ebe] border border-blue-100 text-[11px] font-semibold mb-2">
                <Building2 className="w-3.5 h-3.5" />
                <span>Desktop Terminal</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Desktop Login</h1>
              <p className="text-xs text-gray-500 mt-0.5">Sign in to your cashier & store terminal.</p>
            </div>
          ) : (
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
                    borderColor: mode === tab ? "#0b1d3a" : "transparent",
                    color: mode === tab ? "#0b1d3a" : "#64748b",
                  }}
                >
                  {tab === "login" ? "Sign In" : "Register Business"}
                </button>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {mode === "login" || isDesktop ? (
              /* ── Login Form ── */
              <motion.div
                key="login"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {!isDesktop && (
                  <div className="mb-5">
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Welcome back</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Sign in to access your store terminal.</p>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-3.5">
                  <div>
                    <Label htmlFor="login-email" className="text-xs font-medium text-gray-700">
                      Work Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      className="mt-1 h-9 border-gray-300 focus:border-[#0b1d3a] focus:ring-[#0b1d3a] rounded-md text-xs"
                      placeholder="Work Email"
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
                        className="text-[11px] font-medium text-[#0b1d3a] hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        className="h-9 border-gray-300 focus:border-[#0b1d3a] focus:ring-[#0b1d3a] rounded-md pr-8 text-xs"
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
                    style={{ backgroundColor: "#0b1d3a" }}
                    disabled={loginLoading}
                  >
                    {loginLoading ? "Signing in…" : "Sign In"}
                  </Button>

                  {!isDesktop && (
                    <>
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
                    </>
                  )}
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
                    <span className="font-semibold text-[#0b1d3a]">
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
                    <div className={`h-full flex-1 rounded-full ${registerStep >= 1 ? "bg-[#0b1d3a]" : "bg-gray-200"}`} />
                    <div className={`h-full flex-1 rounded-full ${registerStep >= 2 ? "bg-[#0b1d3a]" : "bg-gray-200"}`} />
                    <div className={`h-full flex-1 rounded-full ${registerStep === 3 ? "bg-[#0b1d3a]" : "bg-gray-200"}`} />
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
                          className="mt-1 h-9 border-gray-300 focus:border-[#0b1d3a] focus:ring-[#0b1d3a] rounded-md text-xs"
                          placeholder="Store Name"
                          value={registerData.companyName}
                          onChange={(e) => setRegisterData({ ...registerData, companyName: e.target.value })}
                          required
                          autoFocus
                        />
                      </div>

                      <div>
                        <Label htmlFor="reg-tin" className="text-xs font-medium text-gray-700">
                          TIN / Tax Number <span className="text-gray-400 font-normal">(Optional)</span>
                        </Label>
                        <Input
                          id="reg-tin"
                          type="text"
                          className="mt-1 h-9 border-gray-300 focus:border-[#0b1d3a] focus:ring-[#0b1d3a] rounded-md text-xs"
                          placeholder="TIN / Tax Number"
                          value={registerData.tinNumber}
                          onChange={(e) => setRegisterData({ ...registerData, tinNumber: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="reg-address" className="text-xs font-medium text-gray-700">
                          Physical Address
                        </Label>
                        <Input
                          id="reg-address"
                          type="text"
                          className="mt-1 h-9 border-gray-300 focus:border-[#0b1d3a] focus:ring-[#0b1d3a] rounded-md text-xs"
                          placeholder="Store Address"
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
                        style={{ backgroundColor: "#0b1d3a" }}
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
                          className="mt-1 h-9 border-gray-300 focus:border-[#0b1d3a] focus:ring-[#0b1d3a] rounded-md text-xs"
                          placeholder="Owner Name"
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
                          className="mt-1 h-9 border-gray-300 focus:border-[#0b1d3a] focus:ring-[#0b1d3a] rounded-md text-xs"
                          placeholder="Work Email"
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
                          className="mt-1 h-9 border-gray-300 focus:border-[#0b1d3a] focus:ring-[#0b1d3a] rounded-md text-xs"
                          placeholder="Phone Number"
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
                          style={{ backgroundColor: "#0b1d3a" }}
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
                            className="h-9 border-gray-300 focus:border-[#0b1d3a] focus:ring-[#0b1d3a] rounded-md pr-8 text-xs"
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
                          className="mt-1 h-9 border-gray-300 focus:border-[#0b1d3a] focus:ring-[#0b1d3a] rounded-md text-xs"
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
                          style={{ backgroundColor: "#0b1d3a" }}
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
                    className="font-semibold text-[#0b1d3a] hover:underline"
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
                className="mt-1 text-center text-xl font-mono tracking-[0.3em] h-10 border-gray-300 focus:border-[#0b1d3a] focus:ring-[#0b1d3a] rounded-md"
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
                  className="font-semibold flex items-center gap-1 text-[#0b1d3a] hover:underline"
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
              style={{ backgroundColor: "#0b1d3a" }}
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
              <KeyRound className="w-5 h-5 text-[#0b1d3a]" />
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
                    className="mt-1 h-9 border-gray-300 focus:border-[#0b1d3a] focus:ring-[#0b1d3a] rounded-md text-xs"
                    placeholder="Work Email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-9 font-medium text-xs rounded-md text-white"
                  style={{ backgroundColor: "#0b1d3a" }}
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
                    className="mt-1 text-center text-lg font-mono tracking-[0.25em] h-9 border-gray-300 focus:border-[#0b1d3a] focus:ring-[#0b1d3a] rounded-md"
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
                      className="h-9 border-gray-300 focus:border-[#0b1d3a] focus:ring-[#0b1d3a] rounded-md pr-8 text-xs"
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
                    className="mt-1 h-9 border-gray-300 focus:border-[#0b1d3a] focus:ring-[#0b1d3a] rounded-md text-xs"
                    placeholder="Confirm password"
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
                    style={{ backgroundColor: "#0b1d3a" }}
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

      {/* ── Google First-Time Setup Modal ── */}
      <Dialog open={googleOnboardingOpen} onOpenChange={setGoogleOnboardingOpen}>
        <DialogContent className="bg-white rounded-2xl max-w-sm p-6">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#0b1d3a] flex items-center justify-center mb-2">
              <Building2 className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-gray-900">
              Set Store Details & Password
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 leading-relaxed">
              Complete your store profile and set a password so you can log into the Desktop App and Web using your email.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitGoogleAuth(googleIdToken, googleCompanyData);
            }}
            className="space-y-3 mt-3"
          >
            <div>
              <Label className="text-xs font-medium text-gray-700">
                Store / Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                required
                placeholder="Store Name"
                value={googleCompanyData.companyName}
                onChange={(e) => setGoogleCompanyData({ ...googleCompanyData, companyName: e.target.value })}
                className="mt-1 h-9 text-xs border-gray-300 rounded-md focus:border-[#0b1d3a]"
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-gray-700">
                Store Physical Address
              </Label>
              <Input
                type="text"
                placeholder="Store Address"
                value={googleCompanyData.address}
                onChange={(e) => setGoogleCompanyData({ ...googleCompanyData, address: e.target.value })}
                className="mt-1 h-9 text-xs border-gray-300 rounded-md focus:border-[#0b1d3a]"
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-gray-700">
                TIN / Tax Number <span className="text-gray-400 font-normal">(Optional)</span>
              </Label>
              <Input
                type="text"
                placeholder="TIN / Tax Number"
                value={googleCompanyData.tinNumber}
                onChange={(e) => setGoogleCompanyData({ ...googleCompanyData, tinNumber: e.target.value })}
                className="mt-1 h-9 text-xs border-gray-300 rounded-md focus:border-[#0b1d3a]"
              />
            </div>

            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs font-medium text-gray-700">
                  Desktop & Account Password <span className="text-red-500">*</span>
                </Label>
              </div>
              <p className="text-[11px] text-gray-500 mb-2">
                This password allows you to log in on the Desktop App and Web using your email.
              </p>
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showGooglePassword ? "text" : "password"}
                    required
                    placeholder="Create a password (min 6 characters)"
                    value={googleCompanyData.password}
                    onChange={(e) => setGoogleCompanyData({ ...googleCompanyData, password: e.target.value })}
                    className="h-9 text-xs border-gray-300 rounded-md pr-8 focus:border-[#0b1d3a]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGooglePassword(!showGooglePassword)}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showGooglePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    type={showGooglePassword ? "text" : "password"}
                    required
                    placeholder="Confirm password"
                    value={googleCompanyData.confirmPassword}
                    onChange={(e) => setGoogleCompanyData({ ...googleCompanyData, confirmPassword: e.target.value })}
                    className="h-9 text-xs border-gray-300 rounded-md pr-8 focus:border-[#0b1d3a]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Button
                type="submit"
                className="w-full h-9 text-xs text-white font-medium rounded-md shadow-sm"
                style={{ backgroundColor: "#0b1d3a" }}
                disabled={googleSubmitting}
              >
                {googleSubmitting ? "Saving & Setting Password..." : "Save Store & Set Password"}
              </Button>

              <button
                type="button"
                onClick={() => submitGoogleAuth(googleIdToken)}
                className="w-full text-center text-[11px] text-gray-400 hover:text-gray-600 hover:underline py-1"
                disabled={googleSubmitting}
              >
                I already set my password / Sign in directly
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
