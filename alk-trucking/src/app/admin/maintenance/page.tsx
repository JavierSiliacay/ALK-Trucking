"use client";

import React, { useState } from "react";
import { Wrench, Eye, Edit, Trash2, AlertTriangle } from "lucide-react";
import { PageShell, TableShell, Pagination, StatusBadge } from "@/components/ui/PageShell";

const MAINTENANCE_TYPES = ["Preventive Maintenance (PMS)", "Oil Change", "Tire Rotation", "Brake Service", "Engine Repair", "Electrical", "Body Repair", "Other"];

const MOCK_MAINTENANCE = [
  { id: "1", truck: "ALK-004", type: "Engine Repair",    date: "Jul 1, 2026",  provider: "CDO Auto Repair Center", cost: 18500, desc: "Engine overhaul — blown head gasket",  status: "Maintenance", nextSched: "Aug 1, 2026" },
  { id: "2", truck: "ALK-001", type: "Oil Change",       date: "Jun 25, 2026", provider: "Petron Service Center",   cost: 2800,  desc: "Full synthetic oil change 10W-40",    status: "Active",      nextSched: "Sep 25, 2026" },
  { id: "3", truck: "ALK-008", type: "Tire Rotation",    date: "Jun 20, 2026", provider: "Bridgestone CDO",         cost: 1500,  desc: "All-tire rotation and balancing",     status: "Active",      nextSched: "Aug 20, 2026" },
  { id: "4", truck: "ALK-003", type: "Brake Service",    date: "Jun 15, 2026", provider: "CDO Auto Repair Center",  cost: 6500,  desc: "Front/rear brake pad replacement",   status: "Active",      nextSched: "Dec 15, 2026" },
  { id: "5", truck: "ALK-006", type: "PMS",              date: "Jun 10, 2026", provider: "Petron Service Center",   cost: 5200,  desc: "10,000 km scheduled maintenance",     status: "Active",      nextSched: "Oct 10, 2026" },
  { id: "6", truck: "ALK-002", type: "Electrical",       date: "May 28, 2026", provider: "JC Electrical Services", cost: 3800,  desc: "Alternator replacement",              status: "Active",      nextSched: "—" },
];

export default function MaintenancePage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = MOCK_MAINTENANCE.filter((m) => {
    const q = search.toLowerCase();
    return m.truck.toLowerCase().includes(q) || m.type.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q);
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  const totalCost = MOCK_MAINTENANCE.reduce((s, m) => s + m.cost, 0);

  return (
    <PageShell
      title="Maintenance Records"
      subtitle={`${MOCK_MAINTENANCE.length} records · ₱${totalCost.toLocaleString()} total maintenance cost`}
      addLabel="Log Maintenance"
      onAdd={() => alert("Add maintenance record")}
    >
      <TableShell
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search by truck, type, or provider..."
        onExport={() => alert("Export coming soon")}
        pagination={<Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} perPage={perPage} />}
      >
        <table className="alk-table">
          <thead>
            <tr>
              <th>Truck</th>
              <th>Type</th>
              <th>Date</th>
              <th>Service Provider</th>
              <th>Description</th>
              <th>Cost</th>
              <th>Next Sched.</th>
              <th>Truck Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((m) => (
              <tr key={m.id}>
                <td><span className="font-mono font-bold text-[#1e3a8a]">{m.truck}</span></td>
                <td>
                  <span className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">{m.type}</span>
                </td>
                <td><span className="text-slate-500 text-xs">{m.date}</span></td>
                <td><span className="text-slate-600 text-sm">{m.provider}</span></td>
                <td><span className="text-slate-500 text-xs leading-relaxed">{m.desc}</span></td>
                <td><span className="font-bold text-amber-600">₱{m.cost.toLocaleString()}</span></td>
                <td>
                  <div className="flex items-center gap-1.5">
                    {m.nextSched === "Aug 1, 2026" && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                    <span className="text-xs text-slate-500">{m.nextSched}</span>
                  </div>
                </td>
                <td><StatusBadge status={m.status} /></td>
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
