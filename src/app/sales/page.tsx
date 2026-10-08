"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { fetchWithCache } from "@/lib/offlineCache";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileText, Trash2, Eye, ReceiptText, Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, AlertTriangle, Edit, Plus, Minus } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ThermalReceipt } from "@/components/pos/ThermalReceipt";
import jsPDF from "jspdf";
import QRCode from "qrcode";

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);

  const [selectedSale, setSelectedSale] = useState<any>(null);
  
  const [dateFilter, setDateFilter] = useState("all");
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<number | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const generateReceiptPDF = async () => {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [80, 200]
    });
    
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    const headerTitle = (selectedSale.company_name || "ZIGA POS").toUpperCase();
    pdf.text(headerTitle, 40, 15, { align: "center" });

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text("Kigali, Rwanda | +250 788 123 456", 40, 20, { align: "center" });
    pdf.text(`Receipt #${selectedSale.id}`, 40, 25, { align: "center" });
    pdf.text(new Date(selectedSale.created_at).toLocaleString(), 40, 30, { align: "center" });

    pdf.text(`Customer: ${selectedSale.customer_name}`, 4, 40);
    pdf.text(`Salesperson: ${selectedSale.salesperson_name || 'Admin'}`, 4, 45);

    pdf.setLineWidth(0.5);
    pdf.setDrawColor(200, 200, 200);
    pdf.line(4, 50, 70, 50); 
    
    pdf.setFont("helvetica", "bold");
    pdf.text("Item", 4, 55);
    pdf.text("Qty", 30, 55, { align: "center" });
    pdf.text("Price", 50, 55, { align: "right" });
    pdf.text("Total", 70, 55, { align: "right" });
    pdf.line(4, 58, 70, 58);

    pdf.setFont("helvetica", "normal");
    let y = 63;
    selectedSale.items?.forEach((item: any) => {
      const name = item.product_name || item.name || "Item";
      pdf.text(name.substring(0, 14), 4, y);
      pdf.text(String(item.quantity), 30, y, { align: "center" });
      pdf.text(Number(item.unit_price).toLocaleString(), 50, y, { align: "right" });
      pdf.text(Number(item.subtotal || item.total_price || (item.quantity * item.unit_price)).toLocaleString(), 70, y, { align: "right" });
      y += 6;
    });

    pdf.line(4, y, 70, y);
    y += 6;
    
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("Total:", 4, y);
    pdf.text(`${Number(selectedSale.total_amount).toLocaleString()} RWF`, 70, y, { align: "right" });
    y += 6;

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text("Payment:", 4, y);
    pdf.text(`${Number(selectedSale.payment_amount).toLocaleString()} RWF`, 70, y, { align: "right" });
    y += 6;

    if (parseFloat(selectedSale.balance) > 0) {
      pdf.text("Balance Due:", 4, y);
      pdf.text(`${Number(selectedSale.balance).toLocaleString()} RWF`, 70, y, { align: "right" });
      y += 6;
    }

    y += 5;
    try {
      const qrText = `https://nexusps.netlify.app/receipt?id=${selectedSale.id}`;
      const qrDataUrl = await QRCode.toDataURL(qrText, { margin: 1, width: 30 });
      pdf.addImage(qrDataUrl, 'PNG', 25, y, 30, 30);
      y += 35;
      pdf.setFontSize(8);
      pdf.text("Scan to view online", 40, y, { align: "center" });
    } catch (err) {
      console.error("Failed to generate QR code", err);
    }

    return pdf;
  };

  const handlePrint = async () => {
    if (!selectedSale) return;
    try {
      const pdf = await generateReceiptPDF();
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        }, 300);
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 60000);
      };
    } catch (err: any) {
      console.error("PDF print error:", err);
      toast.error(`Failed to print: ${err.message}`);
    }
  };

  const handleDownload = async () => {
    if (!selectedSale) return;
    try {
      const pdf = await generateReceiptPDF();
      const safeCustomerName = (selectedSale.customer_name || "customer")
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .replace(/-+/g, "-")
        .toLowerCase();
      pdf.save(`${safeCustomerName}-ziga-receipt.pdf`);
    } catch (err: any) {
      console.error("PDF generation error:", err);
      toast.error(`Failed to generate PDF: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchFormOptions();
  }, []);

  const fetchSales = async () => {
    try {
      const data = await fetchWithCache("/sales/", "nexus_cached_sales");
      setSales(data);
    } catch (err) {
      toast.error("Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  const fetchFormOptions = async () => {
    try {
      const pData = await fetchWithCache('/products/', 'nexus_cached_products');
      setProducts(pData);
      const cData = await fetchWithCache('/customers/', 'nexus_cached_customers');
      setCustomers(cData);
    } catch (err) {
      console.error("Failed to fetch form options", err);
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

  const sortedSales = [...sales].sort((a, b) => {
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

  const filteredSales = sortedSales.filter(s => {
    const matchesSearch = s.id.toString().includes(searchTerm) || 
      (s.customer_name && s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
    if (!matchesSearch) return false;
    
    if (dateFilter !== "all") {
      const saleDate = new Date(s.created_at);
      const today = new Date();
      
      if (dateFilter === "today") {
        return saleDate.toDateString() === today.toDateString();
      } else if (dateFilter === "week") {
        const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        return saleDate >= firstDayOfWeek;
      } else if (dateFilter === "month") {
        return saleDate.getMonth() === today.getMonth() && saleDate.getFullYear() === today.getFullYear();
      }
    }
    
    return true;
  });

  const { paginatedData: paginatedSales, currentPage, totalPages, nextPage, prevPage } = usePagination(filteredSales, 6);

  const confirmDelete = async () => {
    if (!saleToDelete) return;
    try {
      await api.delete(`/sales/${saleToDelete}/`);
      toast.success("Sale moved to trash");
      setDeleteConfirmOpen(false);
      fetchSales();
    } catch (err) {
      toast.error("Failed to delete sale");
    }
  };

  const handleEditOpen = (sale: any) => {
    if (sale.customer && !customers.some(c => c.id === sale.customer)) {
      setCustomers(prev => [...prev, { id: sale.customer, name: sale.customer_name }]);
    }

    setEditFormData({
      id: sale.id,
      customer_id: sale.customer ? sale.customer.toString() : "",
      payment_amount: sale.payment_amount,
      items: sale.items.map((i: any) => ({
        product_id: i.product.toString(),
        product_name: i.product_name,
        quantity: i.quantity,
        unit_price: i.unit_price
      }))
    });
    setIsEditModalOpen(true);
  };

  const updateEditItem = (index: number, key: string, value: any) => {
    const newItems = [...editFormData.items];
    if (key === 'product_id') {
      const selectedProd = products.find(p => p.id.toString() === value);
      newItems[index] = { 
        ...newItems[index], 
        product_id: value, 
        product_name: selectedProd?.name || '',
        unit_price: selectedProd?.price || 0 
      };
    } else {
      newItems[index] = { ...newItems[index], [key]: value };
    }
    setEditFormData({ ...editFormData, items: newItems });
  };

  const removeEditItem = (index: number) => {
    const newItems = editFormData.items.filter((_: any, i: number) => i !== index);
    setEditFormData({ ...editFormData, items: newItems });
  };

  const addEditItem = () => {
    setEditFormData({
      ...editFormData,
      items: [...editFormData.items, { product_id: "", product_name: "", quantity: 1, unit_price: 0 }]
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editFormData.items.length === 0) {
      toast.error("Sale must have at least one item.");
      return;
    }
    if (editFormData.items.some((i: any) => !i.product_id || i.quantity <= 0)) {
      toast.error("All items must have a product and valid quantity.");
      return;
    }

    try {
      await api.put(`/sales/${editFormData.id}/`, editFormData);
      toast.success("Sale updated successfully");
      setIsEditModalOpen(false);
      fetchSales();
    } catch (err) {
      toast.error("Failed to update sale");
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const editTotalAmount = editFormData?.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" /> Sales History
          </h2>
          <p className="text-muted-foreground">View, manage, and edit past transactions.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 max-w-sm w-full sm:w-auto relative group">
          <Search className="w-5 h-5 text-muted-foreground absolute left-3 transition-colors group-focus-within:text-primary" />
          <Input 
            placeholder="Search by receipt # or customer..." 
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
          <Table className="w-full text-[11px] sm:text-xs">
            <TableHeader className="bg-slate-50/95 sticky top-0 z-20 backdrop-blur-sm border-b border-slate-200">
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort('id')}>
                Receipt # <SortIcon column="id" />
              </TableHead>
              <TableHead className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort('created_at')}>
                Date <SortIcon column="created_at" />
              </TableHead>
              <TableHead className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort('customer_name')}>
                Customer <SortIcon column="customer_name" />
              </TableHead>
              <TableHead className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500">
                Items (Qty x Prod @ Price)
              </TableHead>
              <TableHead className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500 text-right cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort('total_amount')}>
                Total <SortIcon column="total_amount" />
              </TableHead>
              <TableHead className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500 text-right cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort('payment_amount')}>
                Paid <SortIcon column="payment_amount" />
              </TableHead>
              <TableHead className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500 text-center">Status</TableHead>
              <TableHead className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No sales recorded yet.</TableCell>
              </TableRow>
            ) : (
              paginatedSales.map((sale) => {
                const isPaid = parseFloat(sale.payment_amount) >= parseFloat(sale.total_amount);
                return (
                  <TableRow key={sale.id} className="border-border/30 hover:bg-slate-50/50 group transition-colors">
                    <TableCell className="py-2.5 font-mono text-[11px] text-muted-foreground group-hover:text-foreground">#{sale.id}</TableCell>
                    <TableCell className="py-2.5">{new Date(sale.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</TableCell>
                    <TableCell className="py-2.5 font-medium">{sale.customer_name}</TableCell>
                    <TableCell className="py-2.5 text-[11px] leading-tight max-w-[250px]">
                      <div className="flex flex-wrap gap-x-1 gap-y-0.5">
                        {sale.items?.map((item: any, index: number) => (
                          <span key={item.id} className="whitespace-nowrap">
                            {item.quantity}x <span className="font-semibold">{item.product_name}</span>
                            {index < sale.items.length - 1 ? <span className="text-slate-400">,</span> : ""}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 text-right font-bold">{sale.total_amount} RWF</TableCell>
                    <TableCell className="py-2.5 text-right font-bold text-emerald-600">{sale.payment_amount} RWF</TableCell>
                    <TableCell className="py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border ${isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-200/50' : 'bg-amber-50 text-amber-600 border-amber-200/50'}`}>
                        {isPaid ? "Paid" : `Debt: ${(parseFloat(sale.total_amount) - parseFloat(sale.payment_amount)).toFixed(0)}`}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-2.5">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedSale(sale)} className="text-blue-400 hover:text-blue-500 hover:bg-blue-50 h-7 w-7 transition-colors">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEditOpen(sale)} className="text-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 ml-1 h-7 w-7 transition-colors">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setSaleToDelete(sale.id); setDeleteConfirmOpen(true); }} className="text-red-400 hover:text-red-500 hover:bg-red-50 ml-1 h-7 w-7 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        </div>{/* end scrollable flex-1 div */}
        
        <div className="border-t border-slate-200/50 bg-slate-50/80 backdrop-blur-sm p-1">
          <PaginationControls 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onNext={nextPage} 
            onPrev={prevPage} 
          />
        </div>
      </motion.div>

      {/* Edit Sale Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader className="border-b pb-4 mb-4">
              <DialogTitle className="flex items-center gap-2 text-xl"><Edit className="w-5 h-5 text-indigo-500"/> Edit Sale #{editFormData?.id}</DialogTitle>
            </DialogHeader>
            {editFormData && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select value={editFormData.customer_id} onValueChange={(val) => setEditFormData({...editFormData, customer_id: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Customer">
                        {editFormData.customer_id 
                          ? customers.find(c => c.id.toString() === editFormData.customer_id)?.name || editFormData.customer_id 
                          : "Select Customer"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Items</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addEditItem}><Plus className="w-4 h-4 mr-2"/> Add Item</Button>
                  </div>
                  
                  {editFormData.items.map((item: any, index: number) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-3 items-end p-3 bg-slate-50 border rounded-lg">
                      <div className="w-full sm:flex-1 space-y-1">
                        <Label className="text-xs">Product</Label>
                        <Select value={item.product_id} onValueChange={(val) => updateEditItem(index, 'product_id', val)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Product">
                              {item.product_id 
                                ? products.find(p => p.id.toString() === item.product_id)?.name || item.product_name || "Unknown Product"
                                : "Select Product"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(p => (
                              <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.price} RWF)</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-full sm:w-24 space-y-1">
                        <Label className="text-xs">Quantity</Label>
                        <Input 
                          type="number" 
                          min="1" 
                          value={item.quantity} 
                          onChange={(e) => updateEditItem(index, 'quantity', parseInt(e.target.value) || 0)} 
                        />
                      </div>
                      <div className="w-full sm:w-32 space-y-1">
                        <Label className="text-xs">Unit Price</Label>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01"
                          value={item.unit_price} 
                          onChange={(e) => updateEditItem(index, 'unit_price', parseFloat(e.target.value) || 0)} 
                        />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeEditItem(index)} className="text-red-500 hover:text-red-600 hover:bg-red-50 sm:mb-0 mb-2">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t space-y-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Amount:</span>
                    <span>{editTotalAmount.toLocaleString()} RWF</span>
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Amount (Paid by customer)</Label>
                    <Input 
                      type="number" 
                      min="0" 
                      step="0.01"
                      value={editFormData.payment_amount} 
                      onChange={(e) => setEditFormData({...editFormData, payment_amount: parseFloat(e.target.value) || 0})}
                      className="text-lg font-semibold"
                    />
                  </div>
                  
                  {(editTotalAmount - parseFloat(editFormData.payment_amount)) > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <p>This sale has an unpaid balance of <strong>{(editTotalAmount - parseFloat(editFormData.payment_amount)).toLocaleString()} RWF</strong> which will be adjusted in the customer's loan account.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter className="mt-6 border-t pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Receipt Dialog */}
      <Dialog open={!!selectedSale} onOpenChange={(open) => { if (!open) setSelectedSale(null); }}>
        <DialogContent showCloseButton={false} className="sm:max-w-[440px] p-0 overflow-hidden bg-transparent border-0 shadow-none">
          <ThermalReceipt 
            receipt={selectedSale} 
            onPrint={handlePrint} 
            onDownload={handleDownload} 
            onClose={() => setSelectedSale(null)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="admin-modal-content sm:max-w-[380px] text-center p-0">
          <div className="bg-[#2c2c3e] pt-8 pb-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-400 to-red-500 text-white flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <AlertDialogTitle className="text-xl font-bold tracking-tight text-white mb-2">Delete Sale?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-sm max-w-[240px]">
              This will move the sale to the Trash.
            </AlertDialogDescription>
          </div>
          <div className="p-6 bg-white flex flex-col items-center">
            <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 text-sm text-slate-500 text-left">
              <strong className="text-slate-800">Warning:</strong> Deleting a sale does <strong className="text-red-500">NOT</strong> automatically restore product inventory or adjust loan balances. You can restore it from Trash later.
            </div>
            <div className="w-full flex gap-3">
              <AlertDialogCancel className="flex-1 mt-0 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl gap-2 shadow-sm shadow-red-500/20"><Trash2 className="w-4 h-4"/> Move to Trash</AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
