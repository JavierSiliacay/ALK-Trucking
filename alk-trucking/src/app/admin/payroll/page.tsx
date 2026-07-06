"use client";

import React, { useState } from "react";
import { Wallet, Eye, Printer, Users, UserCheck } from "lucide-react";
import { PageShell, TableShell, Pagination, StatusBadge } from "@/components/ui/PageShell";

const MOCK_DRIVER_PAYROLL = [
  { id: "1", name: "Juan Dela Cruz",  period: "Jul 1–15, 2026", trips: 9,  ratePerTrip: 500, totalTrips: 4500, allowance: 800, deductions: 200, netPay: 5100, status: "Pending" },
  { id: "2", name: "Pedro Santos",    period: "Jul 1–15, 2026", trips: 8,  ratePerTrip: 500, totalTrips: 4000, allowance: 600, deductions: 150, netPay: 4450, status: "Pending" },
  { id: "3", name: "Ramon Reyes",     period: "Jul 1–15, 2026", trips: 7,  ratePerTrip: 500, totalTrips: 3500, allowance: 700, deductions: 0,   netPay: 4200, status: "Pending" },
  { id: "4", name: "Eduardo Lim",     period: "Jul 1–15, 2026", trips: 6,  ratePerTrip: 500, totalTrips: 3000, allowance: 500, deductions: 100, netPay: 3400, status: "Released" },
  { id: "5", name: "Miguel Torres",   period: "Jul 1–15, 2026", trips: 5,  ratePerTrip: 500, totalTrips: 2500, allowance: 400, deductions: 0,   netPay: 2900, status: "Released" },
  { id: "6", name: "Carlos Reyes",    period: "Jul 1–15, 2026", trips: 5,  ratePerTrip: 500, totalTrips: 2500, allowance: 600, deductions: 200, netPay: 2900, status: "Pending" },
];

export default function PayrollPage() {
  const [tab, setTab] = useState<"drivers" | "helpers">("drivers");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const data = MOCK_DRIVER_PAYROLL;
  const filtered = data.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  const totalNet = data.reduce((s, p) => s + p.netPay, 0);
  const pending = data.filter(p => p.status === "Pending").reduce((s, p) => s + p.netPay, 0);

  return (
    <PageShell
      title="Payroll"
      subtitle="Per-trip rate payroll computation"
      addLabel="Generate Payroll"
      onAdd={() => alert("Generate payroll period")}
    >
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
        {[
          { label: "Total Payable (Jul 1–15)", value: `₱${totalNet.toLocaleString()}`, color: "text-[#1e3a8a]", bg: "bg-blue-50", icon: "💰" },
          { label: "Pending Release", value: `₱${pending.toLocaleString()}`, color: "text-amber-600", bg: "bg-amber-50", icon: "⏳" },
          { label: "Released", value: `₱${(totalNet - pending).toLocaleString()}`, color: "text-emerald-600", bg: "bg-emerald-50", icon: "✅" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-white`}>
            <p className="text-xs text-slate-500 mb-1">{s.icon} {s.label}</p>
            <p className={`text-xl font-manrope font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {(["drivers", "helpers"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              tab === t ? "bg-white text-[#1e3a8a] shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "drivers" ? <UserCheck className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            {t === "drivers" ? "Drivers" : "Helpers"}
          </button>
        ))}
      </div>

      <TableShell
        search={search}
        onSearch={setSearch}
        searchPlaceholder={`Search ${tab}...`}
        onExport={() => alert("Export coming soon")}
        pagination={<Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} perPage={perPage} />}
      >
        <table className="alk-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Period</th>
              <th>Trips</th>
              <th>Rate/Trip</th>
              <th>Trip Earnings</th>
              <th>Allowance</th>
              <th>Deductions</th>
              <th>Net Pay</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1e3a8a] flex items-center justify-center text-white text-xs font-bold">
                      {p.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-slate-700">{p.name}</span>
                  </div>
                </td>
                <td><span className="text-slate-500 text-xs">{p.period}</span></td>
                <td><span className="font-bold text-[#1e3a8a]">{p.trips}</span></td>
                <td><span className="text-slate-600 text-xs">₱{p.ratePerTrip.toLocaleString()}</span></td>
                <td><span className="font-semibold text-slate-700">₱{p.totalTrips.toLocaleString()}</span></td>
                <td><span className="text-emerald-600 font-medium">+₱{p.allowance.toLocaleString()}</span></td>
                <td><span className="text-red-500 font-medium">{p.deductions > 0 ? `-₱${p.deductions.toLocaleString()}` : "—"}</span></td>
                <td><span className="font-bold text-lg text-[#1e3a8a]">₱{p.netPay.toLocaleString()}</span></td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
                <td>
                  <div className="flex items-center justify-center gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-[#1e3a8a] transition-colors"><Eye className="w-4 h-4" /></button>
                    <button title="Print Slip" className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-[#1e3a8a] transition-colors"><Printer className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </PageShell>
  );
}
