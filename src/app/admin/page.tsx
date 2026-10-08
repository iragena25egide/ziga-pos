"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  SlidersHorizontal,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Eye,
  Trash2,
  AlertCircle,
  FileText,
  BadgeAlert,
  Headphones,
} from "lucide-react";
import api from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Company {
  id: number;
  name: string;
  ceo_founder?: string;
  contact_email?: string;
  contact_phone?: string;
  tin_number?: string;
  address?: string;
  is_approved: boolean;
  created_at: string;
  users_count?: number;
  total_transactions_amount?: string;
  total_sales_count?: number;
}

interface PlatformUser {
  id: number;
  username: string;
  email: string;
  role: string;
  company?: number;
  company_name?: string;
  is_approved: boolean;
  is_superuser: boolean;
  phone?: string;
}

interface SupportMessage {
  id?: number;
  company_id?: number | null;
  company_name?: string;
  sender_name: string;
  sender_role?: string;
  message: string;
  is_admin: boolean;
  is_read?: boolean;
  created_at: string;
}

interface ConversationItem {
  company_id: number;
  company_name: string;
  ceo_founder?: string;
  contact_email?: string;
  contact_phone?: string;
  is_approved: boolean;
  unread_count: number;
  last_message?: string;
  last_message_at?: string;
  last_message_is_admin?: boolean;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  // Active Tab: "overview" | "approvals" | "users" | "support"
  const [activeTab, setActiveTab] = useState<"overview" | "approvals" | "users" | "support">("overview");

  // Metrics state
  const [metrics, setMetrics] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Companies state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companySearch, setCompanySearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState<"all" | "pending" | "approved">("all");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Users state
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [userSearch, setUserSearch] = useState("");

  // Live Support Desk state
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<SupportMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [companyTyping, setCompanyTyping] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all admin data
  const fetchData = async () => {
    try {
      setLoadingMetrics(true);
      const [metricsRes, companiesRes, usersRes, convsRes] = await Promise.all([
        api.get("/admin/metrics/").catch(() => ({ data: null })),
        api.get("/companies/").catch(() => ({ data: [] })),
        api.get("/users/").catch(() => ({ data: [] })),
        api.get("/support-messages/conversations/").catch(() => ({ data: [] })),
      ]);

      if (metricsRes.data) setMetrics(metricsRes.data);
      setCompanies(companiesRes.data?.results || companiesRes.data || []);
      setUsers(usersRes.data?.results || usersRes.data || []);
      setConversations(convsRes.data || []);
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error("Super Admin privileges required to view this dashboard.");
        router.push("/");
      }
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Socket.IO Setup for Admin Support Desk
  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setIsSocketConnected(true);
      socket.emit("join_admin", {});
    };

    const handleDisconnect = () => {
      setIsSocketConnected(false);
    };

    const handleNewMessage = (msg: SupportMessage) => {
      // If message is for the currently selected company in the chat panel
      if (selectedCompanyId && Number(msg.company_id) === Number(selectedCompanyId)) {
        setChatMessages((prev) => {
          if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }

      // Update conversations list summary
      setConversations((prev) => {
        const index = prev.findIndex((c) => Number(c.company_id) === Number(msg.company_id));
        if (index !== -1) {
          const updated = [...prev];
          const curr = updated[index];
          const isSelected = selectedCompanyId && Number(msg.company_id) === Number(selectedCompanyId);

          updated[index] = {
            ...curr,
            last_message: msg.message,
            last_message_at: msg.created_at,
            last_message_is_admin: msg.is_admin,
            unread_count: isSelected || msg.is_admin ? curr.unread_count : curr.unread_count + 1,
          };
          // Move to top
          const item = updated.splice(index, 1)[0];
          return [item, ...updated];
        }
        return prev;
      });

      if (!msg.is_admin) {
        toast.info(`Support text from ${msg.company_name || msg.sender_name}`, {
          description: msg.message.slice(0, 60),
        });
      }
    };

    const handleUserTyping = (data: any) => {
      if (!data.is_admin && selectedCompanyId && Number(data.company_id) === Number(selectedCompanyId)) {
        setCompanyTyping(data.name || "Customer");
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setCompanyTyping(null);
        }, 3000);
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleUserTyping);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleUserTyping);
    };
  }, [selectedCompanyId]);

  // Load chat messages when a company is selected in the Support Desk
  useEffect(() => {
    if (!selectedCompanyId) return;

    const loadCompanyMessages = async () => {
      try {
        const res = await api.get(`/support-messages/?company_id=${selectedCompanyId}`);
        setChatMessages(res.data?.results || res.data || []);
        // Mark read
        await api.post("/support-messages/mark_read/", { company_id: selectedCompanyId });
        // Clear unread badge in list
        setConversations((prev) =>
          prev.map((c) => (c.company_id === selectedCompanyId ? { ...c, unread_count: 0 } : c))
        );
      } catch (err) {
        toast.error("Failed to load chat history for this company.");
      }
    };

    loadCompanyMessages();
  }, [selectedCompanyId]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Toggle Company Approval
  const handleToggleCompanyApproval = async (company: Company) => {
    try {
      setActionLoadingId(company.id);
      const res = await api.post(`/companies/${company.id}/approve/`);
      const newStatus = res.data.is_approved;

      setCompanies((prev) =>
        prev.map((c) => (c.id === company.id ? { ...c, is_approved: newStatus } : c))
      );

      // Also update matching users locally
      setUsers((prev) =>
        prev.map((u) => (u.company === company.id ? { ...u, is_approved: newStatus } : u))
      );

      toast.success(
        `${company.name} is now ${newStatus ? "APPROVED & ACTIVATED" : "SUSPENDED"}`
      );
      fetchData();
    } catch (err) {
      toast.error("Failed to update company approval status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Toggle User Approval
  const handleToggleUserApproval = async (u: PlatformUser) => {
    try {
      const res = await api.post(`/users/${u.id}/approve/`);
      const newStatus = res.data.is_approved;

      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, is_approved: newStatus } : item))
      );

      toast.success(`${u.username} approval status toggled to: ${newStatus ? "Active" : "Pending"}`);
      fetchData();
    } catch (err) {
      toast.error("Failed to toggle user approval.");
    }
  };

  // Send Admin Reply via Socket.IO
  const handleSendAdminReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = chatInput.trim();
    if (!text || !selectedCompanyId) return;

    setChatInput("");
    const selectedComp = companies.find((c) => c.id === selectedCompanyId);

    const optimistic: SupportMessage = {
      company_id: selectedCompanyId,
      company_name: selectedComp?.name || "Company",
      sender_name: "Super Admin",
      sender_role: "super_admin",
      message: text,
      is_admin: true,
      created_at: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, optimistic]);

    const socket = getSocket();
    if (socket.connected) {
      socket.emit("send_message", {
        company_id: selectedCompanyId,
        message: text,
        sender_name: "Super Admin",
        sender_role: "super_admin",
        is_admin: true,
      });
    } else {
      try {
        await api.post("/support-messages/", {
          company: selectedCompanyId,
          message: text,
        });
      } catch (err) {
        toast.error("Failed to send reply. Please check connection.");
      }
    }
  };

  // Filtered companies
  const filteredCompanies = companies.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(companySearch.toLowerCase()) ||
      (c.ceo_founder && c.ceo_founder.toLowerCase().includes(companySearch.toLowerCase())) ||
      (c.tin_number && c.tin_number.includes(companySearch)) ||
      (c.contact_email && c.contact_email.toLowerCase().includes(companySearch.toLowerCase()));

    if (companyFilter === "pending") return matchesSearch && !c.is_approved;
    if (companyFilter === "approved") return matchesSearch && c.is_approved;
    return matchesSearch;
  });

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Top Admin Header */}
      <header className="px-6 py-4 bg-zinc-900/80 border-b border-zinc-800/80 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-400 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-wide uppercase text-white">Super Admin Command Center</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                Root Access
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium">
              Multi-tenant approvals, system monitoring, and real-time support desk
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Socket.IO status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs">
            <span className={`w-2 h-2 rounded-full ${isSocketConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            <span className="text-[11px] font-medium text-zinc-300">
              {isSocketConnected ? "Live Socket Active" : "Socket Reconnecting..."}
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchData}
            disabled={loadingMetrics}
            className="rounded-xl border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs gap-1.5 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingMetrics ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </header>

      {/* Admin Navigation Tabs */}
      <div className="px-6 pt-3 border-b border-zinc-800/80 bg-zinc-900/40 shrink-0 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 ${
            activeTab === "overview"
              ? "bg-zinc-800 text-white border-t-2 border-emerald-400"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>System Overview & Monitoring</span>
        </button>

        <button
          onClick={() => setActiveTab("approvals")}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 relative ${
            activeTab === "approvals"
              ? "bg-zinc-800 text-white border-t-2 border-emerald-400"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
          }`}
        >
          <Building2 className="w-4 h-4 text-indigo-400" />
          <span>Company Approvals</span>
          {metrics?.pending_companies > 0 && (
            <span className="bg-amber-500 text-zinc-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
              {metrics.pending_companies}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 ${
            activeTab === "users"
              ? "bg-zinc-800 text-white border-t-2 border-emerald-400"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
          }`}
        >
          <Users className="w-4 h-4 text-cyan-400" />
          <span>User Accounts</span>
        </button>

        <button
          onClick={() => setActiveTab("support")}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 relative ${
            activeTab === "support"
              ? "bg-zinc-800 text-white border-t-2 border-emerald-400"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
          }`}
        >
          <Headphones className="w-4 h-4 text-emerald-400" />
          <span>Live Support Desk</span>
          {metrics?.unread_support > 0 && (
            <span className="bg-emerald-500 text-zinc-950 font-black text-[10px] px-1.5 py-0.2 rounded-full animate-pulse">
              {metrics.unread_support}
            </span>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* TAB 1: OVERVIEW & MONITORING */}
        {activeTab === "overview" && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800/80 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Companies</span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-white">{metrics?.total_companies ?? "—"}</div>
                <div className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">{metrics?.approved_companies ?? 0} Approved</span>
                  <span>•</span>
                  <span className="text-amber-400 font-bold">{metrics?.pending_companies ?? 0} Pending</span>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800/80 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Company Users</span>
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-cyan-400">
                  {metrics?.total_company_users ?? metrics?.total_users ?? "—"}
                </div>
                <div className="mt-2 text-[11px] text-zinc-400">
                  <span className="text-zinc-200 font-bold">{metrics?.company_admins_count ?? 0} Admins</span> •{" "}
                  <span className="text-zinc-300 font-medium">{metrics?.cashiers_count ?? 0} Cashiers</span>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800/80 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Transactions</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-400 truncate">
                  ${Number(metrics?.total_transaction_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="mt-2 text-[11px] text-zinc-400 truncate">
                  <span className="text-emerald-400 font-bold">${Number(metrics?.total_payment_collected || 0).toLocaleString()}</span> collected ({metrics?.total_sales ?? 0} sales)
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800/80 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Pending Approvals</span>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <BadgeAlert className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-amber-400">{metrics?.pending_companies ?? "0"}</div>
                <div className="mt-2 text-[11px] text-zinc-400">
                  {metrics?.pending_companies > 0 ? (
                    <button
                      onClick={() => {
                        setActiveTab("approvals");
                        setCompanyFilter("pending");
                      }}
                      className="text-amber-300 font-bold hover:underline flex items-center gap-1"
                    >
                      Review requests <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <span>All approved</span>
                  )}
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800/80 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Open Inquiries</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-emerald-400">{metrics?.unread_support ?? "0"}</div>
                <div className="mt-2 text-[11px] text-zinc-400">
                  <button
                    onClick={() => setActiveTab("support")}
                    className="text-emerald-400 font-bold hover:underline flex items-center gap-1"
                  >
                    Live Help Desk <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Registrations & Support Inquiries */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Company Registrations */}
              <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800/80">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-400" /> Recent Company Registrations
                  </h3>
                  <button
                    onClick={() => setActiveTab("approvals")}
                    className="text-xs text-emerald-400 hover:underline font-semibold"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3">
                  {companies.slice(0, 5).map((comp) => (
                    <div
                      key={comp.id}
                      className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-2">
                          <span>{comp.name}</span>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                              comp.is_approved
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {comp.is_approved ? "Approved" : "Pending"}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {comp.ceo_founder || "Owner"} • TIN: {comp.tin_number || "—"}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleToggleCompanyApproval(comp)}
                        className={`rounded-xl text-xs font-bold h-8 px-3 ${
                          comp.is_approved
                            ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white"
                        }`}
                      >
                        {comp.is_approved ? "Suspend" : "Approve"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Support Chats */}
              <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800/80">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-emerald-400" /> Recent Inbound Messages
                  </h3>
                  <button
                    onClick={() => setActiveTab("support")}
                    className="text-xs text-emerald-400 hover:underline font-semibold"
                  >
                    Open Live Desk
                  </button>
                </div>

                <div className="space-y-3">
                  {conversations.slice(0, 5).map((conv) => (
                    <div
                      key={conv.company_id}
                      onClick={() => {
                        setSelectedCompanyId(conv.company_id);
                        setActiveTab("support");
                      }}
                      className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 hover:border-zinc-700 cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="flex-1 mr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{conv.company_name}</span>
                          {conv.unread_count > 0 && (
                            <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                              {conv.unread_count} new
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5 max-w-[260px]">
                          {conv.last_message || "No messages yet"}
                        </p>
                      </div>

                      <ArrowRight className="w-4 h-4 text-zinc-600" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMPANY APPROVALS */}
        {activeTab === "approvals" && (
          <div className="space-y-5 max-w-7xl mx-auto">
            {/* Filter & Search Bar */}
            <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                <Input
                  placeholder="Search by name, CEO, TIN, or email..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="pl-9 bg-zinc-950 border-zinc-800 text-xs rounded-xl h-10 text-white"
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setCompanyFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    companyFilter === "all" ? "bg-zinc-100 text-zinc-900" : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  All ({companies.length})
                </button>
                <button
                  onClick={() => setCompanyFilter("pending")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    companyFilter === "pending" ? "bg-amber-400 text-zinc-950" : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  Pending ({companies.filter((c) => !c.is_approved).length})
                </button>
                <button
                  onClick={() => setCompanyFilter("approved")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    companyFilter === "approved" ? "bg-emerald-400 text-zinc-950" : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  Approved ({companies.filter((c) => c.is_approved).length})
                </button>
              </div>
            </div>

            {/* Companies Table */}
            <div className="rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="px-5 py-3.5 font-bold">Company / Business</th>
                    <th className="px-5 py-3.5 font-bold">Owner / CEO</th>
                    <th className="px-5 py-3.5 font-bold">TIN Number</th>
                    <th className="px-5 py-3.5 font-bold">Contact Info</th>
                    <th className="px-5 py-3.5 font-bold text-center">Company Users</th>
                    <th className="px-5 py-3.5 font-bold">Transactions</th>
                    <th className="px-5 py-3.5 font-bold">Status</th>
                    <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-zinc-500">
                        No companies match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map((c) => (
                      <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-5 py-4 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-zinc-500" />
                            <span>{c.name}</span>
                          </div>
                          {c.address && <p className="text-[10px] text-zinc-500 mt-0.5">{c.address}</p>}
                        </td>
                        <td className="px-5 py-4 text-zinc-300 font-medium">
                          {c.ceo_founder || "—"}
                        </td>
                        <td className="px-5 py-4 font-mono text-zinc-400">
                          {c.tin_number ? (
                            <span className="bg-zinc-800 px-2 py-0.5 rounded text-[11px] font-bold text-zinc-200">
                              {c.tin_number}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-5 py-4 text-zinc-400">
                          <div>{c.contact_email || "—"}</div>
                          <div className="text-[11px] text-zinc-500">{c.contact_phone || ""}</div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            <Users className="w-3 h-3" />
                            {c.users_count || 0} {c.users_count === 1 ? "user" : "users"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-emerald-400 text-xs">
                            ${Number(c.total_transactions_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            {c.total_sales_count || 0} sales recorded
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                              c.is_approved
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {c.is_approved ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {c.is_approved ? "Approved" : "Pending Review"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button
                            size="sm"
                            disabled={actionLoadingId === c.id}
                            onClick={() => handleToggleCompanyApproval(c)}
                            className={`rounded-xl text-xs font-bold h-8 px-4 ${
                              c.is_approved
                                ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"
                            }`}
                          >
                            {actionLoadingId === c.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : c.is_approved ? (
                              "Suspend"
                            ) : (
                              "Approve & Activate"
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: USER ACCOUNTS */}
        {activeTab === "users" && (
          <div className="space-y-5 max-w-7xl mx-auto">
            {/* Search */}
            <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <div className="relative w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                <Input
                  placeholder="Search user by username or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9 bg-zinc-950 border-zinc-800 text-xs rounded-xl h-10 text-white"
                />
              </div>
              <span className="text-xs text-zinc-400">Total accounts: {users.length}</span>
            </div>

            {/* Users Table */}
            <div className="rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="px-5 py-3.5 font-bold">Username</th>
                    <th className="px-5 py-3.5 font-bold">Email Address</th>
                    <th className="px-5 py-3.5 font-bold">Assigned Company</th>
                    <th className="px-5 py-3.5 font-bold">Role</th>
                    <th className="px-5 py-3.5 font-bold">Status</th>
                    <th className="px-5 py-3.5 font-bold text-right">Approval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {users
                    .filter((u) => u.username.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
                    .map((u) => (
                      <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-white flex items-center gap-2">
                          <Users className="w-4 h-4 text-zinc-500" />
                          <span>{u.username}</span>
                          {u.is_superuser && (
                            <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.2 rounded font-bold uppercase">
                              Superuser
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-300 font-mono text-[11px]">{u.email}</td>
                        <td className="px-5 py-3.5 text-zinc-400">{u.company_name || "—"}</td>
                        <td className="px-5 py-3.5 font-bold capitalize text-zinc-300">{u.role.replace("_", " ")}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.is_approved
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {u.is_approved ? "Approved" : "Pending"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleUserApproval(u)}
                            className="rounded-xl text-xs h-7 px-3 border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                          >
                            {u.is_approved ? "Suspend" : "Approve"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: LIVE SUPPORT DESK */}
        {activeTab === "support" && (
          <div className="h-full flex gap-4 max-w-7xl mx-auto rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900/60 min-h-[620px]">
            {/* Left Conversations List */}
            <div className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-900">
              <div className="p-4 border-b border-zinc-800">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-emerald-400" />
                  <span>Support Inbox</span>
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">Companies awaiting support</p>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500">
                    No active support messages yet.
                  </div>
                ) : (
                  conversations.map((c) => {
                    const isSelected = selectedCompanyId === c.company_id;
                    return (
                      <div
                        key={c.company_id}
                        onClick={() => setSelectedCompanyId(c.company_id)}
                        className={`p-4 cursor-pointer transition-all ${
                          isSelected ? "bg-zinc-800 border-l-4 border-emerald-400" : "hover:bg-zinc-800/40"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-white truncate max-w-[170px]">
                            {c.company_name}
                          </span>
                          {c.unread_count > 0 && (
                            <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                              {c.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate">
                          {c.last_message || "Started chat"}
                        </p>
                        <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500">
                          <span>{c.ceo_founder || "Store Owner"}</span>
                          {c.last_message_at && (
                            <span>{new Date(c.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Chat Conversation View */}
            <div className="flex-1 flex flex-col bg-zinc-950">
              {selectedCompany ? (
                <>
                  {/* Chat Top Header */}
                  <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">{selectedCompany.name}</h4>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                            selectedCompany.is_approved
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {selectedCompany.is_approved ? "Approved" : "Pending"}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        CEO: {selectedCompany.ceo_founder || "—"} • TIN: {selectedCompany.tin_number || "—"} • Email:{" "}
                        {selectedCompany.contact_email || "—"}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleToggleCompanyApproval(selectedCompany)}
                      className="rounded-xl text-xs font-bold h-8"
                    >
                      {selectedCompany.is_approved ? "Suspend Account" : "Approve Company"}
                    </Button>
                  </div>

                  {/* Messages Bubble Area */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500">
                        <MessageSquare className="w-8 h-8 mb-2 text-zinc-600" />
                        <p className="font-semibold text-xs">No message history with {selectedCompany.name}.</p>
                        <p className="text-[11px] mt-1 text-zinc-600">Send a greeting below to initiate live help.</p>
                      </div>
                    ) : (
                      chatMessages.map((m, idx) => {
                        const isMe = m.is_admin;
                        const time = m.created_at
                          ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "";

                        return (
                          <div key={m.id || idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            <div className="flex items-center gap-1.5 mb-1 text-[10px] text-zinc-400">
                              <span className="font-bold text-zinc-300">
                                {isMe ? "Super Admin (You)" : m.sender_name || selectedCompany.name}
                              </span>
                              <span>•</span>
                              <span>{time}</span>
                            </div>

                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-md leading-relaxed ${
                                isMe
                                  ? "bg-emerald-600 text-white rounded-br-xs font-medium"
                                  : "bg-zinc-800 text-zinc-100 border border-zinc-700/80 rounded-bl-xs"
                              }`}
                            >
                              {m.message}
                            </div>
                          </div>
                        );
                      })
                    )}

                    {companyTyping && (
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 italic">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>{companyTyping} is typing a message...</span>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Reply Input Bar */}
                  <form onSubmit={handleSendAdminReply} className="p-3.5 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={`Reply to ${selectedCompany.name}...`}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <Button
                      type="submit"
                      disabled={!chatInput.trim()}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 px-4 text-xs gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </Button>
                  </form>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500">
                  <Headphones className="w-10 h-10 mb-3 text-zinc-700" />
                  <p className="font-bold text-sm text-zinc-300">Select a company from the left panel</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                    View real-time messages and chat live with store owners to assist them with account setup or POS issues.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
