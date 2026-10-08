"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, RefreshCcw, ShieldAlert } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationControls } from "@/components/ui/pagination-controls";

export default function TrashPage() {
  const [trashItems, setTrashItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [confirmHardDeleteOpen, setConfirmHardDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: number, type: string} | null>(null);

  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
  const [itemToRestore, setItemToRestore] = useState<{id: number, type: string} | null>(null);

  const filteredTrash = trashItems.filter(item => {
    const term = searchTerm.trim().toLowerCase();
    return (
      (item.name && item.name.toLowerCase().includes(term)) ||
      (item.type && item.type.toLowerCase().includes(term))
    );
  });

  const { paginatedData: paginatedTrash, currentPage, totalPages, nextPage, prevPage } = usePagination(filteredTrash);

  useEffect(() => {
    fetchTrash();
  }, []);

  const fetchTrash = async () => {
    try {
      const res = await api.get("/trash/");
      setTrashItems(res.data);
    } catch (err) {
      toast.error("Failed to load trash");
    } finally {
      setLoading(false);
    }
  };

  const getEndpoint = (type: string) => {
    switch(type) {
      case 'company': return '/companies';
      case 'product': return '/products';
      case 'customer': return '/customers';
      case 'sale': return '/sales';
      case 'loan': return '/loans';
      default: return '';
    }
  };

  const handleRestore = async () => {
    if (!itemToRestore) return;
    try {
      await api.post(`${getEndpoint(itemToRestore.type)}/${itemToRestore.id}/restore/`);
      toast.success("Item restored successfully");
      setConfirmRestoreOpen(false);
      setItemToRestore(null);
      fetchTrash();
    } catch (err) {
      toast.error("Failed to restore item");
    }
  };

  const handleHardDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`${getEndpoint(itemToDelete.type)}/${itemToDelete.id}/force_delete/`);
      toast.success("Item permanently deleted");
      setConfirmHardDeleteOpen(false);
      fetchTrash();
    } catch (err) {
      toast.error("Failed to delete item permanently");
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-red-500">
            <Trash2 className="w-8 h-8" /> Recycle Bin
          </h2>
          <p className="text-muted-foreground">Restore deleted items or erase them permanently.</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl overflow-hidden border border-red-500/20"
      >
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>Type</TableHead>
              <TableHead>Item Details</TableHead>
              <TableHead>Deleted At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trashItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">The recycle bin is empty.</TableCell>
              </TableRow>
            ) : (
              paginatedTrash.map((item) => (
                <TableRow key={`${item.type}-${item.id}`} className="border-border/30 hover:bg-accent/50">
                  <TableCell className="capitalize font-bold text-primary">{item.type}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{new Date(item.deleted_at).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => { setItemToRestore({id: item.id, type: item.type}); setConfirmRestoreOpen(true); }} className="mr-2 border-emerald-500/50 hover:bg-emerald-500/20 text-emerald-500 gap-1">
                      <RefreshCcw className="w-3 h-3" /> Restore
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => { setItemToDelete({id: item.id, type: item.type}); setConfirmHardDeleteOpen(true); }} className="gap-1">
                      <ShieldAlert className="w-3 h-3" /> Delete
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

      <AlertDialog open={confirmHardDeleteOpen} onOpenChange={setConfirmHardDeleteOpen}>
        <AlertDialogContent className="admin-modal-content sm:max-w-[380px] text-center p-0">
          <div className="bg-[#2c2c3e] pt-8 pb-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-400 to-red-500 text-white flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <AlertDialogTitle className="text-xl font-bold tracking-tight text-white mb-2">Permanent Deletion?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-sm max-w-[240px]">
              This will permanently delete the record.
            </AlertDialogDescription>
          </div>
          <div className="p-6 bg-white flex flex-col items-center">
            <div className="w-full bg-red-50 border border-red-100 rounded-xl p-4 mb-6 text-sm text-red-600 text-center font-medium">
              This action cannot be undone.
            </div>
            <AlertDialogFooter className="w-full sm:justify-center flex-row gap-3">
              <AlertDialogCancel className="admin-btn-secondary flex-1 m-0">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleHardDelete} className="admin-btn-primary bg-red-500 hover:bg-red-600 flex-1 m-0">Permanently Delete</AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmRestoreOpen} onOpenChange={setConfirmRestoreOpen}>
        <AlertDialogContent className="admin-modal-content sm:max-w-[380px] text-center p-0">
          <div className="bg-[#2c2c3e] pt-8 pb-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 text-white flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <RefreshCcw className="w-8 h-8" />
            </div>
            <AlertDialogTitle className="text-xl font-bold tracking-tight text-white mb-2">Restore Item?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-sm max-w-[240px]">
              This will restore the record back to the active list.
            </AlertDialogDescription>
          </div>
          <div className="p-6 bg-white flex flex-col items-center">
            <AlertDialogFooter className="w-full sm:justify-center flex-row gap-3">
              <AlertDialogCancel className="admin-btn-secondary flex-1 m-0">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRestore} className="admin-btn-primary bg-emerald-500 hover:bg-emerald-600 flex-1 m-0">Restore Item</AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
