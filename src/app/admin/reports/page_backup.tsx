"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell
} from "recharts";
import { useTrips, calculateTripTotals, Trip } from "@/lib/trips-store";
import TripInspectorModal from "@/components/trips/TripInspectorModal";
import DigitalPaperForm from "@/components/trips/DigitalPaperForm";
import { X, Truck, Calendar, MapPin, CreditCard, DollarSign, PackageOpen } from "lucide-react";
import { getAllStockOuts } from "@/actions/inventory";
import { getMaintenanceRecords } from "@/actions/maintenance";

type ReportPeriod = "daily" | "weekly" | "monthly" | "yearly" | "overall" | "custom";
type ViewMode = "detailed" | "summary";

// Standard ALK Trucking Overhead Category Descriptions (Autoworx System Standard)
const OVERHEAD_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "Fuel Costs": "DIESEL DISBURSEMENTS FOR FLEET TRUCKS",
  "Driver Wages": "DRIVER RATE",
  "Helper Wages": "HELPER 1, HELPER 2, AND STRIPPER RATES",
  "Maintenance": "TRUCK REPAIRS AND MAINTENANCE",
  "Inventory Supply": "WAREHOUSE / INVENTORY STOCK-OUTS",
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
  const [showFinancials, setShowFinancials] = useState<boolean>(true);
  const [stockOuts, setStockOuts] = useState<any[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>([]);

  // Stable Audit Number to prevent SSR hydration mismatch
  const auditNo = "AUD-600383";

  // Available Years
  const availableYears = [2024, 2025, 2026, 2027];

  React.useEffect(() => {
    getAllStockOuts().then(data => setStockOuts(data));
    getMaintenanceRecords().then(data => setMaintenanceRecords(data.filter((r: any) => r.status === "Completed")));
  }, []);

  const getFilteredTrips = (): Trip[] => {
    const tokens = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);

    return trips.filter((t) => {
      // Trip Status Filter
      if (statusFilter !== "all" && t.status?.toLowerCase() !== statusFilter) {
        return false;
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
          `₱${Number(t.rate || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`,
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

  const getFilteredStockOuts = () => {
    return stockOuts.filter(tx => {
      const txDateStr = new Date(tx.createdAt).toISOString().split("T")[0];
      const txDate = new Date(tx.createdAt);

      if (filterPeriod === "daily") {
        return txDateStr === selectedDay;
      }
      if (filterPeriod === "monthly") {
        return txDate.getMonth() === selectedMonth && txDate.getFullYear() === selectedYear;
      }
      if (filterPeriod === "yearly") {
        return txDate.getFullYear() === selectedYear;
      }
      if (filterPeriod === "overall") {
        return true; 
      }
      if (filterPeriod === "custom") {
        if (!customStartDate || !customEndDate) return true;
        return txDateStr >= customStartDate && txDateStr <= customEndDate;
      }
      return true;
    });
  };

  const reportStockOuts = getFilteredStockOuts();

  const getFilteredMaintenanceRecords = () => {
    return maintenanceRecords.filter(m => {
      const mDateStr = new Date(m.dateIncurred || m.createdAt).toISOString().split("T")[0];
      const mDate = new Date(m.dateIncurred || m.createdAt);

      if (filterPeriod === "daily") {
        return mDateStr === selectedDay;
      }
      if (filterPeriod === "monthly") {
        return mDate.getMonth() === selectedMonth && mDate.getFullYear() === selectedYear;
      }
      if (filterPeriod === "yearly") {
        return mDate.getFullYear() === selectedYear;
      }
      if (filterPeriod === "overall") {
        return true; 
      }
      if (filterPeriod === "custom") {
        if (!customStartDate || !customEndDate) return true;
        return mDateStr >= customStartDate && mDateStr <= customEndDate;
      }
      return true;
    });
  };

  const reportMaintenanceRecords = getFilteredMaintenanceRecords();

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
      return acc;
    },
    { fuel: 0, driverWages: 0, helperWages: 0, maintenance: 0, misc: 0, total: 0, revenue: 0, profit: 0, inventorySupply: 0 }
  );

  const inventoryTotalCost = reportStockOuts.reduce((sum, tx) => sum + Number(tx.totalCost), 0);
  const manualMaintenanceTotalCost = reportMaintenanceRecords.reduce((sum, m) => sum + Number(m.cost), 0);
  
  totals.inventorySupply = inventoryTotalCost;
  totals.maintenance += manualMaintenanceTotalCost;
  totals.total += inventoryTotalCost + manualMaintenanceTotalCost;
  totals.profit = totals.revenue - totals.total;

  // Overhead Category Summary Computations (Autoworx System Style)
  const overheadCategorySummaries = useMemo(() => {
    const categories = [
      { name: "Fuel Costs", amount: totals.fuel, desc: OVERHEAD_CATEGORY_DESCRIPTIONS["Fuel Costs"] },
      { name: "Driver Wages", amount: totals.driverWages, desc: OVERHEAD_CATEGORY_DESCRIPTIONS["Driver Wages"] },
      { name: "Helper Wages", amount: totals.helperWages, desc: OVERHEAD_CATEGORY_DESCRIPTIONS["Helper Wages"] },
      { name: "Maintenance", amount: totals.maintenance, desc: OVERHEAD_CATEGORY_DESCRIPTIONS["Maintenance"] },
      { name: "Inventory Supply", amount: totals.inventorySupply, desc: OVERHEAD_CATEGORY_DESCRIPTIONS["Inventory Supply"] },
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
      trip?: Trip;
      inventoryTx?: any;
      maintenanceTx?: any;
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

        if (categoryKey.includes("total") || categoryKey === "total expenses") {
          isMatch = true;
        } else if (categoryKey.includes("fuel")) {
          isMatch = catStr === "DIESEL" || catStr.includes("FUEL");
        } else if (categoryKey.includes("allowance") || categoryKey.includes("wage")) {
          isMatch = catStr === "DRIVER RATE" || catStr.includes("DRIVER") || catStr === "HELPER 1 RATE" || catStr === "HELPER 2 RATE" || catStr === "STRIPPER" || catStr.includes("HELPER");
        } else if (categoryKey.includes("maintenance")) {
          isMatch = catStr === "MAINTENANCE" || catStr.includes("REPAIR") || catStr.includes("PARTS");
        } else if (categoryKey.includes("misc") || categoryKey.includes("other")) {
          isMatch = !(
            catStr === "DIESEL" || catStr.includes("FUEL") ||
            catStr === "DRIVER RATE" || catStr.includes("DRIVER") ||
            catStr === "HELPER 1 RATE" || catStr === "HELPER 2 RATE" || catStr === "STRIPPER" || catStr.includes("HELPER") ||
            catStr === "MAINTENANCE" || catStr.includes("REPAIR") || catStr.includes("PARTS")
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

    // Also include inventory stock-outs if category is Total Expenses or Inventory Supply
    if (categoryKey.includes("total") || categoryKey === "total expenses" || categoryKey === "inventory supply") {
      reportStockOuts.forEach((tx) => {
        result.push({
          inventoryTx: tx,
          categoryName: "Inventory Supply",
          itemDescription: `${tx.quantity} ${tx.item?.unit} ${tx.item?.name} (${tx.remarks || "No remarks"})`,
          amount: Number(tx.totalCost) || 0,
        });
      });
    }

    // Also include manual maintenance records if category is Total Expenses or Maintenance
    if (categoryKey.includes("total") || categoryKey === "total expenses" || categoryKey.includes("maintenance")) {
      reportMaintenanceRecords.forEach((m) => {
        const prefix = m.autoworxJobId ? "Autoworx Repairs" : "Manual Entry";
        result.push({
          maintenanceTx: m,
          categoryName: m.category || "Maintenance",
          itemDescription: `${prefix}: ${m.description} ${m.truck ? `(${m.truck.plateNo})` : ""}`,
          amount: Number(m.cost) || 0,
        });
      });
    }

    return result;
  }, [reportTrips, selectedOverheadCategory, reportStockOuts, reportMaintenanceRecords]);

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
      "SEQUENCE #",
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
      "INVENTORY SUPPLY (PHP)",
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
        0, // Inventory supply is not tied to a single trip row in this structure
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
      totals.inventorySupply,
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
          .overflow-x-auto, .overflow-y-auto {
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
      <div className="flex flex-col gap-3.5 bg-slate-50 p-3 rounded-2xl border border-slate-200 shadow-2xs no-print">

        {/* Top Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 w-full">

          {/* Prominent High-Visibility Search Bar (Primary Staff Focal Point) */}
          <div className="relative w-full lg:w-[500px] shrink-0">
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

        {/* Top Right Controls (Financials Toggle + View Mode Switcher) */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto justify-end">
          
          {/* Show Financials Toggle */}
          <label className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-2xs cursor-pointer hover:bg-slate-50 transition-colors shrink-0">
            <input
              type="checkbox"
              checked={showFinancials}
              onChange={(e) => setShowFinancials(e.target.checked)}
              className="w-4 h-4 text-[#00193c] rounded focus:ring-[#00193c]"
            />
            <span className="text-xs font-bold text-[#00193c]">Show Revenue & Profit</span>
          </label>

          {/* View Mode Switcher */}
          <div className="flex bg-[#e5e8eb] p-1 rounded-xl shrink-0 w-full sm:w-auto justify-center">
            <button
            onClick={() => setViewMode("detailed")}
            className={`px-5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${viewMode === "detailed"
                ? "bg-white text-[#00193c] shadow-xs"
                : "text-[#43474f] hover:text-[#00193c]"
              }`}
          >
            Detailed Log
          </button>
          <button
            onClick={() => setViewMode("summary")}
            className={`px-5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${viewMode === "summary"
                ? "bg-white text-[#00193c] shadow-xs"
                : "text-[#43474f] hover:text-[#00193c]"
              }`}
          >
            Overhead Summary
          </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Filters */}
      <div className="flex flex-wrap items-center gap-2.5 w-full bg-slate-200/50 p-2.5 rounded-xl border border-slate-200">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider ml-1 mr-2 hidden sm:block">Filters</span>

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


        </div>
      </div>

      {/* Bento Expense Summary Cards (NO-PRINT) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 no-print">
        <div 
          onClick={() => setSelectedOverheadCategory("Total Expenses")}
          className="bg-white border border-[#c4c6d1] p-4.5 rounded-xl flex flex-col justify-between card-shadow cursor-pointer hover:bg-slate-50 transition-colors group"
        >
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-rose-700 text-[20px] group-hover:scale-110 transition-transform">payments</span>
          </div>
          <div className="mt-3">
            <span className="text-[#43474f] font-bold text-xs uppercase tracking-wide group-hover:text-[#00193c] transition-colors">Total Expenses</span>
            <h3 className="font-extrabold text-2xl text-rose-700 mt-0.5 font-mono">₱{totals.total.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</h3>
          </div>
        </div>

        <div 
          onClick={() => setSelectedOverheadCategory("Inventory Supply")}
          className="bg-white border border-[#c4c6d1] p-4.5 rounded-xl flex flex-col justify-between card-shadow cursor-pointer hover:bg-slate-50 transition-colors group"
        >
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-teal-700 text-[20px] group-hover:scale-110 transition-transform">inventory_2</span>
          </div>
          <div className="mt-3">
            <span className="text-[#43474f] font-bold text-xs uppercase tracking-wide group-hover:text-[#00193c] transition-colors">Inventory Supply</span>
            <h3 className="font-extrabold text-2xl text-teal-800 mt-0.5 font-mono">₱{totals.inventorySupply.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</h3>
          </div>
        </div>

        <div 
          onClick={() => setSelectedOverheadCategory("Fuel Costs")}
          className="bg-white border border-[#c4c6d1] p-4.5 rounded-xl flex flex-col justify-between card-shadow cursor-pointer hover:bg-slate-50 transition-colors group"
        >
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-[#00193c] text-[20px] group-hover:scale-110 transition-transform">local_gas_station</span>
          </div>
          <div className="mt-3">
            <span className="text-[#43474f] font-bold text-xs uppercase tracking-wide group-hover:text-[#00193c] transition-colors">Fuel Costs</span>
            <h3 className="font-extrabold text-2xl text-[#00193c] mt-0.5 font-mono">₱{totals.fuel.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</h3>
          </div>
        </div>

        <div 
          onClick={() => setSelectedOverheadCategory("Allowances")}
          className="bg-white border border-[#c4c6d1] p-4.5 rounded-xl flex flex-col justify-between card-shadow cursor-pointer hover:bg-slate-50 transition-colors group"
        >
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-amber-700 text-[20px] group-hover:scale-110 transition-transform">badge</span>
          </div>
          <div className="mt-3">
            <span className="text-[#43474f] font-bold text-xs uppercase tracking-wide group-hover:text-[#00193c] transition-colors">Allowances</span>
            <h3 className="font-extrabold text-2xl text-amber-900 mt-0.5 font-mono">
              ₱{(totals.driverWages + totals.helperWages).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
            </h3>
          </div>
        </div>

        <div 
          onClick={() => setSelectedOverheadCategory("Maintenance")}
          className="bg-white border border-[#c4c6d1] p-4.5 rounded-xl flex flex-col justify-between card-shadow cursor-pointer hover:bg-slate-50 transition-colors group"
        >
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-indigo-700 text-[20px] group-hover:scale-110 transition-transform">build</span>
          </div>
          <div className="mt-3">
            <span className="text-[#43474f] font-bold text-xs uppercase tracking-wide group-hover:text-[#00193c] transition-colors">Maintenance</span>
            <h3 className="font-extrabold text-2xl text-indigo-950 mt-0.5 font-mono">
              ₱{totals.maintenance.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
            </h3>
          </div>
        </div>

        <div 
          onClick={() => setSelectedOverheadCategory("Other / Misc")}
          className="bg-white border border-[#c4c6d1] p-4.5 rounded-xl flex flex-col justify-between card-shadow cursor-pointer hover:bg-slate-50 transition-colors group"
        >
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-slate-700 text-[20px] group-hover:scale-110 transition-transform">more_horiz</span>
          </div>
          <div className="mt-3">
            <span className="text-[#43474f] font-bold text-xs uppercase tracking-wide group-hover:text-[#00193c] transition-colors">Other / Misc</span>
            <h3 className="font-extrabold text-2xl text-slate-900 mt-0.5 font-mono">
              ₱{totals.misc.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
            </h3>
          </div>
        </div>
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
            <p className="font-extrabold text-slate-900 text-xs uppercase">
              As of: {
                filterPeriod === "daily" ? new Date(selectedDay).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) :
                filterPeriod === "monthly" ? `${MONTH_NAMES[selectedMonth]} ${selectedYear}` : 
                filterPeriod === "yearly" ? `YEAR ${selectedYear}` : 
                filterPeriod === "custom" ? `${customStartDate} to ${customEndDate}` :
                "OVERALL"
              } | Status: {statusFilter}
            </p>
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
                  <td className="p-2 font-black text-[#00193c] border-r border-slate-900">₱{totals.revenue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                  <td className="bg-slate-100 font-bold p-2 border-r border-slate-900 text-slate-900">NET PROFIT:</td>
                  <td className="p-2 font-black text-emerald-700">₱{totals.profit.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                </tr>
              )}
              <tr>
                <td className="bg-slate-100 font-bold p-2 border-r border-slate-900 text-slate-900">TOTAL EXPENSES:</td>
                <td className="p-2 font-black text-rose-800 border-r border-slate-900">₱{totals.total.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                <td className="bg-slate-100 font-bold p-2 border-r border-slate-900 text-slate-900">FUEL SHARE:</td>
                <td className="p-2 font-extrabold text-slate-900">
                  ₱{totals.fuel.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} ({totals.total > 0 ? ((totals.fuel / totals.total) * 100).toFixed(1) : 0}%)
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
                  <th className={`p-2 border border-slate-900 ${showFinancials ? 'w-[9%]' : 'w-[10%]'}`}>SEQUENCE #</th>
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
                                ₱{Number(e.amount || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
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
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-bold uppercase border ${t.status === "Active"
                            ? "bg-amber-50 text-amber-900 border-amber-400"
                            : "bg-emerald-50 text-emerald-900 border-emerald-400"
                          }`}>
                          {t.status === "Completed" ? "Completed" : "Active"}
                        </span>
                      </td>
                      {showFinancials && (
                        <td className="p-2 border border-slate-900 text-right font-mono font-extrabold text-[#00193c] text-xs whitespace-nowrap">
                          ₱{Number(t.rate || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                        </td>
                      )}
                      <td className="p-2 border border-slate-900 text-right font-mono font-extrabold text-rose-700 text-xs whitespace-nowrap">
                        ₱{b.total.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                      </td>
                      {showFinancials && (
                        <td className="p-2 border border-slate-900 text-right font-mono font-extrabold text-emerald-600 text-xs whitespace-nowrap">
                          ₱{(Number(t.rate || 0) - b.total).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                        </td>
                      )}
                    </tr>
                  );
                })}
                {reportTrips.length > 0 && (
                  <tr className="bg-slate-100 text-slate-900 font-extrabold text-[11px] border-t-2 border-slate-900">
                    <td colSpan={6} className="p-2.5 border border-slate-900 text-right uppercase tracking-wider font-sans">
                      FLEET TRIPS TOTALS:
                    </td>
                    {showFinancials && (
                      <td className="p-2.5 border border-slate-900 text-right text-[#00193c] font-mono font-black text-xs">
                        ₱{totals.revenue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                      </td>
                    )}
                    <td className="p-2.5 border border-slate-900 text-right text-rose-800 font-mono font-black text-xs">
                      ₱{(totals.total - totals.inventorySupply).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                    </td>
                    {showFinancials && (
                      <td className="p-2.5 border border-slate-900 text-right text-emerald-700 font-mono font-black text-xs">
                        ₱{(totals.profit + totals.inventorySupply).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
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

            {/* SECONDARY TABLE: FLEET INVENTORY DISBURSEMENTS */}
            <div className="mt-8">
              <h3 className="font-extrabold text-sm text-[#00193c] uppercase mb-2">Fleet Inventory Disbursements</h3>
              <table className="autoworx-grid w-full text-left border-collapse text-[10.5px] table-fixed border-2 border-slate-900 bg-white">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[9.5px] tracking-tight border-b-2 border-slate-900">
                    <th className="p-2 border border-slate-900 w-[15%]">DATE REQ.</th>
                    <th className="p-2 border border-slate-900 w-[30%]">SUPPLY ITEM</th>
                    <th className="p-2 border border-slate-900 w-[20%]">VEHICLE DETAILS</th>
                    <th className="p-2 border border-slate-900 w-[20%]">REMARKS</th>
                    <th className="p-2 border border-slate-900 w-[15%] text-right font-black text-rose-800">EXPENSES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 font-sans">
                  {reportStockOuts.map((tx: any) => {
                    const compDate = new Date(tx.createdAt).toLocaleDateString();
                    return (
                      <tr 
                        key={tx.id} 
                        onClick={() => setSelectedOverheadCategory("Inventory Supply")}
                        className="bg-white leading-tight hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Click to view Inventory Category Inspector"
                      >
                        <td className="p-2 border border-slate-900 font-semibold text-slate-900 whitespace-nowrap">
                          {compDate}
                        </td>
                        <td className="p-2 border border-slate-900">
                          <p className="font-bold text-slate-900">{tx.item?.name}</p>
                          <p className="text-slate-600 text-[10px]">
                            {tx.quantity} {tx.item?.unit} @ ₱{Number(tx.unitCost || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} / {tx.item?.unit}
                          </p>
                        </td>
                        <td className="p-2 border border-slate-900">
                          <p className="font-bold text-slate-900 truncate">{tx.truck?.unit}</p>
                          <p className="text-slate-800 font-mono font-bold text-[10px]">{tx.truck?.plateNo}</p>
                        </td>
                        <td className="p-2 border border-slate-900">
                          <p className="text-slate-700 italic text-[10px]">{tx.remarks || "No remarks"}</p>
                        </td>
                        <td className="p-2 border border-slate-900 text-right font-mono font-extrabold text-rose-700 text-xs whitespace-nowrap">
                          ₱{Number(tx.totalCost).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                        </td>
                      </tr>
                    );
                  })}
                  {reportStockOuts.length > 0 && (
                    <tr className="bg-slate-100 text-slate-900 font-extrabold text-[11px] border-t-2 border-slate-900">
                      <td colSpan={4} className="p-2.5 border border-slate-900 text-right uppercase tracking-wider font-sans">
                        INVENTORY TOTALS:
                      </td>
                      <td className="p-2.5 border border-slate-900 text-right text-rose-800 font-mono font-black text-xs">
                        ₱{totals.inventorySupply.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                      </td>
                    </tr>
                  )}
                  {reportStockOuts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center border border-slate-900 bg-slate-50 text-slate-600 font-bold text-xs uppercase">
                        No Inventory Disbursements Found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* TERTIARY TABLE: FLEET MAINTENANCE DISBURSEMENTS */}
            <div className="mt-8">
              <h3 className="font-extrabold text-sm text-[#00193c] uppercase mb-2">Fleet Maintenance Disbursements</h3>
              <table className="autoworx-grid w-full text-left border-collapse text-[10.5px] table-fixed border-2 border-slate-900 bg-white">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[9.5px] tracking-tight border-b-2 border-slate-900">
                    <th className="p-2 border border-slate-900 w-[15%]">DATE INCD.</th>
                    <th className="p-2 border border-slate-900 w-[30%]">MAINTENANCE ITEM / DESC</th>
                    <th className="p-2 border border-slate-900 w-[20%]">VEHICLE DETAILS</th>
                    <th className="p-2 border border-slate-900 w-[20%]">CATEGORY & STATUS</th>
                    <th className="p-2 border border-slate-900 w-[15%] text-right font-black text-rose-800">EXPENSES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 font-sans">
                  {reportMaintenanceRecords.map((m: any) => {
                    const compDate = new Date(m.dateIncurred || m.createdAt).toLocaleDateString();
                    return (
                      <tr 
                        key={m.id} 
                        onClick={() => setSelectedOverheadCategory("Maintenance")}
                        className="bg-white leading-tight hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Click to view Maintenance Category Inspector"
                      >
                        <td className="p-2 border border-slate-900 font-semibold text-slate-900 whitespace-nowrap">
                          {compDate}
                        </td>
                        <td className="p-2 border border-slate-900">
                          <p className="font-bold text-slate-900">{m.description}</p>
                          {m.autoworxJobId && <p className="text-blue-600 font-mono text-[10px] mt-0.5">AWX JOB: {m.autoworxJobId}</p>}
                        </td>
                        <td className="p-2 border border-slate-900">
                          {m.truck ? (
                            <>
                              <p className="font-bold text-slate-900">{m.truck.unit}</p>
                              <p className="font-mono text-slate-500 text-[10px]">({m.truck.plateNo})</p>
                            </>
                          ) : (
                            <p className="font-bold text-slate-900">General Fleet</p>
                          )}
                        </td>
                        <td className="p-2 border border-slate-900">
                          <p className="text-slate-800 font-medium uppercase tracking-wider">{m.category || "Maintenance"}</p>
                          <p className={`font-bold text-[10px] mt-0.5 ${m.autoworxJobId ? 'text-blue-700' : 'text-emerald-700'}`}>
                            {m.autoworxJobId ? "AUTOWORX SYNC" : "MANUAL LOG"}
                          </p>
                        </td>
                        <td className="p-2 border border-slate-900 text-right font-mono font-black text-rose-800 text-xs">
                          ₱{Number(m.cost || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                        </td>
                      </tr>
                    );
                  })}
                  {reportMaintenanceRecords.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center border border-slate-900 text-slate-500 font-bold uppercase text-[10px]">
                        No Maintenance Disbursements Found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* OVERALL GRAND TOTALS */}
            <div className="mt-8 flex justify-end">
              <table className="autoworx-grid w-full sm:w-2/3 lg:w-1/2 text-left border-collapse text-[11px] border-2 border-slate-900 bg-white shadow-sm">
                <tbody>
                  <tr className="bg-[#00193c] text-white print:bg-slate-100 print:text-slate-900 font-extrabold uppercase tracking-widest text-[12px]">
                    <td className="p-3 border border-slate-900 text-right">OVERALL GRAND TOTALS:</td>
                    {showFinancials && (
                      <td className="p-3 border border-slate-900 text-right text-blue-200 print:text-[#00193c] font-mono font-black">
                        <span className="block text-[8px] text-blue-300 print:text-slate-600 font-sans tracking-wide leading-none mb-1">TOTAL REVENUE</span>
                        ₱{totals.revenue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                      </td>
                    )}
                    <td className="p-3 border border-slate-900 text-right text-rose-300 print:text-rose-800 font-mono font-black">
                      <span className="block text-[8px] text-rose-400 print:text-slate-600 font-sans tracking-wide leading-none mb-1">TOTAL EXPENSES</span>
                      ₱{totals.total.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                    </td>
                    {showFinancials && (
                      <td className="p-3 border border-slate-900 text-right text-emerald-300 print:text-emerald-700 font-mono font-black">
                        <span className="block text-[8px] text-emerald-400 print:text-slate-600 font-sans tracking-wide leading-none mb-1">NET PROFIT</span>
                        ₱{totals.profit.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
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
                      ₱{cat.amount.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
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
                    ₱{totals.total.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}


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
                    ₱{selectedCategoryTotal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                  </span>
                </div>
              </div>

              {/* Table of Trips under this Category */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs font-sans border-collapse">
                  <thead>
                    <tr className="bg-[#00193c] text-white font-extrabold uppercase text-[10px]">
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Sequence #</th>
                      <th className="p-2.5">Vehicle Details</th>
                      <th className="p-2.5">Driver</th>
                      <th className="p-2.5">Customer & Route</th>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5 text-right font-black">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-sans text-[11px]">
                    {selectedCategoryTrips.map((item, idx) => {
                      if (item.inventoryTx) {
                        return (
                          <tr key={`inv-${idx}`} className="bg-white">
                            <td className="p-2.5 text-slate-800 whitespace-nowrap font-medium">
                              {new Date(item.inventoryTx.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-2.5 font-mono font-bold text-[#00193c]">
                              STOCK-OUT
                            </td>
                            <td className="p-2.5 font-bold text-slate-900">
                              {item.inventoryTx.truck?.unit} <span className="font-mono text-slate-500 font-normal">({item.inventoryTx.truck?.plateNo})</span>
                            </td>
                            <td className="p-2.5 text-slate-800 font-medium">{item.inventoryTx.truck?.driver || "-"}</td>
                            <td className="p-2.5 text-slate-800">
                              <p className="font-bold text-[10px] text-slate-500">Fleet Inventory Allocation</p>
                            </td>
                            <td className="p-2.5 text-slate-700">
                              <span className="font-semibold text-teal-700">{item.categoryName}: </span>
                              <span>{item.itemDescription}</span>
                            </td>
                            <td className="p-2.5 text-right font-mono font-extrabold text-teal-700 text-xs">
                              ₱{item.amount.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                            </td>
                          </tr>
                        );
                      }
                      
                      if (item.maintenanceTx) {
                        return (
                          <tr key={`main-${idx}`} className="bg-white">
                            <td className="p-2.5 text-slate-800 whitespace-nowrap font-medium">
                              {new Date(item.maintenanceTx.dateIncurred || item.maintenanceTx.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-2.5 font-mono font-bold text-[#00193c]">
                              {item.maintenanceTx.autoworxJobId ? "AUTOWORX SYNC" : "MANUAL LOG"}
                            </td>
                            <td className="p-2.5 font-bold text-slate-900">
                              {item.maintenanceTx.truck?.unit || "General Fleet"} <span className="font-mono text-slate-500 font-normal">({item.maintenanceTx.truck?.plateNo || "N/A"})</span>
                            </td>
                            <td className="p-2.5 text-slate-800 font-medium">-</td>
                            <td className="p-2.5 text-slate-800">
                              <p className="font-bold text-[10px] text-slate-500">Maintenance & Repairs</p>
                            </td>
                            <td className="p-2.5 text-slate-700">
                              <span className="font-semibold text-rose-700">{item.categoryName}: </span>
                              <span>{item.itemDescription}</span>
                            </td>
                            <td className="p-2.5 text-right font-mono font-extrabold text-rose-700 text-xs">
                              ₱{item.amount.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                            </td>
                          </tr>
                        );
                      }
                      
                      const t = item.trip!;
                      return (
                      <tr
                        key={`trip-${idx}`}
                        onClick={() => {
                          setSelectedOverheadCategory(null);
                          setViewingPaperTrip(t);
                        }}
                        className="hover:bg-blue-50/70 cursor-pointer transition-colors group"
                        title="Click to view Monitoring Form (Travel & Expense)"
                      >
                        <td className="p-2.5 text-slate-800 whitespace-nowrap font-medium">
                          {t.completedAt ? new Date(t.completedAt).toLocaleDateString() : t.dateOfTravel}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-[#00193c] group-hover:underline">
                          {t.seqNo || t.id}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900">
                          {t.unit} <span className="font-mono text-slate-500 font-normal">({t.plateNo})</span>
                        </td>
                        <td className="p-2.5 text-slate-800 font-medium">{t.driver}</td>
                        <td className="p-2.5 text-slate-800">
                          <p className="font-bold">{t.customerName}</p>
                          <p className="text-[10px] text-slate-500">{t.origin || "CDO"} → {t.destination}</p>
                        </td>
                        <td className="p-2.5 text-slate-700">
                          <span className="font-semibold text-slate-900">{item.categoryName}: </span>
                          <span>{item.itemDescription}</span>
                        </td>
                        <td className="p-2.5 text-right font-mono font-extrabold text-rose-800 text-xs">
                          ₱{item.amount.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                        </td>
                      </tr>
                      );
                    })}
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
