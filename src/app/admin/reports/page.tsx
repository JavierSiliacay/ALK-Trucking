"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell
} from "recharts";
import { useTrips, calculateTripTotals, Trip } from "@/lib/trips-store";
import TripInspectorModal from "@/components/trips/TripInspectorModal";
import DigitalPaperForm from "@/components/trips/DigitalPaperForm";
import { X, Truck, Calendar, MapPin, CreditCard, DollarSign } from "lucide-react";

type ReportPeriod = "daily" | "weekly" | "monthly" | "yearly" | "overall" | "custom";
type ViewMode = "detailed" | "summary";

// Standard ALK Trucking Overhead Category Descriptions (Autoworx System Standard)
const OVERHEAD_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "Fuel Costs": "DIESEL DISBURSEMENTS FOR FLEET TRUCKS",
  "Driver Wages": "DRIVER RATE",
  "Helper Wages": "HELPER 1, HELPER 2, AND STRIPPER RATES",
  "Maintenance": "TRUCK REPAIRS AND MAINTENANCE",
  "Other / Misc": "ALLOWANCES, CHARGE, STICKER, SOP, TOLLS & MISCELLANEOUS"
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function ReportsPage() {
  const { completedTrips, activeTrips, trips, isLoaded } = useTrips();
  const [filterPeriod, setFilterPeriod] = useState<ReportPeriod>("monthly");
  const [viewMode, setViewMode] = useState<ViewMode>("detailed");
  
  // Clean Date Selector States
  const [selectedDay, setSelectedDay] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  const [inspectingTrip, setInspectingTrip] = useState<Trip | null>(null);
  const [viewingPaperTrip, setViewingPaperTrip] = useState<Trip | null>(null);
  const [selectedOverheadCategory, setSelectedOverheadCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<"all" | "fuel" | "allowances" | "tolls_repairs">("all");
  const [showFinancials, setShowFinancials] = useState<boolean>(true);
  // Stable Audit Number to prevent SSR hydration mismatch
  const auditNo = "AUD-600383";

  // Available Years
  const availableYears = [2024, 2025, 2026, 2027];

  const getFilteredTrips = (): Trip[] => {
    const tokens = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);

    return trips.filter((t) => {
      // Trip Status Filter
      if (statusFilter !== "all" && t.status?.toLowerCase() !== statusFilter) {
        return false;
      }

      // Interactive Metric Card Quick Category Filter
      if (selectedCategoryFilter === "fuel") {
        const hasFuel = t.expenses.some((e) => {
          const c = (e.category || "").toUpperCase();
          return c === "DIESEL" || c.includes("FUEL");
        });
        if (!hasFuel) return false;
      } else if (selectedCategoryFilter === "allowances") {
        const hasAllowance = t.expenses.some((e) => {
          const c = (e.category || "").toUpperCase();
          return c === "DRIVER RATE" || c === "HELPER 1 RATE" || c === "HELPER 2 RATE" || c === "STRIPPER" || c.includes("ALLOWANCE") || c.includes("DRIVER") || c.includes("HELPER");
        });
        if (!hasAllowance) return false;
      } else if (selectedCategoryFilter === "tolls_repairs") {
        const hasTollsRepairs = t.expenses.some((e) => {
          const c = (e.category || "").toUpperCase();
          return c === "MAINTENANCE" || c === "CHARGE" || c === "STICKER" || c === "SOP" || c.includes("TOLL") || c.includes("REPAIR") || c.includes("MISC");
        });
        if (!hasTollsRepairs) return false;
      }
      if (tokens.length > 0) {
        const searchableBlob = [
          t.id,
          t.seqNo || "",
          t.unit || "",
          t.plateNo || "",
          t.driver || "",
          t.helper1 || "",
          t.helper2 || "",
          t.customerName || "",
          t.origin || "",
          t.destination || "",
          t.gatePassNo || "",
          t.status || "",
          `₱${Number(t.rate || 0).toLocaleString()}`,
          t.expenses.map((e) => `${e.category} ${e.description} ${e.remarks} ₱${e.amount}`).join(" ")
        ].join(" ").toLowerCase();

        const matchesTokens = tokens.every((token) => searchableBlob.includes(token));
        if (!matchesTokens) return false;
      }

      const tripDateStr = t.completedAt ? t.completedAt.split("T")[0] : t.dateOfTravel;
      const tripDate = new Date(tripDateStr);

      if (filterPeriod === "daily") {
        return tripDateStr === selectedDay;
      }
      if (filterPeriod === "monthly") {
        return tripDate.getMonth() === selectedMonth && tripDate.getFullYear() === selectedYear;
      }
      if (filterPeriod === "yearly") {
        return tripDate.getFullYear() === selectedYear;
      }
      if (filterPeriod === "overall") {
        return true; // All trips in system
      }
      if (filterPeriod === "custom") {
        if (!customStartDate || !customEndDate) return true;
        return tripDateStr >= customStartDate && tripDateStr <= customEndDate;
      }
      return true;
    });
  };

  const reportTrips = getFilteredTrips();

  // Helper to extract itemized expense breakdown for each trip row
  const getTripExpenseBreakdown = (t: Trip) => {
    let fuel = 0;
    let driverWages = 0;
    let helperWages = 0;
    let maintenance = 0;
    let misc = 0;

    t.expenses.forEach((e) => {
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

    const total = fuel + driverWages + helperWages + maintenance + misc;
    return { fuel, driverWages, helperWages, maintenance, misc, total };
  };

  // Grand Totals across all report trips
  const totals = reportTrips.reduce(
    (acc, t) => {
      const b = getTripExpenseBreakdown(t);
      const revenue = Number(t.rate) || 0;
      acc.fuel += b.fuel;
      acc.driverWages += b.driverWages;
      acc.helperWages += b.helperWages;
      acc.maintenance += b.maintenance;
      acc.misc += b.misc;
      acc.total += b.total;
      acc.revenue += revenue;
      acc.profit += (revenue - b.total);
      return acc;
    },
    { fuel: 0, driverWages: 0, helperWages: 0, maintenance: 0, misc: 0, total: 0, revenue: 0, profit: 0 }
  );

  // Overhead Category Summary Computations (Autoworx System Style)
  const overheadCategorySummaries = useMemo(() => {
    const categories = [
      { name: "Fuel Costs", amount: totals.fuel, desc: OVERHEAD_CATEGORY_DESCRIPTIONS["Fuel Costs"] },
      { name: "Driver Wages", amount: totals.driverWages, desc: OVERHEAD_CATEGORY_DESCRIPTIONS["Driver Wages"] },
      { name: "Helper Wages", amount: totals.helperWages, desc: OVERHEAD_CATEGORY_DESCRIPTIONS["Helper Wages"] },
      { name: "Maintenance", amount: totals.maintenance, desc: OVERHEAD_CATEGORY_DESCRIPTIONS["Maintenance"] },
      { name: "Other / Misc", amount: totals.misc, desc: OVERHEAD_CATEGORY_DESCRIPTIONS["Other / Misc"] },
    ];

    return categories.map((cat) => ({
      ...cat,
      percentShare: totals.total > 0 ? ((cat.amount / totals.total) * 100).toFixed(1) : "0.0",
    }));
  }, [totals]);

  // Extract all trips & items under a specific selected overhead category
  const selectedCategoryTrips = useMemo(() => {
    if (!selectedOverheadCategory) return [];

    const categoryKey = selectedOverheadCategory.toLowerCase();
    const result: Array<{
      trip: Trip;
      categoryName: string;
      itemDescription: string;
      amount: number;
    }> = [];

    reportTrips.forEach((t) => {
      t.expenses.forEach((e) => {
        const cName = (e.category || "").toLowerCase();
        let matches = false;

        const catStr = (e.category || "").toUpperCase();
        let isMatch = false;

        if (categoryKey.includes("fuel")) {
          isMatch = catStr === "DIESEL" || catStr.includes("FUEL");
        } else if (categoryKey.includes("driver")) {
          isMatch = catStr === "DRIVER RATE" || catStr.includes("DRIVER");
        } else if (categoryKey.includes("helper")) {
          isMatch = catStr === "HELPER 1 RATE" || catStr === "HELPER 2 RATE" || catStr === "STRIPPER" || catStr.includes("HELPER");
        } else if (categoryKey.includes("maintenance")) {
          isMatch = catStr === "MAINTENANCE" || catStr.includes("REPAIR");
        } else if (categoryKey.includes("misc") || categoryKey.includes("other")) {
          // Everything else
          isMatch = !(
            catStr === "DIESEL" || catStr.includes("FUEL") ||
            catStr === "DRIVER RATE" || catStr.includes("DRIVER") ||
            catStr === "HELPER 1 RATE" || catStr === "HELPER 2 RATE" || catStr === "STRIPPER" || catStr.includes("HELPER") ||
            catStr === "MAINTENANCE" || catStr.includes("REPAIR")
          );
        }

        if (isMatch) {
          result.push({
            trip: t,
            categoryName: e.category,
            itemDescription: e.description || "Operational disbursement",
            amount: Number(e.amount) || 0,
          });
        }
      });
    });

    return result;
  }, [reportTrips, selectedOverheadCategory]);

  const selectedCategoryTotal = useMemo(() => {
    return selectedCategoryTrips.reduce((acc, curr) => acc + curr.amount, 0);
  }, [selectedCategoryTrips]);

  // Category Pie Chart Data
  const pieChartData = overheadCategorySummaries.filter((d) => d.amount > 0).map((d) => ({ name: d.name, value: d.amount }));
  const COLORS = ["#00193c", "#002d62", "#10b981", "#f59e0b", "#ba1a1a", "#8b5cf6"];

  const monthlyTrendData = [
    { month: "Jan", cost: 120000 },
    { month: "Feb", cost: 138000 },
    { month: "Mar", cost: 125000 },
    { month: "Apr", cost: 155000 },
    { month: "May", cost: 148000 },
    { month: "Jun", cost: 170000 },
    { month: "Jul", cost: 162000 },
    { month: "Aug", cost: totals.total },
  ];

  // Professional CSV Export identical to Autoworx System
  const handleExportCSV = () => {
    if (reportTrips.length === 0) {
      alert("No trip expense records available to export.");
      return;
    }
    const headers = [
      "DATE REQ.",
      "TRIP #",
      "EXPENSE DESCRIPTION / ITEMS",
      "VEHICLE DETAILS",
      "DRIVER & CREW",
      "CUSTOMER",
      "ROUTE",
      "STATUS",
      "FUEL COSTS (PHP)",
      "DRIVER WAGES (PHP)",
      "HELPER WAGES (PHP)",
      "MAINTENANCE (PHP)",
      "OTHER / MISC (PHP)",
      ...(showFinancials ? ["TRIP REVENUE (PHP)"] : []),
      "TOTAL DISBURSED (PHP)",
      ...(showFinancials ? ["NET PROFIT (PHP)"] : [])
    ];

    const rows = reportTrips.map((t) => {
      const b = getTripExpenseBreakdown(t);
      const compDate = t.completedAt ? new Date(t.completedAt).toLocaleDateString() : t.dateOfTravel;
      const expenseDesc = t.expenses.map((e) => `${e.category}: ₱${e.amount}`).join(" | ");
      const revenue = Number(t.rate) || 0;
      return [
        `"${compDate}"`,
        `"${t.seqNo || t.id}"`,
        `"${expenseDesc}"`,
        `"${t.unit} (${t.plateNo})"`,
        `"${t.driver}"`,
        `"${t.customerName}"`,
        `"${t.origin || "CDO"} → ${t.destination}"`,
        `"${t.status}"`,
        b.fuel,
        b.driverWages,
        b.helperWages,
        b.maintenance,
        b.misc,
        ...(showFinancials ? [revenue] : []),
        b.total,
        ...(showFinancials ? [revenue - b.total] : [])
      ].join(",");
    });

    const summaryRow = [
      '"GRAND TOTALS"',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      totals.fuel,
      totals.driverWages,
      totals.helperWages,
      totals.maintenance,
      totals.misc,
      ...(showFinancials ? [totals.revenue] : []),
      totals.total,
      ...(showFinancials ? [totals.profit] : [])
    ].join(",");

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows, summaryRow].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ALK_Trucking_${filterPeriod.toUpperCase()}_Expenses_${viewMode.toUpperCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPeriodTitle = () => {
    const viewLabel = viewMode === "detailed" ? "DETAILED AUDIT LOG" : "OVERHEAD CATEGORY SUMMARY";
    if (filterPeriod === "daily") return `DAILY FLEET EXPENSES (${selectedDay}) (${viewLabel})`;
    if (filterPeriod === "monthly") return `MONTHLY FLEET EXPENSES (${MONTH_NAMES[selectedMonth].toUpperCase()} ${selectedYear}) (${viewLabel})`;
    if (filterPeriod === "yearly") return `ANNUAL FLEET EXPENSES (${selectedYear}) (${viewLabel})`;
    if (filterPeriod === "overall") return `OVERALL FLEET EXPENSES (${viewLabel})`;
    return `CUSTOM PERIOD FLEET EXPENSES (${viewLabel})`;
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1440px] mx-auto w-full space-y-6 bg-white">
      
      {/* Ink-Saving Print PDF Media Styles (Pure White Bond Paper & No Heavy Dark Banners) */}
      <style jsx global>{`
        @media print {
          @page {
            size: 8.5in 13in portrait;
            margin: 8mm 10mm 8mm 10mm;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-size: 9.5px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .overflow-x-auto {
            overflow: visible !important;
          }
          aside, header, nav, .no-print, [class*="Header"], [class*="Sidebar"] {
            display: none !important;
          }
          main {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            background-color: #ffffff !important;
          }
          .autoworx-grid {
            border: 1.5px solid #000000 !important;
            border-collapse: collapse !important;
            width: 100% !important;
            background-color: #ffffff !important;
          }
          .autoworx-grid th {
            border: 1px solid #000000 !important;
            background-color: #f1f5f9 !important;
            color: #000000 !important;
            padding: 5px 6px !important;
            font-size: 9.5px !important;
            font-weight: 800 !important;
          }
          .autoworx-grid td {
            border: 1px solid #000000 !important;
            padding: 5px 6px !important;
            font-size: 9.5px !important;
            background-color: #ffffff !important;
          }
          .ink-save-bar {
            background-color: #ffffff !important;
            color: #000000 !important;
            border: 2px solid #000000 !important;
          }
        }
      `}</style>

      {/* Screen Header & Primary Action (NO-PRINT) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#c4c6d1] pb-4 no-print">
        <div className="flex items-center gap-3">
          <img src="/alk_logo.jpg" alt="ALK Trucking Logo" className="h-12 w-auto object-contain rounded-lg shadow-xs" />
          <div>
            <h2 className="font-extrabold text-xl text-[#00193c] font-manrope">Sales & Expenses Monitoring</h2>
            <p className="text-[#43474f] text-xs mt-0.5">Streamlined Date Filter & Pure White Bond Paper Statement (8.5 x 13 in).</p>
          </div>
        </div>

        {/* Print Button */}
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-6 py-2.5 bg-[#00193c] hover:bg-blue-900 text-white rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer shrink-0 hover:scale-[1.01] active:scale-95"
          title="Print Expense Statement on Long Bond Paper (8.5 x 13 in)"
        >
          <span className="material-symbols-outlined text-[18px]">print</span>
          <span>Print PDF (8.5x13 in)</span>
        </button>
      </div>

      {/* DEDICATED TABLE CONTROL TOOLBAR (HIGH-VISIBILITY SEARCH, FILTERS & TABS) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 bg-slate-50 p-3 rounded-2xl border border-slate-200 shadow-2xs no-print">
        
        {/* Prominent High-Visibility Search Bar (Primary Staff Focal Point) */}
        <div className="relative w-full lg:w-[400px] shrink-0">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search PR #, Driver, Truck, Item..."
            className="w-full pl-10 pr-9 py-2.5 bg-white border-2 border-slate-300 focus:border-[#00193c] rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#00193c]/20 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters and Tabs */}
        <div className="flex flex-wrap items-center gap-2.5 justify-end w-full lg:w-auto">
          
          {/* Show Financials Toggle */}
          <label className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-2xs cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={showFinancials}
              onChange={(e) => setShowFinancials(e.target.checked)}
              className="w-4 h-4 text-[#00193c] rounded focus:ring-[#00193c]"
            />
            <span className="text-xs font-bold text-[#00193c]">Show Revenue & Profit</span>
          </label>

          {/* Trip Status Filter */}
          <div className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-xl border border-slate-300 shadow-2xs">
            <span className="material-symbols-outlined text-slate-500 text-[18px] ml-1">local_shipping</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "completed")}
              className="px-1 border-none bg-transparent text-xs font-bold text-[#00193c] outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="completed">Completed Only</option>
            </select>
          </div>

          {/* Unified Compact Date Filter Control (1-to-1 Match with User Image) */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-2xs">
            <span className="material-symbols-outlined text-slate-500 text-[18px]">calendar_today</span>
            
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value as ReportPeriod)}
              className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs font-bold text-[#00193c] bg-white outline-none cursor-pointer hover:border-slate-400 focus:ring-2 focus:ring-[#00193c]/20"
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="overall">Overall</option>
              <option value="custom">Custom Range</option>
            </select>

            {filterPeriod === "daily" && (
              <input
                type="date"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs font-bold text-[#00193c] bg-white outline-none cursor-pointer focus:ring-2 focus:ring-[#00193c]/20"
              />
            )}

            {filterPeriod === "monthly" && (
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-[#00193c] bg-white outline-none cursor-pointer"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={m} value={idx}>{m}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-[#00193c] bg-white outline-none cursor-pointer"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}

            {filterPeriod === "yearly" && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs font-bold text-[#00193c] bg-white outline-none cursor-pointer"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}

            {filterPeriod === "overall" && (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                All Records
              </span>
            )}

            {filterPeriod === "custom" && (
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-[#00193c] bg-white"
                />
                <span className="text-xs text-slate-400 font-bold">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-[#00193c] bg-white"
                />
              </div>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex bg-[#e5e8eb] p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode("detailed")}
              className={`px-5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                viewMode === "detailed"
                  ? "bg-white text-[#00193c] shadow-xs"
                  : "text-[#43474f] hover:text-[#00193c]"
              }`}
            >
              Detailed Log
            </button>
            <button
              onClick={() => setViewMode("summary")}
              className={`px-5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                viewMode === "summary"
                  ? "bg-white text-[#00193c] shadow-xs"
                  : "text-[#43474f] hover:text-[#00193c]"
              }`}
            >
              Overhead Summary
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Bento Expense Summary Filter Cards (NO-PRINT) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 no-print">
        <button
          type="button"
          onClick={() => setSelectedCategoryFilter("all")}
          className={`text-left bg-white border p-4.5 rounded-xl flex flex-col justify-between transition-all cursor-pointer card-shadow ${
            selectedCategoryFilter === "all"
              ? "border-[#00193c] ring-2 ring-[#00193c]/30 shadow-md bg-blue-50/20"
              : "border-[#c4c6d1] hover:border-slate-400"
          }`}
          title="Click to show all expense categories"
        >
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-rose-700 text-[20px]">payments</span>
            <span className={`font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-full ${
              selectedCategoryFilter === "all" ? "bg-[#00193c] text-white" : "bg-rose-50 text-rose-700"
            }`}>
              {selectedCategoryFilter === "all" ? "Active Filter" : "All Purchases"}
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[#43474f] font-bold text-xs uppercase tracking-wide">Total Expenses</span>
            <h3 className="font-extrabold text-2xl text-rose-700 mt-0.5 font-mono">₱{totals.total.toLocaleString()}.00</h3>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === "fuel" ? "all" : "fuel")}
          className={`text-left bg-white border p-4.5 rounded-xl flex flex-col justify-between transition-all cursor-pointer card-shadow ${
            selectedCategoryFilter === "fuel"
              ? "border-[#00193c] ring-2 ring-[#00193c]/30 shadow-md bg-blue-50/30"
              : "border-[#c4c6d1] hover:border-slate-400"
          }`}
          title="Click to filter statement to Fuel Costs"
        >
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-[#00193c] text-[20px]">local_gas_station</span>
            <span className={`font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-full ${
              selectedCategoryFilter === "fuel" ? "bg-[#00193c] text-white" : "bg-blue-50 text-blue-900"
            }`}>
              {selectedCategoryFilter === "fuel" ? "Filtered" : "Filter Fuel"}
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[#43474f] font-bold text-xs uppercase tracking-wide">Fuel Costs</span>
            <h3 className="font-extrabold text-2xl text-[#00193c] mt-0.5 font-mono">₱{totals.fuel.toLocaleString()}.00</h3>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === "allowances" ? "all" : "allowances")}
          className={`text-left bg-white border p-4.5 rounded-xl flex flex-col justify-between transition-all cursor-pointer card-shadow ${
            selectedCategoryFilter === "allowances"
              ? "border-amber-600 ring-2 ring-amber-500/30 shadow-md bg-amber-50/30"
              : "border-[#c4c6d1] hover:border-slate-400"
          }`}
          title="Click to filter statement to Driver & Helper Allowances"
        >
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-amber-700 text-[20px]">badge</span>
            <span className={`font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-full ${
              selectedCategoryFilter === "allowances" ? "bg-amber-800 text-white" : "bg-amber-50 text-amber-900"
            }`}>
              {selectedCategoryFilter === "allowances" ? "Filtered" : "Filter Allowances"}
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[#43474f] font-bold text-xs uppercase tracking-wide">Allowances</span>
            <h3 className="font-extrabold text-2xl text-amber-900 mt-0.5 font-mono">
              ₱{(totals.driverWages + totals.helperWages).toLocaleString()}.00
            </h3>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === "tolls_repairs" ? "all" : "tolls_repairs")}
          className={`text-left bg-white border p-4.5 rounded-xl flex flex-col justify-between transition-all cursor-pointer card-shadow ${
            selectedCategoryFilter === "tolls_repairs"
              ? "border-indigo-600 ring-2 ring-indigo-500/30 shadow-md bg-indigo-50/30"
              : "border-[#c4c6d1] hover:border-slate-400"
          }`}
          title="Click to filter statement to Tolls & Repairs"
        >
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-indigo-700 text-[20px]">build</span>
            <span className={`font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-full ${
              selectedCategoryFilter === "tolls_repairs" ? "bg-indigo-900 text-white" : "bg-indigo-50 text-indigo-900"
            }`}>
              {selectedCategoryFilter === "tolls_repairs" ? "Filtered" : "Filter Maint & Misc"}
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[#43474f] font-bold text-xs uppercase tracking-wide">Maintenance & Misc</span>
            <h3 className="font-extrabold text-2xl text-indigo-950 mt-0.5 font-mono">
              ₱{(totals.maintenance + totals.misc).toLocaleString()}.00
            </h3>
          </div>
        </button>
      </div>



      {/* ========================================================================= */}
      {/* PURE WHITE BOND PAPER INK-SAVING PRINT CONTAINER (FOR ALK TRUCKING OWNER) */}
      {/* NO HEAVY DARK BLUE FILLED BANNERS - SAVES PRINTER INK & MATCHES BOND PAPER */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-900 shadow-md p-6 print:p-0 print:border-none print:shadow-none space-y-4 font-sans">
        
        {/* Official Header Letterhead */}
        <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/alk_logo.jpg" alt="ALK Trucking Logo" className="h-16 w-auto object-contain rounded shrink-0 border border-slate-900 p-0.5" />
            <div>
              <h1 className="text-xl font-extrabold uppercase text-slate-900 tracking-wider font-manrope">
                ALK TRUCKING SERVICES
              </h1>
            </div>
          </div>
          <div className="text-right font-mono text-[10px] text-slate-900">
            <p className="font-extrabold text-slate-900 text-xs">AUDIT NO: {auditNo}</p>
            <p className="text-emerald-800 font-extrabold mt-0.5 uppercase">OFFICIAL EXPENSES STATEMENT</p>
          </div>
        </div>

        {/* Ink-Saving Clean White Title Banner (No Heavy Blue Ink Fill) */}
        <div className="ink-save-bar bg-white text-slate-900 px-4 py-2 text-center border-2 border-slate-900 rounded font-manrope font-extrabold uppercase tracking-wider text-sm sm:text-base">
          {getPeriodTitle()}
        </div>

        {/* Ink-Saving Info Section Grid Box */}
        <div className="border-2 border-slate-900 rounded overflow-hidden">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <tbody>
              <tr className="border-b border-slate-900">
                <td className="bg-slate-100 font-bold p-2 w-[20%] border-r border-slate-900 text-slate-900">STATEMENT PERIOD:</td>
                <td className="p-2 font-extrabold text-slate-900 w-[30%] border-r border-slate-900 uppercase">{filterPeriod} AUDIT ({viewMode.toUpperCase()})</td>
                <td className="bg-slate-100 font-bold p-2 w-[20%] border-r border-slate-900 text-slate-900">DATE GENERATED:</td>
                <td className="p-2 font-extrabold text-slate-900 w-[30%]">{new Date().toLocaleDateString()}</td>
              </tr>
              {showFinancials && (
                <tr className="border-b border-slate-900">
                  <td className="bg-slate-100 font-bold p-2 border-r border-slate-900 text-slate-900">TOTAL TRIP REVENUE:</td>
                  <td className="p-2 font-black text-[#00193c] border-r border-slate-900">₱{totals.revenue.toLocaleString()}.00</td>
                  <td className="bg-slate-100 font-bold p-2 border-r border-slate-900 text-slate-900">NET PROFIT:</td>
                  <td className="p-2 font-black text-emerald-700">₱{totals.profit.toLocaleString()}.00</td>
                </tr>
              )}
              <tr>
                <td className="bg-slate-100 font-bold p-2 border-r border-slate-900 text-slate-900">TOTAL EXPENSES:</td>
                <td className="p-2 font-black text-rose-800 border-r border-slate-900">₱{totals.total.toLocaleString()}.00</td>
                <td className="bg-slate-100 font-bold p-2 border-r border-slate-900 text-slate-900">FUEL SHARE:</td>
                <td className="p-2 font-extrabold text-slate-900">
                  ₱{totals.fuel.toLocaleString()}.00 ({totals.total > 0 ? ((totals.fuel / totals.total) * 100).toFixed(1) : 0}%)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* VIEW MODE 1: DETAILED AUDIT LOG (PURE WHITE BOND PAPER & INK SAVING) */}
        {viewMode === "detailed" && (
          <div className="w-full">
            <table className="autoworx-grid w-full text-left border-collapse text-[10.5px] table-fixed border-2 border-slate-900 bg-white">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[9.5px] tracking-tight border-b-2 border-slate-900">
                  <th className={`p-2 border border-slate-900 ${showFinancials ? 'w-[8%]' : 'w-[10%]'}`}>DATE REQ.</th>
                  <th className={`p-2 border border-slate-900 ${showFinancials ? 'w-[9%]' : 'w-[10%]'}`}>TRIP #</th>
                  <th className={`p-2 border border-slate-900 ${showFinancials ? 'w-[20%]' : 'w-[26%]'}`}>EXPENSE DESCRIPTION / ITEMS</th>
                  <th className={`p-2 border border-slate-900 ${showFinancials ? 'w-[12%]' : 'w-[16%]'}`}>VEHICLE DETAILS</th>
                  <th className={`p-2 border border-slate-900 ${showFinancials ? 'w-[12%]' : 'w-[14%]'}`}>CUSTOMER & ROUTE</th>
                  <th className={`p-2 border border-slate-900 ${showFinancials ? 'w-[12%]' : 'w-[12%]'} text-center`}>STATUS</th>
                  {showFinancials && (
                    <th className="p-2 border border-slate-900 w-[9%] text-right font-black text-[#00193c]">TRIP REVENUE</th>
                  )}
                  <th className={`p-2 border border-slate-900 ${showFinancials ? 'w-[9%]' : 'w-[12%]'} text-right font-black text-rose-800`}>EXPENSES</th>
                  {showFinancials && (
                    <th className="p-2 border border-slate-900 w-[9%] text-right font-black text-emerald-700">PROFIT</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 font-sans">
                {reportTrips.map((t) => {
                  const b = getTripExpenseBreakdown(t);
                  const compDate = t.completedAt ? new Date(t.completedAt).toLocaleDateString() : t.dateOfTravel;
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setViewingPaperTrip(t)}
                      className="bg-white leading-tight hover:bg-slate-100 cursor-pointer transition-colors group"
                      title="Click to view Monitoring Form (Travel & Expense)"
                    >
                      <td className="p-2 border border-slate-900 font-semibold text-slate-900 whitespace-nowrap">
                        {compDate}
                      </td>
                      <td className="p-2 border border-slate-900">
                        <span className="font-mono font-extrabold text-slate-900 text-xs block group-hover:underline">{t.seqNo || t.id}</span>
                        <span className="text-[9px] text-slate-700 font-bold uppercase">PR RECORD</span>
                      </td>
                      <td className="p-2 border border-slate-900">
                        <div className="space-y-1">
                          {t.expenses.map((e, eIdx) => (
                            <div key={eIdx} className="flex items-center justify-between border-b border-slate-200 last:border-0 pb-0.5">
                              <span className="font-semibold text-slate-900 text-[10px] truncate max-w-[170px]">
                                {e.category}: <span className="font-normal text-slate-700">{e.description || "Disbursement"}</span>
                              </span>
                              <span className="font-mono text-[9.5px] font-bold text-slate-900 bg-slate-50 px-1 py-0.2 rounded border border-slate-300">
                                ₱{Number(e.amount || 0).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-2 border border-slate-900">
                        <p className="font-bold text-slate-900 truncate">{t.unit}</p>
                        <p className="text-slate-800 font-mono font-bold text-[10px]">{t.plateNo}</p>
                        <p className="text-slate-600 italic text-[9.5px] truncate">Driver: {t.driver}</p>
                      </td>
                      <td className="p-2 border border-slate-900">
                        <p className="font-bold text-slate-900 truncate">{t.customerName}</p>
                        <p className="text-slate-700 text-[9.5px] font-semibold">{t.origin || "CDO"} → {t.destination}</p>
                      </td>
                      <td className="p-2 border border-slate-900 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-bold uppercase border ${
                          t.status === "Active"
                            ? "bg-amber-50 text-amber-900 border-amber-400"
                            : "bg-emerald-50 text-emerald-900 border-emerald-400"
                        }`}>
                          {t.status === "Completed" ? "Completed" : "Active"}
                        </span>
                      </td>
                      {showFinancials && (
                        <td className="p-2 border border-slate-900 text-right font-mono font-extrabold text-[#00193c] text-xs whitespace-nowrap">
                          ₱{Number(t.rate || 0).toLocaleString()}.00
                        </td>
                      )}
                      <td className="p-2 border border-slate-900 text-right font-mono font-extrabold text-rose-700 text-xs whitespace-nowrap">
                        ₱{b.total.toLocaleString()}.00
                      </td>
                      {showFinancials && (
                        <td className="p-2 border border-slate-900 text-right font-mono font-extrabold text-emerald-600 text-xs whitespace-nowrap">
                          ₱{(Number(t.rate || 0) - b.total).toLocaleString()}.00
                        </td>
                      )}
                    </tr>
                  );
                })}
                {reportTrips.length > 0 && (
                  <tr className="bg-slate-100 text-slate-900 font-extrabold text-[11px] border-t-2 border-slate-900">
                    <td colSpan={6} className="p-2.5 border border-slate-900 text-right uppercase tracking-wider font-sans">
                      GRAND TOTALS:
                    </td>
                    {showFinancials && (
                      <td className="p-2.5 border border-slate-900 text-right text-[#00193c] font-mono font-black text-xs">
                        ₱{totals.revenue.toLocaleString()}.00
                      </td>
                    )}
                    <td className="p-2.5 border border-slate-900 text-right text-rose-800 font-mono font-black text-xs">
                      ₱{totals.total.toLocaleString()}.00
                    </td>
                    {showFinancials && (
                      <td className="p-2.5 border border-slate-900 text-right text-emerald-700 font-mono font-black text-xs">
                        ₱{totals.profit.toLocaleString()}.00
                      </td>
                    )}
                  </tr>
                )}
                {reportTrips.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center border border-slate-900 bg-slate-50">
                      <div className="max-w-md mx-auto space-y-2">
                        <span className="material-symbols-outlined text-slate-400 text-[36px]">find_in_page</span>
                        <h4 className="font-extrabold text-slate-900 text-sm font-manrope">No Purchasing Records Found</h4>
                        <p className="text-xs text-slate-600 font-sans">
                          No expense disbursements match your current search query {searchQuery && <strong>"{searchQuery}"</strong>} or selected category filter.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedCategoryFilter("all");
                            setFilterPeriod("monthly");
                          }}
                          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-[#00193c] hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all no-print"
                        >
                          <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                          <span>Reset Search & Filters</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW MODE 2: OVERHEAD CATEGORY SUMMARY (AUTOWORX INTERACTIVE ROW SELECTION) */}
        {viewMode === "summary" && (
          <div className="w-full">
            <table className="autoworx-grid w-full text-left border-collapse text-xs table-fixed border-2 border-slate-900 bg-white">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] tracking-tight border-b-2 border-slate-900">
                  <th className="p-2.5 border border-slate-900 w-[24%]">OVERHEAD EXPENSE CATEGORY</th>
                  <th className="p-2.5 border border-slate-900 w-[42%]">DESCRIPTION & OPERATIONAL AUDIT SCOPE</th>
                  <th className="p-2.5 border border-slate-900 w-[14%] text-center">% SHARE</th>
                  <th className="p-2.5 border border-slate-900 w-[20%] text-right font-black">SUBTOTAL DISBURSED (₱)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 font-sans">
                {overheadCategorySummaries.map((cat) => (
                  <tr
                    key={cat.name}
                    onClick={() => setSelectedOverheadCategory(cat.name)}
                    className="bg-white hover:bg-blue-100/70 cursor-pointer transition-colors group"
                    title={`Click to inspect detailed breakdown of all trips for ${cat.name}`}
                  >
                    <td className="p-2.5 border border-slate-900 font-extrabold text-[#00193c] group-hover:underline flex items-center justify-between">
                      <span>{cat.name}</span>
                      <span className="material-symbols-outlined text-[16px] text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity">visibility</span>
                    </td>
                    <td className="p-2.5 border border-slate-900 text-slate-800 font-mono text-[10.5px]">
                      {cat.desc}
                    </td>
                    <td className="p-2.5 border border-slate-900 text-center font-mono font-bold text-slate-900">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 rounded-full text-[10px] font-bold">
                        {cat.percentShare}%
                      </span>
                    </td>
                    <td className="p-2.5 border border-slate-900 text-right font-mono font-extrabold text-slate-900 text-xs whitespace-nowrap">
                      ₱{cat.amount.toLocaleString()}.00
                    </td>
                  </tr>
                ))}

                {/* OVERHEAD SUMMARY GRAND TOTAL ROW */}
                <tr className="bg-slate-100 text-slate-900 font-extrabold text-xs border-t-2 border-slate-900">
                  <td colSpan={2} className="p-3 border border-slate-900 uppercase tracking-wider">
                    TOTAL OVERHEAD DISBURSEMENTS (ALL CATEGORIES):
                  </td>
                  <td className="p-3 border border-slate-900 text-center font-mono text-slate-900 font-black">
                    100.0%
                  </td>
                  <td className="p-3 border border-slate-900 text-right font-mono font-black text-sm text-slate-900">
                    ₱{totals.total.toLocaleString()}.00
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Prepared By Office Staff Sign-Off Footer */}
        <div className="pt-5 border-t-2 border-slate-900 flex justify-start mt-4">
          <div className="w-64 mt-12">
            <div className="border-t-2 border-slate-900 print-border-black pt-1.5 text-center">
              <p className="text-[#334155] font-extrabold text-[11px] uppercase tracking-wider">
                PREPARED BY: VIRGIE AGBONG
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Autoworx Detailed Floating Trip Inspector Modal */}
      <TripInspectorModal
        trip={inspectingTrip}
        onClose={() => setInspectingTrip(null)}
        onPrint={(t) => {
          setInspectingTrip(null);
          setViewingPaperTrip(t);
        }}
      />

      {/* Modal View Digital Form */}
      {viewingPaperTrip && (
        <div
          onClick={() => setViewingPaperTrip(null)}
          className="fixed inset-0 z-[140] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto cursor-pointer print:p-0 print:bg-white print:static print:overflow-visible print:block no-print"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[95vh] overflow-y-auto print:max-h-none print:overflow-visible print:w-full print:max-w-none cursor-default"
          >
            <DigitalPaperForm trip={viewingPaperTrip} onClose={() => setViewingPaperTrip(null)} />
          </div>
        </div>
      )}

      {/* Autoworx Overhead Category Floating Detail Modal */}
      {selectedOverheadCategory && (
        <div
          onClick={() => setSelectedOverheadCategory(null)}
          className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default"
          >
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#00193c] text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-extrabold uppercase rounded">
                    Overhead Audit
                  </span>
                  <h3 className="text-base font-extrabold font-manrope">
                    Category Inspector: {selectedOverheadCategory}
                  </h3>
                </div>
                <p className="text-xs text-blue-200 mt-0.5">
                  Breakdown of all trip disbursements under {selectedOverheadCategory} for selected period
                </p>
              </div>
              <button
                onClick={() => setSelectedOverheadCategory(null)}
                type="button"
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Summary Metric Cards */}
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-300 p-3 rounded-lg">
                  <span className="text-[10px] font-extrabold text-slate-600 uppercase block tracking-wider">Overhead Category</span>
                  <span className="text-sm font-black text-[#00193c] mt-0.5 block">{selectedOverheadCategory}</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <span className="text-[10px] font-extrabold text-blue-900 uppercase block tracking-wider">Disbursement Count</span>
                  <span className="text-sm font-black text-blue-900 mt-0.5 block">{selectedCategoryTrips.length} Record Items</span>
                </div>
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg">
                  <span className="text-[10px] font-extrabold text-rose-900 uppercase block tracking-wider">Subtotal Disbursed</span>
                  <span className="text-base font-black text-rose-800 font-mono mt-0.5 block">
                    ₱{selectedCategoryTotal.toLocaleString()}.00
                  </span>
                </div>
              </div>

              {/* Table of Trips under this Category */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs font-sans border-collapse">
                  <thead>
                    <tr className="bg-[#00193c] text-white font-extrabold uppercase text-[10px]">
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Trip #</th>
                      <th className="p-2.5">Vehicle Details</th>
                      <th className="p-2.5">Driver</th>
                      <th className="p-2.5">Customer & Route</th>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5 text-right font-black">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-sans text-[11px]">
                    {selectedCategoryTrips.map((item, idx) => (
                      <tr
                        key={idx}
                        onClick={() => {
                          setSelectedOverheadCategory(null);
                          setViewingPaperTrip(item.trip);
                        }}
                        className="hover:bg-blue-50/70 cursor-pointer transition-colors group"
                        title="Click to view Monitoring Form (Travel & Expense)"
                      >
                        <td className="p-2.5 text-slate-800 whitespace-nowrap font-medium">
                          {item.trip.completedAt ? new Date(item.trip.completedAt).toLocaleDateString() : item.trip.dateOfTravel}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-[#00193c] group-hover:underline">
                          {item.trip.seqNo || item.trip.id}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900">
                          {item.trip.unit} <span className="font-mono text-slate-500 font-normal">({item.trip.plateNo})</span>
                        </td>
                        <td className="p-2.5 text-slate-800 font-medium">{item.trip.driver}</td>
                        <td className="p-2.5 text-slate-800">
                          <p className="font-bold">{item.trip.customerName}</p>
                          <p className="text-[10px] text-slate-500">{item.trip.origin || "CDO"} → {item.trip.destination}</p>
                        </td>
                        <td className="p-2.5 text-slate-700">
                          <span className="font-semibold text-slate-900">{item.categoryName}: </span>
                          <span>{item.itemDescription}</span>
                        </td>
                        <td className="p-2.5 text-right font-mono font-extrabold text-rose-800 text-xs">
                          ₱{item.amount.toLocaleString()}.00
                        </td>
                      </tr>
                    ))}
                    {selectedCategoryTrips.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                          No disbursements recorded under {selectedOverheadCategory} for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 italic">
                Tip: Click any trip row in this table to open the full Trip Record Inspector.
              </span>
              <button
                onClick={() => setSelectedOverheadCategory(null)}
                className="px-4 py-1.5 bg-[#00193c] hover:bg-blue-900 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close Category Inspector
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
