"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { fetchWithCache } from "@/lib/offlineCache";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Wallet, Calendar as CalendarIcon, Building, Download } from "lucide-react";
import { Label } from "@/components/ui/label";
import { format, startOfWeek, startOfMonth, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationControls } from "@/components/ui/pagination-controls";

export default function BalancePage() {
  const [balanceData, setBalanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [dateFilter, setDateFilter] = useState("today");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  const { paginatedData: paginatedBalance, currentPage, totalPages, nextPage, prevPage } = usePagination(balanceData);

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
      fetchBalance();
    }
  }, [startDate, endDate]);

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const start = format(startDate, "yyyy-MM-dd");
      const end = format(endDate, "yyyy-MM-dd");
      
      const cacheKey = `nexus_cached_balance_${start}_${end}`;
      const data = await fetchWithCache(`/reports/revenue/?start_date=${start}&end_date=${end}`, cacheKey);
      setBalanceData(data);
    } catch (err) {
      toast.error("Failed to load balance report");
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = balanceData.reduce((acc, curr) => acc + parseFloat(curr.total_sales_value), 0);

  const generatePDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("NEXUS POS", 105, 15, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Kigali, Rwanda | +250 788 123 456", 105, 21, { align: "center" });

    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 25, 196, 25);

    const title = `Company Balance Report (${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")})`;
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, 35);
    doc.setFont("helvetica", "normal");
    
    const tableColumn = ["Company Name", "Products Sold", "Total Balance Earned"];
    const tableRows: any[] = [];
    
    balanceData.forEach(data => {
      const rowData = [
        data.company_name,
        data.items_sold.toString(),
        `${parseFloat(data.total_sales_value).toFixed(2)} RWF`
      ];
      tableRows.push(rowData);
    });

    doc.setFontSize(12);
    doc.text(`Total Aggregated Balance: ${totalBalance.toFixed(2)} RWF`, 14, 45);

    autoTable(doc, {
      startY: 53,
      head: [tableColumn],
      body: tableRows,
    });

    doc.save(`company_balance_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="w-8 h-8 text-primary" /> Daily Balance
          </h2>
          <p className="text-muted-foreground">View total amount earned by each company over time.</p>
        </div>
        <Button onClick={generatePDF} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
          <Download className="w-4 h-4" /> Download PDF
        </Button>
      </div>

      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4 flex flex-col md:flex-row gap-4 items-end"
      >
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="glass overflow-hidden border-0 relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet className="w-24 h-24" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance Earned</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold text-emerald-400">{totalBalance.toFixed(2)} RWF</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-xl overflow-hidden"
      >
        <div className="p-6 border-b border-border/50">
          <h3 className="text-lg font-bold flex items-center gap-2"><Building className="w-5 h-5"/> Company Earnings Balance</h3>
        </div>
        <div className="overflow-auto max-h-[calc(100vh-320px)] w-full pb-2">
        <Table>
          <TableHeader className="bg-slate-50/95 shadow-sm sticky top-0 z-20 backdrop-blur-sm">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>Company Name</TableHead>
              <TableHead className="text-right">Products Sold</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                </TableCell>
              </TableRow>
            ) : balanceData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No sales data found for this date range.</TableCell>
              </TableRow>
            ) : (
              paginatedBalance.map((data, idx) => (
                <TableRow key={idx} className="border-border/30 hover:bg-accent/50">
                  <TableCell className="font-medium">{data.company_name}</TableCell>
                  <TableCell className="text-right">{data.items_sold}</TableCell>
                  <TableCell className="text-right font-bold text-emerald-400">
                    {parseFloat(data.total_sales_value).toFixed(2)} RWF
                  </TableCell>
                </TableRow>
              ))
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
    </div>
  );
}
