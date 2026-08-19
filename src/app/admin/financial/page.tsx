"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, Lock, Printer } from "lucide-react";
import FinanceFormModal from "@/components/finance/FinanceFormModal";
import { format, startOfMonth, endOfMonth, isWithinInterval, getISOWeek, getYear, isSameDay } from "date-fns";
import { getFinancialRecords, deleteFinancialRecord } from "@/actions/finance";
import { getSystemSetting } from "@/actions/settings";
import { toast } from "sonner";

export default function FinancialModulePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // "all", "Issuance", "Deposit"
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [hasDismissedWarning, setHasDismissedWarning] = useState(false);
  const [warningThreshold, setWarningThreshold] = useState(50000);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
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
      r.checkNo?.toLowerCase().includes(searchTerm.toLowerCase());
      
    if (!matchesSearch) return false;
    
    // 2. Type filter
    if (typeFilter !== "all" && r.type !== typeFilter) return false;

    // 2.5 Category filter
    if (categoryFilter !== "all" && r.category !== categoryFilter) return false;

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

  const totalIssuances = filteredRecords.filter(r => r.type === "Issuance").reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
  const totalDeposits = filteredRecords.filter(r => r.type === "Deposit").reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
  const netBalance = totalDeposits - totalIssuances;

  // Reset the warning dismissal if the balance recovers above the threshold
  useEffect(() => {
    if (netBalance >= warningThreshold) {
      setHasDismissedWarning(false);
    }
  }, [netBalance, warningThreshold]);

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
          Generated on: {format(new Date(), "MMMM d, yyyy 'at' h:mm a")} 
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2 print:mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1 print:p-3 print:rounded-none">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Issuances</span>
          <span className="text-2xl font-black text-rose-600 font-mono print:text-lg">₱{totalIssuances.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1 print:p-3 print:rounded-none">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Deposits</span>
          <span className="text-2xl font-black text-emerald-600 font-mono print:text-lg">₱{totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className={`p-5 rounded-2xl border shadow-sm flex flex-col gap-1 print:p-3 print:rounded-none ${netBalance >= 0 ? 'bg-blue-50/50 border-blue-200' : 'bg-rose-50/50 border-rose-200'}`}>
          <span className={`text-xs font-bold uppercase tracking-wider ${netBalance >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>Running Balance</span>
          <span className={`text-2xl font-black font-mono print:text-lg ${netBalance >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
            {netBalance >= 0 ? "+" : ""}₱{netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 print:border-none print:shadow-none print:rounded-none">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4 print:hidden">
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Check #, Name, or Category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Type:</span>
              <div className="relative inline-block">
                <span className="invisible block px-2 pr-16 py-2 text-sm font-medium whitespace-pre pointer-events-none">
                  {typeFilter === 'all' ? 'All Types' : typeFilter === 'Issuance' ? 'Issuances' : 'Deposits'}
                </span>
                <select 
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="absolute inset-0 w-full h-full bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all p-2 pr-10"
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
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 print:py-1 print:border-b-blue-200">Category</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 print:py-1 print:border-b-blue-200">Bank</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 print:py-1 print:border-b-blue-200">Name / Supplier</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 print:py-1 print:border-b-blue-200">Check #</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 print:py-1 print:border-b-blue-200">Amount</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 print:py-1 print:border-b-blue-200">Remarks</th>
                <th className="px-4 py-3 text-right font-bold text-slate-700 uppercase tracking-wider print:hidden w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500 text-sm">
                    No financial records found for this filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr 
                    key={record.id} 
                    onClick={() => {
                      setSelectedRecord(record);
                      setIsViewOnly(true);
                      setIsModalOpen(true);
                    }}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer print:break-inside-avoid print:cursor-auto group divide-x divide-slate-100 print:divide-slate-200"
                  >
                    <td className="px-4 py-3 text-sm text-slate-600 print:py-1 group-hover:text-blue-600 transition-colors">{format(new Date(record.date), "MMM d, yyyy")}</td>
                    <td className="px-4 py-3 print:py-1">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        record.type === "Issuance" ? "bg-rose-100 text-rose-700 print:border print:border-rose-300" : "bg-emerald-100 text-emerald-700 print:border print:border-emerald-300"
                      }`}>
                        {record.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700 print:py-1">{record.category}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-600 print:py-1">{record.bank || "-"}</td>
                    <td className="px-4 py-3 text-sm text-slate-900 font-bold print:py-1">{record.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 font-mono print:py-1">{record.checkNo || "-"}</td>
                    <td className="px-4 py-3 text-sm font-black font-mono text-right text-slate-900 print:py-1">
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <FinanceFormModal 
          initialRecord={selectedRecord}
          isViewOnly={isViewOnly}
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
