"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";
import { fetchWithCache } from "@/lib/offlineCache";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { TrendingUp, Calendar as CalendarIcon, FileText, Download, Eye, ReceiptText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format, startOfWeek, startOfMonth, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import autoTable from "jspdf-autotable";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ThermalReceipt } from "@/components/pos/ThermalReceipt";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"sales" | "loans">("sales");
  const [dateFilter, setDateFilter] = useState("today");
  
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedSale, setSelectedSale] = useState<any>(null);
  const itemsScrollRef = useRef<HTMLDivElement>(null);

  const [vThumbTop, setVThumbTop] = useState(0);
  const updateVScrollbar = useCallback(() => {
    const el = itemsScrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll <= 0) {
      setVThumbTop(0);
      return;
    }
    const percent = scrollTop / maxScroll;
    const thumbMaxTop = 100 - 40; // height is 40%
    setVThumbTop(percent * thumbMaxTop);
  }, []);

  const { paginatedData: paginatedReport, currentPage, totalPages, nextPage, prevPage } = usePagination(reportData, 5);

  useEffect(() => {
    const today = new Date();
    if (dateFilter === "today") {
      setStartDate(startOfDay(today));
      setEndDate(endOfDay(today));
    } else if (dateFilter === "week") {
      setStartDate(startOfWeek(today));
      setEndDate(endOfDay(today));
    } else if (dateFilter === "month") {
      setStartDate(startOfMonth(today));
      setEndDate(endOfDay(today));
    }
  }, [dateFilter]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchReport();
    }
  }, [startDate, endDate, reportType]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("start_date", format(startDate, "yyyy-MM-dd"));
      params.append("end_date", format(endDate, "yyyy-MM-dd"));
      
      const endpoint = reportType === "sales" ? "/sales/" : "/loans/";
      const cacheKey = `nexus_cached_report_${reportType}_${params.toString()}`;
      const data = await fetchWithCache(`${endpoint}?${params.toString()}`, cacheKey);
      setReportData(data);
    } catch (err) {
      toast.error("Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

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

  const downloadPDF = async () => {
    if (!selectedSale) return;
    try {
      const pdf = await generateReceiptPDF();
      const safeCustomerName = (selectedSale.customer_name || "customer")
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .replace(/-+/g, "-")
        .toLowerCase();
      const formattedDate = new Date(selectedSale.created_at).toISOString().split('T')[0];
      pdf.save(`${safeCustomerName}-ziga-receipt-${formattedDate}.pdf`);
    } catch (err: any) {
      console.error("PDF generation error:", err);
      toast.error(`Failed to generate PDF: ${err.message}`);
    }
  };

  const generateReportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("ZIGA POS", 105, 15, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Kigali, Rwanda | +250 788 123 456", 105, 21, { align: "center" });

    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 25, 196, 25);

    const title = `${reportType === "sales" ? "Sales" : "Loans"} Report (${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")})`;
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, 35);
    doc.setFont("helvetica", "normal");
    
    if (reportType === "sales") {
      const tableColumn = ["Receipt #", "Date", "Customer", "Total", "Credit (Paid)", "Debt"];
      const tableRows: any[] = [];
      
      let totalEarned = 0;
      let totalDebt = 0;

      reportData.forEach(sale => {
        const debt = parseFloat(sale.total_amount) - parseFloat(sale.payment_amount);
        totalEarned += parseFloat(sale.payment_amount);
        totalDebt += debt;

        const rowData = [
          `#${sale.id}`,
          new Date(sale.created_at).toLocaleString(),
          sale.customer_name,
          `${parseFloat(sale.total_amount).toFixed(2)}`,
          `${parseFloat(sale.payment_amount).toFixed(2)}`,
          `${debt.toFixed(2)}`
        ];
        tableRows.push(rowData);
      });

      doc.setFontSize(12);
      doc.text(`Total Earned (Credit): ${totalEarned.toFixed(2)} RWF`, 14, 45);
      doc.text(`Total Debt Generated: ${totalDebt.toFixed(2)} RWF`, 14, 53);

      autoTable(doc, {
        startY: 58,
        head: [tableColumn],
        body: tableRows,
      });
    } else {
      const tableColumn = ["Loan ID", "Customer", "Date", "Total Debt", "Status"];
      const tableRows: any[] = [];
      
      let totalOutstanding = 0;

      reportData.forEach(loan => {
        totalOutstanding += parseFloat(loan.total_debt);
        const rowData = [
          `#${loan.id}`,
          loan.customer_name,
          new Date(loan.updated_at).toLocaleString(),
          `${parseFloat(loan.total_debt).toFixed(2)}`,
          loan.status
        ];
        tableRows.push(rowData);
      });

      doc.setFontSize(12);
      doc.text(`Total Outstanding Debt: ${totalOutstanding.toFixed(2)} RWF`, 14, 45);

      autoTable(doc, {
        startY: 53,
        head: [tableColumn],
        body: tableRows,
      });
    }

    return doc;
  };

  const handleExportDownload = () => {
    try {
      const doc = generateReportPDF();
      doc.save(`${reportType}_report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } catch (err: any) {
      console.error("PDF export error:", err);
      toast.error(`Failed to export PDF: ${err.message}`);
    }
  };

  const handleExportPrint = () => {
    try {
      const doc = generateReportPDF();
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    } catch (err: any) {
      console.error("PDF print error:", err);
      toast.error(`Failed to print PDF: ${err.message}`);
    }
  };

  const totalEarned = reportType === "sales" 
    ? reportData.reduce((acc, curr) => acc + parseFloat(curr.payment_amount), 0)
    : 0;

  const totalDebt = reportType === "sales"
    ? reportData.reduce((acc, curr) => acc + (parseFloat(curr.total_amount) - parseFloat(curr.payment_amount)), 0)
    : reportData.reduce((acc, curr) => acc + parseFloat(curr.total_debt), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-primary" /> Reports & Analytics
          </h2>
          <p className="text-muted-foreground">Detailed reports with PDF generation.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportPrint} variant="outline" className="gap-2 font-bold border-primary/20 hover:bg-primary/10">
            <ReceiptText className="w-4 h-4" /> Print Report
          </Button>
          <Button onClick={handleExportDownload} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
            <Download className="w-4 h-4" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4 flex flex-col md:flex-row gap-4 items-end"
      >
        <div className="space-y-2 w-full md:w-48">
          <Label>Report Type</Label>
          <Select value={reportType} onValueChange={(v) => v && setReportType(v as "sales" | "loans")}>
            <SelectTrigger className="bg-background/50 h-10">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Sales Report</SelectItem>
              <SelectItem value="loans">Loans Report</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 w-full md:w-48">
          <Label>Date Range</Label>
          <Select value={dateFilter} onValueChange={(v) => v && setDateFilter(v)}>
            <SelectTrigger className="bg-background/50 h-10">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {dateFilter === "custom" && (
          <>
            <div className="space-y-2 w-full md:w-auto flex flex-col">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger render={<Button variant="outline" className="w-[180px] h-10 justify-start text-left font-normal bg-background/50" />}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2 w-full md:w-auto flex flex-col">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger render={<Button variant="outline" className="w-[180px] h-10 justify-start text-left font-normal bg-background/50" />}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={endDate} onSelect={(d) => d && setEndDate(d)} />
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}
      </motion.div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="glass overflow-hidden border-0 relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {reportType === "sales" ? "Total Earned (Credit)" : "Total Loans (Count)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-emerald-400">
                {reportType === "sales" ? `${totalEarned.toFixed(2)} RWF` : reportData.length}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="glass overflow-hidden border-0 relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {reportType === "sales" ? "Total Debt Generated" : "Total Outstanding Debt"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-amber-400">
                {totalDebt.toFixed(2)} RWF
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl overflow-hidden"
      >
        <div className="p-6 border-b border-border/50">
          <h3 className="text-lg font-bold flex items-center gap-2"><FileText className="w-5 h-5"/> Detailed Data</h3>
        </div>
        <div className="overflow-auto max-h-[calc(100vh-320px)] w-full pb-2">
        <Table>
          <TableHeader className="bg-slate-50/95 shadow-sm sticky top-0 z-20 backdrop-blur-sm">
            {reportType === "sales" ? (
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Credit (Paid)</TableHead>
                <TableHead className="text-right">Debt</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            ) : (
              <TableRow>
                <TableHead>Loan ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Total Debt</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                </TableCell>
              </TableRow>
            ) : reportData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No data found for this period.</TableCell>
              </TableRow>
            ) : (
              paginatedReport.map((data, idx) => {
                if (reportType === "sales") {
                  const debt = parseFloat(data.total_amount) - parseFloat(data.payment_amount);
                  return (
                    <TableRow key={idx} className="border-border/30 hover:bg-accent/50">
                      <TableCell className="font-mono text-xs">#{data.id}</TableCell>
                      <TableCell>{new Date(data.created_at).toLocaleString()}</TableCell>
                      <TableCell className="font-medium">{data.customer_name}</TableCell>
                      <TableCell className="text-right">{parseFloat(data.total_amount).toFixed(2)}</TableCell>
                      <TableCell className="text-right text-emerald-400 font-bold">{parseFloat(data.payment_amount).toFixed(2)}</TableCell>
                      <TableCell className="text-right text-amber-400 font-bold">{debt.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelectedSale(data)} className="border-primary/50 text-primary hover:bg-primary/20 gap-1">
                          <Eye className="w-3 h-3" /> View & Print
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                } else {
                  return (
                    <TableRow key={idx} className="border-border/30 hover:bg-accent/50">
                      <TableCell className="font-mono text-xs">#{data.id}</TableCell>
                      <TableCell>{new Date(data.created_at).toLocaleString()}</TableCell>
                      <TableCell className="font-medium">{data.customer_name}</TableCell>
                      <TableCell className="text-right text-amber-400 font-bold">{parseFloat(data.total_debt).toFixed(2)}</TableCell>
                      <TableCell className="text-center">{data.status}</TableCell>
                    </TableRow>
                  );
                }
              })
            )}
          </TableBody>
        </Table>
        </div>
        <PaginationControls 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onNext={nextPage} 
          onPrev={prevPage} 
        />
      </motion.div>

      {/* View Receipt Dialog */}
      <Dialog open={!!selectedSale} onOpenChange={(open) => { if (!open) setSelectedSale(null); }}>
        <DialogContent showCloseButton={false} className="sm:max-w-[440px] p-0 overflow-hidden bg-transparent border-0 shadow-none">
          <ThermalReceipt 
            receipt={selectedSale} 
            onPrint={handlePrint} 
            onDownload={downloadPDF} 
            onClose={() => setSelectedSale(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
