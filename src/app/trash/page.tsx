"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Trash2,
  RefreshCcw,
  ShieldAlert,
  Search,
  Package,
  Users,
  ShoppingBag,
  Coins,
  Building2,
  Filter,
  ArrowUpDown,
  AlertTriangle,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationControls } from "@/components/ui/pagination-controls";

interface TrashItem {
  id: number;
  type: "company" | "product" | "customer" | "sale" | "loan";
  name: string;
  company_id?: number | null;
  company_name?: string;
  deleted_at: string;
}

export default function TrashPage() {
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name_asc" | "name_desc">("newest");
  const [loading, setLoading] = useState(true);
  
  const [confirmHardDeleteOpen, setConfirmHardDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<TrashItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
  const [itemToRestore, setItemToRestore] = useState<TrashItem | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const [confirmEmptyBinOpen, setConfirmEmptyBinOpen] = useState(false);
  const [emptyLoading, setEmptyLoading] = useState(false);

  useEffect(() => {
    fetchTrash();
  }, []);

  const fetchTrash = async () => {
    try {
      setLoading(true);
      const res = await api.get("/trash/");
      setTrashItems(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to load recycle bin");
    } finally {
      setLoading(false);
    }
  };

  const getEndpoint = (type: string) => {
    switch(type) {
      case 'company': return '/companies';
      case 'product': return '/products';
      case 'customer': return '/customers';
      case 'sale': return '/sales';
      case 'loan': return '/loans';
      default: return '';
    }
  };

  const filteredAndSortedTrash = useMemo(() => {
    let result = trashItems.filter((item) => {
      if (selectedType !== "all" && item.type !== selectedType) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = item.name && item.name.toLowerCase().includes(term);
        const matchesType = item.type && item.type.toLowerCase().includes(term);
        const matchesCompany = item.company_name && item.company_name.toLowerCase().includes(term);
        if (!matchesName && !matchesType && !matchesCompany) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.deleted_at).getTime() - new Date(b.deleted_at).getTime();
      }
      if (sortBy === "name_asc") {
        return (a.name || "").localeCompare(b.name || "");
      }
      if (sortBy === "name_desc") {
        return (b.name || "").localeCompare(a.name || "");
      }
      return 0;
    });

    return result;
  }, [trashItems, selectedType, searchTerm, sortBy]);

  const { paginatedData: paginatedTrash, currentPage, totalPages, nextPage, prevPage } = usePagination(filteredAndSortedTrash, 12);

  const counts = useMemo(() => {
    return {
      all: trashItems.length,
      sale: trashItems.filter((i) => i.type === "sale").length,
      loan: trashItems.filter((i) => i.type === "loan").length,
      product: trashItems.filter((i) => i.type === "product").length,
      customer: trashItems.filter((i) => i.type === "customer").length,
      company: trashItems.filter((i) => i.type === "company").length,
    };
  }, [trashItems]);

  const handleRestore = async () => {
    if (!itemToRestore) return;
    setRestoreLoading(true);
    try {
      await api.post(`${getEndpoint(itemToRestore.type)}/${itemToRestore.id}/restore/`);
      toast.success(`"${itemToRestore.name || itemToRestore.type}" restored successfully`);
      setConfirmRestoreOpen(false);
      setItemToRestore(null);
      fetchTrash();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to restore item");
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleHardDelete = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);
    try {
      await api.delete(`${getEndpoint(itemToDelete.type)}/${itemToDelete.id}/force_delete/`);
      toast.success(`"${itemToDelete.name || itemToDelete.type}" permanently erased`);
      setConfirmHardDeleteOpen(false);
      setItemToDelete(null);
      fetchTrash();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete item permanently");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEmptyBin = async () => {
    setEmptyLoading(true);
    try {
      const query = selectedType !== "all" ? `?type=${selectedType}` : "";
      await api.delete(`/trash/${query}`);
      toast.success(
        selectedType !== "all"
          ? `All deleted ${selectedType}s permanently removed.`
          : "Recycle bin completely emptied."
      );
      setConfirmEmptyBinOpen(false);
      fetchTrash();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to empty recycle bin.");
    } finally {
      setEmptyLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "sale":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShoppingBag className="w-3 h-3 text-emerald-600" />
            <span>Sale</span>
          </span>
        );
      case "loan":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Coins className="w-3 h-3 text-amber-600" />
            <span>Loan</span>
          </span>
        );
      case "product":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Package className="w-3 h-3 text-blue-600" />
            <span>Product</span>
          </span>
        );
      case "customer":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Users className="w-3 h-3 text-purple-600" />
            <span>Customer</span>
          </span>
        );
      case "company":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <Building2 className="w-3 h-3 text-slate-600" />
            <span>Company</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Recycle Bin</h1>
          </div>
          <p className="text-xs text-gray-500">
            Recover deleted sales, loans, products, and customers, or erase them permanently from the system.
          </p>
        </div>

        {trashItems.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setConfirmEmptyBinOpen(true)}
            className="h-9 px-3.5 text-xs font-semibold rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors shadow-xs"
          >
            <ShieldAlert className="w-4 h-4 mr-1.5 text-red-500" />
            {selectedType !== "all" ? `Empty Deleted ${selectedType.toUpperCase()}s` : "Empty Entire Bin"}
          </Button>
        )}
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <Input
              type="text"
              placeholder="Search deleted records by name or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs border-gray-200 rounded-xl focus:border-[#1b5ebe]"
            />
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 flex items-center gap-1 whitespace-nowrap">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-9 px-3 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700 focus:outline-none focus:border-[#1b5ebe]"
            >
              <option value="newest">Newest Deleted</option>
              <option value="oldest">Oldest Deleted</option>
              <option value="name_asc">Name (A → Z)</option>
              <option value="name_desc">Name (Z → A)</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-100">
          <span className="text-[11px] font-semibold text-gray-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>

          {[
            { id: "all", label: "All Items", count: counts.all },
            { id: "sale", label: "Sales", count: counts.sale },
            { id: "loan", label: "Loans", count: counts.loan },
            { id: "product", label: "Products", count: counts.product },
            { id: "customer", label: "Customers", count: counts.customer },
            ...(counts.company > 0
              ? [{ id: "company", label: "Companies", count: counts.company }]
              : []),
          ].map((tab) => {
            const active = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? "bg-[#1b5ebe] text-white shadow-xs font-semibold"
                    : "bg-gray-100/70 text-gray-600 hover:bg-gray-200/60"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    active ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl overflow-hidden border border-gray-200/80 shadow-xs"
      >
        <Table>
          <TableHeader>
            <TableRow className="border-gray-100 hover:bg-transparent bg-gray-50/50">
              <TableHead className="text-xs font-bold text-gray-700">Type</TableHead>
              <TableHead className="text-xs font-bold text-gray-700">Record / Details</TableHead>
              <TableHead className="text-xs font-bold text-gray-700">Company</TableHead>
              <TableHead className="text-xs font-bold text-gray-700">Deleted Date</TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-xs text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-[#1b5ebe] border-t-transparent rounded-full animate-spin" />
                    <span>Loading recycle bin...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredAndSortedTrash.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16 text-gray-400">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-2">
                      <Trash2 className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-xs text-gray-700">The recycle bin is empty</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {searchTerm
                        ? "No records matched your search."
                        : "Deleted sales, products, loans, and customers will appear here."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedTrash.map((item) => (
                <TableRow
                  key={`${item.type}-${item.id}`}
                  className="border-gray-100 hover:bg-gray-50/70 transition-colors"
                >
                  <TableCell className="w-[120px]">{getTypeBadge(item.type)}</TableCell>

                  <TableCell className="font-medium text-xs text-gray-900">
                    {item.name || `Item #${item.id}`}
                  </TableCell>

                  <TableCell className="text-xs text-gray-500">
                    {item.company_name || "—"}
                  </TableCell>

                  <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                    {item.deleted_at
                      ? new Date(item.deleted_at).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "—"}
                  </TableCell>

                  <TableCell className="text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setItemToRestore(item);
                          setConfirmRestoreOpen(true);
                        }}
                        className="h-8 px-2.5 text-xs font-semibold border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 rounded-lg gap-1"
                      >
                        <RefreshCcw className="w-3.5 h-3.5 text-emerald-600" />
                        Restore
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setItemToDelete(item);
                          setConfirmHardDeleteOpen(true);
                        }}
                        className="h-8 px-2.5 text-xs font-semibold border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        Delete Permanently
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {filteredAndSortedTrash.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Showing {paginatedTrash.length} of {filteredAndSortedTrash.length} deleted records
            </span>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onNext={nextPage}
              onPrev={prevPage}
            />
          </div>
        )}
      </motion.div>

      {/* ── Dialog: Permanently Delete Single Record ── */}
      <AlertDialog open={confirmHardDeleteOpen} onOpenChange={setConfirmHardDeleteOpen}>
        <AlertDialogContent className="admin-modal-content sm:max-w-[400px] text-center p-0">
          <div className="bg-[#1e293b] pt-8 pb-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(239,68,68,0.35)]">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <AlertDialogTitle className="text-xl font-bold tracking-tight text-white mb-2">
              Permanently Delete?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300 text-xs max-w-[280px]">
              Erase <strong className="text-white">{itemToDelete?.name || itemToDelete?.type}</strong> completely from the database.
            </AlertDialogDescription>
          </div>
          <div className="p-6 bg-white flex flex-col items-center">
            <div className="w-full bg-red-50 border border-red-100 rounded-xl p-3.5 mb-5 text-xs text-red-600 text-center font-medium">
              This record cannot be recovered or restored once erased.
            </div>
            <AlertDialogFooter className="w-full sm:justify-center flex-row gap-3">
              <AlertDialogCancel disabled={deleteLoading} className="admin-btn-secondary flex-1 m-0">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleHardDelete}
                disabled={deleteLoading}
                className="admin-btn-primary bg-red-600 hover:bg-red-700 text-white flex-1 m-0"
              >
                {deleteLoading ? "Erasing..." : "Erase Permanently"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Dialog: Restore Record ── */}
      <AlertDialog open={confirmRestoreOpen} onOpenChange={setConfirmRestoreOpen}>
        <AlertDialogContent className="admin-modal-content sm:max-w-[400px] text-center p-0">
          <div className="bg-[#1e293b] pt-8 pb-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(16,185,129,0.35)]">
              <RefreshCcw className="w-8 h-8" />
            </div>
            <AlertDialogTitle className="text-xl font-bold tracking-tight text-white mb-2">
              Restore Item?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300 text-xs max-w-[280px]">
              Restore <strong className="text-white">{itemToRestore?.name || itemToRestore?.type}</strong> back to your active records list.
            </AlertDialogDescription>
          </div>
          <div className="p-6 bg-white flex flex-col items-center">
            <div className="w-full bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 mb-5 text-xs text-emerald-700 text-center font-medium">
              This record will be active and visible again in your workspace.
            </div>
            <AlertDialogFooter className="w-full sm:justify-center flex-row gap-3">
              <AlertDialogCancel disabled={restoreLoading} className="admin-btn-secondary flex-1 m-0">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRestore}
                disabled={restoreLoading}
                className="admin-btn-primary bg-emerald-600 hover:bg-emerald-700 text-white flex-1 m-0"
              >
                {restoreLoading ? "Restoring..." : "Yes, Restore Item"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Dialog: Empty Entire Recycle Bin ── */}
      <AlertDialog open={confirmEmptyBinOpen} onOpenChange={setConfirmEmptyBinOpen}>
        <AlertDialogContent className="admin-modal-content sm:max-w-[420px] text-center p-0">
          <div className="bg-[#1e293b] pt-8 pb-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(239,68,68,0.35)]">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <AlertDialogTitle className="text-xl font-bold tracking-tight text-white mb-2">
              {selectedType !== "all"
                ? `Empty Deleted ${selectedType.toUpperCase()}s?`
                : "Empty Entire Recycle Bin?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300 text-xs max-w-[300px]">
              This will permanently delete{" "}
              <strong className="text-white">
                {selectedType !== "all"
                  ? `${counts[selectedType as keyof typeof counts] || 0} ${selectedType} records`
                  : `all ${trashItems.length} records`}
              </strong>{" "}
              from the system.
            </AlertDialogDescription>
          </div>
          <div className="p-6 bg-white flex flex-col items-center">
            <div className="w-full bg-red-50 border border-red-100 rounded-xl p-3.5 mb-5 text-xs text-red-600 text-center font-medium">
              Warning: All selected deleted records will be permanently erased. This cannot be undone.
            </div>
            <AlertDialogFooter className="w-full sm:justify-center flex-row gap-3">
              <AlertDialogCancel disabled={emptyLoading} className="admin-btn-secondary flex-1 m-0">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleEmptyBin}
                disabled={emptyLoading}
                className="admin-btn-primary bg-red-600 hover:bg-red-700 text-white flex-1 m-0"
              >
                {emptyLoading ? "Emptying..." : "Permanently Empty"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
