"use client";

import React, { useState } from "react";
import { DollarSign, Eye, Edit, Trash2, ArrowRight } from "lucide-react";
import { PageShell, TableShell, Pagination, StatusBadge } from "@/components/ui/PageShell";

const COST_TYPES = ["Fuel", "Toll Fee", "Driver Allowance", "Helper Allowance", "Loading Fee", "Other"];

const MOCK_COSTING = [
  { id: "CST-001", tripId: "TRP-001", truck: "ALK-001", route: "CDO → Iligan City", date: "Jul 6", quotation: 8500, fuel: 2800, toll: 200, driverAllowance: 500, helperAllowance: 300, loadingFee: 400, other: 0,   status: "In Transit" },
  { id: "CST-002", tripId: "TRP-002", truck: "ALK-003", route: "CDO → Bukidnon",    date: "Jul 6", quotation: 12000, fuel: 3900, toll: 300, driverAllowance: 600, helperAllowance: 400, loadingFee: 500, other: 1100, status: "Delivered" },
  { id: "CST-003", tripId: "TRP-004", truck: "ALK-002", route: "CDO → Ozamiz",      date: "Jul 6", quotation: 15000, fuel: 5200, toll: 450, driverAllowance: 800, helperAllowance: 500, loadingFee: 750, other: 500,  status: "In Transit" },
  { id: "CST-004", tripId: "TRP-005", truck: "ALK-005", route: "CDO → Gingoog",     date: "Jul 5", quotation: 7200,  fuel: 2400, toll: 150, driverAllowance: 500, helperAllowance: 300, loadingFee: 350, other: 200,  status: "Delivered" },
  { id: "CST-005", tripId: "TRP-006", truck: "ALK-006", route: "CDO → Iligan City", date: "Jul 4", quotation: 9500,  fuel: 2900, toll: 200, driverAllowance: 600, helperAllowance: 350, loadingFee: 400, other: 650,  status: "Delivered" },
];

export default function CostingPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = MOCK_COSTING.filter((c) => {
    const q = search.toLowerCase();
    return c.tripId.toLowerCase().includes(q) || c.truck.toLowerCase().includes(q) || c.route.toLowerCase().includes(q);
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  const totalQuotation = MOCK_COSTING.reduce((s, c) => s + c.quotation, 0);
  const totalCost = MOCK_COSTING.reduce((s, c) => s + c.fuel + c.toll + c.driverAllowance + c.helperAllowance + c.loadingFee + c.other, 0);
  const totalProfit = totalQuotation - totalCost;

  return (
    <PageShell
      title="Costing Management"
      subtitle={`Revenue: ₱${totalQuotation.toLocaleString()} · Cost: ₱${totalCost.toLocaleString()} · Profit: ₱${totalProfit.toLocaleString()}`}
      addLabel="Add Cost Entry"
      onAdd={() => alert("Add cost entry")}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
        {[
          { label: "Total Quotation", value: `₱${totalQuotation.toLocaleString()}`, color: "text-[#1e3a8a]", bg: "bg-blue-50", icon: "📋" },
          { label: "Total Operating Cost", value: `₱${totalCost.toLocaleString()}`, color: "text-amber-600", bg: "bg-amber-50", icon: "💸" },
          { label: "Net Profit", value: `₱${totalProfit.toLocaleString()}`, color: "text-emerald-600", bg: "bg-emerald-50", icon: "💰" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-white`}>
            <p className="text-xs text-slate-500 mb-1">{s.icon} {s.label}</p>
            <p className={`text-xl font-manrope font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <TableShell
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search by trip ID, truck, or route..."
        onExport={() => alert("Export coming soon")}
        onPrint={() => window.print()}
        pagination={<Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} perPage={perPage} />}
      >
        <table className="alk-table">
          <thead>
            <tr>
              <th>Trip</th>
              <th>Truck</th>
              <th>Route</th>
              <th>Date</th>
              <th>Quotation</th>
              <th>Fuel</th>
              <th>Toll</th>
              <th>Driver Allow.</th>
              <th>Helper Allow.</th>
              <th>Loading</th>
              <th>Other</th>
              <th>Total Cost</th>
              <th>Profit</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((c) => {
              const totalCostRow = c.fuel + c.toll + c.driverAllowance + c.helperAllowance + c.loadingFee + c.other;
              const profit = c.quotation - totalCostRow;
              return (
                <tr key={c.id}>
                  <td><span className="font-mono text-xs font-bold text-[#1e3a8a]">{c.tripId}</span></td>
                  <td><span className="font-mono font-semibold text-slate-700">{c.truck}</span></td>
                  <td>
                    <span className="text-xs text-slate-600">{c.route}</span>
                  </td>
                  <td><span className="text-xs text-slate-500">{c.date}</span></td>
                  <td><span className="font-bold text-[#1e3a8a]">₱{c.quotation.toLocaleString()}</span></td>
                  <td><span className="text-slate-600 text-xs">₱{c.fuel.toLocaleString()}</span></td>
                  <td><span className="text-slate-600 text-xs">₱{c.toll.toLocaleString()}</span></td>
                  <td><span className="text-slate-600 text-xs">₱{c.driverAllowance.toLocaleString()}</span></td>
                  <td><span className="text-slate-600 text-xs">₱{c.helperAllowance.toLocaleString()}</span></td>
                  <td><span className="text-slate-600 text-xs">₱{c.loadingFee.toLocaleString()}</span></td>
                  <td><span className="text-slate-600 text-xs">₱{c.other.toLocaleString()}</span></td>
                  <td><span className="font-semibold text-amber-600">₱{totalCostRow.toLocaleString()}</span></td>
                  <td>
                    <span className={`font-bold text-sm ${profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      ₱{profit.toLocaleString()}
                    </span>
                  </td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-[#1e3a8a] transition-colors"><Eye className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-[#1e3a8a] transition-colors"><Edit className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableShell>
    </PageShell>
  );
}
