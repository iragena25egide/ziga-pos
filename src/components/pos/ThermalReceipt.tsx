import { ReceiptText, Printer, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ThermalReceiptProps {
  receipt: any;
  onPrint: () => void;
  onDownload: () => void;
  onClose?: () => void;
}

export function ThermalReceipt({ receipt, onPrint, onDownload, onClose }: ThermalReceiptProps) {
  if (!receipt) return null;

  return (
    <div className="flex flex-col bg-white text-black font-mono w-full max-h-[85vh] overflow-hidden rounded-md">
      {/* Top Action Bar - Hidden when printing */}
      <div className="flex items-center justify-between p-3 bg-slate-900 text-slate-100 print:hidden">
        <div className="flex items-center gap-2 text-sm font-bold">
          <ReceiptText className="w-4 h-4 text-emerald-400" />
          Receipt #{receipt.id}
        </div>
        <div className="flex gap-2">
          <Button title="Download Receipt PDF" size="icon" variant="secondary" className="h-8 w-8 hover:bg-slate-700" onClick={onDownload}>
            <Download className="w-4 h-4" />
          </Button>
          <Button title="Print Receipt" size="icon" className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onPrint}>
            <Printer className="w-4 h-4" />
          </Button>
          {onClose && (
            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* The Printable Area */}
      <div id="thermal-receipt-content" className="flex flex-col bg-white printable-receipt text-xs leading-relaxed overflow-hidden print:overflow-visible">
        {/* Fixed Header Area */}
        <div className="px-6 pt-6 shrink-0">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-widest uppercase mb-0.5">
              Ziga Pos
            </h1>
            {receipt.company_name && (
              <p className="text-sm font-semibold text-gray-800 uppercase mb-1 tracking-wide">
                {receipt.company_name}
              </p>
            )}
            <p className="text-gray-500">{receipt.company_address || "KN 4 Ave, Kigali, Rwanda"}</p>
            <p className="text-gray-500">{receipt.company_phone || "+250 788 123 456"}</p>
            <p className="text-[10px] font-bold text-gray-700 tracking-wider mt-1 uppercase">
              TIN: {receipt.company_tin || receipt.tin_number || "109283746"}
            </p>
          </div>

          <div className="border-b-2 border-dashed border-gray-300 pb-3 mb-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Date:</span>
              <span className="font-semibold">{new Date(receipt.created_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-500">Receipt No:</span>
              <span className="font-semibold">{receipt.id}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-500">Cashier:</span>
              <span className="font-semibold">{receipt.salesperson_name || "Admin"}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-500">Customer:</span>
              <span className="font-semibold">{receipt.customer_name || "Guest"}</span>
            </div>
          </div>

          <table className="w-full mb-1">
            <thead>
              <tr className="border-b-2 border-dashed border-gray-300">
                <th className="py-2 text-left font-bold text-gray-500 w-[50%]">Item</th>
                <th className="py-2 text-center font-bold text-gray-500 w-[15%]">Qty</th>
                <th className="py-2 text-right font-bold text-gray-500 w-[35%]">Amount</th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Scrollable Items Area (roughly 3-4 items height) */}
        <ScrollArea type="always" className="h-[140px] px-6 print:h-auto print:max-h-none print:overflow-visible">
          <table className="w-full">
            <tbody className="divide-y divide-dashed divide-gray-100">
              {receipt.items?.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className="py-2 text-left align-top pr-2 w-[50%]">
                    <div className="font-semibold break-words line-clamp-2">
                      {item.product_name || item.name || "Item"}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">@ {Number(item.unit_price).toLocaleString()} RWF</div>
                  </td>
                  <td className="py-2 text-center align-top font-semibold w-[15%]">{item.quantity}</td>
                  <td className="py-2 text-right align-top font-bold w-[35%]">
                    {Number(item.subtotal || item.total_price || item.quantity * item.unit_price).toLocaleString()} RWF
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>

        {/* Fixed Footer Area */}
        <div className="px-6 pb-6 pt-2 shrink-0">
          <div className="border-t-2 border-dashed border-gray-300 pt-3 space-y-1">
            <div className="flex justify-between text-sm font-bold">
              <span>TOTAL</span>
              <span>{Number(receipt.total_amount).toLocaleString()} RWF</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Cash Tendered</span>
              <span>{Number(receipt.payment_amount).toLocaleString()} RWF</span>
            </div>
            {parseFloat(receipt.balance) > 0 && (
              <div className="flex justify-between text-red-600 font-bold mt-1">
                <span>Balance Due</span>
                <span>{Number(receipt.balance).toLocaleString()} RWF</span>
              </div>
            )}
          </div>

          <div className="mt-8 text-center text-gray-500 flex flex-col items-center">
            {/* Simulated Barcode via CSS blocks for visual aesthetics */}
            <div className="flex gap-[2px] justify-center h-8 mb-2 opacity-80">
              {[...Array(30)].map((_, i) => (
                <div key={i} className="bg-black" style={{ width: `${Math.random() * 4 + 1}px` }}></div>
              ))}
            </div>
            <p className="text-[10px] font-bold tracking-[0.2em]">{receipt.id}</p>
            <p className="mt-4 font-semibold text-black">Thank you for your business!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
