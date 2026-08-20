"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTrips, Trip } from "@/lib/trips-store";
import { getAllStockOuts } from "@/actions/inventory";
import { getMaintenanceRecords } from "@/actions/maintenance";
import { format, parseISO, getISOWeek, getISOWeekYear, setISOWeek, setISOWeekYear, startOfISOWeek, endOfISOWeek } from "date-fns";
import {
  Search, Calendar as CalendarIcon, FileDown, Printer, ListChecks, FileText,
  DollarSign, Wrench, Package, ArrowRightLeft, X
} from "lucide-react";
import TripInspectorModal from "@/components/trips/TripInspectorModal";
import DigitalPaperForm from "@/components/trips/DigitalPaperForm";
import AddReportRecordModal from "@/components/reports/AddReportRecordModal";
import ManualRecordInspectorModal from "@/components/reports/ManualRecordInspectorModal";
import { getReportManualEntries, deleteReportManualEntry } from "@/actions/reportsManual";
import { Plus } from "lucide-react";
import { toast } from "sonner";

type ReportPeriod = "daily" | "weekly" | "monthly" | "yearly" | "overall" | "custom";

const CATEGORIES = [
  "FUEL COSTS",
  "DRIVER & HELPER WAGES",
  "MAINTENANCE & REPAIR",
  "INVENTORY SUPPLY",
  "OTHER / MISC",
  "PAYROLL",
  "EMPLOYEES BENEFITS",
  "RENTALS",
  "TAXES",
  "UTILITIES",
  "TELEPHONE/INTERNET",
  "REPAIR AND MAINTENANCE",
  "SHOP PARTS AND GOODS",
  "OFFICE EXPENSES",
  "UNIFORMS",
  "INSURANCE",
  "REPRESENTATIONS",
  "PROFESSIONAL FEES",
  "MEALS AND ENTERTAINMENTS",
  "FOODS",
  "BUILDING MAINTENANCE",
  "IT",
  "ADVERTISING/MARKETING",
  "OTHER/MISCELLANEOUS",
  "ASSET SALES",
  "CUSTOM"
];

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "FUEL COSTS": "ALL DIESEL AND FUEL EXPENSES",
  "DRIVER & HELPER WAGES": "ALLOWANCES, DRIVER RATES, HELPER 1/2 RATES",
  "MAINTENANCE & REPAIR": "EXTERNAL SHOP REPAIRS AND MANUAL ENTRIES",
  "INVENTORY SUPPLY": "ALL TRUCK STOCK OUTS FROM INVENTORY",
  "OTHER / MISC": "MISCELLANEOUS EXPENSES FROM TRIPS",
  "PAYROLL": "CORPORATE PAYROLL",
  "EMPLOYEES BENEFITS": "EMPLOYEE BENEFITS",
  "RENTALS": "PROPERTY OR EQUIPMENT RENTALS",
  "TAXES": "GOVERNMENT TAXES AND FEES",
  "UTILITIES": "WATER, ELECTRICITY, ETC.",
  "TELEPHONE/INTERNET": "COMMUNICATIONS",
  "REPAIR AND MAINTENANCE": "CORPORATE REPAIRS",
  "SHOP PARTS AND GOODS": "SHOP TOOLS AND GOODS",
  "OFFICE EXPENSES": "OFFICE SUPPLIES",
  "UNIFORMS": "STAFF UNIFORMS",
  "INSURANCE": "VEHICLE OR CORPORATE INSURANCE",
  "REPRESENTATIONS": "REPRESENTATION EXPENSES",
  "PROFESSIONAL FEES": "LEGAL OR PROFESSIONAL FEES",
  "MEALS AND ENTERTAINMENTS": "MEALS AND ENTERTAINMENT",
  "FOODS": "FOOD EXPENSES",
  "BUILDING MAINTENANCE": "FACILITY MAINTENANCE",
  "IT": "IT AND SOFTWARE",
  "ADVERTISING/MARKETING": "MARKETING EXPENSES",
  "OTHER/MISCELLANEOUS": "OTHER CORPORATE MISC",
  "ASSET SALES": "BEST FOR SELLING COMPANY EQUIPMENT LIKE A CAR, OLD TIRES, OR SCRAP METAL",
  "CUSTOM": "CUSTOM EXPENSE"
};

interface UnifiedExpense {
  date: string;
  category: string;
  desc: string;
  charge: string;
  unit: string;
  plate: string;
  amount: number;
  sourceTrip?: Trip;
  isManual?: boolean;
  id?: string;
  rawManualRecord?: any;
  recordType?: "Expense" | "Sale";
}

function formatWeekRange(weekStr: string) {
  if (!weekStr || !weekStr.includes('-W')) return weekStr;
  const [yearStr, weekNumStr] = weekStr.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekNumStr, 10);
  let d = new Date();
  d = setISOWeekYear(d, year);
  d = setISOWeek(d, week);
  const start = startOfISOWeek(d);
  const end = endOfISOWeek(d);
  
  const endFormat = start.getMonth() === end.getMonth() ? 'd, yyyy' : 'MMMM d, yyyy';
  return `from ${format(start, 'MMMM d')} - ${format(end, endFormat)}`;
}

export default function ReportsPage() {
  const { trips } = useTrips();
  const [stockOuts, setStockOuts] = useState<any[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>([]);
  const [manualEntries, setManualEntries] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [inspectingTrip, setInspectingTrip] = useState<Trip | null>(null);
  const [viewingPaperTrip, setViewingPaperTrip] = useState<Trip | null>(null);
  const [selectedOverheadCategory, setSelectedOverheadCategory] = useState<string | null>(null);
  const [editingManualRecord, setEditingManualRecord] = useState<any>(null);
  const [inspectingManualRecord, setInspectingManualRecord] = useState<any>(null);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDeleteManualRecord = async (id: string) => {
    setIsDeleting(id);
    setRecordToDelete(null);
    try {
      // Add a small delay so the animation can play out before removing data
      await new Promise(resolve => setTimeout(resolve, 300));
      await deleteReportManualEntry(id);
      loadData();
      toast.success("Record deleted successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete record.");
    } finally {
      setIsDeleting(null);
    }
  };

  const loadData = () => {
    getAllStockOuts().then(data => setStockOuts(data));
    getMaintenanceRecords().then(data => setMaintenanceRecords(data));
    getReportManualEntries().then(data => setManualEntries(data));
  };

  useEffect(() => {
    loadData();
  }, []);

  const [viewMode, setViewMode] = useState<"detailed" | "summary">("summary");
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("monthly");
  const [reportStatus, setReportStatus] = useState<string>("Completed");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>("ALL");
  
  const currentYear = new Date().getFullYear().toString();
  const currentMonthKey = `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const [selectedDay, setSelectedDay] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [selectedWeek, setSelectedWeek] = useState<string>(() => {
    const d = new Date();
    return `${getISOWeekYear(d)}-W${String(getISOWeek(d)).padStart(2, '0')}`;
  });
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [customStartDate, setCustomStartDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [customEndDate, setCustomEndDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  const { availableYears } = useMemo(() => {
    let current = new Date().getFullYear();
    let minYear = current - 4; // Show at least 5 years (current - 4 to current)
    let maxYear = current;

    trips.forEach((t: Trip) => {
      const dateStr = t.completedAt ? new Date(t.completedAt).toISOString() : t.dateOfTravel;
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        if (y < minYear) minYear = y;
        if (y > maxYear) maxYear = y;
      }
    });

    const yearsSet = new Set<string>();
    for (let y = minYear; y <= maxYear; y++) {
      yearsSet.add(y.toString());
    }

    const availableYearsList = Array.from(yearsSet).sort((a, b) => b.localeCompare(a));

    return {
      availableYears: availableYearsList
    };
  }, [trips]);

  const getFilteredTrips = () => {
    return trips.filter((t: Trip) => {
      if (reportStatus !== "All" && t.status !== reportStatus) return false;

      const tDateStr = t.completedAt ? new Date(t.completedAt).toISOString().split("T")[0] : t.dateOfTravel;
      const tDate = new Date(tDateStr);

      if (reportPeriod === "daily") return tDateStr === selectedDay;
      if (reportPeriod === "weekly") {
        if (!selectedWeek || !selectedWeek.includes('-W')) return false;
        const [yearStr, weekStr] = selectedWeek.split('-W');
        const year = parseInt(yearStr, 10);
        const week = parseInt(weekStr, 10);
        return getISOWeekYear(tDate) === year && getISOWeek(tDate) === week;
      }
      if (reportPeriod === "monthly") {
        const key = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`;
        return key === selectedMonth;
      }
      if (reportPeriod === "yearly") return tDate.getFullYear().toString() === selectedYear;
      if (reportPeriod === "overall") return true; 
      if (reportPeriod === "custom") {
        if (!customStartDate || !customEndDate) return true;
        return tDateStr >= customStartDate && tDateStr <= customEndDate;
      }
      return true;
    });
  };

  const getFilteredStockOuts = () => {
    return stockOuts.filter((tx: any) => {
      const txDateStr = new Date(tx.createdAt).toISOString().split("T")[0];
      const txDate = new Date(tx.createdAt);

      if (reportPeriod === "daily") return txDateStr === selectedDay;
      if (reportPeriod === "weekly") {
        if (!selectedWeek || !selectedWeek.includes('-W')) return false;
        const [yearStr, weekStr] = selectedWeek.split('-W');
        const year = parseInt(yearStr, 10);
        const week = parseInt(weekStr, 10);
        return getISOWeekYear(txDate) === year && getISOWeek(txDate) === week;
      }
      if (reportPeriod === "monthly") {
        const key = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
        return key === selectedMonth;
      }
      if (reportPeriod === "yearly") return txDate.getFullYear().toString() === selectedYear;
      if (reportPeriod === "overall") return true; 
      if (reportPeriod === "custom") {
        if (!customStartDate || !customEndDate) return true;
        return txDateStr >= customStartDate && txDateStr <= customEndDate;
      }
      return true;
    });
  };

  const getFilteredMaintenanceRecords = () => {
    return maintenanceRecords.filter((m: any) => {
      if (reportStatus !== "All" && m.status !== reportStatus) return false;

      const mDateStr = new Date(m.dateIncurred || m.createdAt).toISOString().split("T")[0];
      const mDate = new Date(m.dateIncurred || m.createdAt);

      if (reportPeriod === "daily") return mDateStr === selectedDay;
      if (reportPeriod === "weekly") {
        if (!selectedWeek || !selectedWeek.includes('-W')) return false;
        const [yearStr, weekStr] = selectedWeek.split('-W');
        const year = parseInt(yearStr, 10);
        const week = parseInt(weekStr, 10);
        return getISOWeekYear(mDate) === year && getISOWeek(mDate) === week;
      }
      if (reportPeriod === "monthly") {
        const key = `${mDate.getFullYear()}-${String(mDate.getMonth() + 1).padStart(2, '0')}`;
        return key === selectedMonth;
      }
      if (reportPeriod === "yearly") return mDate.getFullYear().toString() === selectedYear;
      if (reportPeriod === "overall") return true; 
      if (reportPeriod === "custom") {
        if (!customStartDate || !customEndDate) return true;
        return mDateStr >= customStartDate && mDateStr <= customEndDate;
      }
      return true;
    });
  };

  const getFilteredManualEntries = () => {
    return manualEntries.filter((m: any) => {
      const mDateStr = new Date(m.date).toISOString().split("T")[0];
      const mDate = new Date(m.date);

      if (reportPeriod === "daily") return mDateStr === selectedDay;
      if (reportPeriod === "weekly") {
        if (!selectedWeek || !selectedWeek.includes('-W')) return false;
        const [yearStr, weekStr] = selectedWeek.split('-W');
        const year = parseInt(yearStr, 10);
        const week = parseInt(weekStr, 10);
        return getISOWeekYear(mDate) === year && getISOWeek(mDate) === week;
      }
      if (reportPeriod === "monthly") {
        const key = `${mDate.getFullYear()}-${String(mDate.getMonth() + 1).padStart(2, '0')}`;
        return key === selectedMonth;
      }
      if (reportPeriod === "yearly") return mDate.getFullYear().toString() === selectedYear;
      if (reportPeriod === "overall") return true; 
      if (reportPeriod === "custom") {
        if (!customStartDate || !customEndDate) return true;
        return mDateStr >= customStartDate && mDateStr <= customEndDate;
      }
      return true;
    });
  };

  const reportTrips = getFilteredTrips();
  const reportStockOuts = getFilteredStockOuts();
  const reportMaintenanceRecords = getFilteredMaintenanceRecords();
  const reportManualEntriesList = getFilteredManualEntries();

  const unifiedExpenses = useMemo(() => {
    const expenses: UnifiedExpense[] = [];
    
    reportTrips.forEach((t: Trip) => {
      const compDate = t.completedAt ? new Date(t.completedAt).toISOString().split("T")[0] : t.dateOfTravel;
      
      let tripFuel = 0;
      let tripDriverWages = 0;
      let tripHelperWages = 0;
      let tripMaintenance = 0;
      let tripMisc = 0;

      t.expenses.forEach((e: any) => {
        const cat = (e.category || "").toUpperCase();
        const amt = Number(e.amount) || 0;

        if (cat === "DIESEL" || cat.includes("FUEL")) tripFuel += amt;
        else if (cat === "DRIVER RATE" || cat.includes("DRIVER")) tripDriverWages += amt;
        else if (cat === "HELPER 1 RATE" || cat === "HELPER 2 RATE" || cat === "STRIPPER" || cat.includes("HELPER")) tripHelperWages += amt;
        else if (cat === "MAINTENANCE" || cat.includes("REPAIR")) tripMaintenance += amt;
        else tripMisc += amt;
      });

      if (tripFuel > 0) expenses.push({ date: compDate, category: "FUEL COSTS", desc: `Trip ${t.seqNo} Fuel`, charge: t.customerName, unit: t.unit, plate: t.plateNo, amount: tripFuel, sourceTrip: t, recordType: "Expense" });
      if (tripDriverWages + tripHelperWages > 0) expenses.push({ date: compDate, category: "DRIVER & HELPER WAGES", desc: `Trip ${t.seqNo} Wages`, charge: t.customerName, unit: t.unit, plate: t.plateNo, amount: tripDriverWages + tripHelperWages, sourceTrip: t, recordType: "Expense" });
      if (tripMaintenance > 0) expenses.push({ date: compDate, category: "MAINTENANCE & REPAIR", desc: `Trip ${t.seqNo} Maintenance`, charge: t.customerName, unit: t.unit, plate: t.plateNo, amount: tripMaintenance, sourceTrip: t, recordType: "Expense" });
      if (tripMisc > 0) expenses.push({ date: compDate, category: "OTHER / MISC", desc: `Trip ${t.seqNo} Misc`, charge: t.customerName, unit: t.unit, plate: t.plateNo, amount: tripMisc, sourceTrip: t, recordType: "Expense" });
    });

    reportStockOuts.forEach((so: any) => {
      const soDateStr = new Date(so.dateStockOut || so.createdAt).toISOString().split("T")[0];
      expenses.push({
        date: soDateStr,
        category: "INVENTORY SUPPLY",
        desc: `Stock Out: ${so.quantity}x ${so.item?.itemName} (${so.item?.brand || ''})`,
        charge: "-",
        unit: so.truck?.unit || so.truck?.unitNo || "-",
        plate: so.truck?.plateNo || "-",
        amount: Number(so.totalCost) || 0,
        recordType: "Expense"
      });
    });

    reportMaintenanceRecords.forEach((m: any) => {
      const mDateStr = new Date(m.dateIncurred || m.createdAt).toISOString().split("T")[0];
      const prefix = m.autoworxJobId ? "Autoworx Repairs" : "Manual Entry";
      expenses.push({
        date: mDateStr,
        category: "MAINTENANCE & REPAIR",
        desc: `${prefix}: ${m.description}`,
        charge: "-",
        unit: m.truck?.unit || m.truck?.unitNo || "-",
        plate: m.truck?.plateNo || "-",
        amount: Number(m.cost) || 0,
        recordType: "Expense"
      });
    });

    reportManualEntriesList.forEach((m: any) => {
      const dateStr = new Date(m.date).toISOString().split("T")[0];
      let descText = m.expenseDescription || "";
      if (m.invoiceNo) descText = descText ? `[Inv: ${m.invoiceNo}] ${descText}` : `Inv: ${m.invoiceNo}`;
      if (m.suppliersName) descText = descText ? `${descText} (Supplier: ${m.suppliersName})` : `Supplier: ${m.suppliersName}`;

      expenses.push({
        date: dateStr,
        category: m.category,
        desc: descText || "-",
        charge: m.chargeTo || "-",
        unit: m.unitVehicle || "-",
        plate: m.plateNo || "-",
        amount: Number(m.amount) || 0,
        isManual: true,
        id: m.id,
        rawManualRecord: m,
        recordType: m.type
      });
    });

    let filtered = expenses;
    
    if (selectedFilterCategory !== "ALL") {
      filtered = filtered.filter(e => e.category === selectedFilterCategory);
    }

    if (searchQuery.trim()) {
      const searchTokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
      filtered = filtered.filter(e => {
        const searchableString = `${e.category} ${e.desc} ${e.charge} ${e.unit} ${e.plate}`.toLowerCase();
        return searchTokens.every(token => searchableString.includes(token));
      });
    }
    
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [reportTrips, reportStockOuts, reportMaintenanceRecords, reportManualEntriesList, searchQuery, selectedFilterCategory]);

  const categorySummaries = useMemo(() => {
    const sums: Record<string, number> = {};
    
    CATEGORIES.forEach(cat => {
      sums[cat] = 0;
    });

    unifiedExpenses.forEach(e => {
      if (e.recordType === "Sale") return; // Skip sales for overhead calculation
      if (sums[e.category] === undefined) {
        sums[e.category] = 0;
      }
      sums[e.category] += e.amount;
    });

    return sums;
  }, [unifiedExpenses]);

  const totalFilteredAmount = unifiedExpenses
    .filter(e => e.recordType !== "Sale")
    .reduce((acc, e) => acc + e.amount, 0);
  
  const filteredTripsForRevenue = useMemo(() => {
    if (!searchQuery.trim()) return reportTrips;
    const searchTokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return reportTrips.filter((t: Trip) => {
      const searchableString = `TRIP REVENUE ${t.customerName} ${t.destination} ${t.unit} ${t.plateNo}`.toLowerCase();
      return searchTokens.every(token => searchableString.includes(token));
    });
  }, [reportTrips, searchQuery]);

  const tripRevenue = filteredTripsForRevenue.reduce((acc, t) => acc + (Number(t.rate) || 0), 0);
  const salesRevenue = unifiedExpenses
    .filter((e) => e.recordType === "Sale")
    .reduce((sum, e) => sum + e.amount, 0);
    
  const totalRevenue = tripRevenue + salesRevenue;
  const netProfit = totalRevenue - totalFilteredAmount;

  const selectedCategoryTrips = useMemo(() => {
    if (!selectedOverheadCategory) return [];
    return unifiedExpenses.filter(e => e.category === selectedOverheadCategory);
  }, [unifiedExpenses, selectedOverheadCategory]);

  const selectedCategoryTotal = selectedCategoryTrips.reduce((sum, item) => sum + item.amount, 0);

  let formattedDateSelected = 'All Time';
  if (reportPeriod === 'daily') formattedDateSelected = format(parseISO(selectedDay), "MMMM d, yyyy");
  else if (reportPeriod === 'weekly') formattedDateSelected = formatWeekRange(selectedWeek);
  else if (reportPeriod === 'monthly') formattedDateSelected = format(parseISO(selectedMonth + '-01'), "MMMM yyyy");
  else if (reportPeriod === 'yearly') formattedDateSelected = selectedYear === 'all' ? 'All Time' : selectedYear;
  else if (reportPeriod === 'custom') formattedDateSelected = `${format(parseISO(customStartDate), "MMM d, yyyy")} to ${format(parseISO(customEndDate), "MMM d, yyyy")}`;

  return (
    <>
      <div className={`p-4 sm:p-6 max-w-[1440px] mx-auto w-full space-y-6 bg-gray-50 min-h-screen ${viewingPaperTrip ? 'print:hidden' : 'print:bg-white print:p-0 print:space-y-0 print:max-w-none print:m-0'}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 print:hidden relative z-20">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">Reports & Expenses</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Monitor and manage fleet expenses.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200">
              <select
                value={reportStatus}
                onChange={(e) => setReportStatus(e.target.value)}
                className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 bg-white outline-none cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
              </select>
              
              <div className="w-px h-4 bg-gray-300 mx-1"></div>

              <CalendarIcon className="text-gray-500 w-4 h-4" />
              <select
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value as ReportPeriod)}
                className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 bg-white outline-none cursor-pointer"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="overall">Overall</option>
                <option value="custom">Custom Range</option>
              </select>

              {reportPeriod === "daily" && (
                <input type="date" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 bg-white" />
              )}
              {reportPeriod === "weekly" && (
                <input type="week" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 bg-white" />
              )}
              {reportPeriod === "monthly" && (
                <div className="flex items-center gap-1">
                  <select 
                    value={selectedMonth.split('-')[1]} 
                    onChange={(e) => setSelectedMonth(`${selectedMonth.split('-')[0]}-${e.target.value}`)} 
                    className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 bg-white outline-none cursor-pointer"
                  >
                    <option value="01">January</option>
                    <option value="02">February</option>
                    <option value="03">March</option>
                    <option value="04">April</option>
                    <option value="05">May</option>
                    <option value="06">June</option>
                    <option value="07">July</option>
                    <option value="08">August</option>
                    <option value="09">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                  <select 
                    value={selectedMonth.split('-')[0]} 
                    onChange={(e) => setSelectedMonth(`${e.target.value}-${selectedMonth.split('-')[1]}`)} 
                    className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 bg-white outline-none cursor-pointer"
                  >
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              )}
              {reportPeriod === "yearly" && (
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 bg-white">
                  <option value="all">All Years</option>
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              )}
              {reportPeriod === "custom" && (
                <div className="flex items-center gap-1">
                  <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="px-2 py-1 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 bg-white" />
                  <span className="text-xs text-gray-400 font-bold">to</span>
                  <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="px-2 py-1 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 bg-white" />
                </div>
              )}
            </div>

            <button onClick={() => window.print()} className="flex items-center justify-center bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 h-9 px-3 rounded-md text-sm font-semibold transition-colors">
              <Printer className="w-4 h-4 mr-2" /> Print PDF
            </button>
            <button onClick={() => setIsAddModalOpen(true)} className="flex items-center justify-center bg-blue-600 text-white border border-transparent hover:bg-blue-700 h-9 px-3 rounded-md text-sm font-semibold transition-colors shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Add Record
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-center bg-white p-3 rounded-lg shadow-sm border border-gray-200 print:hidden relative z-10">
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <input
              placeholder="Search by category, description, unit, or plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 w-full rounded-md border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="h-8 w-px bg-gray-200 hidden md:block mx-1"></div>

          <div className="w-full md:w-auto flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Filter By:</span>
            <select
              value={selectedFilterCategory}
              onChange={(e) => setSelectedFilterCategory(e.target.value)}
              className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 bg-gray-50 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
            >
              <option value="ALL">ALL CATEGORIES</option>
              {Object.keys(categorySummaries)
                .sort((a, b) => {
                  const idxA = CATEGORIES.indexOf(a);
                  const idxB = CATEGORIES.indexOf(b);
                  if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                  if (idxA !== -1) return -1;
                  if (idxB !== -1) return 1;
                  return a.localeCompare(b);
                })
                .map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="hidden md:block flex-1"></div>

          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 w-full md:w-auto mt-2 md:mt-0">
            <button
              onClick={() => setViewMode("detailed")}
              className={`flex-1 md:flex-none justify-center flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'detailed' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <ListChecks className="w-4 h-4" /> Detailed
            </button>
            <button
              onClick={() => setViewMode("summary")}
              className={`flex-1 md:flex-none justify-center flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'summary' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <FileText className="w-4 h-4" /> Summary
            </button>
          </div>
        </div>

        {/* Financial Metric Cards (Interactive Dashboard) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
          <div 
            onClick={() => setSelectedOverheadCategory("ALL")}
            className="bg-white border border-gray-200 p-4.5 rounded-xl shadow-sm hover:shadow-md hover:bg-rose-50/30 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-gray-500 font-bold text-[10px] uppercase tracking-wider group-hover:text-rose-900 transition-colors">Total Overhead Expenses</span>
              <ArrowRightLeft className="w-5 h-5 text-gray-400 group-hover:text-rose-600 transition-colors" />
            </div>
            <h3 className="font-extrabold text-2xl text-rose-700 mt-0.5 font-mono">
              ₱{totalFilteredAmount.toLocaleString("en-US", {minimumFractionDigits:2, maximumFractionDigits:2})}
            </h3>
            <p className="text-[10px] text-rose-600/70 mt-1 uppercase font-bold">Click to view breakdown</p>
          </div>

          <div 
            onClick={() => setSelectedOverheadCategory("REVENUE")}
            className="bg-white border border-gray-200 p-4.5 rounded-xl shadow-sm hover:shadow-md hover:bg-emerald-50/30 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-gray-500 font-bold text-[10px] uppercase tracking-wider group-hover:text-emerald-900 transition-colors">Trip Revenue / Sales</span>
              <DollarSign className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="font-extrabold text-2xl text-emerald-700 mt-0.5 font-mono">
              ₱{totalRevenue.toLocaleString("en-US", {minimumFractionDigits:2, maximumFractionDigits:2})}
            </h3>
            <p className="text-[10px] text-emerald-600/70 mt-1 uppercase font-bold">Click to view breakdown</p>
          </div>

          <div 
            onClick={() => setSelectedOverheadCategory("INVENTORY SUPPLY")}
            className="bg-white border border-gray-200 p-4.5 rounded-xl shadow-sm hover:shadow-md hover:bg-rose-50/30 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-gray-500 font-bold text-[10px] uppercase tracking-wider group-hover:text-rose-900 transition-colors">Inventory Supply</span>
              <Package className="w-5 h-5 text-rose-600 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="font-extrabold text-2xl text-rose-800 mt-0.5 font-mono">
              ₱{(categorySummaries["INVENTORY SUPPLY"] || 0).toLocaleString("en-US", {minimumFractionDigits:2, maximumFractionDigits:2})}
            </h3>
            <p className="text-[10px] text-rose-600/70 mt-1 uppercase font-bold">Click to view breakdown</p>
          </div>

          <div 
            onClick={() => setSelectedOverheadCategory("MAINTENANCE & REPAIR")}
            className="bg-white border border-gray-200 p-4.5 rounded-xl shadow-sm hover:shadow-md hover:bg-amber-50/30 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-gray-500 font-bold text-[10px] uppercase tracking-wider group-hover:text-amber-900 transition-colors">Maintenance</span>
              <Wrench className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="font-extrabold text-2xl text-amber-700 mt-0.5 font-mono">
              ₱{(categorySummaries["MAINTENANCE & REPAIR"] || 0).toLocaleString("en-US", {minimumFractionDigits:2, maximumFractionDigits:2})}
            </h3>
            <p className="text-[10px] text-amber-600/70 mt-1 uppercase font-bold">Click to view breakdown</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="print:p-0">
          {!viewingPaperTrip && (
            <style>{`
              @media print {
                @page {
                  size: 8.5in 13in;
                  margin: 0.2in;
                }
                body {
                  background: white;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 100% !important;
                  max-width: 100% !important;
                }
              }
            `}</style>
          )}

          {/* UNIFIED PRINT HEADER (Only visible when printing) */}
          <div className="hidden print:flex flex-col mb-8 border-b-4 border-blue-900 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src="/alk_logo.jpg" alt="ALK Logo" className="w-16 h-16 object-cover rounded-lg shadow-sm border border-gray-200" />
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-widest text-blue-950 m-0 leading-tight">ALK Trucking Services</h1>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Reports & Analytics Division</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-sm font-black uppercase tracking-widest text-black mb-1">
                  {selectedFilterCategory === "ALL" ? "OVERHEAD EXPENSES" : selectedFilterCategory} REPORT
                </h2>
                <p className="text-[10px] text-gray-700 font-bold uppercase mb-0.5">As of: {formattedDateSelected}</p>
                <p className="text-[10px] font-bold uppercase mb-1 flex justify-end gap-1 items-center">
                  <span className="text-gray-700">Status:</span>
                  <span className={reportStatus === 'Active' ? 'text-emerald-600' : reportStatus === 'Completed' ? 'text-amber-600' : 'text-blue-600'}>
                    {reportStatus === "All" ? "All Status" : reportStatus}
                  </span>
                </p>
                <p className="text-[9px] text-gray-400 font-bold uppercase">Printed on: {format(new Date(), "MMM dd, yyyy - hh:mm a")}</p>
              </div>
            </div>
            
            <div className="flex justify-between items-end mt-4">
              <div className="flex gap-6 items-center">
                <div>
                  <p className="text-[8px] text-gray-400 uppercase font-bold leading-none mb-1">Report Period</p>
                  <p className="text-xs font-black text-black uppercase leading-none">
                    {reportPeriod} <span className="font-bold text-gray-600 ml-1">
                      ({formattedDateSelected})
                    </span>
                  </p>
                </div>
                <div className="w-px h-6 bg-gray-200"></div>
                <div>
                  <p className="text-[8px] text-gray-400 uppercase font-bold leading-none mb-1">Report Type</p>
                  <p className="text-xs font-black text-black uppercase leading-none">{viewMode === "summary" ? "Executive Summary" : "Detailed Log Monitor"}</p>
                </div>
              </div>
            </div>
          </div>

          {viewMode === "summary" ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 print:shadow-none print:border-none print:p-0 relative z-10">
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full border-collapse text-xs text-left text-gray-800 border border-gray-300 print:text-[10px] print:[&_th]:px-1.5 print:[&_th]:py-1 print:[&_td]:px-1.5 print:[&_td]:py-1">
                  <thead>
                    <tr className="bg-blue-50 border-b border-gray-300 text-gray-900 font-bold uppercase" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                      <th className="border border-gray-300 px-2 py-2 text-center w-10">NO.</th>
                      <th className="border border-gray-300 px-3 py-2 min-w-[200px]">CATEGORY DESCRIPTION</th>
                      <th className="border border-gray-300 px-3 py-2 min-w-[200px]">TYPE OF EXPENSE</th>
                      <th className="border border-gray-300 px-3 py-2 text-right min-w-[150px]">TOTAL AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(categorySummaries)
                      .sort((a, b) => {
                         const idxA = CATEGORIES.indexOf(a);
                         const idxB = CATEGORIES.indexOf(b);
                         if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                         if (idxA !== -1) return -1;
                         if (idxB !== -1) return 1;
                         return a.localeCompare(b);
                      })
                      .map((cat, idx) => {
                      const amount = categorySummaries[cat] || 0;
                      return (
                        <tr 
                          key={cat} 
                          onClick={() => setSelectedOverheadCategory(cat)}
                          className="border-b border-gray-300 transition-colors bg-white hover:bg-blue-50/50 font-medium group cursor-pointer"
                          title={`Click to view breakdown of ${cat}`}
                        >
                          <td className="border border-gray-300 px-2 py-2.5 text-center font-bold text-gray-700">{idx + 1}</td>
                          <td className="border border-gray-300 px-3 py-2.5 font-extrabold text-gray-900 group-hover:text-blue-700 transition-colors">{cat}</td>
                          <td className="border border-gray-300 px-3 py-2.5 text-[10px] text-gray-700 uppercase font-semibold leading-tight">{CATEGORY_DESCRIPTIONS[cat] || "CUSTOM EXPENSE CATEGORY"}</td>
                          <td className="border border-gray-300 px-3 py-2.5 text-right font-mono font-extrabold text-rose-800">
                            {amount > 0 ? `₱${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-rose-50 border-t border-rose-300 font-black text-rose-900 text-sm">
                      <td colSpan={3} className="border border-rose-200 px-4 py-3 text-right uppercase tracking-wider">
                        {selectedFilterCategory === "ALL" ? "GRAND TOTAL OVERHEAD EXPENSES" : `TOTAL ${selectedFilterCategory}`}
                      </td>
                      <td className="border border-rose-200 px-3 py-3 text-right font-mono text-base text-rose-700 font-black">
                        ₱{totalFilteredAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                    {selectedFilterCategory === "ALL" && (
                      <>
                        <tr 
                          className="bg-emerald-50 border-t border-emerald-200 font-black text-gray-900 text-sm hover:bg-emerald-100 transition-colors cursor-pointer group"
                          onClick={() => setSelectedOverheadCategory("REVENUE")}
                          title="Click to view Trip & Sales Revenue breakdown"
                        >
                          <td colSpan={3} className="border border-emerald-200 px-4 py-3 text-right uppercase tracking-wider text-emerald-900 group-hover:text-emerald-800">TRIP REVENUE</td>
                          <td className="border border-emerald-200 px-3 py-3 text-right font-mono text-base text-emerald-700 font-black">
                            ₱{tripRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                        {salesRevenue > 0 && (
                          <tr 
                            className="bg-emerald-50 font-black text-gray-900 text-sm hover:bg-emerald-100 transition-colors cursor-pointer group"
                            onClick={() => setSelectedOverheadCategory("REVENUE")}
                            title="Click to view Trip & Sales Revenue breakdown"
                          >
                            <td colSpan={3} className="border border-emerald-200 px-4 py-3 text-right uppercase tracking-wider text-emerald-900 group-hover:text-emerald-800">OTHER SALES REVENUE</td>
                            <td className="border border-emerald-200 px-3 py-3 text-right font-mono text-base text-emerald-700 font-black">
                              ₱{salesRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        )}
                        <tr className="bg-blue-100 border-t-2 border-blue-400 font-black text-gray-900 text-sm">
                          <td colSpan={3} className="border border-blue-300 px-4 py-4 text-right uppercase tracking-wider text-blue-900">NET PROFIT (REVENUE - EXPENSES)</td>
                          <td className="border border-blue-300 px-3 py-4 text-right font-mono text-lg text-blue-800 font-black">
                            ₱{netProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>

                <div className="mt-12 pt-6 grid grid-cols-3 gap-8 text-xs font-bold text-gray-800 border-t border-gray-200 print:mt-8">
                  <div><p className="mb-10">PREPARED BY:</p><div className="border-b border-gray-800 w-4/5"></div></div>
                  <div><p className="mb-10">NOTED BY:</p><div className="border-b border-gray-800 w-4/5"></div></div>
                  <div><p className="mb-10">APPROVED BY:</p><div className="border-b border-gray-800 w-4/5"></div></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-none print:overflow-visible relative z-10">
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full border-collapse text-sm text-left text-gray-700 [&_th]:border [&_th]:border-gray-200 [&_td]:border [&_td]:border-gray-200 print:text-[10px] print:[&_th]:px-1 print:[&_th]:py-1 print:[&_td]:px-1 print:[&_td]:py-1">
                  <thead className="text-xs text-gray-700 bg-blue-50 border-b border-blue-200 uppercase font-bold" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                    <tr>
                      <th className="px-2 py-2 text-[10px]">NO.</th>
                      <th className="px-2 py-2 text-[10px]">DATE</th>
                      <th className="px-2 py-2 text-[10px]">CATEGORY</th>
                      <th className="px-2 py-2 text-[10px] min-w-[200px]">DESCRIPTION</th>
                      <th className="px-2 py-2 text-[10px]">CHARGE TO</th>
                      <th className="px-2 py-2 text-[10px]">UNIT / PLATE</th>
                      <th className="px-2 py-2 text-[10px] text-right">AMOUNT</th>
                      <th className="px-2 py-2 text-[10px] text-center print:hidden">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unifiedExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-gray-500">No expenses found for this period.</td>
                      </tr>
                    ) : (
                      unifiedExpenses.map((expense, index) => (
                        <tr 
                          key={index} 
                          className={`border-b border-gray-100 hover:bg-rose-50/40 cursor-pointer ${
                            isDeleting === expense.id ? "opacity-0 scale-95 bg-rose-100" : ""
                          } transition-all duration-300`}
                          onClick={() => {
                            if (expense.sourceTrip) {
                              setInspectingTrip(expense.sourceTrip);
                            } else if (expense.isManual && expense.rawManualRecord) {
                              setInspectingManualRecord(expense.rawManualRecord);
                            } else {
                              setSelectedOverheadCategory(expense.category);
                            }
                          }}
                        >
                          <td className="px-2 py-2 font-mono text-[11px] text-gray-500">{index + 1}</td>
                          <td className="px-2 py-2 whitespace-nowrap text-[11px]">{format(parseISO(expense.date), "MMM dd, yyyy")}</td>
                          <td className="px-2 py-2 font-semibold text-blue-700 text-[11px] whitespace-nowrap">{expense.category}</td>
                          <td className="px-2 py-2 text-gray-900 text-xs">{expense.desc}</td>
                          <td className="px-2 py-2 font-medium text-gray-800 text-[11px]">{expense.charge}</td>
                          <td className="px-2 py-2 font-mono text-gray-600 text-[11px]">{expense.unit !== "-" ? `${expense.unit} (${expense.plate})` : "-"}</td>
                          <td className="px-2 py-2 font-mono text-gray-900 font-bold text-right text-[11px]">
                            {expense.amount > 0 ? `₱${expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}
                          </td>
                          <td className="px-2 py-2 text-center print:hidden">
                            {expense.isManual && (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingManualRecord(expense.rawManualRecord);
                                  }}
                                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                >
                                  <Wrench className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRecordToDelete(expense.id!);
                                  }}
                                  className="p-1 text-rose-600 hover:bg-rose-100 rounded"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {unifiedExpenses.length > 0 && (
                    <tbody className="bg-rose-50/50 font-bold border-t-2 border-gray-200">
                      <tr className="border-b border-rose-100">
                        <td colSpan={6} className="px-4 py-3 text-right text-rose-900 uppercase font-black">
                          {reportPeriod === 'daily' ? 'Daily' : reportPeriod === 'weekly' ? 'Weekly' : reportPeriod === 'monthly' ? 'Monthly' : reportPeriod === 'yearly' ? 'Yearly' : 'Overall'} Total {selectedFilterCategory === "ALL" ? "Expenses" : selectedFilterCategory}:
                        </td>
                        <td className="px-4 py-3 text-right text-lg font-mono text-rose-700 whitespace-nowrap font-black">
                          ₱ {totalFilteredAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                      {selectedFilterCategory === "ALL" && (
                        <>
                          <tr className="bg-emerald-50 border-t border-emerald-200">
                            <td colSpan={6} className="px-4 py-3 text-right text-emerald-900 uppercase">
                              {reportPeriod === 'daily' ? 'Daily' : reportPeriod === 'weekly' ? 'Weekly' : reportPeriod === 'monthly' ? 'Monthly' : reportPeriod === 'yearly' ? 'Yearly' : 'Overall'} Trip Revenue:
                            </td>
                            <td className="px-4 py-3 text-right text-lg text-emerald-700 whitespace-nowrap">
                              ₱ {tripRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                          {salesRevenue > 0 && (
                            <tr className="bg-emerald-50">
                              <td colSpan={6} className="px-4 py-3 text-right text-emerald-900 uppercase">
                                Other Sales Revenue:
                              </td>
                              <td className="px-4 py-3 text-right text-lg text-emerald-700 whitespace-nowrap">
                                ₱ {salesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          )}
                          <tr className="bg-blue-100 border-t-2 border-blue-400">
                            <td colSpan={6} className="px-4 py-4 text-right text-blue-900 uppercase font-black tracking-wider">
                              NET PROFIT (REVENUE - EXPENSES):
                            </td>
                            <td className="px-4 py-4 text-right text-xl text-blue-800 font-black whitespace-nowrap">
                              ₱ {netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  )}
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals & Inspectors (Rendered OUTSIDE the main printable page div) */}
      {inspectingTrip && (
        <TripInspectorModal
          trip={inspectingTrip}
          onClose={() => setInspectingTrip(null)}
          onPrint={(trip) => {
            setInspectingTrip(null);
            setViewingPaperTrip(trip);
          }}
        />
      )}
      
      {viewingPaperTrip && (
        <div
          onClick={() => setViewingPaperTrip(null)}
          className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto cursor-pointer print:p-0 print:bg-white print:static print:overflow-visible print:block"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-4xl max-h-[95vh] overflow-y-auto print:max-h-none print:overflow-visible print:w-full print:max-w-none cursor-default"
          >
            <DigitalPaperForm
              trip={viewingPaperTrip}
              onClose={() => setViewingPaperTrip(null)}
            />
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
            className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-blue-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-extrabold uppercase rounded">
                    Overhead Audit
                  </span>
                  <h3 className="text-base font-extrabold tracking-tight">
                    {selectedOverheadCategory === "ALL" ? "All Overhead Expenses" : selectedOverheadCategory === "REVENUE" ? "Trip Revenue/Sales Inspector" : `Category Inspector: ${selectedOverheadCategory}`}
                  </h3>
                </div>
                <p className="text-xs text-blue-200 mt-0.5">
                  {selectedOverheadCategory === "REVENUE" ? "Breakdown of all trip and sales revenue generated for selected period" : `Breakdown of ${selectedOverheadCategory === "ALL" ? "all disbursements" : `all ${selectedOverheadCategory === "ASSET SALES" ? "sales revenue" : "disbursements"} under ${selectedOverheadCategory}`} for selected period`}
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
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                  <span className="text-[10px] font-extrabold text-gray-500 uppercase block tracking-wider">{selectedOverheadCategory === "REVENUE" ? "Revenue Type" : "Overhead Category"}</span>
                  <span className="text-sm font-black text-gray-900 mt-0.5 block">{selectedOverheadCategory === "REVENUE" ? "FREIGHT & SALES" : selectedOverheadCategory === "ALL" ? "ALL CATEGORIES" : selectedOverheadCategory}</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <span className="text-[10px] font-extrabold text-blue-900 uppercase block tracking-wider">{selectedOverheadCategory === "REVENUE" ? "Trips & Sales" : "Disbursement Count"}</span>
                  <span className="text-sm font-black text-blue-900 mt-0.5 block">{selectedOverheadCategory === "REVENUE" ? reportTrips.length + reportManualEntriesList.filter((m: any) => m.type === "Sale").length : selectedCategoryTrips.length} {selectedOverheadCategory === "REVENUE" ? "Records" : "Record Items"}</span>
                </div>
                <div className={`${(selectedOverheadCategory === "REVENUE" || selectedOverheadCategory === "ASSET SALES") ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"} border p-3 rounded-lg`}>
                  <span className={`text-[10px] font-extrabold uppercase block tracking-wider ${(selectedOverheadCategory === "REVENUE" || selectedOverheadCategory === "ASSET SALES") ? "text-emerald-900" : "text-rose-900"}`}>{(selectedOverheadCategory === "REVENUE" || selectedOverheadCategory === "ASSET SALES") ? "Total Revenue" : "Subtotal Disbursed"}</span>
                  <span className={`text-base font-black font-mono mt-0.5 block ${(selectedOverheadCategory === "REVENUE" || selectedOverheadCategory === "ASSET SALES") ? "text-emerald-700" : "text-rose-800"}`}>
                    ₱{(selectedOverheadCategory === "REVENUE" ? totalRevenue : selectedCategoryTotal).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                  </span>
                </div>
              </div>

              {/* Table of Items */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs font-sans border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold uppercase text-[10px]">
                      <th className="p-2.5">Date</th>
                      {selectedOverheadCategory === "ALL" && <th className="p-2.5">Category</th>}
                      <th className="p-2.5">Vehicle Details</th>
                      <th className="p-2.5">{selectedOverheadCategory === "REVENUE" ? "Customer" : "Charge To"}</th>
                      <th className="p-2.5">{selectedOverheadCategory === "REVENUE" ? "Route" : "Item Description"}</th>
                      <th className="p-2.5 text-right font-black">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedOverheadCategory === "REVENUE" ? (
                      <>
                        {reportTrips.map((t, idx) => (
                          <tr 
                            key={`trip-${idx}`} 
                            className="bg-white hover:bg-blue-50/50 transition-colors group cursor-pointer"
                            onClick={() => {
                              setSelectedOverheadCategory(null);
                              setInspectingTrip(t);
                            }}
                          >
                            <td className="p-2.5 text-gray-800 whitespace-nowrap font-medium">
                              {format(parseISO(t.dateOfTravel.split("T")[0]), "MMM dd, yyyy")}
                            </td>
                            <td className="p-2.5 font-bold text-gray-900">
                              {t.unit} <span className="font-mono text-gray-500 font-normal">({t.plateNo})</span>
                            </td>
                            <td className="p-2.5 text-gray-800 text-[11px] font-semibold">{t.customerName}</td>
                            <td className="p-2.5 text-gray-600 text-[10px] uppercase truncate max-w-[150px]">{t.destination}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                              ₱{(Number(t.rate) || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                            </td>
                          </tr>
                        ))}
                        {reportManualEntriesList.filter((m: any) => m.type === "Sale").map((sale: any, idx: number) => (
                          <tr 
                            key={`sale-${idx}`} 
                            className="bg-emerald-50/30 hover:bg-emerald-50/80 transition-colors group cursor-pointer"
                            onClick={() => {
                              setSelectedOverheadCategory(null);
                              setInspectingManualRecord(sale);
                            }}
                          >
                            <td className="p-2.5 text-gray-800 whitespace-nowrap font-medium">
                              {format(new Date(sale.date), "MMM dd, yyyy")}
                            </td>
                            <td className="p-2.5 font-bold text-gray-900">
                              {sale.unitVehicle !== "-" ? sale.unitVehicle : "N/A"} <span className="font-mono text-gray-500 font-normal">({sale.plateNo !== "-" ? sale.plateNo : "N/A"})</span>
                            </td>
                            <td className="p-2.5 text-gray-800 text-[11px] font-semibold">{sale.chargeTo !== "-" ? sale.chargeTo : sale.suppliersName !== "-" ? sale.suppliersName : "Manual Sale"}</td>
                            <td className="p-2.5 text-gray-600 text-[10px] uppercase truncate max-w-[150px]"><span className="text-emerald-700 font-bold">[SALE]</span> {sale.expenseDescription || sale.category}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                              ₱{(Number(sale.amount) || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                            </td>
                          </tr>
                        ))}
                      </>
                    ) : (
                      (selectedOverheadCategory === "ALL" ? unifiedExpenses : selectedCategoryTrips).map((item, idx) => (
                        <tr 
                          key={idx} 
                          className={`bg-white hover:bg-blue-50/50 transition-colors group ${item.sourceTrip ? 'cursor-pointer' : ''}`}
                          onClick={() => {
                            if (item.sourceTrip) {
                              setSelectedOverheadCategory(null);
                              setInspectingTrip(item.sourceTrip);
                            }
                          }}
                        >
                          <td className="p-2.5 text-gray-800 whitespace-nowrap font-medium">
                            {format(parseISO(item.date), "MMM dd, yyyy")}
                          </td>
                          {selectedOverheadCategory === "ALL" && (
                            <td className="p-2.5 font-bold text-blue-700 text-[10px]">{item.category}</td>
                          )}
                          <td className="p-2.5 font-bold text-gray-900">
                            {item.unit} <span className="font-mono text-gray-500 font-normal">({item.plate})</span>
                          </td>
                          <td className="p-2.5 text-gray-800 text-[11px] font-semibold">{item.charge}</td>
                          <td className="p-2.5 text-gray-600 text-[10px] uppercase truncate max-w-[150px]">{item.desc}</td>
                          <td className={`p-2.5 text-right font-mono font-bold ${selectedOverheadCategory === "ASSET SALES" ? "text-emerald-700" : "text-rose-800"}`}>
                            ₱{item.amount.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                          </td>
                        </tr>
                      ))
                    )}
                    
                    {selectedOverheadCategory === "REVENUE" && reportTrips.length === 0 && reportManualEntriesList.filter((m: any) => m.type === "Sale").length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-gray-400 italic">
                          No trips or sales recorded for this period.
                        </td>
                      </tr>
                    )}
                    
                    {selectedOverheadCategory !== "REVENUE" && (selectedOverheadCategory === "ALL" ? unifiedExpenses : selectedCategoryTrips).length === 0 && (
                      <tr>
                        <td colSpan={selectedOverheadCategory === "ALL" ? 6 : 5} className="p-6 text-center text-gray-400 italic">
                          No {selectedOverheadCategory === "ASSET SALES" ? "revenue" : "disbursements"} recorded under {selectedOverheadCategory === "ALL" ? "any category" : selectedOverheadCategory} for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-500 italic">
                Tip: Click any trip row in this table to open the full Trip Record Inspector.
              </span>
              <button
                onClick={() => setSelectedOverheadCategory(null)}
                className="px-4 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close Category Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {(isAddModalOpen || editingManualRecord) && (
        <AddReportRecordModal
          editData={editingManualRecord}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingManualRecord(null);
          }}
          onSave={() => {
            setIsAddModalOpen(false);
            setEditingManualRecord(null);
            loadData();
          }}
        />
      )}

      {inspectingManualRecord && (
        <ManualRecordInspectorModal
          record={inspectingManualRecord}
          onClose={() => setInspectingManualRecord(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Delete Record?</h3>
              <p className="text-sm text-slate-500 font-medium mb-6">
                Are you sure you want to permanently delete this manual record? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setRecordToDelete(null)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteManualRecord(recordToDelete)}
                  className="flex-1 px-4 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-sm shadow-rose-600/30"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
