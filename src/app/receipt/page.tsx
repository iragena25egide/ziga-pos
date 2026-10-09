"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ReceiptText, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import QRCode from "qrcode";

export default function ReceiptViewPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        setLoading(true);
        try {
          const res = await api.get(`/sales/${id}/`);
          setReceipt(res.data);
        } catch (e) {
          const res = await api.get("/sales/");
          const sale = res.data.find((s: any) => String(s.id) === String(id));
          if (sale) {
            setReceipt(sale);
          } else {
            setError("Receipt not found");
          }
        }
      } catch (err: any) {
        setError("Failed to load receipt");
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchReceipt();
    }
  }, [id]);

  const generateReceiptPDF = async () => {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [80, 200]
    });
    
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Ziga Pos", 40, 13, { align: "center" });

    let y = 18;
    const companyName = (receipt.company_name || receipt.company?.name || "").trim();
    if (companyName) {
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text(companyName, 40, y, { align: "center" });
      y += 5;
    }

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    const address = receipt.company_address || "Kigali, Rwanda";
    const phone = receipt.company_phone || "+250 788 123 456";
    pdf.text(`${address} | ${phone}`, 40, y, { align: "center" });
    y += 4.5;
    pdf.text(`Receipt #${receipt.id}`, 40, y, { align: "center" });
    y += 4.5;
    pdf.text(new Date(receipt.created_at).toLocaleString(), 40, y, { align: "center" });
    y += 6;

    pdf.text(`Customer: ${receipt.customer_name}`, 4, y);
    y += 5;
    const customerPhone = receipt.customer_phone || receipt.phone;
    if (customerPhone) {
      pdf.text(`Phone: ${customerPhone}`, 4, y);
      y += 5;
    }
    pdf.text(`Salesperson: ${receipt.salesperson_name || 'Admin'}`, 4, y);
    y += 5;

    pdf.setLineWidth(0.5);
    pdf.setDrawColor(200, 200, 200);
    pdf.line(4, y, 70, y); 
    y += 5;
    
    pdf.setFont("helvetica", "bold");
    pdf.text("Item", 4, y);
    pdf.text("Qty", 30, y, { align: "center" });
    pdf.text("Price", 50, y, { align: "right" });
    pdf.text("Total", 70, y, { align: "right" });
    y += 3;
    pdf.line(4, y, 70, y);
    y += 5;

    pdf.setFont("helvetica", "normal");
    receipt.items?.forEach((item: any) => {
      pdf.text(item.product_name.substring(0, 14), 4, y);
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
    pdf.text(`${Number(receipt.total_amount).toLocaleString()} RWF`, 70, y, { align: "right" });
    y += 6;

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text("Payment:", 4, y);
    pdf.text(`${Number(receipt.payment_amount).toLocaleString()} RWF`, 70, y, { align: "right" });
    y += 6;

    if (parseFloat(receipt.balance) > 0) {
      pdf.text("Balance Due:", 4, y);
      pdf.text(`${Number(receipt.balance).toLocaleString()} RWF`, 70, y, { align: "right" });
      y += 6;
    }

    y += 5;
    try {
      const qrText = typeof window !== 'undefined' ? `${window.location.origin}/receipt?id=${receipt.id}` : `Receipt #${receipt.id}`;
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
    if (!receipt) return;
    try {
      const pdf = await generateReceiptPDF();
      pdf.autoPrint();
      window.open(pdf.output('bloburl'), '_blank');
    } catch (err) {
      console.error("Print error", err);
    }
  };

  const handleDownload = async () => {
    if (!receipt) return;
    try {
      const pdf = await generateReceiptPDF();
      const safeCustomerName = (receipt.customer_name || "customer")
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .replace(/-+/g, "-")
        .toLowerCase();
      pdf.save(`${safeCustomerName}-ziga-receipt.pdf`);
    } catch (err) {
      console.error("Download error", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0a0f1c] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0a0f1c] text-white space-y-4">
        <ReceiptText className="w-16 h-16 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-bold">{error || "Receipt not found"}</h2>
      </div>
    );
  }

  const customerPhone = receipt.customer_phone || receipt.phone;

  return (
    <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-dark border-border/50 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
            <ReceiptText className="w-6 h-6" /> Ziga Pos
          </CardTitle>
          {receipt.company_name && (
            <p className="text-sm font-semibold text-slate-300 mt-1 uppercase tracking-wide">
              {receipt.company_name}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-0.5">Receipt #{receipt.id}</p>
        </CardHeader>
        <CardContent>
          <div className="bg-[#0f172a] rounded-xl border border-dashed border-border/50 p-6 font-mono text-sm shadow-inner mb-6">
            <div className="text-center mb-6 space-y-1">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Ziga Pos</h3>
              {receipt.company_name && (
                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">{receipt.company_name}</p>
              )}
              <p className="text-slate-400">Kigali, Rwanda | +250 788 123 456</p>
              <p className="text-slate-400">{new Date(receipt.created_at).toLocaleString()}</p>
            </div>
            
            <div className="space-y-1 mb-6 text-slate-300">
              <p><span className="text-slate-500">Customer:</span> <span className="font-medium text-white">{receipt.customer_name}</span></p>
              {customerPhone && (
                <p><span className="text-slate-500">Phone:</span> <span className="font-medium text-white">{customerPhone}</span></p>
              )}
              <p><span className="text-slate-500">Salesperson:</span> <span className="font-medium text-white">{receipt.salesperson_name || 'Admin'}</span></p>
            </div>

            <table className="w-full mb-6">
              <thead className="border-b border-dashed border-slate-700 text-slate-400">
                <tr>
                  <th className="text-left pb-2 font-normal">Item</th>
                  <th className="text-center pb-2 font-normal">Qty</th>
                  <th className="text-right pb-2 font-normal">Price</th>
                  <th className="text-right pb-2 font-normal">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-slate-800 text-slate-300">
                {receipt.items?.map((item: any) => (
                  <tr key={item.id}>
                    <td className="py-3">{item.product_name}</td>
                    <td className="text-center py-3">{item.quantity}</td>
                    <td className="text-right py-3">{item.unit_price}</td>
                    <td className="text-right py-3 font-medium text-white">{item.subtotal || item.total_price || (item.quantity * item.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-dashed border-slate-700 pt-4 space-y-2">
              <div className="flex justify-between text-base">
                <span className="text-slate-400">Total:</span>
                <span className="font-bold text-white">{receipt.total_amount} RWF</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment:</span>
                <span className="text-slate-300">{receipt.payment_amount} RWF</span>
              </div>
              {parseFloat(receipt.balance) > 0 && (
                <div className="flex justify-between font-medium text-amber-400 mt-2 pt-2 border-t border-slate-800">
                  <span>Balance Due:</span>
                  <span>{receipt.balance} RWF</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handlePrint} variant="outline" className="w-full gap-2 border-primary/20 hover:bg-primary/10">
              <Printer className="w-4 h-4" /> Print
            </Button>
            <Button onClick={handleDownload} className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Download className="w-4 h-4" /> Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
