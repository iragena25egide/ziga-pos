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
  UserCheck,
  UserX,
  AlertTriangle,
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
import { usePagination } from "@/hooks/use-pagination";
import { PaginationControls } from "@/components/ui/pagination-controls";

export default function UsersPage() {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved">("all");
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Modal states
  const [userToSuspend, setUserToSuspend] = useState<any | null>(null);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users/");
      setUsersList(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch (err) {
      toast.error("Failed to load user accounts.");
    } finally {
      setLoading(false);
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
      setUsersList((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_approved: newStatus } : u))
      );
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
      await api.delete(`/users/${userToDelete.id}/`);
      setUsersList((prev) => prev.filter((u) => u.id !== userToDelete.id));
      toast.success(`User "${userToDelete.username}" has been deleted.`);
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
                User Account Management
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-blue-50 text-[#1b5ebe] border border-blue-200 uppercase">
                Admin Directory
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Review, approve, suspend, and manage all company user accounts across the platform.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={fetchUsers}
            variant="outline"
            disabled={loading}
            className="h-9 px-3.5 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex bg-gray-100/80 p-1 rounded-xl border border-gray-200 w-full md:w-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "all"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            All Accounts ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
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
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "approved"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            Active & Approved ({usersList.filter((u) => u.is_approved).length})
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, company..."
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
                  User Details
                </TableHead>
                <TableHead className="py-3.5 px-5 text-gray-600 text-[10px] font-bold uppercase tracking-wider">
                  Email Contact
                </TableHead>
                <TableHead className="py-3.5 px-5 text-gray-600 text-[10px] font-bold uppercase tracking-wider">
                  Assigned Company
                </TableHead>
                <TableHead className="py-3.5 px-5 text-gray-600 text-[10px] font-bold uppercase tracking-wider">
                  Role
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
                  <TableCell colSpan={6} className="py-12 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#1b5ebe]" />
                      <span>Loading accounts directory...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-gray-400">
                    No accounts found matching the filter.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((u) => {
                  const isProcessing = processingId === u.id;
                  const isSuper = u.is_superuser;

                  return (
                    <TableRow
                      key={u.id}
                      className="hover:bg-gray-50/70 transition-colors"
                    >
                      <TableCell className="py-4 px-5 font-semibold text-gray-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs shrink-0">
                            {(u.first_name?.[0] || u.username?.[0] || "U").toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span>{u.username}</span>
                              {isSuper && (
                                <span className="bg-blue-50 text-[#1b5ebe] border border-blue-200 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase">
                                  Super Admin
                                </span>
                              )}
                            </div>
                            {(u.first_name || u.last_name) && (
                              <p className="text-[11px] text-gray-400 font-normal">
                                {`${u.first_name || ""} ${u.last_name || ""}`.trim()}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-5 font-mono text-[11px] text-gray-600">
                        {u.email}
                      </TableCell>

                      <TableCell className="py-4 px-5 text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-medium">{u.company_name || "Platform Core"}</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                          {u.role ? u.role.replace("_", " ") : "User"}
                        </span>
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
                            Pending
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="py-4 px-5 text-right">
                        {isSuper ? (
                          <span className="text-[11px] text-gray-400 italic">System Protected</span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {u.is_approved ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isProcessing}
                                onClick={() => setUserToSuspend(u)}
                                className="rounded-xl text-xs font-semibold h-8 px-3 border-gray-200 hover:bg-amber-50 hover:text-amber-700 text-gray-700"
                              >
                                Suspend
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                disabled={isProcessing}
                                onClick={() => handleToggleApproval(u)}
                                className="rounded-xl text-xs font-semibold h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                              >
                                {isProcessing ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  "Approve"
                                )}
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isProcessing}
                              onClick={() => setUserToDelete(u)}
                              className="h-8 w-8 p-0 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                              title="Delete Account"
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
            Showing {paginatedUsers.length} of {filteredUsers.length} accounts
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
              Are you sure you want to suspend this account ({userToSuspend?.email})? This user will be immediately blocked from signing in until re-approved by Super Admin.
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
              Delete User Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500 leading-relaxed">
              Are you sure you want to permanently delete user <span className="font-bold text-gray-800">"{userToDelete?.username}"</span> ({userToDelete?.email})? This action cannot be reversed.
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
