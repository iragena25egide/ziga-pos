"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { fetchWithCache } from "@/lib/offlineCache";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Wallet, Search, Trash2, AlertTriangle, Eye, ArrowUpDown, ArrowUp, ArrowDown, Printer, Download, ReceiptText, X } from "lucide-react";
import jsPDF from "jspdf";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationControls } from "@/components/ui/pagination-controls";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  const [dateFilter, setDateFilter] = useState("all");

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const data = await fetchWithCache("/payments/", "nexus_cached_payments");
      setPayments(data);
    } catch (err) {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <ArrowUpDown className="w-3 h-3 inline ml-1 opacity-30 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="w-3 h-3 inline ml-1 text-primary" />
      : <ArrowDown className="w-3 h-3 inline ml-1 text-primary" />;
  };

  const sortedPayments = [...payments].sort((a, b) => {
    if (!sortConfig) return 0;
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    if (typeof aValue === 'string') {
      if (aValue.toLowerCase() < bValue.toLowerCase()) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue.toLowerCase() > bValue.toLowerCase()) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    }
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredPayments = sortedPayments.filter(p => {
    const searchString = searchTerm.trim().toLowerCase();
    const clientName = (p.client_name || p.customer_name || '').toLowerCase();
    const matchesSearch = p.id?.toString().includes(searchString) || clientName.includes(searchString);
    if (!matchesSearch) return false;
    if (dateFilter !== "all") {
      const pDate = new Date(p.date);
      const today = new Date();
      if (dateFilter === "today") return pDate.toDateString() === today.toDateString();
      if (dateFilter === "week") {
        const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        return pDate >= firstDayOfWeek;
      }
      if (dateFilter === "month") {
        return pDate.getMonth() === today.getMonth() && pDate.getFullYear() === today.getFullYear();
      }
    }
    return true;
  });

  // ── Group payments by Sale Purchase (1 row per sale in main table)
  const groupedSalesMap = filteredPayments.reduce((acc, curr) => {
    const client = curr.client_name || curr.customer_name || 'Walk-in Customer';
    
    if (curr.payment_type === 'SALE') {
      const saleId = curr.sale || curr.sale_id || curr.id;
      const loanId = curr.loan || curr.loan_id;
      const key = `${client}__${saleId}`;

      const amountPaidAtSale = Number(curr.amount || 0);
      const rawTotal = Number(curr.total_amount || 0);
      const rawBalance = Number(curr.balance !== undefined ? curr.balance : (curr.remaining_debt !== undefined ? curr.remaining_debt : 0));

      let totalAmount = rawTotal;
      let initialDebt = 0;

      if (rawTotal > 0) {
        initialDebt = Math.max(0, rawTotal - amountPaidAtSale);
      } else if (rawBalance > 0) {
        totalAmount = amountPaidAtSale + rawBalance;
        initialDebt = rawBalance;
      } else {
        totalAmount = amountPaidAtSale;
        initialDebt = 0;
      }

      // Find all loan repayments for this customer/loan
      const repayments = payments.filter(p => {
        if (p.payment_type !== 'LOAN_PAYMENT') return false;
        const pClient = p.client_name || p.customer_name || 'Walk-in Customer';
        if (loanId && (p.loan === loanId || p.loan_id === loanId)) return true;
        if (saleId && (p.sale === saleId || p.sale_id === saleId)) return true;
        return pClient === client;
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const totalRepaid = repayments.reduce((sum, r) => sum + Number(r.amount || 0), 0);
      const totalPaid = amountPaidAtSale + totalRepaid;
      const remainingDebt = Math.max(0, initialDebt - totalRepaid);

      // Complete list of installments for this sale
      const installments = [
        {
          id: curr.id,
          date: curr.date,
          type: 'Sale Checkout',
          amount: amountPaidAtSale,
        },
        ...repayments.map((r, idx) => ({
          id: r.id,
          date: r.date,
          type: `Repayment #${idx + 1}`,
          amount: Number(r.amount || 0),
        }))
      ];

      acc[key] = {
        ...curr,
        id: curr.id,
        saleId,
        receiptNo: saleId || curr.id,
        client,
        saleDate: curr.date,
        cashier: curr.salesperson_name || 'Admin',
        totalAmount,
        amountPaidAtSale,
        initialDebt,
        repayments,
        totalRepaid,
        totalPaid,
        remainingDebt,
        installments,
        grouped_ids: [curr.id, ...repayments.map(r => r.id)],
      };
    }

    return acc;
  }, {} as Record<string, any>);

  const displaySales = Object.values(groupedSalesMap).sort(
    (a: any, b: any) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
  );

  const { paginatedData: paginatedPayments, currentPage, totalPages, nextPage, prevPage } = usePagination(displaySales as any[], 8);

  const handleOpenDetail = (payment: any) => {
    setSelectedPayment(payment);
  };

  const confirmDelete = async () => {
    if (!paymentToDelete) return;
    try {
      if (paymentToDelete.grouped_ids) {
        await Promise.all(paymentToDelete.grouped_ids.map((id: any) => api.delete(`/payments/${id}/`)));
      } else {
        await api.delete(`/payments/${paymentToDelete.id}/`);
      }
      toast.success("Payment deleted");
      setDeleteConfirmOpen(false);
      fetchPayments();
    } catch (err) {
      toast.error("Failed to delete payment");
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const detail = selectedPayment;

  // ── PDF Generator ──────────────────────────────────────────────────
  const generateDetailPDF = (mode: 'download' | 'print') => {
    if (!detail) return;
    const pageH = 70 + (detail.installments.length * 7) + 60;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, Math.max(pageH, 150)] });

    // Header
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    const headerTitle = (detail.company_name || "ZIGA POS").toUpperCase();
    doc.text(headerTitle, 40, 12, { align: "center" });
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text("Kigali, Rwanda", 40, 18, { align: "center" });
    doc.text("+250 788 123 456", 40, 22, { align: "center" });

    doc.setLineDashPattern([1, 1], 0);
    doc.line(4, 26, 76, 26);
    doc.setLineDashPattern([], 0);

    // Info
    let y = 32;
    const infoRight = 76;
    doc.setFontSize(8);
    doc.text("Date:", 4, y); doc.setFont("helvetica", "bold"); doc.text(new Date(detail.saleDate).toLocaleString(), infoRight, y, { align: "right" }); doc.setFont("helvetica", "normal"); y += 5;
    doc.text("Receipt No:", 4, y); doc.setFont("helvetica", "bold"); doc.text(String(detail.saleId || detail.id), infoRight, y, { align: "right" }); doc.setFont("helvetica", "normal"); y += 5;
    doc.text("Cashier:", 4, y); doc.setFont("helvetica", "bold"); doc.text(detail.cashier, infoRight, y, { align: "right" }); doc.setFont("helvetica", "normal"); y += 5;
    doc.text("Customer:", 4, y); doc.setFont("helvetica", "bold"); doc.text(detail.client, infoRight, y, { align: "right" }); doc.setFont("helvetica", "normal"); y += 5;

    doc.setLineDashPattern([1, 1], 0);
    doc.line(4, y, 76, y); y += 5;
    doc.setLineDashPattern([], 0);

    // Totals
    doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    doc.text("TOTAL AMOUNT", 4, y); doc.text(`${detail.totalAmount.toLocaleString()} RWF`, 76, y, { align: "right" }); y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    doc.text("Paid at Checkout", 4, y); doc.text(`${detail.amountPaidAtSale.toLocaleString()} RWF`, 76, y, { align: "right" }); y += 5;
    if (detail.initialDebt > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Initial Debt", 4, y); doc.text(`${detail.initialDebt.toLocaleString()} RWF`, 76, y, { align: "right" }); y += 5;
      doc.setFont("helvetica", "normal");
    }

    // Installment History
    if (detail.installments.length > 0) {
      y += 3;
      doc.setLineDashPattern([1, 1], 0); doc.line(4, y, 76, y); y += 4; doc.setLineDashPattern([], 0);
      doc.setFont("helvetica", "bold"); doc.text("PAYMENT INSTALLMENTS", 4, y); y += 5;
      doc.setFont("helvetica", "normal");
      detail.installments.forEach((inst: any, idx: number) => {
        doc.text(`${idx + 1}. ${inst.type}`, 4, y);
        doc.text(`${inst.amount.toLocaleString()} RWF`, 76, y, { align: "right" }); y += 4;
        doc.setFontSize(7); doc.setTextColor(120);
        doc.text(new Date(inst.date).toLocaleString(), 4, y); y += 5;
        doc.setFontSize(8); doc.setTextColor(0);
      });
      doc.setLineDashPattern([1, 1], 0); doc.line(4, y, 76, y); y += 4; doc.setLineDashPattern([], 0);
      doc.setFont("helvetica", "bold");
      doc.text("Total Paid:", 4, y); doc.text(`${detail.totalPaid.toLocaleString()} RWF`, 76, y, { align: "right" }); y += 5;
      doc.text("Remaining Debt:", 4, y); doc.text(`${detail.remainingDebt.toLocaleString()} RWF${detail.remainingDebt === 0 ? ' (CLEARED)' : ''}`, 76, y, { align: "right" }); y += 5;
    }

    y += 4;
    doc.setFont("helvetica", "normal"); doc.setFontSize(7);
    doc.text(`|||||||||||||||||||||||||||||||||||||||||||||||`, 40, y, { align: "center" }); y += 4;
    doc.text(String(detail.saleId || detail.id), 40, y, { align: "center" }); y += 7;
    doc.setFont("helvetica", "bold"); doc.setFontSize(8);
    doc.text("Thank you for your business!", 40, y, { align: "center" });

    if (mode === 'download') {
      const safeCustomerName = (detail.client || "customer")
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .replace(/-+/g, "-")
        .toLowerCase();
      doc.save(`${safeCustomerName}-ziga-receipt.pdf`);
    } else {
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="w-8 h-8 text-primary" /> Payments
          </h2>
          <p className="text-muted-foreground">View and manage all incoming payments.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 max-w-sm w-full sm:w-auto relative group">
          <Search className="w-5 h-5 text-muted-foreground absolute left-3 transition-colors group-focus-within:text-primary" />
          <Input
            placeholder="Search by customer name or receipt #..."
            className="pl-10 bg-white border-slate-200 shadow-sm hover:border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary transition-all !rounded-xl text-sm h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={dateFilter} onValueChange={(v) => setDateFilter(v || "")}>
            <SelectTrigger className="bg-white border-slate-200 shadow-sm !rounded-xl text-sm h-11">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col h-[calc(100vh-210px)] overflow-hidden"
      >
        <div className="w-full flex-1 overflow-y-scroll overflow-x-hidden custom-scrollbar">
          <Table className="w-full text-xs">
            <TableHeader className="bg-slate-50/95 sticky top-0 z-20 backdrop-blur-sm border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort('id')}>
                  Receipt # <SortIcon column="id" />
                </TableHead>
                <TableHead className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort('client_name')}>
                  Customer <SortIcon column="client_name" />
                </TableHead>
                <TableHead className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort('date')}>
                  Sale Date <SortIcon column="date" />
                </TableHead>
                <TableHead className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500 text-right cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort('totalAmount')}>
                  Total Amount <SortIcon column="totalAmount" />
                </TableHead>
                <TableHead className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500 text-right">
                  Total Paid
                </TableHead>
                <TableHead className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500 text-right">
                  Status
                </TableHead>
                <TableHead className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500 text-right">
                  Details
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No payments recorded yet.</TableCell>
                </TableRow>
              ) : (
                paginatedPayments.map((sale: any) => (
                  <TableRow key={sale.saleId || sale.id} className="border-border/30 hover:bg-slate-50/50 group transition-colors">
                    <TableCell className="py-3 font-mono font-bold text-slate-700">
                      #{sale.saleId || sale.id}
                    </TableCell>
                    <TableCell className="py-3 font-medium text-slate-800">
                      {sale.client}
                    </TableCell>
                    <TableCell className="py-3 text-slate-500">
                      {new Date(sale.saleDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </TableCell>
                    <TableCell className="py-3 text-right font-semibold text-slate-800">
                      {Number(sale.totalAmount).toLocaleString()} RWF
                    </TableCell>
                    <TableCell className="py-3 text-right font-bold text-emerald-600">
                      {Number(sale.totalPaid).toLocaleString()} RWF
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      {sale.remainingDebt === 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          Paid in Full ✅
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                          Debt: {sale.remainingDebt.toLocaleString()} RWF
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDetail(sale)} className="text-blue-400 hover:text-blue-500 hover:bg-blue-50 h-8 w-8 transition-colors">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setPaymentToDelete(sale); setDeleteConfirmOpen(true); }} className="text-red-400 hover:text-red-500 hover:bg-red-50 ml-1 h-8 w-8 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 p-2">
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onNext={nextPage} onPrev={prevPage} />
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════
          PAYMENT DETAIL MODAL — Receipt Style
      ═══════════════════════════════════════════════════════ */}
      <Dialog open={!!selectedPayment} onOpenChange={(open) => { if (!open) { setSelectedPayment(null); } }}>
        <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden bg-white rounded-2xl shadow-2xl border-0 flex flex-col max-h-[92vh]">

          {/* ── Fixed Top Bar (dark, like receipt header) ── */}
          <div className="bg-[#0f172a] text-white px-5 py-4 flex-shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <ReceiptText className="w-4 h-4 text-white" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-white leading-none">
                  Receipt #{detail?.receiptNo}
                </DialogTitle>
                {detail && <p className="text-[11px] text-slate-400 mt-0.5">{detail.client}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => generateDetailPDF('download')} title="Download PDF" className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Download className="w-4 h-4 text-white" />
              </button>
              <button onClick={() => generateDetailPDF('print')} title="Print" className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center transition-colors">
                <Printer className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* ── Scrollable Receipt Body ── */}
          <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
            {detail && (
              <div className="px-6 py-6">

                {/* Store Name */}
                <div className="text-center mb-5">
                  <h2 className="text-2xl font-black tracking-widest text-slate-900 uppercase">
                    {detail.company_name || "ZIGA POS"}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Kigali, Rwanda</p>
                  <p className="text-xs text-slate-400">+250 788 123 456</p>
                </div>

                {/* Info Block */}
                <div className="border-t border-dashed border-slate-200 pt-4 mb-4 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date:</span>
                    <span className="font-semibold text-slate-800">{new Date(detail.saleDate).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Receipt No:</span>
                    <span className="font-semibold text-slate-800">{detail.receiptNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cashier:</span>
                    <span className="font-semibold text-slate-800">{detail.cashier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Customer:</span>
                    <span className="font-bold text-slate-900">{detail.client}</span>
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t border-dashed border-slate-200 pt-4 space-y-1.5 mb-4">
                  <div className="flex justify-between text-sm font-black">
                    <span className="text-slate-900">TOTAL</span>
                    <span className="text-slate-900">{detail.totalAmount.toLocaleString()} RWF</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Paid at Checkout</span>
                    <span className="text-slate-600">{detail.amountPaidAtSale.toLocaleString()} RWF</span>
                  </div>
                  {detail.initialDebt > 0 && (
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-red-500">Initial Debt</span>
                      <span className="text-red-500">{detail.initialDebt.toLocaleString()} RWF</span>
                    </div>
                  )}
                </div>

                {/* Installments History */}
                {detail.installments && detail.installments.length > 0 && (
                  <div className="border-t border-dashed border-slate-200 pt-4 mb-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Payment Installments</p>
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <table className="w-full text-xs">
                        <thead className="bg-[#0f172a]">
                          <tr>
                            <th className="text-left py-2 px-3 font-bold text-slate-300 uppercase tracking-wider">#</th>
                            <th className="text-left py-2 px-3 font-bold text-slate-300 uppercase tracking-wider">Type / Time</th>
                            <th className="text-right py-2 px-3 font-bold text-slate-300 uppercase tracking-wider">Paid</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detail.installments.map((inst: any, idx: number) => (
                            <tr key={inst.id || idx} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-slate-800">{inst.type}</div>
                                <div className="text-[10px] text-slate-400">{new Date(inst.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-800">{Number(inst.amount).toLocaleString()} RWF</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-[#0f172a]">
                          <tr>
                            <td colSpan={2} className="py-2.5 px-3 font-bold text-slate-300 text-xs uppercase tracking-wider">Total Paid</td>
                            <td className="py-2.5 px-3 text-right font-black text-white">{detail.totalPaid.toLocaleString()} RWF</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Remaining Debt pill */}
                    <div className={`flex justify-between items-center px-4 py-3 rounded-xl mt-3 ${detail.remainingDebt === 0 ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                      <span className="text-sm font-bold">Remaining Debt</span>
                      <span className="text-base font-black">
                        {detail.remainingDebt.toLocaleString()} RWF {detail.remainingDebt === 0 && '✅'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Barcode + Thank you */}
                <div className="border-t border-dashed border-slate-200 pt-5 text-center">
                  <div className="text-slate-300 text-[8px] tracking-widest select-none leading-none mb-1">
                    ████████ ██ ████ ██████ ████ ██████ ████████
                  </div>
                  <p className="text-xs text-slate-400 font-mono mb-3">{detail.receiptNo}</p>
                  <p className="text-sm font-bold text-slate-800">Thank you for your business!</p>
                </div>

              </div>
            )}
          </div>

        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="admin-modal-content sm:max-w-[380px] text-center p-0">
          <div className="bg-[#2c2c3e] pt-8 pb-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-400 to-red-500 text-white flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <AlertDialogTitle className="text-xl font-bold tracking-tight text-white mb-2">Delete Payment?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-sm max-w-[240px]">
              Are you sure you want to permanently delete this payment?
            </AlertDialogDescription>
          </div>
          <div className="p-6 bg-white flex flex-col items-center">
            <div className="w-full flex gap-3">
              <AlertDialogCancel className="flex-1 mt-0 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl text-xs">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl gap-2 shadow-sm shadow-red-500/20 text-xs"><Trash2 className="w-3.5 h-3.5"/> Delete</AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
