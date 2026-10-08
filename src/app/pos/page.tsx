"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import api from "@/lib/api";
import { fetchWithCache } from "@/lib/offlineCache";
import localforage from "localforage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  ReceiptText,
  ArrowRight,
  AlertCircle,
  CreditCard,
  ChevronDown,
  Printer,
  Download,
  X,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import jsPDF from "jspdf";
import { useOfflineSync } from "@/components/OfflineSync";
import { ThermalReceipt } from "@/components/pos/ThermalReceipt";

export default function POSPage() {
  const { isOnline, addPendingSync } = useOfflineSync();
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");

  const [cart, setCart] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('nexus_pos_cart');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [discount, setDiscount] = useState<number>(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('nexus_pos_customer') || "";
    }
    return "";
  });
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [loanConfirmation, setLoanConfirmation] = useState<{
    isOpen: boolean;
    existingDebt: string;
    newDebt: string;
    message: string;
  } | null>(null);
  const [clearCartConfirmOpen, setClearCartConfirmOpen] = useState(false);
  const [recallOrderOpen, setRecallOrderOpen] = useState(false);
  const [quickAddCustomerOpen, setQuickAddCustomerOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [heldOrders, setHeldOrders] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('nexus_pos_held_orders');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('nexus_pos_held_orders', JSON.stringify(heldOrders));
    }
  }, [heldOrders]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('nexus_pos_cart', JSON.stringify(cart));
    }
  }, [cart]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('nexus_pos_customer', selectedCustomerId);
    }
  }, [selectedCustomerId]);

  const clearCart = () => {
    setCart([]);
    setSelectedCustomerId("");
    setPaymentAmount("");
    setDiscount(0);
  };

  const handleClearCartClick = () => {
    if (cart.length > 0) {
      setClearCartConfirmOpen(true);
    } else {
      clearCart();
    }
  };

  const handleHoldOrder = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty.");
      return;
    }
    const order = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      cart,
      customerId: selectedCustomerId,
      paymentAmount
    };
    setHeldOrders(prev => [...prev, order]);
    clearCart();
    toast.success("Order held successfully.");
  };

  const restoreOrder = (order: any) => {
    setCart(order.cart);
    setSelectedCustomerId(order.customerId);
    setPaymentAmount(order.paymentAmount);
    setHeldOrders(prev => prev.filter(o => o.id !== order.id));
    setRecallOrderOpen(false);
    toast.success("Order recalled.");
  };

  const handleQuickAddCustomer = async () => {
    if (!newCustomerName) {
      toast.error("Customer name is required");
      return;
    }
    try {
      const res = await api.post("/customers/", { name: newCustomerName, phone: newCustomerPhone });
      setCustomers(prev => [...prev, res.data]);
      setSelectedCustomerId(res.data.id.toString());
      setQuickAddCustomerOpen(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
      toast.success("Customer added successfully");
    } catch (err) {
      toast.error("Failed to add customer. Check your connection.");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.company_name?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const cartScrollRef = useRef<HTMLDivElement>(null);
  const itemsScrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [thumbTop, setThumbTop] = useState(0);
  const [thumbHeight, setThumbHeight] = useState(40);
  const [showScrollbar, setShowScrollbar] = useState(false);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startScrollTopRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const barcodeBuffer = useRef("");
  const lastKeyTime = useRef(Date.now());

  useEffect(() => {
    const handleBarcodeScan = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime.current > 50) {
        barcodeBuffer.current = "";
      }

      if (e.key === "Enter") {
        if (barcodeBuffer.current.length > 3) {
          const code = barcodeBuffer.current;
          const product = products.find(
            (p) => p.barcode === code || p.id.toString() === code
          );
          if (product) {
            addToCart(product);
            toast.success(`Added ${product.name}`);
          } else {
            toast.error(`Barcode ${code} not found`);
          }
        }
        barcodeBuffer.current = "";
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
      lastKeyTime.current = currentTime;
    };

    document.addEventListener("keydown", handleBarcodeScan);
    return () => document.removeEventListener("keydown", handleBarcodeScan);
  }, [products]);

  const updateScrollbar = useCallback(() => {
    const el = cartScrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const canScroll = scrollHeight > clientHeight;
    setShowScrollbar(canScroll);
    if (canScroll) {
      const ratio = clientHeight / scrollHeight;
      const tHeight = Math.max(ratio * clientHeight, 36);
      const tTop =
        (scrollTop / (scrollHeight - clientHeight)) * (clientHeight - tHeight);
      setThumbHeight(tHeight);
      setThumbTop(tTop);
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !cartScrollRef.current) return;

      const el = cartScrollRef.current;
      const { scrollHeight, clientHeight } = el;

      const deltaY = e.clientY - startYRef.current;

      const trackHeight = clientHeight;
      const thumbMaxTop = trackHeight - thumbHeight;
      const scrollMaxTop = scrollHeight - clientHeight;

      if (thumbMaxTop > 0) {
        const scrollAmount = (deltaY / thumbMaxTop) * scrollMaxTop;
        el.scrollTop = startScrollTopRef.current + scrollAmount;
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [thumbHeight]);

  useEffect(() => {
    const t = setTimeout(updateScrollbar, 50);
    return () => clearTimeout(t);
  }, [cart, updateScrollbar]);

  const [receipt, setReceipt] = useState<any>(null);

  const generateReceiptPDF = async () => {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [80, 200],
    });

    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("NEXUS POS", 40, 15, { align: "center" });

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text("Kigali, Rwanda | +250 788 123 456", 40, 20, { align: "center" });
    pdf.text(`Receipt #${receipt.id}`, 40, 25, { align: "center" });
    pdf.text(new Date(receipt.created_at).toLocaleString(), 40, 30, {
      align: "center",
    });

    pdf.text(`Customer: ${receipt.customer_name}`, 4, 40);
    pdf.text(`Salesperson: ${receipt.salesperson_name || "Admin"}`, 4, 45);

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
    receipt.items?.forEach((item: any) => {
      pdf.text(item.product_name.substring(0, 14), 4, y);
      pdf.text(String(item.quantity), 30, y, { align: "center" });
      pdf.text(Number(item.unit_price).toLocaleString(), 50, y, {
        align: "right",
      });
      pdf.text(
        Number(
          item.subtotal || item.total_price || item.quantity * item.unit_price,
        ).toLocaleString(),
        70,
        y,
        { align: "right" },
      );
      y += 6;
    });

    pdf.line(4, y, 70, y);
    y += 6;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("Total:", 4, y);
    pdf.text(`${Number(receipt.total_amount).toLocaleString()} RWF`, 70, y, {
      align: "right",
    });
    y += 6;

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text("Payment:", 4, y);
    pdf.text(`${Number(receipt.payment_amount).toLocaleString()} RWF`, 70, y, {
      align: "right",
    });
    y += 6;

    if (parseFloat(receipt.balance) > 0) {
      pdf.text("Balance Due:", 4, y);
      pdf.text(`${Number(receipt.balance).toLocaleString()} RWF`, 70, y, {
        align: "right",
      });
      y += 6;
    }

    y += 5;
    try {
      const qrText = `https://nexusps.netlify.app/receipt?id=${receipt.id}`;
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
    } catch (err: any) {
      console.error("Print generation error:", err);
      toast.error(`Failed to print receipt: ${err.message}`);
    }
  };

  const handleDownload = async () => {
    if (!receipt) return;
    try {
      const pdf = await generateReceiptPDF();
      const safeCustomerName = (receipt.customer_name || "Guest")
        .replace(/\s+/g, "-")
        .toLowerCase();
      pdf.save(`${safeCustomerName}-nexus-receipt.pdf`);
    } catch (err: any) {
      console.error("PDF generation error:", err);
      toast.error(`Failed to generate PDF: ${err.message}`);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await fetchWithCache("/products/", "nexus_cached_products");
      setProducts(data);
    } catch (err) {
      toast.error("Failed to load products and no offline cache available");
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await fetchWithCache("/customers/", "nexus_cached_customers");
      setCustomers(data);
    } catch (err) {
      toast.error("Failed to load customers and no offline cache available");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existingItemIndex = prev.findIndex((item) => item.product_id === product.id);
      
      if (existingItemIndex >= 0) {
        const existing = prev[existingItemIndex];
        const newQty = (typeof existing.quantity === "number" ? existing.quantity : 0) + 1;
        
        if (newQty > product.stock_quantity) {
          toast.error(`Only ${product.stock_quantity} available in stock.`);
          return prev;
        }
        
        const newCart = [...prev];
        newCart.splice(existingItemIndex, 1);
        
        return [
          { ...existing, quantity: newQty },
          ...newCart
        ];
      }
      
      if (product.stock_quantity < 1) {
        toast.error("Out of stock.");
        return prev;
      }
      
      return [
        {
          product_id: product.id,
          name: product.name,
          unit_price: product.price,
          quantity: 1,
          stock_quantity: product.stock_quantity,
        },
        ...prev
      ];
    });
    if (window.innerWidth < 768) {
      setTimeout(() => {
        document
          .getElementById("pos-cart")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const updateCartQuantity = (productId: number, rawValue: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product_id === productId) {
          if (rawValue === "") {
            return { ...item, quantity: "" };
          }
          const qty = parseInt(rawValue, 10);
          if (isNaN(qty)) return item;

          if (qty > item.stock_quantity) {
            toast.error(`Only ${item.stock_quantity} available in stock.`);
            return { ...item, quantity: item.stock_quantity };
          }
          return { ...item, quantity: qty };
        }
        return item;
      }),
    );
  };

  const updateCartNote = (productId: number, note: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId ? { ...item, note } : item
      )
    );
  };

  const subTotalAmount = cart.reduce((sum, item) => {
    const qty = typeof item.quantity === "number" ? item.quantity : 0;
    return sum + qty * item.unit_price;
  }, 0);
  const totalAmount = Math.max(0, subTotalAmount - discount);
  const totalItemsCount = cart.reduce((sum, item) => {
    const qty = typeof item.quantity === "number" ? item.quantity : 0;
    return sum + qty;
  }, 0);
  const balance = totalAmount - parseFloat(paymentAmount || "0");

  const handleCheckout = async (confirmLoan = false) => {
    if (!selectedCustomerId) {
      toast.error("Please select a customer.");
      return;
    }

    if (cart.length === 0) {
      toast.error("Cart is empty.");
      return;
    }
    if (
      cart.some(
        (item) => typeof item.quantity !== "number" || item.quantity < 1,
      )
    ) {
      toast.error("Please enter a valid quantity for all items.");
      return;
    }

    try {
      const payload = {
        customer_id: selectedCustomerId,
        customer_name: customers.find((c) => c.id.toString() === selectedCustomerId)?.name || "Guest",
        items: cart,
        payment_amount: parseFloat(paymentAmount || "0"),
        discount_amount: discount,
        confirm_loan: confirmLoan,
      };

      if (!isOnline) {
        addPendingSync(payload);
        toast.success("Saved offline. Will sync when connection is restored.");
        
        // --- OFFLINE STOCK REDUCTION ---
        const updatedProducts = products.map((p) => {
          const cartItem = cart.find((c) => c.product_id === p.id);
          if (cartItem) {
            const qty = typeof cartItem.quantity === "number" ? cartItem.quantity : 0;
            return { ...p, stock_quantity: p.stock_quantity - qty };
          }
          return p;
        });
        setProducts(updatedProducts);
        localforage.getItem("nexus_cached_products").then((cached: any) => {
          if (cached && cached.data) {
            const newData = cached.data.map((p: any) => {
              const cartItem = cart.find((c) => c.product_id === p.id);
              if (cartItem) {
                const qty = typeof cartItem.quantity === "number" ? cartItem.quantity : 0;
                return { ...p, stock_quantity: p.stock_quantity - qty };
              }
              return p;
            });
            localforage.setItem("nexus_cached_products", { ...cached, data: newData });
          }
        }).catch(console.error);
        // --------------------------------

        setReceipt({
          id: `OFF-${Date.now()}`,
          created_at: new Date().toISOString(),
          customer_name: payload.customer_name,
          salesperson_name: localStorage.getItem("username") || "Cashier",
          company_name: localStorage.getItem("company_name") || "ZIGA POS",
          company_address: localStorage.getItem("company_address") || "",
          company_phone: localStorage.getItem("company_phone") || "",
          company_tin: localStorage.getItem("company_tin") || "",
          items: cart.map(i => ({...i, product_name: i.name})),
          total_amount: totalAmount,
          payment_amount: payload.payment_amount,
          balance: balance > 0 ? balance : 0
        });
        setCart([]);
        setSelectedCustomerId("");
        setCustomerSearch("");
        setPaymentAmount("");
        setLoanConfirmation(null);
        return;
      }

      const res = await api.post("/sales/", payload);
      toast.success("Checkout successful!");
      setReceipt(res.data);
      setCart([]);
      setSelectedCustomerId("");
      setCustomerSearch("");
      setPaymentAmount("");
      setLoanConfirmation(null);
    } catch (error: any) {
      if (
        error.response?.status === 409 &&
        error.response?.data?.requires_confirmation
      ) {
        setLoanConfirmation({
          isOpen: true,
          message: error.response.data.message,
          existingDebt: error.response.data.existing_debt,
          newDebt: error.response.data.new_debt,
        });
      } else {
        toast.error("Checkout failed. Check stock or inputs.");
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-6rem)] relative pb-20 lg:pb-0">
      {/* Left: Products & Search */}
      <div className="lg:w-2/3 flex flex-col gap-6">
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b mb-2 shrink-0">
            <CardTitle>Products</CardTitle>
            <div className="relative w-48 md:w-64 flex items-center">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search products ( / )"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-9 pr-8 h-9 bg-white"
              />
              {productSearch && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 h-9 w-9 p-0 hover:bg-transparent"
                  onClick={() => setProductSearch("")}
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="overflow-y-auto flex-1 custom-scrollbar">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 mt-20 space-y-4">
                <div className="bg-muted p-4 rounded-full">
                  <Search className="w-8 h-8 opacity-50" />
                </div>
                <p className="text-sm font-medium">No products added yet</p>
                <p className="text-xs text-center max-w-[200px] text-slate-400">
                  Try adjusting your search query or add products to your inventory.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {filteredProducts.map((product) => {
                  const isInCart = cart.some(item => item.product_id === product.id);
                  return (
                  <div
                    key={product.id}
                    className={`border rounded-xl p-4 transition-all cursor-pointer flex flex-col justify-between ${
                      isInCart 
                        ? "border-primary bg-primary/5 ring-1 ring-slate-200 shadow-sm" 
                        : "hover:border-primary/50 hover:bg-slate-50 hover:shadow-sm"
                    }`}
                    onClick={() => addToCart(product)}
                  >
                    <div>
                      <h3 className="font-semibold leading-tight mb-1">{product.name}</h3>
                      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                        {product.company_name}
                      </p>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="font-bold text-emerald-600">
                        {product.price} RWF
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${product.stock_quantity === 0 ? "text-white bg-red-500" : product.stock_quantity < 5 ? "text-red-600 bg-red-100" : "text-slate-400 bg-slate-100"}`}>
                        {product.stock_quantity === 0 ? "Out of Stock" : `Stock: ${product.stock_quantity}`}
                      </span>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right: Cart & Checkout - header pinned, middle scrolls, footer pinned */}
      <Card
        id="pos-cart"
        className="lg:w-1/3 flex flex-col min-h-0 overflow-hidden lg:h-full"
      >
        {/* TOP - FIXED */}
        <CardHeader className="border-b shrink-0 pb-3 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Current Order
            <span className="text-sm font-normal text-muted-foreground bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full ml-1 whitespace-nowrap">
              {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
            </span>
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setRecallOrderOpen(true)} className="h-8 px-2 text-xs">
              Recall
            </Button>
            <Button variant="outline" size="sm" onClick={handleHoldOrder} className="h-8 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50">
              Hold
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClearCartClick} className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2 text-xs">
              Clear
            </Button>
          </div>
        </CardHeader>

        {/* MIDDLE - SCROLLABLE CART ITEMS with always-visible custom scrollbar */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {/* Scroll content — native scrollbar hidden */}
          <div
            ref={cartScrollRef}
            onScroll={updateScrollbar}
            style={{
              position: "absolute",
              inset: 0,
              overflowY: "scroll",
              paddingTop: "1rem",
              paddingBottom: "1rem",
              paddingLeft: "1.5rem",
              paddingRight: "2rem", // room for custom scrollbar
              msOverflowStyle: "none",
              scrollbarWidth: "none", // hide native scrollbar Firefox
            }}
            className="hide-native-scrollbar"
          >
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 mt-20 space-y-4">
                <div className="bg-muted p-4 rounded-full">
                  <ShoppingCart className="w-8 h-8 opacity-50" />
                </div>
                <p className="text-sm font-medium">Your cart is empty</p>
                <p className="text-xs text-center max-w-[200px] text-slate-400">
                  Search or click on products to add them to the cart.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-muted/50 p-2 rounded-md border shadow-sm"
                  >
                    <div className="flex-1 mr-2">
                      <p className="font-semibold text-xs text-slate-800">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-medium text-slate-500 min-w-[50px]">
                          {item.unit_price} RWF
                        </span>
                        <div className="flex items-center border rounded bg-background shadow-sm">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-none border-r text-muted-foreground hover:text-foreground"
                            onClick={() => updateCartQuantity(item.product_id, String(Math.max(1, (typeof item.quantity === 'number' ? item.quantity : 1) - 1)))}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateCartQuantity(item.product_id, e.target.value)
                            }
                            onBlur={() => {
                              if (item.quantity === "" || item.quantity < 1) {
                                updateCartQuantity(item.product_id, "1");
                              }
                            }}
                            className="w-10 h-6 text-center font-bold text-xs border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0.5"
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-none border-l text-muted-foreground hover:text-foreground"
                            onClick={() => updateCartQuantity(item.product_id, String((typeof item.quantity === 'number' ? item.quantity : 0) + 1))}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Input
                        placeholder="Add note..."
                        value={item.note || ""}
                        onChange={(e) => updateCartNote(item.product_id, e.target.value)}
                        className="h-6 text-[10px] mt-2 bg-transparent border-dashed rounded-sm"
                      />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-md"
                        onClick={() => removeFromCart(item.product_id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <span className="font-bold text-xs text-indigo-700 whitespace-nowrap">
                        {item.unit_price *
                          (typeof item.quantity === "number"
                            ? item.quantity
                            : 0)}{" "}
                        RWF
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Always-visible custom scrollbar track + thumb */}
          <div
            style={{
              position: "absolute",
              right: 4,
              top: 6,
              bottom: 6,
              width: 6,
              background: "#e2e8f0",
              borderRadius: 3,
              zIndex: 10,
            }}
          >
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                isDraggingRef.current = true;
                startYRef.current = e.clientY;
                if (cartScrollRef.current) {
                  startScrollTopRef.current = cartScrollRef.current.scrollTop;
                }
                document.body.style.userSelect = "none";
              }}
              style={{
                position: "absolute",
                top: thumbTop,
                left: 0,
                width: "100%",
                height: showScrollbar ? thumbHeight : "100%",
                background: showScrollbar ? "#94a3b8" : "#e2e8f0",
                borderRadius: 3,
                transition: isDraggingRef.current
                  ? "none"
                  : "top 0.08s ease, background 0.2s",
                cursor: showScrollbar ? "pointer" : "default",
              }}
            />
          </div>
        </div>

        {/* BOTTOM - FIXED */}
        <div className="shrink-0 border-t bg-card px-4 py-3 space-y-2">
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground block font-medium">
              Customer
            </label>
            <div className="flex gap-2">
              <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      className="flex-1 justify-between h-8 text-xs font-normal text-left bg-background"
                      role="combobox"
                      aria-expanded={customerOpen}
                    />
                  }
                >
                  {selectedCustomerId
                    ? customers.find(
                        (c) => c.id.toString() === selectedCustomerId,
                      )?.name || "Select customer..."
                    : "Select customer..."}
                  <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                  <div className="p-1 border-b">
                    <Input
                      placeholder="Search customer..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto p-1">
                    {customers.filter((c) =>
                      c.name.toLowerCase().includes(customerSearch.toLowerCase()),
                    ).length === 0 ? (
                      <div className="p-3 text-xs text-muted-foreground text-center flex flex-col items-center gap-2">
                        <span>Customer not found.</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs w-full"
                          onClick={() => {
                            setCustomerOpen(false);
                            setNewCustomerName(customerSearch);
                            setQuickAddCustomerOpen(true);
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" /> Add "{customerSearch}"
                        </Button>
                      </div>
                    ) : (
                      customers
                        .filter((c) =>
                          c.name.toLowerCase().includes(customerSearch.toLowerCase()),
                        )
                        .map((c) => (
                          <div
                            key={c.id}
                            className="px-2 py-1.5 text-xs hover:bg-muted cursor-pointer rounded-md flex justify-between items-center"
                            onClick={() => {
                              setSelectedCustomerId(c.id.toString());
                              setCustomerOpen(false);
                            }}
                          >
                            <span className="font-medium">{c.name}</span>
                          </div>
                        ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuickAddCustomerOpen(true)}
                className="h-8 w-8 shrink-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="space-y-1 pt-1 border-t border-dashed">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{subTotalAmount} RWF</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Discount (RWF)</span>
              <Input
                type="number"
                value={discount || ""}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="w-16 h-6 text-right text-xs"
              />
            </div>
            <div className="flex justify-between font-bold text-sm pt-0.5">
              <span>Total</span>
              <span className="text-slate-900">{totalAmount} RWF</span>
            </div>

            {balance > 0 && (
              <div className="flex justify-between font-bold text-[10px] text-red-600 bg-red-50 p-1 rounded-md mt-1">
                <span>Remaining Balance</span>
                <span>{balance.toFixed(2)} RWF</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-1 border-t">
            <label className="text-[11px] text-muted-foreground block font-medium">
              Payment
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full h-8 font-bold text-sm bg-background border-slate-300 focus-visible:ring-primary"
                />
                <div className="flex gap-1 mt-1">
                  <Button variant="secondary" size="sm" className="h-5 px-1 text-[9px] flex-1 bg-slate-100 hover:bg-slate-200" onClick={() => setPaymentAmount(totalAmount.toString())}>Exact</Button>
                  <Button variant="secondary" size="sm" className="h-5 px-1 text-[9px] flex-1 bg-slate-100 hover:bg-slate-200" onClick={() => setPaymentAmount("5000")}>5k</Button>
                  <Button variant="secondary" size="sm" className="h-5 px-1 text-[9px] flex-1 bg-slate-100 hover:bg-slate-200" onClick={() => setPaymentAmount("10000")}>10k</Button>
                </div>
              </div>
              <Button
                size="lg"
                onClick={() => handleCheckout(false)}
                disabled={cart.length === 0}
                className="h-10 px-4 font-bold bg-slate-900 hover:bg-slate-800 text-xs shadow-md shrink-0 self-start"
              >
                <CreditCard className="w-3.5 h-3.5 mr-1" /> Checkout
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Loan Confirmation Dialog */}
      <Dialog
        open={loanConfirmation?.isOpen || false}
        onOpenChange={(open) => {
          if (!open) setLoanConfirmation(null);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-500">
              <AlertCircle className="w-5 h-5" />
              Outstanding Loan Detected
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {loanConfirmation?.message}
            </p>
            <div className="mt-5 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Existing Debt:</span>
                <strong className="text-foreground">
                  {loanConfirmation?.existingDebt} RWF
                </strong>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">New Debt:</span>
                <strong className="text-foreground">
                  {loanConfirmation?.newDebt} RWF
                </strong>
              </div>
              <div className="flex justify-between border-t border-amber-500/20 pt-3 mt-3">
                <span className="font-medium">Total Debt After Checkout:</span>
                <strong className="text-amber-600 text-lg">
                  {parseFloat(loanConfirmation?.existingDebt || "0") +
                    parseFloat(loanConfirmation?.newDebt || "0")}{" "}
                  RWF
                </strong>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setLoanConfirmation(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleCheckout(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              Confirm & Add Debt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Cart Confirmation Dialog */}
      <Dialog
        open={clearCartConfirmOpen}
        onOpenChange={setClearCartConfirmOpen}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Clear Cart</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to clear the cart? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearCartConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => { clearCart(); setClearCartConfirmOpen(false); }}>
              Clear Cart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recall Order Dialog */}
      <Dialog open={recallOrderOpen} onOpenChange={setRecallOrderOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Recall Held Orders</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {heldOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">No held orders yet.</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {heldOrders.map(order => (
                  <div key={order.id} className="flex justify-between items-center p-3 border rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">Order {new Date(order.timestamp).toLocaleTimeString()}</p>
                      <p className="text-xs text-muted-foreground">{order.cart.length} items</p>
                    </div>
                    <Button size="sm" onClick={() => restoreOrder(order)}>Restore</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Add Customer Dialog */}
      <Dialog open={quickAddCustomerOpen} onOpenChange={setQuickAddCustomerOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Quick Add Customer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">Name</label>
              <Input
                id="name"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Customer Name"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="phone" className="text-sm font-medium">Phone (Optional)</label>
              <Input
                id="phone"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="Phone Number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickAddCustomerOpen(false)}>Cancel</Button>
            <Button onClick={handleQuickAddCustomer}>Add Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog
        open={!!receipt}
        onOpenChange={(open) => {
          if (!open) setReceipt(null);
        }}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-[440px] p-0 overflow-hidden bg-transparent border-0 shadow-none">
           <ThermalReceipt 
             receipt={receipt} 
             onPrint={handlePrint} 
             onDownload={handleDownload}
             onClose={() => setReceipt(null)}
           />
        </DialogContent>
      </Dialog>
    </div>
  );
}
