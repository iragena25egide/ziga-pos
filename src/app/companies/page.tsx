"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, Plus, Edit, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { fetchWithCache } from "@/lib/offlineCache";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    ceo_founder: "",
    tin_number: "",
    address: "",
    contact_email: "",
    contact_phone: "",
  });
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await api.get("/companies/").catch(async () => {
        const cached = await fetchWithCache("/companies/", "nexus_cached_companies");
        return { data: cached };
      });
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setCompanies(data);
    } catch (err) {
      toast.error("Failed to load companies");
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

  const sortedCompanies = [...companies].sort((a, b) => {
    if (!sortConfig) return 0;
    const aValue = a[sortConfig.key]?.toLowerCase?.() || a[sortConfig.key];
    const bValue = b[sortConfig.key]?.toLowerCase?.() || b[sortConfig.key];
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredCompanies = sortedCompanies.filter(c => {
    const term = searchTerm.trim().toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(term)) || 
      (c.ceo_founder && c.ceo_founder.toLowerCase().includes(term)) ||
      (c.tin_number && c.tin_number.toLowerCase().includes(term)) ||
      (c.address && c.address.toLowerCase().includes(term)) ||
      (c.contact_email && c.contact_email.toLowerCase().includes(term)) ||
      (c.contact_phone && c.contact_phone.toLowerCase().includes(term))
    );
  });

  const { paginatedData: paginatedCompanies, currentPage, totalPages, nextPage, prevPage } = usePagination(filteredCompanies);

  const handleOpenModal = (company: any = null) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name: company.name || "",
        ceo_founder: company.ceo_founder || "",
        tin_number: company.tin_number || "",
        address: company.address || "",
        contact_email: company.contact_email || "",
        contact_phone: company.contact_phone || "",
      });
    } else {
      setEditingCompany(null);
      setFormData({
        name: "",
        ceo_founder: "",
        tin_number: "",
        address: "",
        contact_email: "",
        contact_phone: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await api.patch(`/companies/${editingCompany.id}/`, formData);
        toast.success("Company updated successfully");
      } else {
        await api.post("/companies/", formData);
        toast.success("Company added successfully");
      }
      setIsModalOpen(false);
      fetchCompanies();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Operation failed");
    }
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;
    try {
      await api.delete(`/companies/${companyToDelete}/`);
      toast.success("Company moved to trash");
      setDeleteConfirmOpen(false);
      fetchCompanies();
    } catch (err) {
      toast.error("Failed to delete company");
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="w-8 h-8 text-primary" /> Companies
          </h2>
          <p className="text-muted-foreground">Manage your suppliers and partner companies.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Add Company
        </Button>
      </div>

      <div className="flex items-center gap-2 max-w-sm w-full md:w-auto relative group">
        <Search className="w-5 h-5 text-muted-foreground absolute left-3 transition-colors group-focus-within:text-primary" />
        <Input 
          placeholder="Search by name, email, or address..." 
          className="pl-10 bg-white border-slate-200 shadow-sm hover:border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary transition-all !rounded-xl text-sm h-11"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden border border-slate-100"
      >
        <Table>
          <TableHeader className="bg-slate-50/95 sticky top-0 z-20 backdrop-blur-sm border-b border-slate-200">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="py-3.5 h-auto font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort('name')}>
                Company Name <SortIcon column="name" />
              </TableHead>
              <TableHead className="py-3.5 h-auto font-bold uppercase tracking-wider text-slate-500">CEO / Founder</TableHead>
              <TableHead className="py-3.5 h-auto font-bold uppercase tracking-wider text-slate-500">TIN Number</TableHead>
              <TableHead className="py-3.5 h-auto font-bold uppercase tracking-wider text-slate-500">Contact</TableHead>
              <TableHead className="py-3.5 h-auto font-bold uppercase tracking-wider text-slate-500">Address</TableHead>
              <TableHead className="py-3.5 h-auto font-bold uppercase tracking-wider text-slate-500">Status</TableHead>
              <TableHead className="py-3.5 h-auto font-bold uppercase tracking-wider text-slate-500 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Building2 className="w-8 h-8 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">No companies added yet.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedCompanies.map((company) => (
                <TableRow key={company.id} className="border-border/30 hover:bg-accent/50 transition-colors">
                  <TableCell className="font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {company.name?.[0] || "C"}
                      </div>
                      <span>{company.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-700 font-medium">
                    {company.ceo_founder || "—"}
                  </TableCell>
                  <TableCell className="font-mono text-gray-600">
                    {company.tin_number ? (
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px] font-bold text-gray-800">
                        {company.tin_number}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    <div className="text-xs font-medium">{company.contact_email || "—"}</div>
                    {company.contact_phone && (
                      <div className="text-[11px] text-gray-400 mt-0.5">{company.contact_phone}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-600 text-xs">
                    {company.address || "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                        company.is_approved
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {company.is_approved ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {company.is_approved ? "Active" : "Pending"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenModal(company)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg h-8 w-8"
                        title="Edit Company Info"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCompanyToDelete(company.id);
                          setDeleteConfirmOpen(true);
                        }}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg h-8 w-8"
                        title="Delete Company"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="admin-modal-content max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="admin-modal-header border-b border-white/10 pb-3">
              <DialogTitle className="admin-modal-title flex items-center gap-2 text-base font-bold text-white">
                <Building2 className="w-5 h-5 text-white/90" />
                {editingCompany ? "Edit Company Information" : "Add New Company"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="font-semibold text-gray-700">
                  Company / Store Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="rounded-xl border-gray-200 text-xs h-10"
                  placeholder="Company Name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ceo_founder" className="font-semibold text-gray-700">
                    Owner / CEO Name
                  </Label>
                  <Input
                    id="ceo_founder"
                    value={formData.ceo_founder}
                    onChange={(e) =>
                      setFormData({ ...formData, ceo_founder: e.target.value })
                    }
                    className="rounded-xl border-gray-200 text-xs h-10"
                    placeholder="Owner Name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tin_number" className="font-semibold text-gray-700">
                    TIN / Tax Number
                  </Label>
                  <Input
                    id="tin_number"
                    value={formData.tin_number}
                    onChange={(e) =>
                      setFormData({ ...formData, tin_number: e.target.value })
                    }
                    className="rounded-xl border-gray-200 text-xs h-10"
                    placeholder="TIN / Tax Number"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address" className="font-semibold text-gray-700">
                  Business Address / Location
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="rounded-xl border-gray-200 text-xs h-10"
                  placeholder="Company Address"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="font-semibold text-gray-700">
                    Contact Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) =>
                      setFormData({ ...formData, contact_email: e.target.value })
                    }
                    className="rounded-xl border-gray-200 text-xs h-10"
                    placeholder="Company Email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="font-semibold text-gray-700">
                    Contact Phone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.contact_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, contact_phone: e.target.value })
                    }
                    className="rounded-xl border-gray-200 text-xs h-10"
                    placeholder="Company Phone"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="border-t border-gray-100 pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl text-xs font-semibold"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#0b1d3a] hover:bg-[#142a4d] text-white rounded-xl px-5 text-xs font-semibold shadow-sm"
              >
                {editingCompany ? "Save Changes" : "Add Company"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="admin-modal-content sm:max-w-[380px] text-center p-0">
          <div className="bg-[#0b1d3a] pt-8 pb-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-400 to-red-500 text-white flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <AlertDialogTitle className="text-xl font-bold tracking-tight text-white mb-2">Delete Company?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-sm max-w-[240px]">
              This will move the company to the Trash.
            </AlertDialogDescription>
          </div>
          <div className="p-6 bg-white flex flex-col items-center">
            <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 text-sm text-slate-500 text-left">
              <strong className="text-slate-800">This company</strong> will be soft-deleted.<br/>You can restore it later or permanently delete it from the Trash bin.
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
