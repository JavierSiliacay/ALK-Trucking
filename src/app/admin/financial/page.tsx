"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, Lock, Printer, ArrowUpDown, ArrowUp } from "lucide-react";
import FinanceFormModal from "@/components/finance/FinanceFormModal";
import { format, startOfMonth, endOfMonth, isWithinInterval, getISOWeek, getYear, isSameDay } from "date-fns";
import { formatInPHTime } from "@/lib/utils";
import { getFinancialRecords, deleteFinancialRecord, updateFinancialStatus } from "@/actions/finance";
import { getSystemSetting } from "@/actions/settings";
import { toast } from "sonner";

export default function FinancialModulePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [clearanceTargetRecord, setClearanceTargetRecord] = useState<any>(null);
  const [clearedDateInput, setClearedDateInput] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const [isClearing, setIsClearing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // "all", "Issuance", "Deposit"
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "Pending", "Cleared", "Cancelled"
  const [hasDismissedWarning, setHasDismissedWarning] = useState(false);
  const [warningThreshold, setWarningThreshold] = useState(50000);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [checkNoSorted, setCheckNoSorted] = useState(false); // false = natural order, true = ascending
  
  // Date Filtering State
  const [dateFilterType, setDateFilterType] = useState("all_years"); // "daily", "weekly", "monthly", "yearly", "all_years"
  const [filterDate, setFilterDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [filterWeek, setFilterWeek] = useState(() => {
    const now = new Date();
    const w = getISOWeek(now);
    return `${getYear(now)}-W${w < 10 ? '0'+w : w}`;
  });
  const [filterMonth, setFilterMonth] = useState(() => (new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(() => new Date().getFullYear().toString());

  // We'll fetch records via a Server Action or just mock for now
  useEffect(() => {
    async function init() {
      const [data, threshold] = await Promise.all([
        getFinancialRecords(),
        getSystemSetting("FINANCIAL_LOW_BALANCE_THRESHOLD", "50000")
      ]);
      setRecords(data);
      setWarningThreshold(parseFloat(threshold) || 50000);
      setIsDataLoaded(true);
    }
    init();
  }, []);

  // Dynamically extract unique categories from loaded records, plus default categories
  const defaultCategories = ["Payroll", "Cash Advance", "Rental Yarda", "Diesel", "Advances from Autoworx", "Receivables", "Payables"];
  const uniqueCategories = Array.from(new Set([...defaultCategories, ...records.map(r => r.category)])).filter(Boolean).sort();

  const filteredRecords = records.filter(r => {
    // 1. Search term
    const matchesSearch = !searchTerm || 
      r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.checkNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.status?.toLowerCase().includes(searchTerm.toLowerCase());
      
    if (!matchesSearch) return false;
    
    // 2. Type filter
    if (typeFilter !== "all" && r.type !== typeFilter) return false;

    // 2.5 Category filter
    if (categoryFilter !== "all" && r.category !== categoryFilter) return false;

    // 2.6 Status filter
    if (statusFilter !== "all" && (r.status || "Pending") !== statusFilter) return false;

    // 3. Date filter
    if (dateFilterType === "all_years") return true;
    
    const recordDate = new Date(r.date);
    const recYear = getYear(recordDate);

    if (dateFilterType === "daily" && filterDate) {
      // Create a local date for comparison to avoid timezone issues
      const selectedDate = new Date(filterDate);
      return (
        recordDate.getDate() === selectedDate.getDate() &&
        recordDate.getMonth() === selectedDate.getMonth() &&
        recordDate.getFullYear() === selectedDate.getFullYear()
      );
    }
    
    if (dateFilterType === "weekly" && filterWeek) {
      // filterWeek format: "YYYY-Www"
      const [y, w] = filterWeek.split("-W");
      return recYear.toString() === y && getISOWeek(recordDate).toString() === parseInt(w, 10).toString();
    }
    
    if (dateFilterType === "monthly" && filterYear && filterMonth) {
      return recYear.toString() === filterYear && (recordDate.getMonth() + 1).toString() === filterMonth;
    }
    
    if (dateFilterType === "yearly" && filterYear) {
      return recYear.toString() === filterYear;
    }
    
    return true;
  });

  // Apply optional ascending sort on Check # (numeric, with non-numeric pushed to end)
  const displayedRecords = checkNoSorted
    ? [...filteredRecords].sort((a, b) => {
        const aNum = parseInt(a.checkNo ?? "", 10);
        const bNum = parseInt(b.checkNo ?? "", 10);
        const aValid = !isNaN(aNum);
        const bValid = !isNaN(bNum);
        if (aValid && bValid) return aNum - bNum;
        if (aValid) return -1;
        if (bValid) return 1;
        return (a.checkNo ?? "").localeCompare(b.checkNo ?? "");
      })
    : filteredRecords;

  // Active records (non-cancelled) for calculations
  const nonCancelledRecords = filteredRecords.filter(r => r.status !== "Cancelled");
  
  // Total Issuances & Deposits reflect ONLY Cleared records (pending checks do not deduct/add to balance until cleared)
  const totalIssuances = nonCancelledRecords.filter(r => r.type === "Issuance" && r.status === "Cleared").reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
  const totalDeposits = nonCancelledRecords.filter(r => r.type === "Deposit" && r.status === "Cleared").reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
  const netBalance = totalDeposits - totalIssuances;

  // Pending floating totals
  const pendingIssuances = nonCancelledRecords.filter(r => r.type === "Issuance" && (r.status === "Pending" || !r.status)).reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
  const pendingDeposits = nonCancelledRecords.filter(r => r.type === "Deposit" && (r.status === "Pending" || !r.status)).reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
  const projectedBalance = netBalance - pendingIssuances + pendingDeposits;

  // Reset the warning dismissal if the balance recovers above the threshold
  useEffect(() => {
    if (netBalance >= warningThreshold) {
      setHasDismissedWarning(false);
    }
  }, [netBalance, warningThreshold]);

  const handleStatusToggle = async (record: any, newStatus: string) => {
    if (newStatus === "Cleared") {
      // Open clearance confirmation modal to choose/confirm clearance date
      setClearanceTargetRecord(record);
      setClearedDateInput(format(new Date(), "yyyy-MM-dd"));
      return;
    }

    try {
      // Optimistic update
      setRecords(prev => prev.map(r => r.id === record.id ? { ...r, status: newStatus } : r));
      const res = await updateFinancialStatus(record.id, newStatus);
      if (res.success) {
        toast.success(`Check #${record.checkNo || record.name} marked as ${newStatus}`);
      } else {
        toast.error("Failed to update status");
        const data = await getFinancialRecords();
        setRecords(data);
      }
    } catch (err) {
      toast.error("An error occurred");
      const data = await getFinancialRecords();
      setRecords(data);
    }
  };

  const handleConfirmClearance = async () => {
    if (!clearanceTargetRecord) return;
    setIsClearing(true);
    try {
      const res = await updateFinancialStatus(clearanceTargetRecord.id, "Cleared", clearedDateInput);
      if (res.success) {
        toast.success(`Check #${clearanceTargetRecord.checkNo || clearanceTargetRecord.name} cleared successfully!`);
        const data = await getFinancialRecords();
        setRecords(data);
        setClearanceTargetRecord(null);
      } else {
        toast.error("Failed to clear check");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to clear check");
    } finally {
      setIsClearing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this record? This cannot be undone.")) {
      try {
        await deleteFinancialRecord(id);
        toast.success("Record deleted successfully");
        const data = await getFinancialRecords();
        setRecords(data);
      } catch (error) {
        console.error("Delete error", error);
        toast.error("Failed to delete record");
      }
    }
  };
  const getDateFilterLabel = () => {
    switch(dateFilterType) {
      case "daily": return `(Daily: ${filterDate})`;
      case "weekly": return `(Weekly: ${filterWeek})`;
      case "monthly": return `(Monthly: ${new Date(2000, parseInt(filterMonth) - 1, 1).toLocaleString('default', { month: 'long' })} ${filterYear})`;
      case "yearly": return `(Yearly: ${filterYear})`;
      default: return "(All Time)";
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 max-w-[1440px] mx-auto print:m-0 print:p-0 print:block">
      
      {/* Low Balance Warning Modal */}
      {isDataLoaded && netBalance < warningThreshold && !hasDismissedWarning && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-rose-500 p-6 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-4xl">warning</span>
              </div>
              <h2 className="text-2xl font-black mb-1">Low Balance Alert</h2>
              <p className="text-rose-100 font-medium">Critical Account Status</p>
            </div>
            <div className="p-6">
              <p className="text-slate-600 mb-6 text-center leading-relaxed">
                The current running balance is <strong>{netBalance < 0 ? "negative" : "critically low"}</strong> (₱{netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}). 
                <br /><br />
                Please verify funds before issuing any further checks to prevent bouncing.
              </p>
              <button 
                onClick={() => setHasDismissedWarning(true)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-colors"
              >
                Acknowledge Warning
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print-Only Header */}
      <div className="hidden print:flex flex-col items-center justify-center mb-6 border-b-2 border-slate-900 pb-4">
        <div className="flex items-center gap-4 mb-2">
          <img src="/alk_logo.jpg" alt="ALK Trucking" className="w-16 h-16 object-contain rounded-lg" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">ALK TRUCKING SERVICES</h1>
            <p className="text-sm font-bold text-slate-600 flex items-center gap-1.5 justify-center mt-0.5">
              <span className="material-symbols-outlined text-[18px] text-slate-500">account_balance</span>
              Financial Report
            </p>
          </div>
        </div>
        <p className="text-xs font-medium text-slate-500 mt-1">
          Generated on: {formatInPHTime(new Date())} 
          <span className="font-bold text-slate-900 ml-1.5">{getDateFilterLabel()}</span>
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-[#00193c] tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00193c] text-3xl">account_balance</span>
            Financial Operations
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            Highly Restricted Area: Authorized Personnel Only
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Ledger
          </button>
          <button
            onClick={() => {
              if (netBalance < warningThreshold) {
                setHasDismissedWarning(false);
              }
              setSelectedRecord(null);
              setIsViewOnly(false);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Record
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2 print:mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1 print:p-3 print:rounded-none">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Issuances (Cleared)</span>
          <span className="text-2xl font-black text-rose-600 font-mono print:text-lg">₱{totalIssuances.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          <span className="text-[11px] text-slate-400 font-medium">Bank-cleared disbursements</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1 print:p-3 print:rounded-none">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Deposits (Cleared)</span>
          <span className="text-2xl font-black text-emerald-600 font-mono print:text-lg">₱{totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          <span className="text-[11px] text-slate-400 font-medium">Bank-cleared collections</span>
        </div>
        <div 
          onClick={() => setIsPendingModalOpen(true)}
          className="bg-amber-50/70 hover:bg-amber-100/70 p-5 rounded-2xl border border-amber-200/90 shadow-sm flex flex-col gap-1 print:p-3 print:rounded-none cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] group relative"
          title="Click to view details of all pending/uncleared cheques"
        >
          <div className="flex items-center justify-between">
            <span className="text-amber-800 text-xs font-bold uppercase tracking-wider group-hover:text-amber-900 transition-colors flex items-center gap-1.5">
              <span>⏳</span> Pending / Uncleared
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-950 group-hover:bg-amber-300 transition-colors">
              Floating
              <span className="material-symbols-outlined text-[12px]">visibility</span>
            </span>
          </div>
          <span className="text-2xl font-black text-amber-800 font-mono print:text-lg">
            ₱{pendingIssuances.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-amber-700/90 font-semibold group-hover:underline flex items-center justify-between mt-0.5">
            <span>{nonCancelledRecords.filter(r => r.type === "Issuance" && (r.status === "Pending" || !r.status)).length} checks pending encashment</span>
            <span className="text-[10px] font-bold text-amber-800 uppercase">View &rarr;</span>
          </span>
        </div>
        <div className={`p-5 rounded-2xl border shadow-sm flex flex-col gap-1 print:p-3 print:rounded-none ${netBalance >= 0 ? 'bg-blue-50/50 border-blue-200' : 'bg-rose-50/50 border-rose-200'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${netBalance >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>Running Balance</span>
          </div>
          <span className={`text-2xl font-black font-mono print:text-lg ${netBalance >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
            {netBalance >= 0 ? "+" : ""}₱{netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            Projected after checks: <strong className="text-slate-800 font-mono">{projectedBalance >= 0 ? "+" : ""}₱{projectedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 print:border-none print:shadow-none print:rounded-none">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4 print:hidden">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search check #, name, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
              <div className="relative inline-block">
                <span className="invisible block px-2 pr-14 py-2 text-sm font-medium whitespace-pre pointer-events-none">
                  {statusFilter === 'all' ? 'All Status' : statusFilter}
                </span>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="absolute inset-0 w-full h-full bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all p-2 pr-8"
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending / Uncleared</option>
                  <option value="Cleared">Cleared</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Type:</span>
              <div className="relative inline-block">
                <span className="invisible block px-2 pr-14 py-2 text-sm font-medium whitespace-pre pointer-events-none">
                  {typeFilter === 'all' ? 'All Types' : typeFilter === 'Issuance' ? 'Issuances' : 'Deposits'}
                </span>
                <select 
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="absolute inset-0 w-full h-full bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all p-2 pr-8"
                >
                  <option value="all">All Types</option>
                  <option value="Issuance">Issuances</option>
                  <option value="Deposit">Deposits</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Category:</span>
              <div className="relative inline-block">
                <span className="invisible block px-2 pr-16 py-2 text-sm font-medium whitespace-pre pointer-events-none">
                  {categoryFilter === 'all' ? 'All Categories' : categoryFilter}
                </span>
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="absolute inset-0 w-full h-full bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all p-2 pr-10"
                >
                  <option value="all">All Categories</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Date:</span>
              <div className="relative inline-block">
                <span className="invisible block px-2 pr-16 py-2 text-sm font-medium whitespace-pre pointer-events-none capitalize">
                  {dateFilterType === 'all_years' ? 'All Years' : dateFilterType}
                </span>
                <select 
                  value={dateFilterType}
                  onChange={(e) => setDateFilterType(e.target.value)}
                  className="absolute inset-0 w-full h-full bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all p-2 pr-10"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="all_years">All Years</option>
                </select>
              </div>

              {dateFilterType === "daily" && (
                <input 
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all p-2"
                />
              )}
              
              {dateFilterType === "weekly" && (
                <input 
                  type="week"
                  value={filterWeek}
                  onChange={(e) => setFilterWeek(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all p-2"
                />
              )}
              
              {dateFilterType === "monthly" && (
                <div className="flex items-center gap-2">
                  <select 
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all p-2 pr-8"
                  >
                    {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                      <option key={m} value={m.toString()}>
                        {new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                  <select 
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all p-2 pr-8"
                  >
                    {Array.from({length: 10}, (_, i) => new Date().getFullYear() - i).map(y => (
                      <option key={y} value={y.toString()}>{y}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {dateFilterType === "yearly" && (
                <select 
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all p-2 pr-8"
                >
                  {Array.from({length: 10}, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y.toString()}>{y}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left border-collapse print:text-[10px]">
            <thead>
              <tr className="bg-slate-50/50 print:bg-blue-50 divide-x divide-slate-200" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 print:py-1 print:border-b-blue-200">Date</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 print:py-1 print:border-b-blue-200">Type</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 print:py-1 print:border-b-blue-200">Status</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 print:py-1 print:border-b-blue-200">Category</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 print:py-1 print:border-b-blue-200">Bank</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 print:py-1 print:border-b-blue-200">Name / Supplier</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 print:py-1 print:border-b-blue-200">
                  <button
                    onClick={() => setCheckNoSorted(prev => !prev)}
                    className={`flex items-center gap-1.5 group transition-colors ${
                      checkNoSorted ? "text-blue-600" : "text-slate-500 hover:text-slate-700"
                    }`}
                    title={checkNoSorted ? "Sorted: ascending — click to reset" : "Click to sort ascending"}
                  >
                    CHECK #
                    {checkNoSorted
                      ? <ArrowUp className="w-3.5 h-3.5 text-blue-500" />
                      : <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-70 transition-opacity" />}
                  </button>
                </th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 print:py-1 print:border-b-blue-200">Amount</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 print:py-1 print:border-b-blue-200">Remarks</th>
                <th className="px-4 py-3 text-right font-bold text-slate-700 uppercase tracking-wider print:hidden w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-500 text-sm">
                    No financial records found for this filter.
                  </td>
                </tr>
              ) : (
                displayedRecords.map((record) => {
                  const recordStatus = record.status || "Pending";
                  return (
                  <tr 
                    key={record.id} 
                    onClick={() => {
                      setSelectedRecord(record);
                      setIsViewOnly(true);
                      setIsModalOpen(true);
                    }}
                    className={`hover:bg-slate-50/50 transition-colors cursor-pointer print:break-inside-avoid print:cursor-auto group divide-x divide-slate-100 print:divide-slate-200 ${
                      recordStatus === 'Cancelled' ? 'opacity-50 bg-slate-50/60' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-slate-600 print:py-1 group-hover:text-blue-600 transition-colors">{format(new Date(record.date), "MMM d, yyyy")}</td>
                    <td className="px-4 py-3 print:py-1">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        record.type === "Issuance" ? "bg-rose-100 text-rose-700 print:border print:border-rose-300" : "bg-emerald-100 text-emerald-700 print:border print:border-emerald-300"
                      }`}>
                        {record.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 print:py-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          recordStatus === "Cleared"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : recordStatus === "Cancelled"
                            ? "bg-slate-100 text-slate-600 border-slate-300 line-through"
                            : "bg-amber-50 text-amber-800 border-amber-300 animate-pulse print:animate-none"
                        }`}
                      >
                        {recordStatus === "Pending" && "⏳ Pending"}
                        {recordStatus === "Cleared" && "✓ Cleared"}
                        {recordStatus === "Cancelled" && "✕ Cancelled"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700 print:py-1">{record.category}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-600 print:py-1">{record.bank || "-"}</td>
                    <td className="px-4 py-3 text-sm text-slate-900 font-bold print:py-1">{record.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 font-mono print:py-1">{record.checkNo || "-"}</td>
                    <td className={`px-4 py-3 text-sm font-black font-mono text-right print:py-1 ${
                      recordStatus === 'Cancelled' ? 'line-through text-slate-400' : 'text-slate-900'
                    }`}>
                      ₱{parseFloat(record.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 print:py-1 max-w-[150px] truncate" title={record.remarks}>{record.remarks || "-"}</td>
                    <td className="px-4 py-3 text-right print:hidden">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(record);
                            setIsViewOnly(false);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(record.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending / Uncleared Checks Detailed Modal */}
      {isPendingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-lg shadow-sm">
                  ⏳
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    Pending / Uncleared Cheques
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Issued checks awaiting encashment or bank processing
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsPendingModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Subheader Summary */}
            {nonCancelledRecords.filter(r => (r.status === "Pending" || !r.status)).length > 0 && (
              <div className="bg-amber-500/10 px-6 py-3 border-b border-amber-200/60 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-amber-900">
                  Total Floating Records ({nonCancelledRecords.filter(r => (r.status === "Pending" || !r.status)).length})
                </span>
                <span className="text-base font-black font-mono text-amber-900">
                  ₱{pendingIssuances.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {(() => {
                const pendingChecks = nonCancelledRecords.filter(r => (r.status === "Pending" || !r.status));
                if (pendingChecks.length === 0) {
                  return (
                    <div className="py-16 text-center flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-3xl text-emerald-600">check_circle</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-800 mb-1">No Pending or Uncleared Cheques</h3>
                      <p className="text-sm text-slate-500 max-w-sm">
                        All issued checks and financial transactions have been cleared by the bank.
                      </p>
                      <button
                        onClick={() => setIsPendingModalOpen(false)}
                        className="mt-6 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-3.5 py-2.5 font-bold text-slate-600 uppercase">Date</th>
                            <th className="px-3.5 py-2.5 font-bold text-slate-600 uppercase">Type</th>
                            <th className="px-3.5 py-2.5 font-bold text-slate-600 uppercase">Check #</th>
                            <th className="px-3.5 py-2.5 font-bold text-slate-600 uppercase">Bank</th>
                            <th className="px-3.5 py-2.5 font-bold text-slate-600 uppercase">Payee / Supplier</th>
                            <th className="px-3.5 py-2.5 font-bold text-slate-600 uppercase">Category</th>
                            <th className="px-3.5 py-2.5 font-bold text-slate-600 uppercase text-right">Amount</th>
                            <th className="px-3.5 py-2.5 font-bold text-slate-600 uppercase text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {pendingChecks.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-3.5 py-2.5 text-slate-600 font-medium">
                                {format(new Date(item.date), "MMM d, yyyy")}
                              </td>
                              <td className="px-3.5 py-2.5">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.type === "Issuance" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                                }`}>
                                  {item.type}
                                </span>
                              </td>
                              <td className="px-3.5 py-2.5 font-mono font-bold text-slate-900">
                                {item.checkNo || "N/A"}
                              </td>
                              <td className="px-3.5 py-2.5 text-slate-600 font-medium">
                                {item.bank || "-"}
                              </td>
                              <td className="px-3.5 py-2.5 text-slate-900 font-bold">
                                {item.name}
                              </td>
                              <td className="px-3.5 py-2.5 text-slate-600">
                                <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-[11px] font-medium text-slate-700">
                                  {item.category}
                                </span>
                              </td>
                              <td className="px-3.5 py-2.5 font-mono font-black text-slate-900 text-right">
                                ₱{parseFloat(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-3.5 py-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await handleStatusToggle(item, "Cleared");
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                                  title="Mark this check as Cleared"
                                >
                                  <span>✓</span> Mark Cleared
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsPendingModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clearance Confirmation Modal with Date Picker */}
      {clearanceTargetRecord && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-emerald-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                  ✓
                </div>
                <div>
                  <h3 className="text-base font-black">Confirm Check Clearance</h3>
                  <p className="text-xs text-emerald-100 font-medium">Bank Processing Verification</p>
                </div>
              </div>
              <button 
                onClick={() => setClearanceTargetRecord(null)}
                disabled={isClearing}
                className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold uppercase">Check #</span>
                  <span className="font-mono font-bold text-slate-900">{clearanceTargetRecord.checkNo || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold uppercase">Payee / Name</span>
                  <span className="font-bold text-slate-900">{clearanceTargetRecord.name}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold uppercase">Bank</span>
                  <span className="font-medium text-slate-700">{clearanceTargetRecord.bank || "-"}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-2">
                  <span className="text-slate-700 font-bold uppercase">Amount</span>
                  <span className="font-mono font-black text-emerald-700 text-sm">
                    ₱{parseFloat(clearanceTargetRecord.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Clearance Date <span className="text-red-500">*</span>
                </label>
                <input 
                  type="date"
                  value={clearedDateInput}
                  onChange={(e) => setClearedDateInput(e.target.value)}
                  onClick={(e) => {
                    try {
                      if ('showPicker' in e.target) {
                        (e.target as any).showPicker();
                      }
                    } catch (err) {}
                  }}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block p-3 shadow-xs"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Select the date this check was cleared/encashed by the bank.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setClearanceTargetRecord(null)}
                disabled={isClearing}
                className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearance}
                disabled={isClearing || !clearedDateInput}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
              >
                {isClearing ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                    Clearing...
                  </>
                ) : (
                  <>
                    <span>✓</span> Confirm Cleared
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <FinanceFormModal 
          initialRecord={selectedRecord}
          isViewOnly={isViewOnly}
          runningBalance={netBalance}
          warningThreshold={warningThreshold}
          onClose={() => setIsModalOpen(false)}
          onSave={async () => {
             const data = await getFinancialRecords();
             setRecords(data);
             setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
