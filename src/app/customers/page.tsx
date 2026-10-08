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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Edit,
  Trash2,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { fetchWithCache } from "@/lib/offlineCache";
import { useOfflineSync } from "@/components/OfflineSync";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await fetchWithCache("/customers/", "nexus_cached_customers");
      setCustomers(data);
    } catch (err) {
      toast.error("Failed to load customers");
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

  const sortedCustomers = [...customers].sort((a, b) => {
    if (!sortConfig) return 0;
    const aValue = a[sortConfig.key]?.toLowerCase?.() || a[sortConfig.key];
    const bValue = b[sortConfig.key]?.toLowerCase?.() || b[sortConfig.key];
    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const filteredCustomers = sortedCustomers.filter((c) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (activeTab === "Recent") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(c.created_at) >= thirtyDaysAgo;
    }

    return true;
  });

  const {
    paginatedData: paginatedCustomers,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
  } = usePagination(filteredCustomers, 10);

  const { isOnline, addPendingSync } = useOfflineSync();

  const handleOpenModal = (customer: any = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
      });
    } else {
      setEditingCustomer(null);
      setFormData({ name: "", phone: "", email: "", address: "" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!isOnline) {
        addPendingSync({
          endpoint: editingCustomer ? `/customers/${editingCustomer.id}/` : "/customers/",
          method: editingCustomer ? "PUT" : "POST",
          payload: formData,
          customer_name: `Customer: ${formData.name}`
        });
        toast.success("Saved offline. Will sync when connection is restored.");
        setIsModalOpen(false);
        if (!editingCustomer) {
          setCustomers([{ id: Date.now(), created_at: new Date().toISOString(), ...formData }, ...customers]);
        } else {
          setCustomers(customers.map(c => c.id === editingCustomer.id ? { ...c, ...formData } : c));
        }
        return;
      }

      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}/`, formData);
        toast.success("Customer updated successfully");
      } else {
        await api.post("/customers/", formData);
        toast.success("Customer added successfully");
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      toast.error("Operation failed");
    }
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    try {
      if (!isOnline) {
        addPendingSync({
          endpoint: `/customers/${customerToDelete}/`,
          method: "DELETE",
          customer_name: "Customer Deletion"
        });
        toast.success("Saved offline. Will sync when connection is restored.");
        setDeleteConfirmOpen(false);
        setCustomers(customers.filter(c => c.id !== customerToDelete));
        return;
      }

      await api.delete(`/customers/${customerToDelete}/`);
      toast.success("Customer moved to trash");
      setDeleteConfirmOpen(false);
      fetchCustomers();
    } catch (err) {
      toast.error("Failed to delete customer");
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
            <Users className="w-8 h-8 text-primary" /> Customers
          </h2>
          <p className="text-muted-foreground">Manage your client database.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Add Customer
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div className="flex gap-6 border-b border-slate-200 w-full md:w-auto">
          {["All", "Recent"].map((tab) => (
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
        <div className="flex items-center gap-2 max-w-sm w-full md:w-auto relative group">
          <Search className="w-5 h-5 text-muted-foreground absolute left-3 transition-colors group-focus-within:text-primary" />
          <Input 
            placeholder="Search by name, email..." 
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
                <TableHead className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500">
                  Phone
                </TableHead>
                <TableHead className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500">
                  Email
                </TableHead>
                <TableHead className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500">
                  Address
                </TableHead>
                <TableHead
                  className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-primary transition-colors group"
                  onClick={() => handleSort("created_at")}
                >
                  Added <SortIcon column="created_at" />
                </TableHead>
                <TableHead className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No customers added yet.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCustomers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="border-border/30 hover:bg-accent/50"
                  >
                    <TableCell className="font-medium">
                      {customer.name}
                    </TableCell>
                    <TableCell>{customer.phone || "-"}</TableCell>
                    <TableCell>{customer.email || "-"}</TableCell>
                    <TableCell>{customer.address || "-"}</TableCell>
                    <TableCell>
                      {new Date(customer.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenModal(customer)}
                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCustomerToDelete(customer.id);
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

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="admin-modal-content">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="admin-modal-header border-b border-white/10">
              <DialogTitle className="admin-modal-title flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />{" "}
                {editingCustomer ? "Edit Customer" : "Add New Customer"}
              </DialogTitle>
            </DialogHeader>
            <div className="admin-modal-body space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="admin-input-label">
                  Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="admin-input"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="admin-input-label">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="admin-input"
                  placeholder="+250 788 123 456"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="admin-input-label">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="admin-input"
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address" className="admin-input-label">
                  Address
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="admin-input"
                  placeholder="Kigali, Rwanda"
                />
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
                {editingCustomer ? "Save Changes" : "Add Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="admin-modal-content sm:max-w-[380px] text-center p-0">
          <div className="bg-[#2c2c3e] pt-8 pb-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-400 to-red-500 text-white flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <AlertDialogTitle className="text-xl font-bold tracking-tight text-white mb-2">
              Suspend Customer?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-sm max-w-[240px]">
              This will suspend the customer's account.
            </AlertDialogDescription>
          </div>
          <div className="p-6 bg-white flex flex-col items-center">
            <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 text-sm text-slate-500">
              <strong className="text-slate-800">This customer</strong> will be
              soft-deleted.
              <br />
              You can restore them from the database if needed.
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
