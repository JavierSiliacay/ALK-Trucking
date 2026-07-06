"use client";

import React, { useState } from "react";
import { MapPin, Eye, Edit, Trash2, ArrowRight } from "lucide-react";
import { PageShell, TableShell, Pagination, StatusBadge } from "@/components/ui/PageShell";

const MOCK_TRIPS = [
  { id: "TRP-001", truck: "ALK-001", driver: "Juan Dela Cruz",  helper: "Bryan Gomez",     customer: "Mindanao Fresh Produce Inc.", origin: "CDO",  dest: "Iligan City",  date: "Jul 6, 2026", status: "In Transit", amount: 8500,  cost: 4200 },
  { id: "TRP-002", truck: "ALK-003", driver: "Pedro Santos",    helper: "Kevin Castro",    customer: "CDO Builders Supply Corp.",   origin: "CDO",  dest: "Bukidnon",     date: "Jul 6, 2026", status: "Delivered",  amount: 12000, cost: 6800 },
  { id: "TRP-003", truck: "ALK-007", driver: "Ramon Reyes",     helper: "Allen Soriano",   customer: "Northern Mindanao Trading",   origin: "CDO",  dest: "Valencia City",date: "Jul 7, 2026", status: "Scheduled",  amount: 9800,  cost: 0 },
  { id: "TRP-004", truck: "ALK-002", driver: "Eduardo Lim",     helper: "Mark Villanueva", customer: "Cagayan Agri Ventures",       origin: "CDO",  dest: "Ozamiz",       date: "Jul 6, 2026", status: "In Transit", amount: 15000, cost: 8200 },
  { id: "TRP-005", truck: "ALK-005", driver: "Miguel Torres",   helper: "Dennis Ramos",    customer: "Pacific Cement Distributors", origin: "CDO",  dest: "Gingoog",      date: "Jul 5, 2026", status: "Delivered",  amount: 7200,  cost: 3900 },
  { id: "TRP-006", truck: "ALK-006", driver: "Carlos Reyes",    helper: "Mark Villanueva", customer: "Lanao Del Norte Fisheries",   origin: "CDO",  dest: "Iligan City",  date: "Jul 4, 2026", status: "Delivered",  amount: 9500,  cost: 5100 },
  { id: "TRP-007", truck: "ALK-008", driver: "Antonio Cruz",    helper: "Kevin Castro",    customer: "Northern Mindanao Trading",   origin: "CDO",  dest: "Bukidnon",     date: "Jul 3, 2026", status: "Delivered",  amount: 11000, cost: 6200 },
  { id: "TRP-008", truck: "ALK-003", driver: "Pedro Santos",    helper: "Bryan Gomez",     customer: "CDO Builders Supply Corp.",   origin: "CDO",  dest: "Valencia City",date: "Jul 2, 2026", status: "Cancelled",  amount: 8000,  cost: 0 },
];

export default function TripsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = MOCK_TRIPS.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = t.id.toLowerCase().includes(q) || t.truck.toLowerCase().includes(q) || t.driver.toLowerCase().includes(q) || t.customer.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  const totalRevenue = MOCK_TRIPS.filter(t => t.status === "Delivered").reduce((s, t) => s + t.amount, 0);
  const totalCost    = MOCK_TRIPS.filter(t => t.status === "Delivered").reduce((s, t) => s + t.cost, 0);

  return (
    <PageShell
      title="Trip Management"
      subtitle={`${MOCK_TRIPS.length} trips · Revenue: ₱${totalRevenue.toLocaleString()} · Cost: ₱${totalCost.toLocaleString()}`}
      addLabel="Create Trip"
      onAdd={() => alert("Create Trip modal")}
    >
      <TableShell
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search by trip ID, truck, driver, or customer..."
        onExport={() => alert("Export coming soon")}
        onPrint={() => window.print()}
        filters={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-[#1e3a8a]"
          >
            {["All", "Scheduled", "In Transit", "Delivered", "Cancelled"].map((s) => <option key={s}>{s}</option>)}
          </select>
        }
        pagination={<Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} perPage={perPage} />}
      >
        <table className="alk-table">
          <thead>
            <tr>
              <th>Trip ID</th>
              <th>Truck</th>
              <th>Driver / Helper</th>
              <th>Customer</th>
              <th>Route</th>
              <th>Date</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Cost</th>
              <th>Profit</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((t) => {
              const profit = t.amount - t.cost;
              return (
                <tr key={t.id}>
                  <td><span className="font-mono text-xs font-bold text-[#1e3a8a]">{t.id}</span></td>
                  <td><span className="font-semibold text-slate-700 font-mono">{t.truck}</span></td>
                  <td>
                    <div className="text-xs">
                      <p className="font-medium text-slate-700">{t.driver}</p>
                      <p className="text-slate-400">{t.helper}</p>
                    </div>
                  </td>
                  <td><span className="text-slate-600 text-xs leading-tight">{t.customer}</span></td>
                  <td>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="font-medium text-slate-700">{t.origin}</span>
                      <ArrowRight className="w-3 h-3 text-slate-300" />
                      <span className="font-medium text-slate-700">{t.dest}</span>
                    </div>
                  </td>
                  <td><span className="text-slate-500 text-xs">{t.date}</span></td>
                  <td><StatusBadge status={t.status} /></td>
                  <td><span className="font-semibold text-slate-700">₱{t.amount.toLocaleString()}</span></td>
                  <td><span className="font-semibold text-slate-500">₱{t.cost.toLocaleString()}</span></td>
                  <td>
                    {t.status === "Cancelled" ? (
                      <span className="text-slate-300 text-xs">—</span>
                    ) : t.cost > 0 ? (
                      <span className={`font-bold text-sm ${profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        ₱{profit.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">Pending</span>
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
              );
            })}
          </tbody>
        </table>
      </TableShell>
    </PageShell>
  );
}
