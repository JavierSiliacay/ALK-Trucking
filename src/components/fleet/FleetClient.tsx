"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { TrendingUp, TrendingDown, Receipt, Truck as TruckIcon, Calendar, X, FileText, PackageOpen, ChevronDown } from "lucide-react";
import wingvanImg from "../../../public/wingvan.png";
import canterImg from "../../../public/canter6wheelers.png";
import forwardImg from "../../../public/forward.png";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { formatDateLong } from "@/lib/utils";
import TripInspectorModal from "@/components/trips/TripInspectorModal";

type Trip = {
  id: string;
  dateOfTravel: Date;
  customerName: string;
  destination: string;
  rate: string;
  expenses: { amount: string }[];
};

type InventoryTx = {
  id: string;
  createdAt: Date;
  quantity: string;
  unitCost: string;
  totalCost: string;
  remarks: string | null;
};

type TruckStats = {
  tripsCount: number;
  revenue: number;
  tripExpenses: number;
  inventoryExpenses: number;
  maintenanceExpenses: number;
  totalExpenses: number;
  netProfit: number;
};

type TruckPerformance = {
  id: string;
  unit: string;
  plateNo: string;
  owner: string;
  stats: TruckStats;
  trips?: Trip[];
  inventoryTransactions?: InventoryTx[];
  maintenanceRecords?: any[];
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

const YEARS = ["2024", "2025", "2026", "2027", "2028"];

export default function FleetClient({
  trucks,
  initialStatus,
  initialDateRange,
  initialMonth,
  initialYear,
  initialDay,
  initialCustomStart,
  initialCustomEnd
}: {
  trucks: TruckPerformance[];
  initialStatus: string;
  initialDateRange: string;
  initialMonth: number;
  initialYear: number;
  initialDay: string;
  initialCustomStart: string;
  initialCustomEnd: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const [selectedTruck, setSelectedTruck] = useState<TruckPerformance | null>(null);
  const [activeTab, setActiveTab] = useState<"trips" | "diesel" | "maintenance">("trips");
  const [inspectingTrip, setInspectingTrip] = useState<any>(null);

  // Auto-refresh the page data every 30 seconds to keep stats live
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [router]);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const getTruckImage = (unit: string) => {
    const normalized = unit.toLowerCase();
    if (normalized.includes("wingvan")) return wingvanImg;
    if (normalized.includes("canter")) return canterImg;
    if (normalized.includes("forward")) return forwardImg;
    return null;
  };

  const totalFleetRevenue = trucks.reduce((sum, t) => sum + t.stats.revenue, 0);
  const totalFleetExpenses = trucks.reduce((sum, t) => sum + t.stats.totalExpenses, 0);
  const totalFleetNet = trucks.reduce((sum, t) => sum + t.stats.netProfit, 0);

  return (
    <div className="p-6 max-w-[1440px] mx-auto w-full space-y-6">
      
      {/* HEADER & ADVANCED FILTERS */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-extrabold text-2xl text-[#00193c] font-manrope">Fleet Performance</h2>
          <p className="text-[#43474f] text-xs mt-0.5">Detailed monitoring of revenue, expenses, and net profit.</p>
        </div>
        
        {/* FILTERS UI */}
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 shadow-sm flex-wrap">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2">Filters</span>
          
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <TruckIcon className="h-4 w-4" />
              </div>
              <select 
                value={initialStatus}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#00193c] focus:ring-2 focus:ring-[#1e3a8a]/20 outline-none appearance-none cursor-pointer hover:border-slate-300 transition-colors shadow-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active Trucks</option>
                <option value="archived">Archived Trucks</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>

            <div className="relative ml-2">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Calendar className="h-4 w-4" />
              </div>
              <select 
                value={initialDateRange}
                onChange={(e) => handleFilterChange("dateRange", e.target.value)}
                className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#00193c] focus:ring-2 focus:ring-[#1e3a8a]/20 outline-none appearance-none cursor-pointer hover:border-slate-300 transition-colors shadow-sm"
              >
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="overall">All Time</option>
                <option value="custom">Custom Range</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>

            {initialDateRange === "daily" && (
              <input
                type="date"
                value={initialDay}
                onChange={(e) => handleFilterChange("day", e.target.value)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#00193c] focus:ring-2 focus:ring-[#1e3a8a]/20 outline-none cursor-pointer shadow-sm hover:border-slate-300 transition-colors"
              />
            )}

            {initialDateRange === "monthly" && (
              <>
                <div className="relative">
                  <select 
                    value={initialMonth}
                    onChange={(e) => handleFilterChange("month", e.target.value)}
                    className="pl-4 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#00193c] focus:ring-2 focus:ring-[#1e3a8a]/20 outline-none appearance-none cursor-pointer hover:border-slate-300 transition-colors shadow-sm"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>

                <div className="relative">
                  <select 
                    value={initialYear}
                    onChange={(e) => handleFilterChange("year", e.target.value)}
                    className="pl-4 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#00193c] focus:ring-2 focus:ring-[#1e3a8a]/20 outline-none appearance-none cursor-pointer hover:border-slate-300 transition-colors shadow-sm"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </>
            )}

            {initialDateRange === "yearly" && (
              <div className="relative">
                <select 
                  value={initialYear}
                  onChange={(e) => handleFilterChange("year", e.target.value)}
                  className="pl-4 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#00193c] focus:ring-2 focus:ring-[#1e3a8a]/20 outline-none appearance-none cursor-pointer hover:border-slate-300 transition-colors shadow-sm"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            )}

            {initialDateRange === "overall" && (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 ml-1">
                All Records
              </span>
            )}

            {initialDateRange === "custom" && (
              <div className="flex items-center gap-1.5 ml-1">
                <input
                  type="date"
                  value={initialCustomStart}
                  onChange={(e) => handleFilterChange("customStart", e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-[#00193c] bg-white shadow-sm"
                />
                <span className="text-xs text-slate-400 font-bold">to</span>
                <input
                  type="date"
                  value={initialCustomEnd}
                  onChange={(e) => handleFilterChange("customEnd", e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-[#00193c] bg-white shadow-sm"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* High Level Fleet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
          <p className="text-emerald-600 text-xs font-bold uppercase tracking-wide mb-1">Fleet Revenue</p>
          <h3 className="text-3xl font-extrabold text-emerald-700">₱{totalFleetRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
        </div>
        <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100">
          <p className="text-rose-600 text-xs font-bold uppercase tracking-wide mb-1">Fleet Expenses</p>
          <h3 className="text-3xl font-extrabold text-rose-700">₱{totalFleetExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
        </div>
        <div className="bg-[#1e3a8a]/5 rounded-2xl p-5 border border-[#1e3a8a]/10">
          <p className="text-[#1e3a8a] text-xs font-bold uppercase tracking-wide mb-1">Fleet Net Profit</p>
          <h3 className="text-3xl font-extrabold text-[#1e3a8a]">₱{totalFleetNet.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {trucks.map(truck => {
          const img = getTruckImage(truck.unit);
          return (
            <div 
              key={truck.id} 
              onClick={() => setSelectedTruck(truck)}
              className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-[#1e3a8a]/30 transition-all cursor-pointer group"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 group-hover:bg-[#1e3a8a]/5 transition-colors">
                <div className="flex items-center gap-3">
                  {img ? (
                    <div className="w-14 h-14 relative bg-white border border-slate-200 rounded-xl flex items-center justify-center p-1.5 shadow-sm">
                      <Image src={img} alt={truck.unit} fill sizes="56px" className="object-contain p-1" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
                      <TruckIcon className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-[#1e3a8a] transition-colors">{truck.unit}</h3>
                    <div className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md inline-block mt-1">
                      {truck.plateNo}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Trips</div>
                  <div className="font-bold text-xl text-[#00193c]">{truck.stats.tripsCount}</div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <div className="p-1.5 bg-emerald-100 rounded-lg"><TrendingUp className="w-4 h-4" /></div>
                    <span className="text-sm font-semibold">Revenue</span>
                  </div>
                  <span className="font-bold text-slate-800">₱{truck.stats.revenue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-rose-500">
                    <div className="p-1.5 bg-rose-100 rounded-lg"><Receipt className="w-4 h-4" /></div>
                    <span className="text-sm font-semibold">Trip Expenses</span>
                  </div>
                  <span className="font-bold text-slate-800">₱{truck.stats.tripExpenses.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-rose-500">
                    <div className="p-1.5 bg-rose-100 rounded-lg"><TrendingDown className="w-4 h-4" /></div>
                    <span className="text-sm font-semibold">Inventory Supply</span>
                  </div>
                  <span className="font-bold text-slate-800">₱{truck.stats.inventoryExpenses.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-rose-500">
                    <div className="p-1.5 bg-rose-100 rounded-lg"><TrendingDown className="w-4 h-4" /></div>
                    <span className="text-sm font-semibold">Maintenance</span>
                  </div>
                  <span className="font-bold text-slate-800">₱{truck.stats.maintenanceExpenses.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                </div>
              </div>

              <div className="p-5 bg-[#00193c] group-hover:bg-[#002d62] text-white flex justify-between items-center transition-colors relative overflow-hidden">
                <span className="text-sm font-bold text-blue-200 uppercase tracking-wide">Net Profit</span>
                <span className="text-2xl font-extrabold z-10">₱{truck.stats.netProfit.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                
                {/* Micro animation arrow on hover */}
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-white/10 flex items-center justify-center translate-x-full group-hover:translate-x-0 transition-transform duration-300">
                   <TrendingUp className="w-5 h-5 text-emerald-400 rotate-90" />
                </div>
              </div>
            </div>
          );
        })}
        {trucks.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 font-medium bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            No trucks found or no data for this period.
          </div>
        )}
      </div>

      {/* DRILL DOWN MODAL */}
      {selectedTruck && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-8 py-6 bg-[#00193c] text-white flex justify-between items-start relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
              <div className="flex items-center gap-5 z-10">
                {getTruckImage(selectedTruck.unit) ? (
                  <div className="w-20 h-20 relative bg-white rounded-2xl flex items-center justify-center p-2 shadow-lg">
                    <Image src={getTruckImage(selectedTruck.unit)!} alt={selectedTruck.unit} fill sizes="80px" className="object-contain p-1" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                    <TruckIcon className="w-10 h-10 text-white/50" />
                  </div>
                )}
                <div>
                  <h2 className="text-3xl font-extrabold">{selectedTruck.unit}</h2>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs font-bold text-[#00193c] bg-white px-2.5 py-1 rounded-lg tracking-wide uppercase shadow-sm">
                      {selectedTruck.plateNo}
                    </span>
                    <span className="text-blue-200 text-sm font-medium">Detailed Ledger Audit</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-6 z-10">
                <div className="text-right">
                  <div className="text-xs font-bold text-blue-300 uppercase tracking-wide mb-1">Total Net Profit</div>
                  <div className="text-3xl font-extrabold text-emerald-400">₱{selectedTruck.stats.netProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                </div>
                <button 
                  onClick={() => setSelectedTruck(null)} 
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="px-8 pt-4 bg-slate-50 border-b border-slate-200 flex gap-6">
              <button 
                onClick={() => setActiveTab("trips")}
                className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === "trips" 
                    ? "border-[#1e3a8a] text-[#1e3a8a]" 
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <FileText className="w-4 h-4" />
                Trips Ledger (Revenue & Misc Expenses)
                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">{selectedTruck.trips?.length || 0}</span>
              </button>
                <button 
                  onClick={() => setActiveTab("diesel")}
                  className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                    activeTab === "diesel" 
                      ? "border-rose-600 text-rose-700" 
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  Inventory Expenses
                  <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-xs">{selectedTruck.inventoryTransactions?.length || 0}</span>
                </button>
                <button 
                  onClick={() => setActiveTab("maintenance")}
                  className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                    activeTab === "maintenance" 
                      ? "border-rose-600 text-rose-700" 
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  Maintenance
                  <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-xs">{selectedTruck.maintenanceRecords?.length || 0}</span>
                </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
              
              {activeTab === "trips" && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3">Customer</th>
                        <th className="px-5 py-3">Destination</th>
                        <th className="px-5 py-3 text-right">Freight Rate (Revenue)</th>
                        <th className="px-5 py-3 text-right">Trip Expenses (Tolls, etc.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {!selectedTruck.trips || selectedTruck.trips.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-10 text-center text-slate-400 font-medium">No trips recorded for this period.</td>
                        </tr>
                      ) : (
                        selectedTruck.trips.map(trip => {
                          const tripTotalExp = trip.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
                          return (
                            <tr 
                              key={trip.id} 
                              onClick={() => setInspectingTrip(trip)}
                              className="hover:bg-blue-50/60 transition-colors cursor-pointer group"
                            >
                              <td className="px-5 py-3.5 whitespace-nowrap text-slate-600 font-medium group-hover:text-blue-600">{formatDateLong(trip.dateOfTravel.toString())}</td>
                              <td className="px-5 py-3.5 whitespace-nowrap text-slate-800 font-bold group-hover:text-blue-600">{trip.customerName}</td>
                              <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">{trip.destination}</td>
                              <td className="px-5 py-3.5 whitespace-nowrap text-emerald-600 font-bold text-right">
                                + ₱{Number(trip.rate).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap text-rose-600 font-bold text-right">
                                - ₱{tripTotalExp.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                      <tr>
                        <td colSpan={3} className="px-5 py-4 text-right text-slate-500 text-xs uppercase tracking-wider">Subtotals</td>
                        <td className="px-5 py-4 text-right text-emerald-700 text-lg">
                          ₱{selectedTruck.stats.revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td className="px-5 py-4 text-right text-rose-700 text-lg">
                          ₱{selectedTruck.stats.tripExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {activeTab === "diesel" && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3">Date Dispensed</th>
                        <th className="px-5 py-3">Remarks / Reason</th>
                        <th className="px-5 py-3 text-right">Quantity Pumped</th>
                        <th className="px-5 py-3 text-right">Unit Cost (WAC)</th>
                        <th className="px-5 py-3 text-right">Total Expense</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {!selectedTruck.inventoryTransactions || selectedTruck.inventoryTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-10 text-center text-slate-400 font-medium">No diesel/supply usage recorded for this period.</td>
                        </tr>
                      ) : (
                        selectedTruck.inventoryTransactions.map(tx => (
                          <tr key={tx.id} className="hover:bg-rose-50/30 transition-colors">
                            <td className="px-5 py-3.5 whitespace-nowrap text-slate-600 font-medium">{formatDateLong(tx.createdAt.toString())}</td>
                            <td className="px-5 py-3.5 text-slate-600 text-xs">{tx.remarks || "—"}</td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-slate-800 font-bold text-right">
                              {Number(tx.quantity).toLocaleString()} Liters
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 font-medium text-right text-xs">
                              ₱{Number(tx.unitCost).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-rose-600 font-bold text-right">
                              - ₱{Number(tx.totalCost).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                        <tr>
                          <td colSpan={4} className="px-5 py-4 text-right text-slate-500 text-xs uppercase tracking-wider">Total Inventory Expenses</td>
                          <td className="px-5 py-4 text-right text-rose-700 text-lg">
                            ₱{selectedTruck.stats.inventoryExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                        </tr>
                      </tfoot>
                  </table>
                </div>
              )}

                {activeTab === "maintenance" && (
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                          <th className="px-5 py-3">Date Incurred</th>
                          <th className="px-5 py-3">Maintenance Item / Desc</th>
                          <th className="px-5 py-3">Category & Status</th>
                          <th className="px-5 py-3 text-right">Expense Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {selectedTruck.maintenanceRecords?.map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-4 font-medium text-slate-700">
                              {new Date(m.dateIncurred || m.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-5 py-4">
                              <p className="font-bold text-slate-900">{m.description}</p>
                              {m.autoworxJobId && <p className="text-blue-600 font-mono text-[10px] mt-0.5">AWX JOB: {m.autoworxJobId}</p>}
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-slate-800 font-medium uppercase tracking-wider">{m.category || "Maintenance"}</p>
                              <p className={`font-bold text-[10px] mt-0.5 ${m.autoworxJobId ? 'text-blue-700' : 'text-emerald-700'}`}>
                                {m.autoworxJobId ? "AUTOWORX SYNC" : "MANUAL LOG"}
                              </p>
                            </td>
                            <td className="px-5 py-4 text-right font-black text-rose-600">
                              ₱{Number(m.cost || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </td>
                          </tr>
                        ))}
                        {(!selectedTruck.maintenanceRecords || selectedTruck.maintenanceRecords.length === 0) && (
                          <tr>
                            <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                              No maintenance records found for this truck.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                        <tr>
                          <td colSpan={3} className="px-5 py-4 text-right text-slate-500 text-xs uppercase tracking-wider">Total Maintenance Expenses</td>
                          <td className="px-5 py-4 text-right text-rose-700 text-lg">
                            ₱{selectedTruck.stats.maintenanceExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

            </div>
          </div>
        </div>
      )}

      {/* Autoworx Detailed Floating Inspector Modal */}
      <TripInspectorModal
        trip={inspectingTrip}
        onClose={() => setInspectingTrip(null)}
      />

    </div>
  );
}
