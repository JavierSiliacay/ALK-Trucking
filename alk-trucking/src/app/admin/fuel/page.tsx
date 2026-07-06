"use client";

import React, { useState } from "react";
import { Fuel, Eye, Edit, Trash2 } from "lucide-react";
import { PageShell, TableShell, Pagination } from "@/components/ui/PageShell";

const MOCK_FUEL = [
  { id: "1", truck: "ALK-001", driver: "Juan Dela Cruz",  date: "Jul 6, 2026", station: "Petron CDO",    liters: 120, pricePerLiter: 62.50, total: 7500,  odometer: "142,620 km", tripId: "TRP-001" },
  { id: "2", truck: "ALK-002", driver: "Eduardo Lim",     date: "Jul 6, 2026", station: "Shell CDO",     liters: 140, pricePerLiter: 63.00, total: 8820,  odometer: "98,340 km",  tripId: "TRP-004" },
  { id: "3", truck: "ALK-003", driver: "Pedro Santos",    date: "Jul 5, 2026", station: "Caltex Iligan", liters:  95, pricePerLiter: 62.75, total: 5961,  odometer: "215,920 km", tripId: "TRP-002" },
  { id: "4", truck: "ALK-005", driver: "Miguel Torres",   date: "Jul 5, 2026", station: "Petron CDO",    liters:  80, pricePerLiter: 62.50, total: 5000,  odometer: "67,480 km",  tripId: "TRP-005" },
  { id: "5", truck: "ALK-006", driver: "Carlos Reyes",    date: "Jul 4, 2026", station: "Total CDO",     liters: 110, pricePerLiter: 63.25, total: 6958,  odometer: "183,710 km", tripId: "TRP-006" },
  { id: "6", truck: "ALK-008", driver: "Antonio Cruz",    date: "Jul 6, 2026", station: "Petron CDO",    liters: 160, pricePerLiter: 62.50, total: 10000, odometer: "278,460 km", tripId: "TRP-007" },
];

export default function FuelPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = MOCK_FUEL.filter((f) => {
    const q = search.toLowerCase();
    return f.truck.toLowerCase().includes(q) || f.driver.toLowerCase().includes(q) || f.station.toLowerCase().includes(q);
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  const totalLiters = MOCK_FUEL.reduce((s, f) => s + f.liters, 0);
  const totalAmount = MOCK_FUEL.reduce((s, f) => s + f.total, 0);
  const avgPrice = totalAmount / totalLiters;

  return (
    <PageShell
      title="Fuel Expenses"
      subtitle={`${MOCK_FUEL.length} entries · ${totalLiters}L total · ₱${totalAmount.toLocaleString()} spent`}
      addLabel="Log Fuel"
      onAdd={() => alert("Log Fuel expense")}
    >
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
        {[
          { label: "Total Fuel (Liters)", value: `${totalLiters.toLocaleString()}L`, color: "text-[#1e3a8a]", bg: "bg-blue-50", icon: "⛽" },
          { label: "Total Fuel Cost", value: `₱${totalAmount.toLocaleString()}`, color: "text-amber-600", bg: "bg-amber-50", icon: "💸" },
          { label: "Avg. Price/Liter", value: `₱${avgPrice.toFixed(2)}`, color: "text-slate-700", bg: "bg-slate-50", icon: "📊" },
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
        searchPlaceholder="Search by truck, driver, or station..."
        onExport={() => alert("Export coming soon")}
        pagination={<Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} perPage={perPage} />}
      >
        <table className="alk-table">
          <thead>
            <tr>
              <th>Truck</th>
              <th>Driver</th>
              <th>Date</th>
              <th>Station</th>
              <th>Liters</th>
              <th>Price/L</th>
              <th>Total</th>
              <th>Odometer</th>
              <th>Trip Ref.</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((f) => (
              <tr key={f.id}>
                <td><span className="font-mono font-bold text-[#1e3a8a]">{f.truck}</span></td>
                <td><span className="text-slate-700">{f.driver}</span></td>
                <td><span className="text-slate-500 text-xs">{f.date}</span></td>
                <td><span className="text-slate-600 text-sm">{f.station}</span></td>
                <td><span className="font-bold text-slate-700">{f.liters}L</span></td>
                <td><span className="text-slate-600 text-xs">₱{f.pricePerLiter.toFixed(2)}</span></td>
                <td><span className="font-bold text-amber-600">₱{f.total.toLocaleString()}</span></td>
                <td><span className="font-mono text-xs text-slate-500">{f.odometer}</span></td>
                <td>
                  {f.tripId && (
                    <span className="font-mono text-xs text-[#1e3a8a] bg-blue-50 px-2 py-1 rounded-lg font-semibold">{f.tripId}</span>
                  )}
                </td>
                <td>
                  <div className="flex items-center justify-center gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-[#1e3a8a] transition-colors"><Eye className="w-4 h-4" /></button>
                    <button className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-[#1e3a8a] transition-colors"><Edit className="w-4 h-4" /></button>
                    <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
