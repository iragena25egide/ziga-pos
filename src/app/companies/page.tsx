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
import { Building2, Plus, Edit, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle } from "lucide-react";
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
  const [formData, setFormData] = useState({ name: "", ceo_founder: "", address: "", contact_email: "" });
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const data = await fetchWithCache("/companies/", "nexus_cached_companies");
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
      (c.address && c.address.toLowerCase().includes(term)) ||
      (c.contact_email && c.contact_email.toLowerCase().includes(term))
    );
  });

  const { paginatedData: paginatedCompanies, currentPage, totalPages, nextPage, prevPage } = usePagination(filteredCompanies);

  const handleOpenModal = (company: any = null) => {
    if (company) {
      setEditingCompany(company);
      setFormData({ name: company.name, ceo_founder: company.ceo_founder || "", address: company.address || "", contact_email: company.contact_email || "" });
    } else {
      setEditingCompany(null);
      setFormData({ name: "", ceo_founder: "", address: "", contact_email: "" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await api.put(`/companies/${editingCompany.id}/`, formData);
        toast.success("Company updated successfully");
      } else {
        await api.post("/companies/", formData);
        toast.success("Company added successfully");
      }
      setIsModalOpen(false);
      fetchCompanies();
    } catch (err) {
      toast.error("Operation failed");
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
              <TableHead className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort('name')}>
                Name <SortIcon column="name" />
              </TableHead>
              <TableHead className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500">CEO/Founder</TableHead>
              <TableHead className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500">Address</TableHead>
              <TableHead className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500">Contact Email</TableHead>
              <TableHead className="py-3 h-auto font-bold uppercase tracking-wider text-slate-500 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No companies found.</TableCell>
              </TableRow>
            ) : (
              paginatedCompanies.map((company) => (
                <TableRow key={company.id} className="border-border/30 hover:bg-accent/50">
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.ceo_founder || "-"}</TableCell>
                  <TableCell>{company.address || "-"}</TableCell>
                  <TableCell>{company.contact_email || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(company)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setCompanyToDelete(company.id); setDeleteConfirmOpen(true); }} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
        <DialogContent className="admin-modal-content">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="admin-modal-header border-b border-white/10">
              <DialogTitle className="admin-modal-title flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />{" "}
                {editingCompany ? "Edit Company" : "Add New Company"}
              </DialogTitle>
            </DialogHeader>
            <div className="admin-modal-body">
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
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ceo_founder" className="admin-input-label">
                  CEO/Founder
                </Label>
                <Input
                  id="ceo_founder"
                  value={formData.ceo_founder}
                  onChange={(e) =>
                    setFormData({ ...formData, ceo_founder: e.target.value })
                  }
                  className="admin-input"
                  placeholder="e.g. Jane Doe"
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
                  placeholder="e.g. Kigali, Rwanda"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="admin-input-label">
                  Contact Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_email: e.target.value })
                  }
                  className="admin-input"
                  placeholder="contact@example.com"
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
                {editingCompany ? "Save Changes" : "Add Company"}
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
