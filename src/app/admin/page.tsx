"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useTrips, calculateTripTotals } from "@/lib/trips-store";
import TripFormModal from "@/components/trips/TripFormModal";
import { getAllStockOuts } from "@/actions/inventory";
import { getMaintenanceRecords } from "@/actions/maintenance";

export default function DashboardPage() {
  const { trips, activeTrips, completedTrips, addTrip, masterData } = useTrips();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [isProfitModalOpen, setIsProfitModalOpen] = useState(false);
  const [stockOuts, setStockOuts] = useState<any[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>([]);

  React.useEffect(() => {
    getAllStockOuts().then(setStockOuts);
    getMaintenanceRecords().then(data => setMaintenanceRecords(data.filter((r: any) => r.status === "Completed")));
  }, []);
  
  const [filterType, setFilterType] = useState<"Today" | "Monthly" | "Yearly" | "All Time">("Monthly");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Date Filtering Logic
  const filteredTrips = useMemo(() => {
    const now = new Date();
    return trips.filter((t) => {
      if (filterType === "All Time") return true;
      
      const dateStr = t.completedAt || t.dateOfTravel;
      if (!dateStr) return false;
      
      const tripDate = new Date(dateStr);
      
      if (filterType === "Today") {
        return tripDate.toDateString() === now.toDateString();
      }
      if (filterType === "Monthly") {
        return tripDate.getMonth() === selectedMonth && tripDate.getFullYear() === selectedYear;
      }
      if (filterType === "Yearly") {
        return tripDate.getFullYear() === selectedYear;
      }
      return true;
    });
  }, [trips, filterType, selectedMonth, selectedYear]);

  // Inventory Filtering Logic
  const filteredStockOuts = useMemo(() => {
    const now = new Date();
    return stockOuts.filter((tx) => {
      if (filterType === "All Time") return true;
      
      const dateStr = tx.date || tx.createdAt;
      if (!dateStr) return false;
      
      const txDate = new Date(dateStr);
      
      if (filterType === "Today") {
        return txDate.toDateString() === now.toDateString();
      }
      if (filterType === "Monthly") {
        return txDate.getMonth() === selectedMonth && txDate.getFullYear() === selectedYear;
      }
      if (filterType === "Yearly") {
        return txDate.getFullYear() === selectedYear;
      }
      return true;
    });
  }, [stockOuts, filterType, selectedMonth, selectedYear]);

  // Maintenance Filtering Logic
  const filteredMaintenance = useMemo(() => {
    const now = new Date();
    return maintenanceRecords.filter((m) => {
      if (filterType === "All Time") return true;
      
      const dateStr = m.dateIncurred || m.createdAt;
      if (!dateStr) return false;
      
      const mDate = new Date(dateStr);
      
      if (filterType === "Today") {
        return mDate.toDateString() === now.toDateString();
      }
      if (filterType === "Monthly") {
        return mDate.getMonth() === selectedMonth && mDate.getFullYear() === selectedYear;
      }
      if (filterType === "Yearly") {
        return mDate.getFullYear() === selectedYear;
      }
      return true;
    });
  }, [maintenanceRecords, filterType, selectedMonth, selectedYear]);

  const dateString = useMemo(() => {
    if (filterType === "Today") return "Today";
    if (filterType === "All Time") return "All Time";
    if (filterType === "Monthly") return `${months[selectedMonth]} ${selectedYear}`;
    if (filterType === "Yearly") return `${selectedYear}`;
    return "";
  }, [filterType, selectedMonth, selectedYear]);

  // Financial Calculations
  const { grossRevenue, totalExpenses, netProfit } = useMemo(() => {
    let rev = 0;
    let exp = 0;
    
    // Add trip expenses
    filteredTrips.forEach(t => {
      const { totalExpense } = calculateTripTotals(t);
      rev += (Number(t.rate) || 0);
      exp += totalExpense;
    });
    
    // Add inventory expenses
    const inventoryCost = filteredStockOuts.reduce((sum, tx) => sum + Number(tx.totalCost || 0), 0);
    exp += inventoryCost;

    // Add maintenance expenses
    const maintenanceCost = filteredMaintenance.reduce((sum, m) => sum + Number(m.cost || 0), 0);
    exp += maintenanceCost;

    return { grossRevenue: rev, totalExpenses: exp, netProfit: rev - exp };
  }, [filteredTrips, filteredStockOuts, filteredMaintenance]);

  // Detailed Expense Breakdown
  const expenseBreakdown = useMemo(() => {
    let fuel = 0;
    let driverWages = 0;
    let helperWages = 0;
    let maintenance = 0;
    let misc = 0;

    filteredTrips.forEach(t => {
      t.expenses.forEach(e => {
        const cat = (e.category || "").toUpperCase();
        const amt = Number(e.amount) || 0;

        if (cat === "DIESEL" || cat.includes("FUEL")) {
          fuel += amt;
        } else if (cat === "DRIVER RATE" || cat.includes("DRIVER")) {
          driverWages += amt;
        } else if (cat === "HELPER 1 RATE" || cat === "HELPER 2 RATE" || cat === "STRIPPER" || cat.includes("HELPER")) {
          helperWages += amt;
        } else if (cat === "MAINTENANCE" || cat.includes("REPAIR")) {
          maintenance += amt;
        } else {
          misc += amt;
        }
      });
    });

    const inventoryCost = filteredStockOuts.reduce((sum, tx) => sum + Number(tx.totalCost || 0), 0);
    const maintenanceCost = filteredMaintenance.reduce((sum, m) => sum + Number(m.cost || 0), 0);
    maintenance += maintenanceCost; // Add to existing trip maintenance costs

    return { fuel, driverWages, helperWages, maintenance, misc, inventoryCost };
  }, [filteredTrips, filteredStockOuts, filteredMaintenance]);

  // Detailed Revenue Breakdown by Customer
  const revenueBreakdown = useMemo(() => {
    const clients: Record<string, number> = {};
    filteredTrips.forEach(t => {
      const client = t.customerName || "Unknown Customer";
      const amt = Number(t.rate) || 0;
      if (!clients[client]) clients[client] = 0;
      clients[client] += amt;
    });
    return Object.entries(clients).sort((a, b) => b[1] - a[1]);
  }, [filteredTrips]);

  const profitMargin = grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(1) : "0.0";

  const formatPHP = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1440px] mx-auto w-full space-y-6">
      
      {/* Header & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#c4c6d1] card-shadow">
        <div>
          <h1 className="text-xl font-extrabold text-[#00193c] font-manrope">Dashboard Overview</h1>
          <p className="text-sm text-[#43474f]">Track your fleet operations and financial performance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="material-symbols-outlined text-slate-400 text-[20px]">calendar_month</span>
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-[#f1f4f7] border border-[#c4c6d1] text-[#00193c] text-sm font-bold rounded-xl px-4 py-2 outline-none focus:border-[#00193c] cursor-pointer"
          >
            <option value="Today">Today</option>
            <option value="Monthly">Monthly</option>
            <option value="Yearly">Yearly</option>
            <option value="All Time">All Time</option>
          </select>

          {filterType === "Monthly" && (
            <>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-white border border-[#c4c6d1] text-[#00193c] text-sm font-bold rounded-xl px-3 py-2 outline-none focus:border-[#00193c] cursor-pointer"
              >
                {months.map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-white border border-[#c4c6d1] text-[#00193c] text-sm font-bold rounded-xl px-3 py-2 outline-none focus:border-[#00193c] cursor-pointer"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </>
          )}

          {filterType === "Yearly" && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-white border border-[#c4c6d1] text-[#00193c] text-sm font-bold rounded-xl px-3 py-2 outline-none focus:border-[#00193c] cursor-pointer"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Row 1: Financial Overview (3 Cards) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Gross Revenue */}
        <div 
          onClick={() => setIsRevenueModalOpen(true)}
          className="bg-white p-6 rounded-2xl border border-[#c4c6d1] card-shadow flex flex-col justify-between hover:-translate-y-1 hover:border-emerald-500 hover:ring-4 hover:ring-emerald-500/10 cursor-pointer transition-all duration-300 group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
              <span className="material-symbols-outlined text-emerald-600 text-[24px]">payments</span>
            </div>
            <span className="text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">Gross Revenue</span>
          </div>
          <div>
            <span className="font-extrabold text-3xl text-slate-900 font-mono tracking-tight block">
              {formatPHP(grossRevenue)}
            </span>
            <span className="text-xs text-slate-500 font-medium mt-1 block">Total billed for {dateString}</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div 
          onClick={() => setIsExpenseModalOpen(true)}
          className="bg-white p-6 rounded-2xl border border-[#c4c6d1] card-shadow flex flex-col justify-between hover:-translate-y-1 hover:border-blue-500 hover:ring-4 hover:ring-blue-500/10 cursor-pointer transition-all duration-300 group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <span className="material-symbols-outlined text-rose-600 text-[24px] group-hover:text-blue-600 transition-colors">receipt_long</span>
            </div>
            <span className="text-rose-700 font-bold text-xs bg-rose-50 px-3 py-1 rounded-full border border-rose-200">Total Expenses</span>
          </div>
          <div>
            <span className="font-extrabold text-3xl text-slate-900 font-mono tracking-tight block">
              {formatPHP(totalExpenses)}
            </span>
            <span className="text-xs text-slate-500 font-medium mt-1 block">Trips, warehouse stock-outs, & maintenance</span>
          </div>
        </div>

        {/* Net Profit */}
        <div 
          onClick={() => setIsProfitModalOpen(true)}
          className="bg-[#00193c] p-6 rounded-2xl border border-[#002d62] shadow-xl flex flex-col justify-between hover:-translate-y-1 hover:shadow-blue-500/20 cursor-pointer transition-all duration-300 relative overflow-hidden group"
        >
          {/* Decorative background glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-400/30">
              <span className="material-symbols-outlined text-blue-400 text-[24px]">account_balance</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-200 font-bold text-xs px-2">Margin: {profitMargin}%</span>
              <span className="text-white font-extrabold text-xs bg-blue-600 px-3 py-1 rounded-full shadow-inner">Net Profit</span>
            </div>
          </div>
          <div className="relative z-10">
            <span className="font-extrabold text-3xl text-white font-mono tracking-tight block drop-shadow-sm">
              {formatPHP(netProfit)}
            </span>
            <span className="text-xs text-blue-300 font-medium mt-1 block">Actual earnings for {dateString}</span>
          </div>
        </div>
      </section>

      {/* Row 2: Operational Stats (4 Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#c4c6d1] card-shadow flex items-center gap-4">
          <div className="w-12 h-12 bg-[#f1f4f7] rounded-full flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#002d62]">route</span>
          </div>
          <div>
            <span className="font-semibold text-xs text-[#43474f] uppercase tracking-wider block">Active Trips</span>
            <span className="font-extrabold text-2xl text-[#00193c] font-mono leading-none mt-1 block">{activeTrips.length}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#c4c6d1] card-shadow flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-emerald-600">task_alt</span>
          </div>
          <div>
            <span className="font-semibold text-xs text-[#43474f] uppercase tracking-wider block">Completed</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-extrabold text-2xl text-[#00193c] font-mono leading-none block">{filteredTrips.filter(t => t.status === "Completed").length}</span>
              <span className="text-[10px] text-slate-400 font-bold max-w-[60px] leading-tight text-right">{dateString}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#c4c6d1] card-shadow flex items-center gap-4">
          <div className="w-12 h-12 bg-[#f1f4f7] rounded-full flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#43474f]">local_shipping</span>
          </div>
          <div>
            <span className="font-semibold text-xs text-[#43474f] uppercase tracking-wider block">Total Trucks</span>
            <span className="font-extrabold text-2xl text-[#00193c] font-mono leading-none mt-1 block">{masterData.trucks.length}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#c4c6d1] card-shadow flex items-center gap-4">
          <div className="w-12 h-12 bg-[#f1f4f7] rounded-full flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#43474f]">badge</span>
          </div>
          <div>
            <span className="font-semibold text-xs text-[#43474f] uppercase tracking-wider block">Total Drivers</span>
            <span className="font-extrabold text-2xl text-[#00193c] font-mono leading-none mt-1 block">{masterData.drivers.length}</span>
          </div>
        </div>
      </section>

      {/* Bento Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Quick Actions: Compact Buttons (Col-Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <h2 className="font-extrabold text-base text-[#00193c] font-manrope">Quick Actions</h2>
          
          <button
            onClick={() => setIsFormOpen(true)}
            className="group w-full p-4 sm:p-4.5 bg-[#00193c] text-white rounded-xl flex items-center justify-between hover:brightness-110 transition-all shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[24px]">add_circle</span>
              <span className="font-bold text-base">Add Trip</span>
            </div>
            <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>

          <Link
            href="/admin/trips"
            className="group w-full p-4 sm:p-4.5 bg-white border border-[#00193c] text-[#00193c] rounded-xl flex items-center justify-between hover:bg-blue-50 transition-all card-shadow cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[24px]">list_alt</span>
              <span className="font-bold text-base">Track Trips</span>
            </div>
            <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>

          <Link
            href="/admin/reports"
            className="group w-full p-4 sm:p-4.5 bg-white border border-[#c4c6d1] text-[#43474f] rounded-xl flex items-center justify-between hover:bg-[#f1f4f7] transition-all card-shadow cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[24px]">assessment</span>
              <span className="font-bold text-base">Reports</span>
            </div>
            <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
        </div>

        {/* Recent Active Trips (Col-Span 8) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-[#c4c6d1] card-shadow p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-[#c4c6d1] pb-3">
            <div>
              <h2 className="font-extrabold text-base text-[#00193c] font-manrope">Recent Active Trips</h2>
              <p className="text-[11px] text-[#43474f]">Live shipments currently en route</p>
            </div>
            <Link href="/admin/trips" className="text-xs font-bold text-[#00193c] hover:underline flex items-center gap-1">
              View All Trips →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f1f4f7] border-b border-[#c4c6d1] text-[#00193c] font-bold">
                  <th className="px-3.5 py-2.5">Sequence #</th>
                  <th className="px-3.5 py-2.5">Date</th>
                  <th className="px-3.5 py-2.5">Truck Unit</th>
                  <th className="px-3.5 py-2.5">Driver</th>
                  <th className="px-3.5 py-2.5">Route</th>
                  <th className="px-3.5 py-2.5">Customer</th>
                  <th className="px-3.5 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c4c6d1]">
                {activeTrips.slice(0, 5).map((t) => (
                  <tr key={t.id} className="hover:bg-[#f1f4f7] transition-colors">
                    <td className="px-3.5 py-2.5 font-mono font-extrabold text-[#00193c]">{t.seqNo || t.id}</td>
                    <td className="px-3.5 py-2.5 text-[#43474f]">{t.dateOfTravel}</td>
                    <td className="px-3.5 py-2.5 font-bold text-[#181c1e]">{t.unit} ({t.plateNo})</td>
                    <td className="px-3.5 py-2.5 font-semibold text-[#181c1e]">{t.driver}</td>
                    <td className="px-3.5 py-2.5 font-bold text-[#181c1e]">{t.origin || "CDO"} → {t.destination}</td>
                    <td className="px-3.5 py-2.5 text-[#181c1e]">{t.customerName}</td>
                    <td className="px-3.5 py-2.5">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-extrabold text-[10px] rounded-full uppercase">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
                {activeTrips.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                      No active trips. Click <strong>&quot;Add Trip&quot;</strong> to start a new record.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <TripFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={async (data) => { await addTrip(data as any); }}
      />

      {/* Expense Breakdown Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#00193c]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-[#00193c] text-xl font-manrope">Total Expenses Breakdown</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <p className="text-sm text-slate-500 mb-6 font-bold">Showing breakdown for: <span className="text-[#00193c]">{dateString}</span></p>

            <div className="space-y-4 font-mono text-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-600 font-bold uppercase tracking-wider text-xs">Fuel Costs</span>
                <span className="text-[#00193c] font-extrabold">{formatPHP(expenseBreakdown.fuel)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-600 font-bold uppercase tracking-wider text-xs">Driver Wages</span>
                <span className="text-[#00193c] font-extrabold">{formatPHP(expenseBreakdown.driverWages)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-600 font-bold uppercase tracking-wider text-xs">Helper Wages</span>
                <span className="text-[#00193c] font-extrabold">{formatPHP(expenseBreakdown.helperWages)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-600 font-bold uppercase tracking-wider text-xs">Maintenance</span>
                <span className="text-[#00193c] font-extrabold">{formatPHP(expenseBreakdown.maintenance)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-emerald-700 font-extrabold uppercase tracking-wider text-xs bg-emerald-50 px-2 py-1 rounded">Inventory Supply</span>
                <span className="text-emerald-700 font-extrabold">{formatPHP(expenseBreakdown.inventoryCost)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-600 font-bold uppercase tracking-wider text-xs">Other / Misc</span>
                <span className="text-[#00193c] font-extrabold">{formatPHP(expenseBreakdown.misc)}</span>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t-2 border-slate-900 mt-6">
                <span className="text-[#00193c] font-black uppercase tracking-widest">Total</span>
                <span className="text-rose-600 font-black text-xl">{formatPHP(totalExpenses)}</span>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="px-6 py-2 bg-[#00193c] hover:bg-blue-900 text-white rounded-xl text-sm font-extrabold shadow-md transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Breakdown Modal */}
      {isRevenueModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#00193c]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-[#00193c] text-xl font-manrope">Revenue by Customer</h3>
              <button onClick={() => setIsRevenueModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <p className="text-sm text-slate-500 mb-6 font-bold">Showing breakdown for: <span className="text-[#00193c]">{dateString}</span></p>

            <div className="space-y-4 font-mono text-sm max-h-[50vh] overflow-y-auto pr-2">
              {revenueBreakdown.map(([client, amt]) => (
                <div key={client} className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600 font-bold uppercase tracking-wider text-xs">{client}</span>
                  <span className="text-[#00193c] font-extrabold">{formatPHP(amt)}</span>
                </div>
              ))}
              {revenueBreakdown.length === 0 && (
                <div className="text-center text-slate-400 py-4 italic">No revenue recorded for this period.</div>
              )}
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t-2 border-slate-900 mt-6 font-mono">
              <span className="text-[#00193c] font-black uppercase tracking-widest text-sm">Total Revenue</span>
              <span className="text-emerald-600 font-black text-xl">{formatPHP(grossRevenue)}</span>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setIsRevenueModalOpen(false)}
                className="px-6 py-2 bg-[#00193c] hover:bg-blue-900 text-white rounded-xl text-sm font-extrabold shadow-md transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Net Profit Breakdown Modal */}
      {isProfitModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#00193c]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-[#00193c] text-xl font-manrope">Net Profit Summary</h3>
              <button onClick={() => setIsProfitModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <p className="text-sm text-slate-500 mb-6 font-bold">Showing summary for: <span className="text-[#00193c]">{dateString}</span></p>

            <div className="space-y-4 font-mono text-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-600 font-bold uppercase tracking-wider text-xs">Gross Revenue</span>
                <span className="text-emerald-600 font-extrabold">{formatPHP(grossRevenue)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-600 font-bold uppercase tracking-wider text-xs">Total Expenses</span>
                <span className="text-rose-600 font-extrabold">- {formatPHP(totalExpenses)}</span>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t-2 border-slate-900 mt-6">
                <span className="text-[#00193c] font-black uppercase tracking-widest">Net Profit</span>
                <span className="text-blue-600 font-black text-xl">{formatPHP(netProfit)}</span>
              </div>
              
              <div className="text-right mt-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Profit Margin: </span>
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{profitMargin}%</span>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setIsProfitModalOpen(false)}
                className="px-6 py-2 bg-[#00193c] hover:bg-blue-900 text-white rounded-xl text-sm font-extrabold shadow-md transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
