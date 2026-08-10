"use client";

import React, { useEffect, useState, useRef } from "react";
import { getPaginatedMaintenanceRecords, approveMaintenanceRecord, deleteMaintenanceRecord } from "@/actions/maintenance";
import { PageShell } from "@/components/ui/PageShell";
import { Wrench, CheckCircle, Clock, ExternalLink, Trash2, Search, Truck, Plus, Edit2 } from "lucide-react";
import toast from "react-hot-toast";
import { LogExpenseModal } from "@/components/fleet/LogExpenseModal";
import { MaintenanceDetailModal } from "@/components/fleet/MaintenanceDetailModal";

type RecordType = any;

export default function MaintenancePage() {
  const [records, setRecords] = useState<RecordType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [detailRecord, setDetailRecord] = useState<any>(null);
  const [filterSource, setFilterSource] = useState<"all" | "manual" | "autoworx">("all");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncEnabled, setIsSyncEnabled] = useState(false);
  const limit = 15;

  useEffect(() => {
    import("@/actions/settings").then(mod => {
      mod.getSystemSetting("ENABLE_AUTOWORX_SYNC", "true").then(val => {
        setIsSyncEnabled(val === "true");
      });
    });
  }, []);

  const fetchRecords = async (page = currentPage, tab = activeTab, search = searchQuery, source = filterSource) => {
    try {
      const data = await getPaginatedMaintenanceRecords({
        page,
        limit,
        status: tab,
        source,
        searchQuery: search
      });
      setRecords(data.records);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
      setPendingCount(data.pagination.pendingCount);
    } catch (error) {
      toast.error("Failed to load maintenance records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(currentPage, activeTab, searchQuery, filterSource);
    
    // Auto-refresh maintenance records every 30 seconds
    const interval = setInterval(() => {
      fetchRecords(currentPage, activeTab, searchQuery, filterSource);
    }, 30000);

    return () => clearInterval(interval);
  }, [currentPage, activeTab, searchQuery, filterSource]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, filterSource]);

  const handleApprove = async (id: string) => {
    const loadingToast = toast.loading("Approving estimate...");
    try {
      await approveMaintenanceRecord(id);
      toast.success("Estimate approved!", { id: loadingToast });
      fetchRecords();
    } catch (error) {
      toast.error("Approval failed", { id: loadingToast });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    const loadingToast = toast.loading("Deleting record...");
    try {
      await deleteMaintenanceRecord(id);
      toast.success("Record deleted", { id: loadingToast });
      fetchRecords();
    } catch (error) {
      toast.error("Deletion failed", { id: loadingToast });
    }
  };

  const formatPHP = (amount: number | string) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(Number(amount));
  };

  return (
    <PageShell title="Maintenance & Repairs" subtitle="Manage fleet repairs, track Autoworx estimates, and log maintenance costs.">
      
      {/* Metrics & Actions */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
        <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all relative ${
              activeTab === "pending" ? "bg-amber-100 text-amber-800" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Pending Estimates
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "completed" ? "bg-emerald-100 text-emerald-800" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Approved & Completed
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value as "all" | "manual" | "autoworx")}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
          >
            <option value="all">All Sources</option>
            <option value="manual">Manual Entry</option>
            {isSyncEnabled && <option value="autoworx">Autoworx Sync</option>}
          </select>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search repairs or plate numbers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-shrink-0 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Log Expense</span>
          </button>
        </div>
      </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center h-64">
              <Wrench className="w-8 h-8 text-blue-500 animate-[spin_3s_linear_infinite]" />
            </div>
          ) : records.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center h-64 text-center px-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No records found</h3>
              <p className="text-slate-500 text-sm max-w-md mt-1">
                There are no {activeTab} maintenance records matching your filters.
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100 flex-1">
                {records.map((record) => (
                  <div 
                    key={record.id} 
                    onClick={() => setDetailRecord(record)}
                    className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group cursor-pointer"
                  >
                    
                    <div className="flex gap-4 items-start w-full md:w-auto">
                      <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${
                        record.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {record.status === "Pending" ? <Clock className="w-6 h-6" /> : <Wrench className="w-6 h-6" />}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
                            <Truck className="w-4 h-4 text-slate-400" />
                            {record.truck 
                                ? record.truck.plateNo 
                                : record.autoworxVehicleDetails && record.autoworxVehicleDetails.trim() !== ""
                                  ? record.autoworxVehicleDetails
                                  : "General ALK Fleet"}
                          </h4>
                          {record.autoworxJobId && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded border border-blue-100 uppercase tracking-wider">
                              Autoworx Sync
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {record.category && record.category !== "Uncategorized" && (
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{record.category}</span>
                          )}
                          <p className="text-sm text-slate-700 font-medium">{record.description}</p>
                        </div>
                          <p className="text-xs text-slate-400 mt-1">
                            Logged on {new Date(record.dateIncurred || record.createdAt).toLocaleDateString()}
                          </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-6 pl-16 md:pl-0 border-t border-slate-100 md:border-none pt-4 md:pt-0 mt-2 md:mt-0">
                      <div className="text-left md:text-right">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Cost</span>
                        <span className="block font-black text-xl text-slate-900 font-mono leading-none">
                          {formatPHP(record.cost)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!record.autoworxJobId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditRecord(record);
                              setIsModalOpen(true);
                            }}
                            className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Edit Record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {record.status === "Pending" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(record.id);
                            }}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-lg shadow-sm transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        
                        {record.autoworxJobId && (
                          <a
                            href={`https://autoworxcagayan.com/track?code=${record.autoworxJobId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View in Autoworx"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(record.id);
                          }}
                          className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="border-t border-slate-200 p-4 bg-slate-50 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    Showing <span className="text-slate-900 font-bold">{(currentPage - 1) * limit + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(currentPage * limit, totalCount)}</span> of <span className="text-slate-900 font-bold">{totalCount}</span> records
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-sm font-bold text-slate-700 px-2">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      <LogExpenseModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditRecord(null);
        }}
        editRecord={editRecord}
        onSuccess={() => {
          fetchRecords();
          setActiveTab("completed");
        }}
      />

      <MaintenanceDetailModal 
        isOpen={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        record={detailRecord}
      />
    </PageShell>
  );
}
