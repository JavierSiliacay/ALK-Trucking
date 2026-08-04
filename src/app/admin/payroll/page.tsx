"use client";

import React, { useState, useMemo } from "react";
import { useTrips, Trip } from "@/lib/trips-store";
import { PageShell } from "@/components/ui/PageShell";
import TripInspectorModal from "@/components/trips/TripInspectorModal";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { User, Calendar, DollarSign, MapPin, Truck, Printer } from "lucide-react";

type Period = "daily" | "monthly" | "yearly" | "overall";

export default function CrewSettlementsPage() {
  const { trips, masterData, isLoaded } = useTrips();

  const [selectedRole, setSelectedRole] = useState<"Driver" | "Helper">("Driver");
  const [selectedCrew, setSelectedCrew] = useState<string>("");
  const [filterPeriod, setFilterPeriod] = useState<Period>("monthly");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const [deductions, setDeductions] = useState<number>(0);
  const [bonus, setBonus] = useState<number>(0);

  const [inspectingTrip, setInspectingTrip] = useState<Trip | null>(null);

  const availableYears = [2024, 2025, 2026, 2027];
  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Derive active crew members from trips, just in case masterData is empty or not matching
  const activeCrewMembers = useMemo(() => {
    const list = new Set<string>();
    trips.forEach(t => {
      if (selectedRole === "Driver" && t.driver) list.add(t.driver);
      if (selectedRole === "Helper") {
        if (t.helper1) list.add(t.helper1);
        if (t.helper2) list.add(t.helper2);
      }
    });
    // Fallback to master data if list is empty
    const masterList = selectedRole === "Driver" ? masterData?.drivers : masterData?.helpers;
    if (list.size === 0 && masterList) {
      masterList.forEach(n => list.add(n));
    }
    return Array.from(list).sort();
  }, [trips, selectedRole, masterData]);

  // Auto-select first crew member when list changes
  React.useEffect(() => {
    if (activeCrewMembers.length > 0 && !activeCrewMembers.includes(selectedCrew)) {
      setSelectedCrew(activeCrewMembers[0]);
    }
  }, [activeCrewMembers, selectedCrew]);

  // Filter trips for the selected crew member and date range
  const crewTrips = useMemo(() => {
    if (!selectedCrew) return [];

    return trips.filter(t => {
      // 1. Crew match
      let isMatch = false;
      if (selectedRole === "Driver") isMatch = t.driver === selectedCrew;
      if (selectedRole === "Helper") isMatch = (t.helper1 === selectedCrew || t.helper2 === selectedCrew);
      if (!isMatch) return false;

      // 2. Date match
      const dateStr = t.completedAt ? t.completedAt.split("T")[0] : t.dateOfTravel;
      const tDate = new Date(dateStr);

      if (filterPeriod === "monthly") {
        return tDate.getMonth() === selectedMonth && tDate.getFullYear() === selectedYear;
      }
      if (filterPeriod === "yearly") {
        return tDate.getFullYear() === selectedYear;
      }
      return true; // overall
    });
  }, [trips, selectedCrew, selectedRole, filterPeriod, selectedMonth, selectedYear]);

  // Calculate total allowances earned from these trips
  const accruedAllowances = useMemo(() => {
    let total = 0;
    crewTrips.forEach(t => {
      t.expenses.forEach(e => {
        const cat = (e.category || "").toUpperCase();
        if (selectedRole === "Driver" && (cat === "DRIVER RATE" || cat.includes("DRIVER"))) {
          total += Number(e.amount) || 0;
        } else if (selectedRole === "Helper" && (cat === "HELPER 1 RATE" || cat === "HELPER 2 RATE" || cat === "STRIPPER" || cat.includes("HELPER"))) {
          total += Number(e.amount) || 0;
        }
      });
    });
    return total;
  }, [crewTrips, selectedRole]);

  const netPayout = accruedAllowances + bonus - deductions;

  const handlePrint = () => {
    window.print();
  };

  if (!isLoaded) return <PageShell title="Loading Payroll..."><div>Loading...</div></PageShell>;

  return (
    <PageShell title="Crew Payroll & Settlements">
      {/* 
        ========================================================
        NO-PRINT CONTROL TOOLBAR
        ========================================================
      */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6 no-print bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">

        {/* Role & Crew Selection */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value as "Driver" | "Helper");
                setSelectedCrew("");
              }}
              className="px-3 py-2 border-2 border-slate-300 rounded-xl text-sm font-extrabold text-[#00193c] bg-white outline-none focus:border-[#00193c]"
            >
              <option value="Driver">Driver</option>
              <option value="Helper">Helper</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select {selectedRole}</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={selectedCrew}
                onChange={(e) => setSelectedCrew(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border-2 border-slate-300 rounded-xl text-sm font-extrabold text-[#00193c] bg-white outline-none focus:border-[#00193c]"
              >
                <option value="" disabled>Select Name</option>
                {activeCrewMembers.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Date Filter */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payroll Period</label>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border-2 border-slate-300">
            <Calendar className="w-4 h-4 text-slate-500" />
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value as Period)}
              className="text-sm font-bold text-[#00193c] outline-none bg-transparent"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="overall">Overall</option>
            </select>

            {filterPeriod === "monthly" && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="text-sm font-bold text-[#00193c] outline-none bg-transparent"
              >
                {MONTH_NAMES.map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
            )}

            {(filterPeriod === "monthly" || filterPeriod === "yearly") && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="text-sm font-bold text-[#00193c] outline-none bg-transparent"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-1.5 shrink-0 justify-end">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-[#00193c] hover:bg-blue-900 text-white rounded-xl font-extrabold text-sm shadow-md transition-all active:scale-95 h-[42px]"
          >
            <Printer className="w-4 h-4" />
            Print Settlement
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6 no-print">
        {/* Adjustments Editor */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4 flex-1">
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Cash Advances / Deductions</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₱</span>
              <CurrencyInput
                placeholder="0.00"
                value={deductions === 0 ? "" : deductions}
                onChange={(val) => setDeductions(val === "" ? 0 : val)}
                className="w-full pl-9 pr-3 py-2 border-2 border-slate-300 rounded-lg text-sm font-bold text-rose-700 outline-none focus:border-rose-500 bg-rose-50/30"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Bonuses / Adjustments</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₱</span>
              <CurrencyInput
                placeholder="0.00"
                value={bonus === 0 ? "" : bonus}
                onChange={(val) => setBonus(val === "" ? 0 : val)}
                className="w-full pl-9 pr-3 py-2 border-2 border-slate-300 rounded-lg text-sm font-bold text-emerald-700 outline-none focus:border-emerald-500 bg-emerald-50/30"
              />
            </div>
          </div>
        </div>
      </div>


      {/* 
        ========================================================
        PRINTABLE PAYSLIP / SETTLEMENT SHEET
        ========================================================
      */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 print:p-0 print:border-none print:shadow-none min-h-[500px]">
        {/* Printable CSS overrides */}
        <style>{`
          @media print {
            @page { size: portrait; margin: 15mm; }
            body { font-size: 12px; color: #000; }
            .no-print { display: none !important; }
            .print-border-black { border-color: #000 !important; }
            .print-bg-gray { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-[#00193c] print:border-black pb-4 mb-6">
          <div className="flex items-center gap-4">
            <img src="/alk_logo.jpg" alt="ALK Logo" className="h-16 w-auto object-contain rounded" />
            <div>
              <h1 className="text-2xl font-black text-[#00193c] print:text-black uppercase tracking-tight">ALK Trucking Services</h1>
              <p className="text-sm font-semibold text-slate-600 print:text-black">CREW PAYROLL & SETTLEMENT SHEET</p>
              <p className="text-xs font-bold text-slate-500 mt-1 uppercase">
                As of: {filterPeriod === "monthly" ? `${MONTH_NAMES[selectedMonth]} ${selectedYear}` : filterPeriod === "yearly" ? `YEAR ${selectedYear}` : "OVERALL"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-500 uppercase">Period</p>
            <p className="text-lg font-black text-[#00193c] print:text-black uppercase">
              {filterPeriod === "monthly" ? `${MONTH_NAMES[selectedMonth]} ${selectedYear}` :
                filterPeriod === "yearly" ? `YEAR ${selectedYear}` : "OVERALL"}
            </p>
          </div>
        </div>

        {/* Staff Details */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="border-2 border-slate-200 print-border-black rounded-lg overflow-hidden">
            <div className="bg-slate-100 print-bg-gray px-4 py-2 border-b-2 border-slate-200 print-border-black">
              <p className="text-xs font-bold text-slate-600 print:text-black uppercase tracking-wider">{selectedRole} NAME</p>
            </div>
            <div className="px-4 py-3 bg-white">
              <p className="text-xl font-black text-slate-900">{selectedCrew || "No Name Selected"}</p>
            </div>
          </div>
          <div className="border-2 border-slate-200 print-border-black rounded-lg overflow-hidden">
            <div className="bg-slate-100 print-bg-gray px-4 py-2 border-b-2 border-slate-200 print-border-black">
              <p className="text-xs font-bold text-slate-600 print:text-black uppercase tracking-wider">DATE GENERATED</p>
            </div>
            <div className="px-4 py-3 bg-white">
              <p className="text-xl font-black text-slate-900">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Trip History Table */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-slate-800 uppercase mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4" /> Trip History Breakdown
          </h2>
          {crewTrips.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-semibold border-2 border-dashed border-slate-300 rounded-xl">
              No trips recorded for this period.
            </div>
          ) : (
            <table className="w-full text-left border-collapse border-2 border-slate-900 print-border-black">
              <thead>
                <tr className="bg-slate-100 print-bg-gray border-b-2 border-slate-900 print-border-black text-[11px] font-extrabold text-slate-900 uppercase">
                  <th className="p-2.5 border-r border-slate-900 print-border-black w-[15%]">Date</th>
                  <th className="p-2.5 border-r border-slate-900 print-border-black w-[15%]">Trip / PR #</th>
                  <th className="p-2.5 border-r border-slate-900 print-border-black w-[25%]">Route</th>
                  <th className="p-2.5 border-r border-slate-900 print-border-black w-[20%]">Truck</th>
                  <th className="p-2.5 text-right w-[25%] text-emerald-700 print:text-black">Rate Earned</th>
                </tr>
              </thead>
              <tbody className="text-[12px] font-semibold divide-y divide-slate-300">
                {crewTrips.map(t => {
                  const dateStr = t.completedAt ? new Date(t.completedAt).toLocaleDateString() : t.dateOfTravel;
                  // Calculate specific rate for this trip
                  let tripAllowance = 0;
                  t.expenses.forEach(e => {
                    const cat = (e.category || "").toUpperCase();
                    if (selectedRole === "Driver" && (cat === "DRIVER RATE" || cat.includes("DRIVER"))) {
                      tripAllowance += Number(e.amount) || 0;
                    }
                    if (selectedRole === "Helper" && (cat === "HELPER 1 RATE" || cat === "HELPER 2 RATE" || cat === "STRIPPER" || cat.includes("HELPER"))) {
                      tripAllowance += Number(e.amount) || 0;
                    }
                  });

                  return (
                    <tr
                      key={t.id}
                      onClick={() => setInspectingTrip(t)}
                      className="hover:bg-slate-100 border-b border-slate-300 print-border-black cursor-pointer transition-colors"
                    >
                      <td className="p-2.5 border-r border-slate-300 print-border-black">{dateStr}</td>
                      <td className="p-2.5 border-r border-slate-300 print-border-black font-mono">{t.seqNo || t.id}</td>
                      <td className="p-2.5 border-r border-slate-300 print-border-black">{t.origin || "CDO"} → {t.destination}</td>
                      <td className="p-2.5 border-r border-slate-300 print-border-black font-mono">{t.unit} ({t.plateNo})</td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-600 print:text-black">₱{tripAllowance.toLocaleString()}.00</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Financial Summary */}
        <div className="flex justify-end mb-12">
          <div className="w-full md:w-[400px] border-2 border-slate-900 print-border-black rounded-lg overflow-hidden font-mono">
            <div className="flex justify-between items-center p-3 border-b border-slate-900 print-border-black bg-white">
              <span className="text-xs font-bold text-slate-600 print:text-black uppercase">Gross Accrued Wages:</span>
              <span className="text-sm font-black text-slate-900">₱{accruedAllowances.toLocaleString()}.00</span>
            </div>

            {bonus > 0 && (
              <div className="flex justify-between items-center p-3 border-b border-slate-900 print-border-black bg-emerald-50/50">
                <span className="text-xs font-bold text-emerald-700 print:text-black uppercase">Add: Bonuses / Adjustments</span>
                <span className="text-sm font-black text-emerald-700 print:text-black">+ ₱{bonus.toLocaleString()}.00</span>
              </div>
            )}

            {deductions > 0 && (
              <div className="flex justify-between items-center p-3 border-b border-slate-900 print-border-black bg-rose-50/50">
                <span className="text-xs font-bold text-rose-700 print:text-black uppercase">Less: Cash Advances / Ded.</span>
                <span className="text-sm font-black text-rose-700 print:text-black">- ₱{deductions.toLocaleString()}.00</span>
              </div>
            )}

            <div className="flex justify-between items-center p-4 bg-slate-100 print-bg-gray border-t-2 border-slate-900 print-border-black">
              <span className="text-sm font-black text-[#00193c] print:text-black uppercase tracking-widest">NET PAYOUT:</span>
              <span className="text-xl font-black text-[#00193c] print:text-black">₱{netPayout.toLocaleString()}.00</span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-16 mt-24">
          <div className="text-center">
            <div className="border-t-2 border-slate-900 print-border-black pt-2">
              <p className="text-slate-900 print:text-black font-black text-sm uppercase tracking-wide">
                RECEIVED BY: {selectedCrew || "NAME"}
              </p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t-2 border-slate-900 print-border-black pt-2">
              <p className="text-slate-900 print:text-black font-black text-sm uppercase tracking-wide">
                PREPARED BY: VIRGIE AGBONG
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Trip Inspector Modal */}
      <TripInspectorModal
        trip={inspectingTrip}
        onClose={() => setInspectingTrip(null)}
      />
    </PageShell>
  );
}
