"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
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
  UserCheck,
  UserX,
  Paperclip,
  Pencil,
  Check,
  Download,
  ExternalLink,
  X,
  Loader2,
} from "lucide-react";
import api from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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
  client_id?: string;
  company_id?: number | null;
  company?: number | null;
  company_name?: string;
  sender_name: string;
  sender_role?: string;
  message: string;
  attachment?: string | null;
  attachment_url?: string | null;
  is_admin: boolean;
  is_read?: boolean;
  created_at: string;
  updated_at?: string;
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
  const searchParams = useSearchParams();
  const tabQuery = searchParams.get("tab");

  useEffect(() => {
    if (tabQuery === "support") setActiveTab("support");
    else if (tabQuery === "approvals") setActiveTab("approvals");
    else if (tabQuery === "users") setActiveTab("users");
    else if (tabQuery === "overview") setActiveTab("overview");
  }, [tabQuery]);

  // Modal states
  const [companyToSuspend, setCompanyToSuspend] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);
  const [companyEditForm, setCompanyEditForm] = useState({
    name: "",
    ceo_founder: "",
    tin_number: "",
    address: "",
    contact_email: "",
    contact_phone: "",
  });
  const [savingCompanyEdit, setSavingCompanyEdit] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState<PlatformUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<PlatformUser | null>(null);

  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "pending" | "approved">("all");

  // Live Help Chat state
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<SupportMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [companyTyping, setCompanyTyping] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Admin Chat Attachment & Edit states
  const [adminSelectedFile, setAdminSelectedFile] = useState<File | null>(null);
  const [adminFilePreview, setAdminFilePreview] = useState<string | null>(null);
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [adminEditingId, setAdminEditingId] = useState<number | null>(null);
  const [adminEditingText, setAdminEditingText] = useState("");
  const [adminEditLoading, setAdminEditLoading] = useState(false);
  const [adminPreviewImage, setAdminPreviewImage] = useState<string | null>(null);
  const adminFileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Authentication & Permission state
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Load all admin data
  const fetchData = async () => {
    try {
      setLoadingMetrics(true);
      const [metricsRes, compRes, usersRes, convRes] = await Promise.all([
        api.get("/admin/metrics/").catch(() => ({ data: null })),
        api.get("/companies/").catch(() => ({ data: [] })),
        api.get("/users/").catch(() => ({ data: [] })),
        api.get("/support-messages/conversations/").catch(() => ({ data: [] })),
      ]);

      if (metricsRes.data) setMetrics(metricsRes.data);
      if (compRes.data) {
        const compList = Array.isArray(compRes.data) ? compRes.data : compRes.data?.results || [];
        setCompanies(compList);
      }
      if (usersRes.data) {
        const userList = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.results || [];
        setUsers(userList);
      }
      if (convRes.data) {
        const cList = Array.isArray(convRes.data) ? convRes.data : convRes.data?.results || [];
        setConversations(cList);
      }
    } catch (err) {
      console.error("Admin dashboard fetch error:", err);
      toast.error("Failed to refresh admin metrics.");
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    const verifySuperAdmin = async () => {
      try {
        const res = await api.get("/users/me/");
        const isSuper = Boolean(res.data?.is_superuser || res.data?.role === "super_admin");
        if (!isSuper) {
          toast.error("Access Denied: Super Admin privileges are required to view the Admin Hub.");
          router.replace("/");
          return;
        }
        setIsAuthorized(true);
        fetchData();
      } catch (e) {
        toast.error("Session expired or unauthorized.");
        router.replace("/login");
      } finally {
        setCheckingAuth(false);
      }
    };
    verifySuperAdmin();
  }, [router]);

  const selectedCompanyIdRef = useRef<number | null>(null);
  useEffect(() => {
    selectedCompanyIdRef.current = selectedCompanyId;
  }, [selectedCompanyId]);

  // Connect Admin Socket.IO room for instant live monitoring
  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setIsSocketConnected(true);
      socket.emit("join_admin");
      socket.emit("join_admin_hub");
    };

    const onDisconnect = () => setIsSocketConnected(false);

    const onNewMessage = (newMsg: SupportMessage) => {
      const activeId = selectedCompanyIdRef.current;
      const msgCompanyId = newMsg.company_id ?? newMsg.company;

      if (activeId && String(msgCompanyId) === String(activeId)) {
        setChatMessages((prev) => {
          if (newMsg.id && prev.some((m) => m.id === newMsg.id)) {
            return prev.map((m) => (m.id === newMsg.id ? { ...m, ...newMsg } : m));
          }
          if (newMsg.client_id && prev.some((m) => m.client_id === newMsg.client_id)) {
            return prev.map((m) => (m.client_id === newMsg.client_id ? newMsg : m));
          }
          const optimisticIndex = prev.findIndex(
            (m) =>
              !m.id &&
              m.message === newMsg.message &&
              Boolean(m.is_admin) === Boolean(newMsg.is_admin)
          );
          if (optimisticIndex !== -1) {
            const updated = [...prev];
            updated[optimisticIndex] = newMsg;
            return updated;
          }
          return [...prev, newMsg];
        });
      }

      setConversations((prev) => {
        const exists = prev.some((c) => String(c.company_id) === String(msgCompanyId));
        if (!exists && msgCompanyId) {
          return [
            {
              company_id: Number(msgCompanyId),
              company_name: newMsg.company_name || "Company",
              is_approved: true,
              unread_count: 1,
              last_message: newMsg.message || "Sent an attachment",
              last_message_at: newMsg.created_at,
              last_message_is_admin: newMsg.is_admin,
            },
            ...prev,
          ];
        }
        return prev.map((c) => {
          if (String(c.company_id) === String(msgCompanyId)) {
            const isCurrentlySelected = selectedCompanyIdRef.current === c.company_id;
            return {
              ...c,
              last_message: newMsg.message || "Sent an attachment",
              last_message_at: newMsg.created_at,
              last_message_is_admin: newMsg.is_admin,
              unread_count: isCurrentlySelected ? 0 : c.unread_count + 1,
            };
          }
          return c;
        });
      });
    };

    const onUpdateMessage = (updatedMsg: SupportMessage) => {
      const activeId = selectedCompanyIdRef.current;
      const msgCompanyId = updatedMsg.company_id ?? updatedMsg.company;
      if (activeId && String(msgCompanyId) === String(activeId)) {
        setChatMessages((prev) =>
          prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m))
        );
      }
    };

    const onDeleteMessage = (data: { id: number; company_id?: number }) => {
      setChatMessages((prev) => prev.filter((m) => m.id !== data.id));
    };

    const onTyping = (data: { is_admin: boolean; name: string }) => {
      if (!data.is_admin) {
        setCompanyTyping(data.name || "User");
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setCompanyTyping(null), 2500);
      }
    };

    const onCompanyRegistered = (data: { company_id: number; company_name: string }) => {
      toast.info(`🔔 New store registration: "${data.company_name}". Pending approval.`);
      fetchData();
    };

    const onConversationCleared = (data: { company_id: number }) => {
      const activeId = selectedCompanyIdRef.current;
      if (activeId && String(data.company_id) === String(activeId)) {
        setChatMessages([]);
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.company_id === data.company_id
            ? { ...c, last_message: null, last_message_at: null, unread_count: 0 }
            : c
        )
      );
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("new_message", onNewMessage);
    socket.on("update_message", onUpdateMessage);
    socket.on("delete_message", onDeleteMessage);
    socket.on("conversation_cleared", onConversationCleared);
    socket.on("user_typing", onTyping);
    socket.on("company_registered", onCompanyRegistered);

    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("new_message", onNewMessage);
      socket.off("update_message", onUpdateMessage);
      socket.off("delete_message", onDeleteMessage);
      socket.off("conversation_cleared", onConversationCleared);
      socket.off("user_typing", onTyping);
      socket.off("company_registered", onCompanyRegistered);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  // Load chat messages when a company is selected (with auto-sync polling fallback)
  useEffect(() => {
    if (!selectedCompanyId) {
      setChatMessages([]);
      return;
    }

    const fetchCompanyChat = async () => {
      try {
        const res = await api.get(`/support-messages/?company_id=${selectedCompanyId}`);
        const list: SupportMessage[] = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setChatMessages((prev) => {
          const pendingOptimistic = prev.filter(
            (p) =>
              !p.id &&
              !list.some(
                (s) =>
                  (p.client_id && s.client_id === p.client_id) ||
                  (s.message === p.message && Boolean(s.is_admin) === Boolean(p.is_admin))
              )
          );

          if (
            pendingOptimistic.length === 0 &&
            prev.length === list.length &&
            prev.every((p, i) => p.id === list[i].id && p.message === list[i].message)
          ) {
            return prev;
          }

          return [...list, ...pendingOptimistic];
        });

        setConversations((prev) =>
          prev.map((c) => (c.company_id === selectedCompanyId ? { ...c, unread_count: 0 } : c))
        );
      } catch (err) {
        console.error("Failed to load company messages", err);
      }
    };

    fetchCompanyChat();

    // Auto-sync polling every 3.5s so messages are delivered even if customer or socket is offline!
    const pollInterval = setInterval(fetchCompanyChat, 3500);

    return () => clearInterval(pollInterval);
  }, [selectedCompanyId]);

  // Periodic conversations update so new customer messages refresh even when socket is disconnected
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get("/support-messages/conversations/");
        if (res.data) {
          const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
          setConversations(list);
        }
      } catch (err) {}
    };

    const convInterval = setInterval(fetchConversations, 6000);
    return () => clearInterval(convInterval);
  }, []);

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

      setUsers((prev) =>
        prev.map((u) => (u.company === company.id ? { ...u, is_approved: newStatus } : u))
      );

      // Emit socket event so active user receives instant notification without refreshing
      try {
        const socket = getSocket();
        socket.emit("company_approval_changed", {
          company_id: company.id,
          company_name: company.name,
          is_approved: newStatus,
        });
      } catch (e) {}

      toast.success(`${company.name} is now ${newStatus ? "APPROVED & ACTIVATED" : "SUSPENDED"}`);
      fetchData();
    } catch (err) {
      toast.error("Failed to update company approval status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Confirm Suspend Company
  const handleConfirmSuspendCompany = async () => {
    if (!companyToSuspend) return;
    try {
      setActionLoadingId(companyToSuspend.id);
      const res = await api.post(`/companies/${companyToSuspend.id}/approve/`);
      const newStatus = res.data.is_approved;

      setCompanies((prev) =>
        prev.map((c) => (c.id === companyToSuspend.id ? { ...c, is_approved: newStatus } : c))
      );
      setUsers((prev) =>
        prev.map((u) => (u.company === companyToSuspend.id ? { ...u, is_approved: newStatus } : u))
      );

      // Emit socket event so active user receives instant notification
      try {
        const socket = getSocket();
        socket.emit("company_approval_changed", {
          company_id: companyToSuspend.id,
          company_name: companyToSuspend.name,
          is_approved: newStatus,
        });
      } catch (e) {}

      toast.success(`${companyToSuspend.name} is now ${newStatus ? "APPROVED & ACTIVATED" : "SUSPENDED"}`);
      fetchData();
    } catch (err) {
      toast.error("Failed to update company approval status.");
    } finally {
      setActionLoadingId(null);
      setCompanyToSuspend(null);
    }
  };

  // Confirm Delete Company
  const handleConfirmDeleteCompany = async () => {
    if (!companyToDelete) return;
    try {
      await api.delete(`/companies/${companyToDelete.id}/`);
      setCompanies((prev) => prev.filter((c) => c.id !== companyToDelete.id));
      toast.success(`Company "${companyToDelete.name}" deleted.`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete company.");
    } finally {
      setCompanyToDelete(null);
    }
  };

  // Open Edit Company Modal
  const handleOpenEditCompany = (company: Company) => {
    setCompanyToEdit(company);
    setCompanyEditForm({
      name: company.name || "",
      ceo_founder: company.ceo_founder || "",
      tin_number: company.tin_number || "",
      address: company.address || "",
      contact_email: company.contact_email || "",
      contact_phone: company.contact_phone || "",
    });
  };

  // Save Edit Company
  const handleSaveCompanyEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyToEdit) return;
    setSavingCompanyEdit(true);
    try {
      const res = await api.patch(`/companies/${companyToEdit.id}/`, companyEditForm);
      setCompanies((prev) =>
        prev.map((c) => (c.id === companyToEdit.id ? { ...c, ...res.data } : c))
      );
      toast.success(`Company "${companyEditForm.name}" updated successfully.`);
      setCompanyToEdit(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update company details.");
    } finally {
      setSavingCompanyEdit(false);
    }
  };

  // Toggle User Approval directly (or suspend)
  const handleToggleUserApproval = async (user: PlatformUser) => {
    try {
      const res = await api.post(`/users/${user.id}/approve/`);
      const newStatus = res.data.is_approved;

      setUsers((prev) =>
        prev.map((item) => (item.id === user.id ? { ...item, is_approved: newStatus } : item))
      );

      toast.success(`${user.username} is now ${newStatus ? "Active & Approved" : "Suspended"}`);
      fetchData();
    } catch (err) {
      toast.error("Failed to update user approval status.");
    }
  };

  // Confirm Suspend User
  const handleConfirmSuspendUser = async () => {
    if (!userToSuspend) return;
    try {
      const res = await api.post(`/users/${userToSuspend.id}/approve/`);
      const newStatus = res.data.is_approved;

      setUsers((prev) =>
        prev.map((item) => (item.id === userToSuspend.id ? { ...item, is_approved: newStatus } : item))
      );

      toast.success(`${userToSuspend.username} status toggled to: ${newStatus ? "Active" : "Suspended"}`);
      fetchData();
    } catch (err) {
      toast.error("Failed to toggle user status.");
    } finally {
      setUserToSuspend(null);
    }
  };

  // Confirm Delete User
  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/users/${userToDelete.id}/`);
      setUsers((prev) => prev.filter((item) => item.id !== userToDelete.id));
      toast.success(`User "${userToDelete.username}" deleted successfully.`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete user.");
    } finally {
      setUserToDelete(null);
    }
  };

  // File Attachment Handling for Admin
  const handleAdminFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File size exceeds 20MB limit.");
      return;
    }
    setAdminSelectedFile(file);
    if (file.type.startsWith("image/")) {
      setAdminFilePreview(URL.createObjectURL(file));
    } else {
      setAdminFilePreview(null);
    }
  };

  const handleAdminClearFile = () => {
    setAdminSelectedFile(null);
    if (adminFilePreview) {
      URL.revokeObjectURL(adminFilePreview);
      setAdminFilePreview(null);
    }
    if (adminFileInputRef.current) adminFileInputRef.current.value = "";
  };

  // Send Admin Reply (with attachment support)
  const handleSendAdminReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = chatInput.trim();
    if ((!text && !adminSelectedFile) || !selectedCompanyId) return;

    const clientId = `admin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const selectedComp = companies.find((c) => c.id === selectedCompanyId);

    const optimistic: SupportMessage = {
      client_id: clientId,
      company_id: selectedCompanyId,
      company_name: selectedComp?.name || "Company",
      sender_name: "Super Admin",
      sender_role: "super_admin",
      message: text,
      attachment_url: adminFilePreview || null,
      is_admin: true,
      created_at: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, optimistic]);
    setChatInput("");
    const fileToSend = adminSelectedFile;
    handleAdminClearFile();
    setAdminSubmitting(true);

    try {
      if (fileToSend) {
        const formData = new FormData();
        formData.append("company", String(selectedCompanyId));
        formData.append("message", text);
        formData.append("attachment", fileToSend);

        const res = await api.post("/support-messages/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const savedData: SupportMessage = res.data;
        setChatMessages((prev) =>
          prev.map((m) => (m.client_id === clientId ? { ...savedData, client_id: clientId } : m))
        );
      } else {
        const res = await api.post("/support-messages/", {
          company: selectedCompanyId,
          message: text,
        });

        const savedData: SupportMessage = res.data;
        setChatMessages((prev) =>
          prev.map((m) => (m.client_id === clientId ? { ...savedData, client_id: clientId } : m))
        );
      }
    } catch (err) {
      toast.error("Message delivery failed. Check network.");
      setChatMessages((prev) => prev.filter((m) => m.client_id !== clientId));
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleAdminStartEdit = (msg: SupportMessage) => {
    if (!msg.id) return;
    setAdminEditingId(msg.id);
    setAdminEditingText(msg.message);
  };

  const handleAdminCancelEdit = () => {
    setAdminEditingId(null);
    setAdminEditingText("");
  };

  const handleAdminSaveEdit = async (msgId: number) => {
    if (!adminEditingText.trim()) {
      toast.error("Message cannot be empty.");
      return;
    }
    setAdminEditLoading(true);
    try {
      const res = await api.patch(`/support-messages/${msgId}/`, {
        message: adminEditingText.trim(),
      });
      setChatMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, ...res.data } : m))
      );
      setAdminEditingId(null);
      setAdminEditingText("");
      toast.success("Message updated");
    } catch (err) {
      toast.error("Failed to edit message.");
    } finally {
      setAdminEditLoading(false);
    }
  };

  const handleAdminDeleteMessage = async (msgId: number) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      await api.delete(`/support-messages/${msgId}/`);
      setChatMessages((prev) => prev.filter((m) => m.id !== msgId));
      toast.success("Message deleted");
    } catch (err) {
      toast.error("Failed to delete message.");
    }
  };

  const handleClearConversation = async (companyId: number, companyName?: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the entire chat history for "${
          companyName || "this customer"
        }"? This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await api.post("/support-messages/clear_conversation/", { company_id: companyId });
      toast.success(`Entire chat for "${companyName || "Customer"}" deleted.`);
      if (selectedCompanyId === companyId) {
        setChatMessages([]);
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.company_id === companyId
            ? { ...c, last_message: null, last_message_at: null, unread_count: 0 }
            : c
        )
      );
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete chat history.");
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

  if (checkingAuth) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#1b5ebe] animate-spin" />
        <p className="text-xs text-gray-500 font-medium">Verifying administrator authorization...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="space-y-6 pb-12 text-gray-900">
      {/* Top Admin Header Card */}
      <header className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1b5ebe] shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-gray-900">Super Admin Command Center</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-blue-50 text-[#1b5ebe] border border-blue-200 uppercase">
                Platform Root
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Multi-tenant approvals, platform revenue monitoring, and real-time merchant support
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Socket.IO status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs">
            <span className={`w-2 h-2 rounded-full ${isSocketConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span className="text-[11px] font-medium text-gray-600">
              {isSocketConnected ? "Live Socket Active" : "Connecting..."}
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchData}
            disabled={loadingMetrics}
            className="rounded-xl border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs gap-1.5 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingMetrics ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>
      </header>

      {/* Admin Navigation Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-2 ${
            activeTab === "overview"
              ? "bg-white text-gray-900 border-t-2 border-[#1b5ebe] border-x border-gray-200 shadow-sm"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/60"
          }`}
        >
          <TrendingUp className="w-4 h-4 text-[#1b5ebe]" />
          <span>System Overview & Sales</span>
        </button>

        <button
          onClick={() => setActiveTab("approvals")}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-2 relative ${
            activeTab === "approvals"
              ? "bg-white text-gray-900 border-t-2 border-[#1b5ebe] border-x border-gray-200 shadow-sm"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/60"
          }`}
        >
          <Building2 className="w-4 h-4 text-indigo-500" />
          <span>Company Approvals</span>
          {metrics?.pending_companies > 0 && (
            <span className="bg-amber-500 text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full">
              {metrics.pending_companies}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-2 ${
            activeTab === "users"
              ? "bg-white text-gray-900 border-t-2 border-[#1b5ebe] border-x border-gray-200 shadow-sm"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/60"
          }`}
        >
          <Users className="w-4 h-4 text-cyan-600" />
          <span>User Accounts</span>
          <span className="bg-gray-100 text-gray-600 font-semibold text-[10px] px-1.5 py-0.2 rounded-full">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("support")}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-2 relative ${
            activeTab === "support"
              ? "bg-white text-gray-900 border-t-2 border-[#1b5ebe] border-x border-gray-200 shadow-sm"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/60"
          }`}
        >
          <Headphones className="w-4 h-4 text-emerald-600" />
          <span>Live Support Desk</span>
          {metrics?.unread_support > 0 && (
            <span className="bg-emerald-500 text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full">
              {metrics.unread_support}
            </span>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div>
        {/* TAB 1: OVERVIEW & MONITORING */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Total Companies</span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{metrics?.total_companies ?? companies.length}</div>
                <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-1.5">
                  <span className="text-emerald-600 font-semibold">{metrics?.approved_companies ?? 0} Approved</span>
                  <span>•</span>
                  <span className="text-amber-600 font-semibold">{metrics?.pending_companies ?? 0} Pending</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Platform Users</span>
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {metrics?.total_company_users ?? users.length}
                </div>
                <div className="mt-2 text-[11px] text-gray-500">
                  <span className="text-gray-700 font-medium">{users.filter((u) => u.is_approved).length} Active accounts</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Platform Revenue</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-600 truncate">
                  RWF {Number(metrics?.total_transaction_amount || metrics?.total_revenue || 0).toLocaleString()}
                </div>
                <div className="mt-2 text-[11px] text-gray-500 truncate">
                  Across all registered stores
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Pending Approvals</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <BadgeAlert className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-600">{metrics?.pending_companies ?? 0}</div>
                <div className="mt-2 text-[11px] text-gray-500">
                  {metrics?.pending_companies > 0 ? (
                    <button
                      onClick={() => {
                        setActiveTab("approvals");
                        setCompanyFilter("pending");
                      }}
                      className="text-amber-700 font-semibold hover:underline flex items-center gap-1"
                    >
                      Review requests <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <span className="text-emerald-600 font-medium">All companies reviewed</span>
                  )}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Help Desk Inquiries</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1b5ebe] flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{metrics?.unread_support ?? conversations.length}</div>
                <div className="mt-2 text-[11px] text-gray-500">
                  <button
                    onClick={() => setActiveTab("support")}
                    className="text-[#1b5ebe] font-semibold hover:underline flex items-center gap-1"
                  >
                    Open Live Help <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Registrations & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Company Registrations */}
              <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" /> Recent Company Registrations
                  </h3>
                  <button
                    onClick={() => setActiveTab("approvals")}
                    className="text-xs text-[#1b5ebe] hover:underline font-semibold"
                  >
                    View All ({companies.length})
                  </button>
                </div>

                <div className="space-y-3">
                  {companies.slice(0, 5).map((comp) => (
                    <div
                      key={comp.id}
                      className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-xs text-gray-900 flex items-center gap-2">
                          <span>{comp.name}</span>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                              comp.is_approved
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {comp.is_approved ? "Approved" : "Pending"}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {comp.ceo_founder || "Owner"} • TIN: {comp.tin_number || "—"}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleToggleCompanyApproval(comp)}
                        className={`rounded-xl text-xs font-semibold h-8 px-3 ${
                          comp.is_approved
                            ? "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                      >
                        {comp.is_approved ? "Suspend" : "Approve"}
                      </Button>
                    </div>
                  ))}
                  {companies.length === 0 && (
                    <p className="text-xs text-gray-400 py-6 text-center">No companies registered yet.</p>
                  )}
                </div>
              </div>

              {/* Recent Users */}
              <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-600" /> Platform User Accounts
                  </h3>
                  <button
                    onClick={() => setActiveTab("users")}
                    className="text-xs text-[#1b5ebe] hover:underline font-semibold"
                  >
                    View All ({users.length})
                  </button>
                </div>

                <div className="space-y-3">
                  {users.slice(0, 5).map((u) => (
                    <div
                      key={u.id}
                      className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-xs text-gray-900 flex items-center gap-2">
                          <span>{u.username}</span>
                          {u.is_superuser && (
                            <span className="text-[9px] bg-blue-50 text-[#1b5ebe] px-1.5 py-0.2 rounded font-bold uppercase border border-blue-200">
                              Admin
                            </span>
                          )}
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                              u.is_approved
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {u.is_approved ? "Active" : "Pending"}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {u.email} • {u.company_name || "Independent"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (u.is_approved) {
                              setUserToSuspend(u);
                            } else {
                              handleToggleUserApproval(u);
                            }
                          }}
                          className={`rounded-xl text-xs font-semibold h-8 px-3 ${
                            u.is_approved
                              ? "border-gray-200 bg-white hover:bg-gray-100 text-gray-700"
                              : "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {u.is_approved ? "Suspend" : "Approve"}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <p className="text-xs text-gray-400 py-6 text-center">No users registered yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMPANY APPROVALS */}
        {activeTab === "approvals" && (
          <div className="space-y-5">
            {/* Search & Filters */}
            <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search by company name, TIN, email..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="pl-9 bg-gray-50 border-gray-200 text-xs rounded-xl h-10 text-gray-900"
                />
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  onClick={() => setCompanyFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    companyFilter === "all" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  All ({companies.length})
                </button>
                <button
                  onClick={() => setCompanyFilter("pending")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    companyFilter === "pending"
                      ? "bg-amber-600 text-white"
                      : "text-amber-700 bg-amber-50 hover:bg-amber-100"
                  }`}
                >
                  Pending ({companies.filter((c) => !c.is_approved).length})
                </button>
                <button
                  onClick={() => setCompanyFilter("approved")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    companyFilter === "approved"
                      ? "bg-emerald-600 text-white"
                      : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                  }`}
                >
                  Approved ({companies.filter((c) => c.is_approved).length})
                </button>
              </div>
            </div>

            {/* Companies Table */}
            <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3.5 font-bold">Company / Business</th>
                      <th className="px-5 py-3.5 font-bold">Owner / CEO</th>
                      <th className="px-5 py-3.5 font-bold">TIN Number</th>
                      <th className="px-5 py-3.5 font-bold">Contact Info</th>
                      <th className="px-5 py-3.5 font-bold text-center">Users</th>
                      <th className="px-5 py-3.5 font-bold">Platform Volume</th>
                      <th className="px-5 py-3.5 font-bold">Status</th>
                      <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCompanies.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                          No companies match the filter.
                        </td>
                      </tr>
                    ) : (
                      filteredCompanies.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="px-5 py-4 font-semibold text-gray-900">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span>{c.name}</span>
                            </div>
                            {c.address && <p className="text-[10px] text-gray-400 mt-0.5">{c.address}</p>}
                          </td>
                          <td className="px-5 py-4 text-gray-700 font-medium">
                            {c.ceo_founder || "—"}
                          </td>
                          <td className="px-5 py-4 font-mono text-gray-600">
                            {c.tin_number ? (
                              <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px] font-bold text-gray-800">
                                {c.tin_number}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-5 py-4 text-gray-600">
                            <div>{c.contact_email || "—"}</div>
                            <div className="text-[11px] text-gray-400">{c.contact_phone || ""}</div>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
                              <Users className="w-3 h-3" />
                              {c.users_count || 0}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-bold text-emerald-700 text-xs">
                              RWF {Number(c.total_transactions_amount || 0).toLocaleString()}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {c.total_sales_count || 0} sales
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                                c.is_approved
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {c.is_approved ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {c.is_approved ? "Approved" : "Pending"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEditCompany(c)}
                                className="h-8 w-8 p-0 rounded-xl text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                title="Edit Company Details"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                disabled={actionLoadingId === c.id}
                                onClick={() => {
                                  if (c.is_approved) {
                                    setCompanyToSuspend(c);
                                  } else {
                                    handleToggleCompanyApproval(c);
                                  }
                                }}
                                className={`rounded-xl text-xs font-semibold h-8 px-3 ${
                                  c.is_approved
                                    ? "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
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

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setCompanyToDelete(c)}
                                className="h-8 w-8 p-0 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                                title="Delete Company"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: USER ACCOUNTS */}
        {activeTab === "users" && (
          <div className="space-y-5">
            {/* Search & Filters */}
            <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search user by username, email, company..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9 bg-gray-50 border-gray-200 text-xs rounded-xl h-10 text-gray-900"
                />
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  onClick={() => setUserFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    userFilter === "all" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  All ({users.length})
                </button>
                <button
                  onClick={() => setUserFilter("pending")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    userFilter === "pending"
                      ? "bg-amber-600 text-white"
                      : "text-amber-700 bg-amber-50 hover:bg-amber-100"
                  }`}
                >
                  Pending ({users.filter((u) => !u.is_approved).length})
                </button>
                <button
                  onClick={() => setUserFilter("approved")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    userFilter === "approved"
                      ? "bg-emerald-600 text-white"
                      : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                  }`}
                >
                  Active ({users.filter((u) => u.is_approved).length})
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3.5 font-bold">Username</th>
                      <th className="px-5 py-3.5 font-bold">Email Address</th>
                      <th className="px-5 py-3.5 font-bold">Assigned Company</th>
                      <th className="px-5 py-3.5 font-bold">Role</th>
                      <th className="px-5 py-3.5 font-bold">Status</th>
                      <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users
                      .filter((u) => {
                        const term = userSearch.toLowerCase().trim();
                        const matchesSearch =
                          !term ||
                          u.username.toLowerCase().includes(term) ||
                          u.email.toLowerCase().includes(term) ||
                          (u.company_name && u.company_name.toLowerCase().includes(term));
                        if (!matchesSearch) return false;

                        if (userFilter === "pending") return !u.is_approved;
                        if (userFilter === "approved") return u.is_approved;
                        return true;
                      })
                      .map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="px-5 py-3.5 font-semibold text-gray-900 flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span>{u.username}</span>
                            {u.is_superuser && (
                              <span className="text-[9px] bg-blue-50 text-[#1b5ebe] px-1.5 py-0.2 rounded font-bold uppercase border border-blue-200">
                                Superuser
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-gray-600 font-mono text-[11px]">{u.email}</td>
                          <td className="px-5 py-3.5 text-gray-600">{u.company_name || "—"}</td>
                          <td className="px-5 py-3.5 font-semibold capitalize text-gray-700">
                            {u.role ? u.role.replace("_", " ") : "User"}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                u.is_approved
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {u.is_approved ? "Active" : "Pending Approval"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (u.is_approved) {
                                    setUserToSuspend(u);
                                  } else {
                                    handleToggleUserApproval(u);
                                  }
                                }}
                                className={`rounded-xl text-xs font-semibold h-7 px-3 ${
                                  u.is_approved
                                    ? "border-gray-200 bg-white hover:bg-gray-100 text-gray-700"
                                    : "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {u.is_approved ? "Suspend" : "Approve"}
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setUserToDelete(u)}
                                className="h-7 w-7 p-0 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                                title="Delete User"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                          No users registered.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LIVE SUPPORT DESK */}
        {activeTab === "support" && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
            {/* Left Conversations List */}
            <div className="w-full md:w-80 border-r border-gray-200 flex flex-col bg-gray-50/50">
              <div className="p-4 border-b border-gray-200 bg-white">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-[#1b5ebe]" />
                  <span>Support Inbox</span>
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Companies awaiting support</p>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400">
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
                          isSelected ? "bg-white border-l-4 border-[#1b5ebe] shadow-xs" : "hover:bg-gray-100/60"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs text-gray-900 truncate max-w-[150px]">
                            {c.company_name}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {c.unread_count > 0 && (
                              <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                                {c.unread_count}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClearConversation(c.company_id, c.company_name);
                              }}
                              className="text-gray-300 hover:text-red-600 p-0.5 rounded transition-colors"
                              title="Delete customer chat"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">
                          {c.last_message || "Started chat"}
                        </p>
                        <div className="mt-1 flex items-center justify-between text-[10px] text-gray-400">
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
            <div className="flex-1 flex flex-col bg-white">
              {selectedCompany ? (
                <>
                  {/* Chat Top Header */}
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-gray-900">{selectedCompany.name}</h4>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                            selectedCompany.is_approved
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {selectedCompany.is_approved ? "Approved" : "Pending"}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Owner: {selectedCompany.ceo_founder || "—"} • TIN: {selectedCompany.tin_number || "—"} • Email:{" "}
                        {selectedCompany.contact_email || "—"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleClearConversation(selectedCompany.id, selectedCompany.name)}
                        className="rounded-xl text-xs font-semibold h-8 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                        title="Delete entire chat history for this customer"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1 text-red-500" />
                        Delete Customer Chat
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleCompanyApproval(selectedCompany)}
                        className="rounded-xl text-xs font-semibold h-8"
                      >
                        {selectedCompany.is_approved ? "Suspend Account" : "Approve Company"}
                      </Button>
                    </div>
                  </div>

                  {/* Messages Bubble Area */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-gray-50/30">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-12">
                        <MessageSquare className="w-8 h-8 mb-2 text-gray-300" />
                        <p className="font-semibold text-xs text-gray-600">No message history with {selectedCompany.name}.</p>
                        <p className="text-[11px] mt-1 text-gray-400">Send a greeting below to initiate live help.</p>
                      </div>
                    ) : (
                      chatMessages.map((m, idx) => {
                        const isMe = m.is_admin;
                        const time = m.created_at
                          ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "";
                        const isEditingThis = adminEditingId === m.id;
                        const hasImage = m.attachment_url && /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(m.attachment_url);
                        const hasFile = m.attachment_url && !hasImage;

                        return (
                          <div
                            key={m.id ? `msg-${m.id}` : m.client_id || `idx-${idx}`}
                            className={`group flex flex-col ${isMe ? "items-end" : "items-start"}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 text-[10px] text-gray-400">
                              <span className="font-semibold text-gray-600">
                                {isMe ? "Super Admin (You)" : m.sender_name || selectedCompany.name}
                              </span>
                              <span>•</span>
                              <span>{time}</span>
                              {m.updated_at && m.updated_at !== m.created_at && (
                                <span className="italic text-[9px] text-gray-400">(edited)</span>
                              )}
                            </div>

                            <div className="relative max-w-[75%]">
                              {isEditingThis ? (
                                <div className="bg-white border border-blue-400 rounded-xl p-2.5 shadow-md w-72">
                                  <textarea
                                    value={adminEditingText}
                                    onChange={(e) => setAdminEditingText(e.target.value)}
                                    rows={2}
                                    className="w-full text-xs text-gray-900 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-[#1b5ebe]"
                                  />
                                  <div className="flex items-center justify-end gap-1.5 mt-2">
                                    <button
                                      type="button"
                                      onClick={handleAdminCancelEdit}
                                      disabled={adminEditLoading}
                                      className="px-2 py-1 text-[11px] text-gray-500 hover:text-gray-700 rounded"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleAdminSaveEdit(m.id!)}
                                      disabled={adminEditLoading || !adminEditingText.trim()}
                                      className="px-2.5 py-1 text-[11px] bg-[#1b5ebe] text-white rounded font-medium flex items-center gap-1 disabled:opacity-50"
                                    >
                                      {adminEditLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className={`rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                                    isMe
                                      ? "bg-[#1b5ebe] text-white rounded-br-xs font-medium"
                                      : "bg-white text-gray-900 border border-gray-200 rounded-bl-xs"
                                  }`}
                                >
                                  {/* Attached Image */}
                                  {hasImage && m.attachment_url && (
                                    <div className="mb-2 relative group/img overflow-hidden rounded-lg border border-black/10">
                                      <img
                                        src={m.attachment_url}
                                        alt="Attachment"
                                        onClick={() => setAdminPreviewImage(m.attachment_url!)}
                                        className="max-h-48 w-full object-cover rounded cursor-pointer hover:opacity-95 transition-opacity"
                                      />
                                      <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/60 backdrop-blur-xs rounded-md p-1">
                                        <a
                                          href={m.attachment_url}
                                          download
                                          target="_blank"
                                          rel="noreferrer"
                                          title="Download image"
                                          onClick={(e) => e.stopPropagation()}
                                          className="text-white hover:text-blue-300 p-0.5"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                        </a>
                                      </div>
                                    </div>
                                  )}

                                  {/* Attached Document File */}
                                  {hasFile && m.attachment_url && (
                                    <div
                                      className={`flex items-center gap-2 p-2 rounded-lg mb-2 text-[11px] font-medium border ${
                                        isMe
                                          ? "bg-white/10 text-white border-white/20"
                                          : "bg-gray-100 text-gray-800 border-gray-200"
                                      }`}
                                    >
                                      <FileText className="w-4 h-4 shrink-0" />
                                      <a
                                        href={m.attachment_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="truncate flex-1 hover:underline"
                                      >
                                        {m.attachment_url.split("/").pop()}
                                      </a>
                                      <a
                                        href={m.attachment_url}
                                        download
                                        target="_blank"
                                        rel="noreferrer"
                                        title="Download file"
                                        className={`p-1 rounded transition-colors ${
                                          isMe
                                            ? "hover:bg-white/20 text-white"
                                            : "hover:bg-gray-200 text-gray-600"
                                        }`}
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </a>
                                    </div>
                                  )}

                                  {m.message && <p className="whitespace-pre-wrap">{m.message}</p>}
                                </div>
                              )}

                              {/* Hover Action Buttons */}
                              {m.id && !isEditingThis && (
                                <div
                                  className={`absolute top-1 ${
                                    isMe ? "-left-14" : "-right-14"
                                  } hidden group-hover:flex items-center gap-1 bg-white border border-gray-200 shadow-md rounded-md p-0.5 z-10`}
                                >
                                  {isMe && (
                                    <button
                                      onClick={() => handleAdminStartEdit(m)}
                                      title="Edit message"
                                      className="p-1 text-gray-500 hover:text-[#1b5ebe] rounded transition-colors"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleAdminDeleteMessage(m.id!)}
                                    title="Delete message"
                                    className="p-1 text-gray-500 hover:text-red-600 rounded transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}

                    {companyTyping && (
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 italic">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>{companyTyping} is typing a message...</span>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Attachment Preview Banner */}
                  {adminSelectedFile && (
                    <div className="px-4 py-2 bg-blue-50/80 border-t border-blue-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        {adminFilePreview ? (
                          <img
                            src={adminFilePreview}
                            alt="preview"
                            className="w-7 h-7 object-cover rounded border border-blue-200 shrink-0"
                          />
                        ) : (
                          <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                        )}
                        <span className="truncate font-medium text-gray-800">
                          {adminSelectedFile.name}
                        </span>
                        <span className="text-[10px] text-gray-500 shrink-0">
                          ({(adminSelectedFile.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAdminClearFile}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Reply Input Bar */}
                  <form onSubmit={handleSendAdminReply} className="p-3.5 bg-white border-t border-gray-200 flex items-center gap-2">
                    <input
                      type="file"
                      ref={adminFileInputRef}
                      onChange={handleAdminFileChange}
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => adminFileInputRef.current?.click()}
                      title="Attach image or file"
                      className="h-10 w-10 rounded-xl border border-gray-200 hover:border-gray-300 text-gray-500 hover:text-[#1b5ebe] flex items-center justify-center transition-colors shrink-0"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={`Reply to ${selectedCompany.name}...`}
                      disabled={adminSubmitting}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1b5ebe]"
                    />
                    <Button
                      type="submit"
                      disabled={adminSubmitting || (!chatInput.trim() && !adminSelectedFile)}
                      className="rounded-xl bg-[#1b5ebe] hover:bg-blue-700 text-white font-semibold h-10 px-4 text-xs gap-1.5 shrink-0"
                    >
                      {adminSubmitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Reply</span>
                        </>
                      )}
                    </Button>
                  </form>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
                  <Headphones className="w-10 h-10 mb-3 text-gray-300" />
                  <p className="font-semibold text-sm text-gray-700">Select a company from the left panel</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm">
                    View real-time messages and chat live with store owners to assist them with account setup or POS inquiries.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Company Suspend Modal ─── */}
      <AlertDialog open={!!companyToSuspend} onOpenChange={(open) => !open && setCompanyToSuspend(null)}>
        <AlertDialogContent className="bg-white rounded-2xl max-w-md">
          <AlertDialogHeader>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-gray-900">
              Suspend Company: {companyToSuspend?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500 leading-relaxed">
              Are you sure you want to suspend this company? All users belonging to this business will be temporarily blocked from signing into Ziga POS.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel className="rounded-xl text-xs font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSuspendCompany} className="rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white">
              Confirm Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Company Delete Modal ─── */}
      <AlertDialog open={!!companyToDelete} onOpenChange={(open) => !open && setCompanyToDelete(null)}>
        <AlertDialogContent className="bg-white rounded-2xl max-w-md">
          <AlertDialogHeader>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-2">
              <Trash2 className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-gray-900">
              Delete Company: {companyToDelete?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500 leading-relaxed">
              Are you sure you want to permanently delete this business? This action cannot be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel className="rounded-xl text-xs font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteCompany} className="rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white">
              Delete Company
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Company Edit Modal ─── */}
      <Dialog open={!!companyToEdit} onOpenChange={(open) => !open && setCompanyToEdit(null)}>
        <DialogContent className="bg-white rounded-2xl max-w-lg">
          <form onSubmit={handleSaveCompanyEdit}>
            <DialogHeader className="border-b border-gray-100 pb-3">
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Edit Company: {companyToEdit?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="admin_company_name" className="font-semibold text-gray-700">
                  Company / Store Name *
                </Label>
                <Input
                  id="admin_company_name"
                  value={companyEditForm.name}
                  onChange={(e) =>
                    setCompanyEditForm({ ...companyEditForm, name: e.target.value })
                  }
                  required
                  className="rounded-xl border-gray-200 text-xs h-10"
                  placeholder="e.g. Acme Supermarket"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="admin_ceo_founder" className="font-semibold text-gray-700">
                    Owner / CEO
                  </Label>
                  <Input
                    id="admin_ceo_founder"
                    value={companyEditForm.ceo_founder}
                    onChange={(e) =>
                      setCompanyEditForm({ ...companyEditForm, ceo_founder: e.target.value })
                    }
                    className="rounded-xl border-gray-200 text-xs h-10"
                    placeholder="Owner name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="admin_tin_number" className="font-semibold text-gray-700">
                    TIN / Tax Number
                  </Label>
                  <Input
                    id="admin_tin_number"
                    value={companyEditForm.tin_number}
                    onChange={(e) =>
                      setCompanyEditForm({ ...companyEditForm, tin_number: e.target.value })
                    }
                    className="rounded-xl border-gray-200 text-xs h-10"
                    placeholder="e.g. 109283746"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin_address" className="font-semibold text-gray-700">
                  Business Address / Location
                </Label>
                <Input
                  id="admin_address"
                  value={companyEditForm.address}
                  onChange={(e) =>
                    setCompanyEditForm({ ...companyEditForm, address: e.target.value })
                  }
                  className="rounded-xl border-gray-200 text-xs h-10"
                  placeholder="e.g. Downtown Kigali, Rwanda"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="admin_email" className="font-semibold text-gray-700">
                    Contact Email
                  </Label>
                  <Input
                    id="admin_email"
                    type="email"
                    value={companyEditForm.contact_email}
                    onChange={(e) =>
                      setCompanyEditForm({ ...companyEditForm, contact_email: e.target.value })
                    }
                    className="rounded-xl border-gray-200 text-xs h-10"
                    placeholder="contact@company.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="admin_phone" className="font-semibold text-gray-700">
                    Contact Phone
                  </Label>
                  <Input
                    id="admin_phone"
                    value={companyEditForm.contact_phone}
                    onChange={(e) =>
                      setCompanyEditForm({ ...companyEditForm, contact_phone: e.target.value })
                    }
                    className="rounded-xl border-gray-200 text-xs h-10"
                    placeholder="e.g. +250 788 123 456"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="border-t border-gray-100 pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl text-xs font-semibold"
                onClick={() => setCompanyToEdit(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingCompanyEdit}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 text-xs font-semibold shadow-sm"
              >
                {savingCompanyEdit ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── User Suspend Modal ─── */}
      <AlertDialog open={!!userToSuspend} onOpenChange={(open) => !open && setUserToSuspend(null)}>
        <AlertDialogContent className="bg-white rounded-2xl max-w-md">
          <AlertDialogHeader>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-gray-900">
              Suspend User: {userToSuspend?.username}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500 leading-relaxed">
              Are you sure you want to suspend user "{userToSuspend?.username}" ({userToSuspend?.email})? They will be blocked from accessing the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel className="rounded-xl text-xs font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSuspendUser} className="rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white">
              Confirm Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── User Delete Modal ─── */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent className="bg-white rounded-2xl max-w-md">
          <AlertDialogHeader>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-2">
              <Trash2 className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-gray-900">
              Delete User: {userToDelete?.username}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500 leading-relaxed">
              Are you sure you want to permanently delete user "{userToDelete?.username}" ({userToDelete?.email})? This action cannot be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel className="rounded-xl text-xs font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteUser} className="rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Full-Size Attachment Image Modal ─── */}
      <AnimatePresence>
        {adminPreviewImage && (
          <div
            onClick={() => setAdminPreviewImage(null)}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] bg-transparent flex flex-col items-center"
            >
              <button
                onClick={() => setAdminPreviewImage(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 p-1"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={adminPreviewImage}
                alt="Enlarged attachment"
                className="max-h-[85vh] w-auto rounded-xl object-contain shadow-2xl"
              />
              <div className="mt-3 flex items-center gap-2">
                <a
                  href={adminPreviewImage}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1b5ebe] text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Image
                </a>
                <a
                  href={adminPreviewImage}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-white text-xs hover:bg-white/30 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open original
                </a>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}