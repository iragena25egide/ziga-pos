"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { motion } from "framer-motion";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  Package,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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
import { fetchWithCache } from "@/lib/offlineCache";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock_quantity: "",
    company: "",
  });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsData, companiesData, userRes] = await Promise.all([
        fetchWithCache("/products/", "nexus_cached_products"),
        fetchWithCache("/companies/", "nexus_cached_companies"),
        api.get("/users/me/").catch(() => ({ data: null })),
      ]);
      const safeProducts = Array.isArray(productsData)
        ? productsData
        : productsData?.results || [];
      const safeCompanies = Array.isArray(companiesData)
        ? companiesData
        : companiesData?.results || [];
      setProducts(safeProducts);
      setCompanies(safeCompanies);
      if (userRes.data) {
        setCurrentUser(userRes.data);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.error || "Failed to load products";
      toast.error(msg);
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

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <ArrowUpDown className="w-3 h-3 inline ml-1 opacity-30 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 inline ml-1 text-primary" /> 
      : <ArrowDown className="w-3 h-3 inline ml-1 text-primary" />;
  };

  const sortedProducts = (Array.isArray(products) ? products : []).sort((a, b) => {
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

  const filteredProducts = sortedProducts.filter((p) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.company_name && p.company_name.toLowerCase().includes(term));
    if (!matchesSearch) return false;

    if (activeTab === "In Stock") return p.stock_quantity >= 10;
    if (activeTab === "Low Stock")
      return p.stock_quantity > 0 && p.stock_quantity < 10;
    if (activeTab === "Out of Stock") return p.stock_quantity === 0;
    return true;
  });

  const {
    paginatedData: paginatedProducts,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
  } = usePagination(filteredProducts);

  const handleOpenModal = (product: any = null) => {
    const userCompanyId =
      currentUser?.company?.id != null
        ? currentUser.company.id.toString()
        : currentUser?.company != null
        ? currentUser.company.toString()
        : "";

    if (product) {
      setEditingProduct(product);
      const companyVal =
        product.company != null
          ? typeof product.company === "object"
            ? product.company.id?.toString()
            : product.company.toString()
          : userCompanyId || (companies.length > 0 ? companies[0].id?.toString() : "");
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        stock_quantity: product.stock_quantity?.toString() || "",
        company: companyVal || "",
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        stock_quantity: "",
        company: userCompanyId || (companies.length > 0 ? companies[0].id?.toString() || "" : ""),
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Build clean payload without empty string company
      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: formData.price,
        stock_quantity: formData.stock_quantity,
      };

      if (formData.company && formData.company !== "none") {
        payload.company = formData.company;
      } else if (currentUser?.company) {
        payload.company = typeof currentUser.company === "object" ? currentUser.company.id : currentUser.company;
      }

      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}/`, payload);
        toast.success("Product updated successfully");
      } else {
        await api.post("/products/", payload);
        toast.success("Product created successfully");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.response?.data?.message ||
        (err.response?.data && typeof err.response.data === "object"
          ? Object.entries(err.response.data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" | ")
          : "Operation failed");
      toast.error(msg);
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await api.delete(`/products/${productToDelete}/`);
      toast.success("Product moved to trash");
      setDeleteConfirmOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.detail || "Failed to delete product");
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
            <Package className="w-8 h-8 text-primary" /> Products
          </h2>
          <p className="text-muted-foreground">
            Manage your inventory and pricing.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex gap-6 border-b border-slate-200 w-full md:w-auto">
          {["All", "In Stock", "Low Stock", "Out of Stock"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === tab ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-indigo-600 rounded-t-full"></div>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 max-w-sm w-full sm:w-auto relative group">
          <Search className="w-5 h-5 text-muted-foreground absolute left-3 transition-colors group-focus-within:text-primary" />
          <Input 
            placeholder="Search products..." 
            className="pl-10 bg-white border-slate-200 shadow-sm hover:border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary transition-all !rounded-xl text-sm h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden border border-slate-100"
      >
        <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
          <Table>
            <TableHeader className="bg-slate-50/95 sticky top-0 z-20 backdrop-blur-sm border-b border-slate-200">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead
                  className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-primary transition-colors group"
                  onClick={() => handleSort("name")}
                >
                  Name <SortIcon column="name" />
                </TableHead>
                <TableHead
                  className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-primary transition-colors group"
                  onClick={() => handleSort("company_name")}
                >
                  Company <SortIcon column="company_name" />
                </TableHead>
                <TableHead
                  className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-primary transition-colors group"
                  onClick={() => handleSort("price")}
                >
                  Price <SortIcon column="price" />
                </TableHead>
                <TableHead
                  className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-primary transition-colors group"
                  onClick={() => handleSort("stock_quantity")}
                >
                  Stock <SortIcon column="stock_quantity" />
                </TableHead>
                <TableHead className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No products added yet.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((product) => (
                  <TableRow
                    key={product.id}
                    className="border-border/30 hover:bg-accent/50"
                  >
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>{product.company_name}</TableCell>
                    <TableCell>{product.price} RWF</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${product.stock_quantity === 0 ? "bg-slate-100 text-slate-600" : product.stock_quantity < 10 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}
                      >
                        {product.stock_quantity} In Stock
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenModal(product)}
                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setProductToDelete(product.id);
                          setDeleteConfirmOpen(true);
                        }}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="admin-modal-content">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="admin-modal-header border-b border-white/10">
              <DialogTitle className="admin-modal-title flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />{" "}
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
            </DialogHeader>
            <div className="admin-modal-body">
              {/* Product details form fields (company is automatically assigned from logged in store account) */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="admin-input-label">
                  Product Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Handwoven Basket"
                  required
                  className="admin-input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description" className="admin-input-label">
                  Description
                </Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe this product..."
                  className="admin-input h-20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="price" className="admin-input-label">
                    Selling Price (RWF) *
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                    className="admin-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="stock" className="admin-input-label">
                    Stock QTY *
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock_quantity: e.target.value,
                      })
                    }
                    required
                    className="admin-input"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="admin-modal-footer">
              <Button
                type="button"
                variant="ghost"
                className="text-slate-500 hover:text-slate-800"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-6 shadow-sm"
              >
                {editingProduct ? "Save Changes" : "Add Product"}
              </Button>
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
              Suspend Product?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-sm max-w-[240px]">
              This prevents the product from being sold.
            </AlertDialogDescription>
          </div>
          <div className="p-6 bg-white flex flex-col items-center">
            <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 text-sm text-slate-500">
              <strong className="text-slate-800">This product</strong> will be
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
                <Trash2 className="w-4 h-4" /> Suspend
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
