"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { fetchWithCache } from "@/lib/offlineCache";
import { useOfflineSync } from "@/components/OfflineSync";
import localforage from "localforage";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CreditCard,
  CheckCircle,
  Search,
  ArrowUpDown,
  Trash2,
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

export default function LoansPage() {
  const { isOnline, addPendingSync } = useOfflineSync();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const [loansData, paymentsData] = await Promise.all([
        fetchWithCache("/loans/", "nexus_cached_loans"),
        fetchWithCache("/payments/", "nexus_cached_payments").catch(() => []),
      ]);

      const computedLoans = (loansData as any[]).map((loan: any) => {
        const initialDebt = parseFloat(loan.total_debt || loan.amount || 0);
        const repayments = (paymentsData as any[]).filter((p: any) => {
          if (p.payment_type !== "LOAN_PAYMENT") return false;
          if (p.loan && String(p.loan) === String(loan.id)) return true;
          if (p.loan_id && String(p.loan_id) === String(loan.id)) return true;
          const pClient = (
            p.client_name ||
            p.customer_name ||
            ""
          ).toLowerCase();
          const lClient = (loan.customer_name || "").toLowerCase();
          return pClient && lClient && pClient === lClient;
        });
        const totalPaidRepayments = repayments.reduce(
          (sum: number, r: any) => sum + parseFloat(r.amount || 0),
          0,
        );
        const currentRemainingDebt = Math.max(
          0,
          initialDebt - totalPaidRepayments,
        );
        const status =
          currentRemainingDebt === 0 ? "Paid" : loan.status || "Pending";

        return {
          ...loan,
          initial_debt: initialDebt,
          total_debt: currentRemainingDebt.toFixed(2),
          status,
        };
      });

      setLoans(computedLoans);
    } catch (err) {
      toast.error("Failed to load loans");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedLoans = [...loans].sort((a, b) => {
    if (!sortConfig) return 0;
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (typeof aValue === "string") {
      if (aValue.toLowerCase() < bValue.toLowerCase())
        return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue.toLowerCase() > bValue.toLowerCase())
        return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    }
    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const filteredLoans = sortedLoans.filter(
    (l) =>
      l.customer_name &&
      l.customer_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const {
    paginatedData: paginatedLoans,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
  } = usePagination(filteredLoans);

  const handleOpenSettleModal = (loan: any) => {
    setSelectedLoan(loan);
    setPaymentAmount(loan.total_debt);
    setIsSettleModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!loanToDelete) return;
    try {
      await api.delete(`/loans/${loanToDelete}/`);
      toast.success("Loan moved to trash");
      setDeleteConfirmOpen(false);
      await localforage.removeItem("nexus_cached_loans");
      fetchLoans();
    } catch (err) {
      toast.error("Failed to delete loan");
    }
  };

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!isOnline) {
        addPendingSync({
          endpoint: `/loans/${selectedLoan.id}/settle/`,
          payload: { payment_amount: paymentAmount },
        });
        toast.success(
          "Payment saved offline. Will sync when connection is restored.",
        );
        setIsSettleModalOpen(false);
        const updatedLoans = loans.map((loan) => {
          if (loan.id === selectedLoan.id) {
            return {
              ...loan,
              total_debt: (
                parseFloat(loan.total_debt) - parseFloat(paymentAmount)
              ).toString(),
            };
          }
          return loan;
        });
        setLoans(updatedLoans);
        localforage
          .getItem("nexus_cached_loans")
          .then((cached: any) => {
            if (cached) {
              localforage.setItem("nexus_cached_loans", {
                ...cached,
                data: updatedLoans,
              });
            }
          })
          .catch(console.error);
        return;
      }

      await api.post(`/loans/${selectedLoan.id}/settle/`, {
        payment_amount: paymentAmount,
      });
      toast.success("Payment applied successfully!");
      setIsSettleModalOpen(false);

      await localforage.removeItem("nexus_cached_loans");
      await localforage.removeItem("nexus_cached_sales");
      await localforage.removeItem("nexus_cached_payments");

      fetchLoans();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to settle debt");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="w-8 h-8 text-primary" /> Outstanding Loans
          </h2>
          <p className="text-muted-foreground">
            Manage and settle customer debts.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="w-5 h-5 text-muted-foreground absolute ml-3 pointer-events-none" />
        <Input
          placeholder="Search by customer name..."
          className="pl-10 glass"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl overflow-auto max-h-[calc(100vh-250px)] w-full"
      >
        <Table>
          <TableHeader className="bg-slate-50/95 shadow-sm sticky top-0 z-20 backdrop-blur-sm">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort("customer_name")}
              >
                Customer <ArrowUpDown className="w-3 h-3 inline ml-1" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort("updated_at")}
              >
                Last Updated <ArrowUpDown className="w-3 h-3 inline ml-1" />
              </TableHead>
              <TableHead
                className="text-right cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort("total_debt")}
              >
                Total Debt <ArrowUpDown className="w-3 h-3 inline ml-1" />
              </TableHead>
              <TableHead
                className="text-center cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort("status")}
              >
                Status <ArrowUpDown className="w-3 h-3 inline ml-1" />
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLoans.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  No active loans yet.
                </TableCell>
              </TableRow>
            ) : (
              paginatedLoans.map((loan) => (
                <TableRow
                  key={loan.id}
                  className="border-border/30 hover:bg-accent/50"
                >
                  <TableCell className="font-medium">
                    {loan.customer_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(loan.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right font-bold text-red-500">
                    {loan.total_debt} RWF
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${loan.status === "Paid" ? "bg-emerald-500/20 text-emerald-500" : "bg-amber-500/20 text-amber-500"}`}
                    >
                      {loan.status || "Pending"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {(!loan.status || loan.status === "Pending") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenSettleModal(loan)}
                        className="gap-2 border-primary/50 hover:bg-primary/20 text-primary mr-2"
                      >
                        <CheckCircle className="w-4 h-4" /> Pay
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setLoanToDelete(loan.id);
                        setDeleteConfirmOpen(true);
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onNext={nextPage}
          onPrev={prevPage}
        />
      </motion.div>

      <Dialog open={isSettleModalOpen} onOpenChange={setIsSettleModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSettle}>
            <DialogHeader>
              <DialogTitle>Settle Debt</DialogTitle>
            </DialogHeader>
            <div className="py-6 space-y-4">
              <div className="p-4 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20 flex justify-between items-center">
                <span className="text-sm">Outstanding Balance</span>
                <span className="text-xl font-bold">
                  {selectedLoan?.total_debt} RWF
                </span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_amount">Payment Amount (RWF)</Label>
                <Input
                  id="payment_amount"
                  type="number"
                  step="0.01"
                  max={selectedLoan?.total_debt}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                  className="text-lg font-bold"
                />
                <p className="text-xs text-muted-foreground">
                  You can make a partial payment or pay the full amount.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsSettleModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Apply Payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="admin-modal-content sm:max-w-[380px] text-center p-0">
          <div className="bg-[#2c2c3e] pt-8 pb-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-400 to-red-500 text-white flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <AlertDialogTitle className="text-xl font-bold tracking-tight text-white mb-2">
              Delete Loan?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-sm max-w-[240px]">
              This will move the loan to the Trash.
            </AlertDialogDescription>
          </div>
          <div className="p-6 bg-white flex flex-col items-center">
            <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 text-sm text-slate-500 text-left">
              <strong className="text-slate-800">This loan</strong> will be
              soft-deleted.
              <br />
              You can restore it from the database if needed.
            </div>
            <div className="w-full flex gap-3">
              <AlertDialogCancel className="flex-1 mt-0 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl gap-2 shadow-sm shadow-red-500/20"
              >
                <Trash2 className="w-4 h-4" /> Move to Trash
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
