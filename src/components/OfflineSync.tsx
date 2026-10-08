"use client";

import { useState, useEffect, createContext, useContext, useRef } from "react";
import { CloudOff, CloudUpload, CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import localforage from "localforage";
import api from "@/lib/api";

// --- Context for Offline Sync ---
interface OfflineSyncContextType {
  isOnline: boolean;
  pendingSyncs: any[];
  addPendingSync: (item: any) => void;
  removePendingSync: (id: string) => void;
  clearPendingSyncs: () => void;
}

const OfflineSyncContext = createContext<OfflineSyncContextType>({
  isOnline: true,
  pendingSyncs: [],
  addPendingSync: () => {},
  removePendingSync: () => {},
  clearPendingSyncs: () => {},
});

export const useOfflineSync = () => useContext(OfflineSyncContext);

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncs, setPendingSyncs] = useState<any[]>([]);

  useEffect(() => {
    // Initial check
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Connection restored! You are back online.");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error("You are offline. Transactions will be saved locally.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load from local storage
    localforage.getItem("nexus_pending_syncs").then((stored: any) => {
      if (stored && Array.isArray(stored)) {
        setPendingSyncs(stored);
      }
    }).catch(e => console.error("Failed to parse pending syncs", e));

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-sync when online
  useEffect(() => {
    if (isOnline && pendingSyncs.length > 0) {
      toast.info("Auto-syncing pending transactions...");
      // The indicator component handles the actual sync or we can trigger it via an event
      window.dispatchEvent(new Event("trigger-auto-sync"));
    }
  }, [isOnline]);

  const addPendingSync = async (item: any) => {
    const newItem = { ...item, id: item.id || crypto.randomUUID(), timestamp: new Date().toISOString() };
    setPendingSyncs(prev => {
      const updated = [...prev, newItem];
      localforage.setItem("nexus_pending_syncs", updated);
      return updated;
    });
  };

  const removePendingSync = async (id: string) => {
    setPendingSyncs(prev => {
      const updated = prev.filter((item) => item.id !== id);
      localforage.setItem("nexus_pending_syncs", updated);
      return updated;
    });
  };

  const clearPendingSyncs = async () => {
    setPendingSyncs([]);
    await localforage.removeItem("nexus_pending_syncs");
  };

  return (
    <OfflineSyncContext.Provider
      value={{ isOnline, pendingSyncs, addPendingSync, removePendingSync, clearPendingSyncs }}
    >
      {children}
    </OfflineSyncContext.Provider>
  );
}

// --- UI Component: The Indicator in the Header ---
export function OfflineIndicator() {
  const { isOnline, pendingSyncs, removePendingSync } = useOfflineSync();
  const [isSyncManagerOpen, setIsSyncManagerOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false);

  const pendingCount = pendingSyncs.length;

  const handleSyncAll = async () => {
    if (!isOnline) {
      toast.error("Cannot sync while offline.");
      return;
    }
    if (isSyncingRef.current) return;
    
    setIsSyncing(true);
    isSyncingRef.current = true;
    
    let successCount = 0;
    let failCount = 0;

    for (const item of pendingSyncs) {
      try {
        // Exclude local-only fields if necessary
        const { id, timestamp, endpoint, type, payload: innerPayload, ...legacyPayload } = item;
        
        let url = '/sales/';
        let data = item;
        
        // If it's a new standardized format with an endpoint (e.g., loan payments)
        if (endpoint) {
          url = endpoint;
          data = innerPayload;
        } else {
          // It's a legacy offline sale queue item
          data = legacyPayload;
        }
        
        // Fix: Auto-confirm loans for offline sales transactions to prevent 409 Conflict errors
        if (url === '/sales/') {
          data.confirm_loan = true;
        }

        if (item.method === 'PUT') {
          await api.put(url, data);
        } else if (item.method === 'DELETE') {
          await api.delete(url);
        } else {
          await api.post(url, data);
        }
        
        await removePendingSync(item.id);
        successCount++;
      } catch (error) {
        console.error("Failed to sync item", item, error);
        failCount++;
      }
    }
    
    if (successCount > 0) {
      toast.success(`Successfully synced ${successCount} transactions.`);
      // IMPORTANT: Clear all cached data so the user instantly sees the newly synced data!
      await Promise.all([
        localforage.removeItem("nexus_cached_sales"),
        localforage.removeItem("nexus_cached_products"),
        localforage.removeItem("nexus_cached_stats"),
        localforage.removeItem("nexus_cached_loans"),
        localforage.removeItem("nexus_cached_payments"),
        localforage.removeItem("nexus_cached_customers"),
      ]);
    }
    if (failCount > 0) {
      toast.error(`Failed to sync ${failCount} transactions.`);
    }
    
    setIsSyncing(false);
    isSyncingRef.current = false;
    
    if (failCount === 0) {
      setIsSyncManagerOpen(false);
    }
  };

  useEffect(() => {
    const autoSync = () => handleSyncAll();
    window.addEventListener("trigger-auto-sync", autoSync);
    return () => window.removeEventListener("trigger-auto-sync", autoSync);
  }, [pendingSyncs, isOnline]);

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Connection Status */}
        <div className="hidden sm:flex items-center gap-2 px-2 text-xs font-medium text-slate-500">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'}`}></div>
          {isOnline ? 'Online' : 'Offline Mode'}
        </div>

        {/* Sync Button/Badge */}
        {pendingCount > 0 && (
          <button
            onClick={() => setIsSyncManagerOpen(true)}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              isOnline 
                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200' 
                : 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200'
            }`}
          >
            {isOnline ? <CloudUpload className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}
            <span>Sync Pending</span>
            <span className="flex items-center justify-center w-4 h-4 ml-1 rounded-full bg-white text-[10px] shadow-sm">
              {pendingCount}
            </span>
          </button>
        )}
      </div>

      {/* Sync Manager Modal */}
      <Dialog open={isSyncManagerOpen} onOpenChange={setIsSyncManagerOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CloudUpload className="w-5 h-5 text-primary" />
              Sync Manager
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4 flex items-center justify-between bg-slate-50 p-3 rounded-lg border">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-700">Network Status</span>
                <span className={`text-xs ${isOnline ? 'text-emerald-600' : 'text-orange-600'}`}>
                  {isOnline ? 'Connected (Ready to sync)' : 'Disconnected (Waiting for network)'}
                </span>
              </div>
              {isOnline ? <CheckCircle2 className="text-emerald-500 w-6 h-6" /> : <XCircle className="text-orange-500 w-6 h-6" />}
            </div>

            <h4 className="text-sm font-semibold mb-2">Pending Transactions ({pendingCount})</h4>
            <div className="max-h-[250px] overflow-y-auto border rounded-md custom-scrollbar">
              {pendingCount === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                  <CheckCircle2 className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-sm">All transactions are synced up to date.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {pendingSyncs.map((sync, index) => (
                    <div key={sync.id || index} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="text-sm font-medium">Sale - {sync.customer_name || 'Guest'}</p>
                        <p className="text-xs text-muted-foreground">
                          {sync.items?.length || 0} items • {new Date(sync.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{sync.payment_amount || 0} RWF</p>
                        <p className="text-[10px] font-medium text-orange-500 uppercase tracking-wider">Pending</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSyncManagerOpen(false)} disabled={isSyncing}>
              Close
            </Button>
            <Button 
              onClick={handleSyncAll} 
              disabled={!isOnline || pendingCount === 0 || isSyncing}
              className="gap-2"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4" />
                  Sync All Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
