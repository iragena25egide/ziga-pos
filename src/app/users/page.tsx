"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  Building2,
  User,
  Clock,
  RefreshCw,
  Plus,
  Trash2,
  Lock,
  SlidersHorizontal,
  AlertTriangle,
  UserCheck,
  KeyRound,
  Shield,
  Eye,
  Check,
  X,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useRouter } from "next/navigation";
import {
  UserPermissions,
  getUserPermissions,
  saveUserPermissions,
  CASHIER_PERMISSIONS,
  SALES_ONLY_PERMISSIONS,
  MANAGER_PERMISSIONS,
  ADMIN_PERMISSIONS,
} from "@/lib/permissions";

export default function UsersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved">("all");
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Modal states
  const [userToSuspend, setUserToSuspend] = useState<any | null>(null);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);

  // Create Staff / Add Member Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "cashier", // "cashier" | "sales" | "manager" | "custom"
  });

  // Edit Permissions Modal state
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [permissionsForm, setPermissionsForm] = useState<UserPermissions>(CASHIER_PERMISSIONS);
  const [savingPermissions, setSavingPermissions] = useState(false);

  const isSuper = Boolean(currentUser?.is_superuser || currentUser?.role === "super_admin");
  const isCompanyAdmin = Boolean(
    currentUser?.role === "company_admin" ||
    currentUser?.role === "owner" ||
    currentUser?.role === "admin" ||
    currentUser?.company != null
  );

  const myCompanyId = currentUser?.company?.id ?? currentUser?.company;
  const myCompanyName = currentUser?.company_name || currentUser?.company?.name || "My Store";

  useEffect(() => {
    checkPermissionAndFetch();
  }, []);

  const fetchUsers = async (userObj?: any) => {
    const user = userObj || currentUser;
    if (!user) return;

    try {
      const isSuperUser = Boolean(user.is_superuser || user.role === "super_admin");
      const res = await api.get("/users/").catch(() => ({ data: [] }));
      const apiUsers = Array.isArray(res.data) ? res.data : res.data?.results || [];

      // Load local staff accounts if any
      const compId = user.company?.id ?? user.company;
      let localStaff: any[] = [];
      if (typeof window !== "undefined" && compId) {
        try {
          const stored = localStorage.getItem(`ziga_local_company_users_${compId}`);
          if (stored) {
            localStaff = JSON.parse(stored);
          }
        } catch {
          // ignore
        }
      }

      // Merge API users and local staff
      const combined = [...apiUsers];
      for (const localUser of localStaff) {
        if (!combined.some((u) => u.id === localUser.id || u.username === localUser.username)) {
          combined.push(localUser);
        }
      }

      if (isSuperUser) {
        setUsersList(combined);
      } else {
        // Filter to users belonging to this company
        const filtered = combined.filter((u) => {
          const uCompId = u.company?.id ?? u.company;
          const uCompName = (u.company_name || u.company?.name || "").toLowerCase();
          const targetName = (user.company_name || user.company?.name || "").toLowerCase();

          return (
            (compId && uCompId === compId) ||
            (targetName && uCompName === targetName) ||
            u.id === user.id
          );
        });
        setUsersList(filtered);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to refresh user list.");
    }
  };

  const checkPermissionAndFetch = async () => {
    setLoading(true);
    try {
      const meRes = await api.get("/users/me/");
      setCurrentUser(meRes.data);

      const superCheck = Boolean(meRes.data?.is_superuser || meRes.data?.role === "super_admin");
      const companyAdminCheck = Boolean(
        meRes.data?.role === "company_admin" ||
        meRes.data?.role === "owner" ||
        meRes.data?.role === "admin" ||
        meRes.data?.company != null
      );

      if (!superCheck && !companyAdminCheck) {
        toast.error("Access restricted: You do not have permission to manage team accounts.");
        router.replace("/");
        return;
      }

      await fetchUsers(meRes.data);
    } catch (err) {
      toast.error("Failed to load user accounts.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (preset: "cashier" | "sales" | "manager" | "admin") => {
    if (preset === "cashier") {
      setPermissionsForm(CASHIER_PERMISSIONS);
    } else if (preset === "sales") {
      setPermissionsForm(SALES_ONLY_PERMISSIONS);
    } else if (preset === "manager") {
      setPermissionsForm(MANAGER_PERMISSIONS);
    } else {
      setPermissionsForm(ADMIN_PERMISSIONS);
    }
  };

  const handleOpenCreateModal = () => {
    setCreateForm({
      username: "",
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      role: "cashier",
    });
    setPermissionsForm(CASHIER_PERMISSIONS);
    setIsCreateModalOpen(true);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.username.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      toast.error("Please fill in Username, Email, and Password.");
      return;
    }

    setCreatingStaff(true);
    try {
      const payload: any = {
        username: createForm.username.trim(),
        first_name: createForm.first_name.trim(),
        last_name: createForm.last_name.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
        is_approved: true,
      };

      if (myCompanyId) {
        payload.company = myCompanyId;
        payload.company_name = myCompanyName;
      }

      let createdUser: any = null;

      // Try creating via API
      try {
        const res = await api.post("/users/", payload);
        createdUser = res.data;
      } catch (apiErr) {
        // Fallback: create locally and attach to company
        const tempId = Date.now();
        createdUser = {
          id: tempId,
          ...payload,
          company: myCompanyId,
          company_name: myCompanyName,
          is_approved: true,
          created_at: new Date().toISOString(),
        };

        if (typeof window !== "undefined" && myCompanyId) {
          const currentLocal = JSON.parse(
            localStorage.getItem(`ziga_local_company_users_${myCompanyId}`) || "[]"
          );
          currentLocal.push(createdUser);
          localStorage.setItem(
            `ziga_local_company_users_${myCompanyId}`,
            JSON.stringify(currentLocal)
          );
        }
      }

      // Save custom permissions
      if (createdUser?.id) {
        saveUserPermissions(createdUser.id, permissionsForm);
      }

      toast.success(`Account for ${createForm.username} created with customized permissions!`);
      setIsCreateModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create staff account.");
    } finally {
      setCreatingStaff(false);
    }
  };

  const handleOpenEditPermissions = (user: any) => {
    setEditingUser(user);
    const existing = getUserPermissions(user);
    setPermissionsForm(existing);
  };

  const handleSavePermissions = () => {
    if (!editingUser) return;
    setSavingPermissions(true);
    try {
      saveUserPermissions(editingUser.id, permissionsForm);

      // Attempt to save to backend as well
      api.patch(`/users/${editingUser.id}/`, { permissions: permissionsForm }).catch(() => {});

      toast.success(`Permissions updated for ${editingUser.username}!`);
      setEditingUser(null);
      fetchUsers();
    } catch {
      toast.error("Failed to update permissions.");
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleToggleApproval = async (user: any) => {
    setProcessingId(user.id);
    const newStatus = !user.is_approved;
    try {
      try {
        await api.post(`/users/${user.id}/approve/`);
      } catch (e) {
        await api.patch(`/users/${user.id}/`, { is_approved: newStatus });
      }

      // Update in state and local storage if present
      setUsersList((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_approved: newStatus } : u))
      );

      if (typeof window !== "undefined" && myCompanyId) {
        const stored = localStorage.getItem(`ziga_local_company_users_${myCompanyId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          const updated = parsed.map((u: any) =>
            u.id === user.id ? { ...u, is_approved: newStatus } : u
          );
          localStorage.setItem(
            `ziga_local_company_users_${myCompanyId}`,
            JSON.stringify(updated)
          );
        }
      }

      toast.success(
        `${user.username} is now ${newStatus ? "Approved & Active" : "Suspended"}.`
      );
    } catch (err) {
      toast.error("Failed to update user status.");
    } finally {
      setProcessingId(null);
      setUserToSuspend(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setProcessingId(userToDelete.id);
    try {
      try {
        await api.delete(`/users/${userToDelete.id}/`);
      } catch (e) {
        // local delete fallback
      }

      setUsersList((prev) => prev.filter((u) => u.id !== userToDelete.id));

      if (typeof window !== "undefined" && myCompanyId) {
        const stored = localStorage.getItem(`ziga_local_company_users_${myCompanyId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          const updated = parsed.filter((u: any) => u.id !== userToDelete.id);
          localStorage.setItem(
            `ziga_local_company_users_${myCompanyId}`,
            JSON.stringify(updated)
          );
        }
      }

      toast.success(`User "${userToDelete.username}" has been removed.`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete user.");
    } finally {
      setProcessingId(null);
      setUserToDelete(null);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (u.username && u.username.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.company_name && u.company_name.toLowerCase().includes(term)) ||
      (u.first_name && u.first_name.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (activeTab === "pending") return !u.is_approved;
    if (activeTab === "approved") return u.is_approved;
    return true;
  });

  const {
    paginatedData: paginatedUsers,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
  } = usePagination(filteredUsers, 10);

  const pendingCount = usersList.filter((u) => !u.is_approved).length;

  return (
    <div className="space-y-6 pb-12 text-gray-900">
      {/* Header Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-[#1b5ebe] shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-gray-900">
                {isSuper ? "Platform User Accounts" : "Team & Staff Management"}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-blue-50 text-[#1b5ebe] border border-blue-200 uppercase">
                {isSuper ? "Super Admin Directory" : myCompanyName}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {isSuper
                ? "Review, approve, suspend, and manage all company user accounts across the platform."
                : "Create employee accounts, assign roles (Cashier, Sales, Manager), and restrict edit or delete actions."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <Button
            onClick={() => fetchUsers()}
            variant="outline"
            disabled={loading}
            className="h-9 px-3.5 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>

          <Button
            onClick={handleOpenCreateModal}
            className="h-9 px-4 bg-[#1b5ebe] hover:bg-[#154ca0] text-white rounded-xl text-xs font-semibold gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Team Member
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex bg-gray-100/80 p-1 rounded-xl border border-gray-200 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
              activeTab === "all"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            All Members ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "pending"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-amber-700 hover:bg-amber-50"
            }`}
          >
            <span>Pending Review</span>
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
              activeTab === "approved"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            Active & Working ({usersList.filter((u) => u.is_approved).length})
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, role..."
            className="pl-9 h-10 text-xs bg-white border-gray-200 text-gray-900 rounded-xl"
          />
        </div>
      </div>

      {/* Users Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/80 border-b border-gray-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-3.5 px-5 text-gray-600 text-[10px] font-bold uppercase tracking-wider">
                  Member
                </TableHead>
                <TableHead className="py-3.5 px-5 text-gray-600 text-[10px] font-bold uppercase tracking-wider">
                  Role
                </TableHead>
                <TableHead className="py-3.5 px-5 text-gray-600 text-[10px] font-bold uppercase tracking-wider">
                  Access & Permissions
                </TableHead>
                <TableHead className="py-3.5 px-5 text-gray-600 text-[10px] font-bold uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="py-3.5 px-5 text-right text-gray-600 text-[10px] font-bold uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#1b5ebe]" />
                      <span>Loading members directory...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-gray-400">
                    No team members found matching the filter.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((u) => {
                  const isProcessing = processingId === u.id;
                  const isSuperUser = u.is_superuser;
                  const perms = getUserPermissions(u);

                  return (
                    <TableRow key={u.id} className="hover:bg-gray-50/70 transition-colors">
                      <TableCell className="py-4 px-5 font-semibold text-gray-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[#0b1d3a] font-bold text-xs shrink-0">
                            {(u.first_name?.[0] || u.username?.[0] || "U").toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span>{u.username}</span>
                              {isSuperUser && (
                                <span className="bg-blue-50 text-[#1b5ebe] border border-blue-200 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase">
                                  Super Admin
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 font-normal">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-800">
                          {u.role ? u.role.replace("_", " ") : "Cashier"}
                        </span>
                      </TableCell>

                      <TableCell className="py-4 px-5">
                        <div className="flex flex-wrap items-center gap-1">
                          {perms.can_view_pos && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                              POS
                            </span>
                          )}
                          {perms.can_edit_sales ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              Can Edit
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                              No Edit
                            </span>
                          )}
                          {perms.can_delete_sales ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              Can Delete
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600 border border-red-200/60 font-semibold">
                              No Delete
                            </span>
                          )}
                          {perms.can_view_reports && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200/60">
                              Reports
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-5">
                        {u.is_approved ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Suspended
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="py-4 px-5 text-right">
                        {isSuperUser ? (
                          <span className="text-[11px] text-gray-400 italic">Protected</span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Permission Config button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEditPermissions(u)}
                              className="rounded-xl text-xs font-semibold h-8 px-2.5 border-gray-200 hover:bg-blue-50 hover:text-blue-700 text-gray-700 gap-1"
                              title="Configure Granular Permissions"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Permissions</span>
                            </Button>

                            {u.is_approved ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isProcessing}
                                onClick={() => setUserToSuspend(u)}
                                className="rounded-xl text-xs font-semibold h-8 px-2.5 border-gray-200 hover:bg-amber-50 hover:text-amber-700 text-gray-700"
                              >
                                Suspend
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                disabled={isProcessing}
                                onClick={() => handleToggleApproval(u)}
                                className="rounded-xl text-xs font-semibold h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                              >
                                Activate
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isProcessing}
                              onClick={() => setUserToDelete(u)}
                              className="h-8 w-8 p-0 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                              title="Delete Member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-xs text-gray-500 font-medium">
            Showing {paginatedUsers.length} of {filteredUsers.length} members
          </p>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              if (page > currentPage) nextPage();
              else prevPage();
            }}
          />
        </div>
      </div>

      {/* ─── Add Staff Member Dialog ─── */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-white rounded-2xl max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#0b1d3a] flex items-center justify-center mb-1">
              <User className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-gray-900">
              Create New Staff Account
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Add a staff member for <span className="font-semibold">{myCompanyName}</span> and define what they can view and perform.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateStaff} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-gray-700">Username *</Label>
                <Input
                  required
                  placeholder="Username"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  className="mt-1 h-9 text-xs rounded-xl"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-700">Email Address *</Label>
                <Input
                  type="email"
                  required
                  placeholder="Staff Email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="mt-1 h-9 text-xs rounded-xl"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-700">First Name</Label>
                <Input
                  placeholder="First name"
                  value={createForm.first_name}
                  onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                  className="mt-1 h-9 text-xs rounded-xl"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-700">Last Name</Label>
                <Input
                  placeholder="Last name"
                  value={createForm.last_name}
                  onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                  className="mt-1 h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-700">Password *</Label>
              <Input
                type="password"
                required
                placeholder="Secure password for login"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                className="mt-1 h-9 text-xs rounded-xl"
              />
            </div>

            {/* Role Preset Quick Selection */}
            <div>
              <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                Role & Permission Preset
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreateForm({ ...createForm, role: "cashier" });
                    handleApplyPreset("cashier");
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    createForm.role === "cashier"
                      ? "border-[#1b5ebe] bg-blue-50/70 text-[#1b5ebe]"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  <p className="text-xs font-bold">Cashier (Supermarket)</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    POS sales only. No delete or update permissions.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCreateForm({ ...createForm, role: "sales" });
                    handleApplyPreset("sales");
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    createForm.role === "sales"
                      ? "border-[#1b5ebe] bg-blue-50/70 text-[#1b5ebe]"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  <p className="text-xs font-bold">Salesperson</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    POS & Customers. View catalog.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCreateForm({ ...createForm, role: "manager" });
                    handleApplyPreset("manager");
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    createForm.role === "manager"
                      ? "border-[#1b5ebe] bg-blue-50/70 text-[#1b5ebe]"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  <p className="text-xs font-bold">Store Manager</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Full store rights including reports & edits.
                  </p>
                </button>
              </div>
            </div>

            {/* Granular Permissions Checklist */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#1b5ebe]" />
                  Granular Action Permissions
                </span>
                <span className="text-[10px] text-gray-500">Fine-tune staff abilities</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={permissionsForm.can_view_pos}
                    onChange={(e) =>
                      setPermissionsForm({ ...permissionsForm, can_view_pos: e.target.checked })
                    }
                    className="rounded border-gray-300 text-[#1b5ebe] focus:ring-[#1b5ebe]"
                  />
                  <span>Access POS & Make Sales</span>
                </label>

                <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={permissionsForm.can_view_sales}
                    onChange={(e) =>
                      setPermissionsForm({ ...permissionsForm, can_view_sales: e.target.checked })
                    }
                    className="rounded border-gray-300 text-[#1b5ebe] focus:ring-[#1b5ebe]"
                  />
                  <span>View Sales Records</span>
                </label>

                <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={permissionsForm.can_edit_sales}
                    onChange={(e) =>
                      setPermissionsForm({ ...permissionsForm, can_edit_sales: e.target.checked })
                    }
                    className="rounded border-gray-300 text-[#1b5ebe] focus:ring-[#1b5ebe]"
                  />
                  <span className={permissionsForm.can_edit_sales ? "text-gray-900" : "text-amber-700 font-medium"}>
                    Can Edit Past Sales {permissionsForm.can_edit_sales ? "" : "(Disabled)"}
                  </span>
                </label>

                <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={permissionsForm.can_delete_sales}
                    onChange={(e) =>
                      setPermissionsForm({ ...permissionsForm, can_delete_sales: e.target.checked })
                    }
                    className="rounded border-gray-300 text-[#1b5ebe] focus:ring-[#1b5ebe]"
                  />
                  <span className={permissionsForm.can_delete_sales ? "text-gray-900" : "text-red-600 font-bold"}>
                    Can Delete / Cancel Sales {permissionsForm.can_delete_sales ? "" : "(Restricted)"}
                  </span>
                </label>

                <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={permissionsForm.can_view_products}
                    onChange={(e) =>
                      setPermissionsForm({ ...permissionsForm, can_view_products: e.target.checked })
                    }
                    className="rounded border-gray-300 text-[#1b5ebe] focus:ring-[#1b5ebe]"
                  />
                  <span>View Products Catalog</span>
                </label>

                <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={permissionsForm.can_edit_products}
                    onChange={(e) =>
                      setPermissionsForm({ ...permissionsForm, can_edit_products: e.target.checked })
                    }
                    className="rounded border-gray-300 text-[#1b5ebe] focus:ring-[#1b5ebe]"
                  />
                  <span>Edit Products & Prices</span>
                </label>

                <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={permissionsForm.can_delete_products}
                    onChange={(e) =>
                      setPermissionsForm({ ...permissionsForm, can_delete_products: e.target.checked })
                    }
                    className="rounded border-gray-300 text-[#1b5ebe] focus:ring-[#1b5ebe]"
                  />
                  <span>Delete Products</span>
                </label>

                <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={permissionsForm.can_view_reports}
                    onChange={(e) =>
                      setPermissionsForm({ ...permissionsForm, can_view_reports: e.target.checked })
                    }
                    className="rounded border-gray-300 text-[#1b5ebe] focus:ring-[#1b5ebe]"
                  />
                  <span>View Reports & Balance</span>
                </label>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creatingStaff}
                className="bg-[#0b1d3a] hover:bg-[#142a4d] text-white rounded-xl text-xs font-semibold gap-1.5"
              >
                {creatingStaff ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Create Staff Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Permissions Dialog ─── */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="bg-white rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-gray-900">
              Manage Permissions: {editingUser?.username}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Control what this employee can see and do in <span className="font-semibold">{myCompanyName}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Quick Presets */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Quick Presets:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset("cashier")}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                Cashier (No delete/edit)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("manager")}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100"
              >
                Manager (Full Access)
              </button>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2.5">
              <p className="text-xs font-bold text-gray-900 mb-2">Permissions Configuration</p>

              <div className="space-y-2 text-xs">
                <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-100 cursor-pointer">
                  <span>Point of Sale Access (Make Sales)</span>
                  <input
                    type="checkbox"
                    checked={permissionsForm.can_view_pos}
                    onChange={(e) =>
                      setPermissionsForm({ ...permissionsForm, can_view_pos: e.target.checked })
                    }
                    className="rounded border-gray-300 text-[#1b5ebe]"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-100 cursor-pointer">
                  <span>View Past Sales Records</span>
                  <input
                    type="checkbox"
                    checked={permissionsForm.can_view_sales}
                    onChange={(e) =>
                      setPermissionsForm({ ...permissionsForm, can_view_sales: e.target.checked })
                    }
                    className="rounded border-gray-300 text-[#1b5ebe]"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-100 cursor-pointer">
                  <div>
                    <span className="font-medium">Edit Past Sales / Receipts</span>
                    <p className="text-[10px] text-gray-400">Can modify price or quantity on existing receipts</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissionsForm.can_edit_sales}
                    onChange={(e) =>
                      setPermissionsForm({ ...permissionsForm, can_edit_sales: e.target.checked })
                    }
                    className="rounded border-gray-300 text-[#1b5ebe]"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-100 cursor-pointer">
                  <div>
                    <span className="font-semibold text-red-600">Delete / Cancel / Refund Sales</span>
                    <p className="text-[10px] text-gray-400">Supermarket cashier rule: uncheck to prevent deleting sales</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissionsForm.can_delete_sales}
                    onChange={(e) =>
                      setPermissionsForm({ ...permissionsForm, can_delete_sales: e.target.checked })
                    }
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-100 cursor-pointer">
                  <span>View Products Inventory Catalog</span>
                  <input
                    type="checkbox"
                    checked={permissionsForm.can_view_products}
                    onChange={(e) =>
                      setPermissionsForm({ ...permissionsForm, can_view_products: e.target.checked })
                    }
                    className="rounded border-gray-300 text-[#1b5ebe]"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-100 cursor-pointer">
                  <span>Edit Products & Modify Stock Prices</span>
                  <input
                    type="checkbox"
                    checked={permissionsForm.can_edit_products}
                    onChange={(e) =>
                      setPermissionsForm({ ...permissionsForm, can_edit_products: e.target.checked })
                    }
                    className="rounded border-gray-300 text-[#1b5ebe]"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-100 cursor-pointer">
                  <span>Delete Products From Catalog</span>
                  <input
                    type="checkbox"
                    checked={permissionsForm.can_delete_products}
                    onChange={(e) =>
                      setPermissionsForm({ ...permissionsForm, can_delete_products: e.target.checked })
                    }
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-100 cursor-pointer">
                  <span>Access Financial Reports & Store Balance</span>
                  <input
                    type="checkbox"
                    checked={permissionsForm.can_view_reports}
                    onChange={(e) =>
                      setPermissionsForm({ ...permissionsForm, can_view_reports: e.target.checked })
                    }
                    className="rounded border-gray-300 text-[#1b5ebe]"
                  />
                </label>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingUser(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePermissions}
                disabled={savingPermissions}
                className="bg-[#0b1d3a] hover:bg-[#142a4d] text-white rounded-xl text-xs font-semibold gap-1.5"
              >
                {savingPermissions ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save Permissions
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Suspend Confirmation Modal ─── */}
      <AlertDialog open={!!userToSuspend} onOpenChange={(open) => !open && setUserToSuspend(null)}>
        <AlertDialogContent className="bg-white rounded-2xl max-w-md">
          <AlertDialogHeader>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-gray-900">
              Suspend Account: {userToSuspend?.username}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500 leading-relaxed">
              Are you sure you want to suspend this staff member ({userToSuspend?.email})? This user will be blocked from signing in until reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel className="rounded-xl text-xs font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleToggleApproval(userToSuspend)}
              className="rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white"
            >
              Confirm Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Delete Confirmation Modal ─── */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent className="bg-white rounded-2xl max-w-md">
          <AlertDialogHeader>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-2">
              <Trash2 className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-gray-900">
              Delete Staff Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500 leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-gray-800">"{userToDelete?.username}"</span> ({userToDelete?.email})? This action cannot be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel className="rounded-xl text-xs font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
