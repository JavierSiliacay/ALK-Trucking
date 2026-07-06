"use client";

import React, { useState } from "react";
import { Truck, Eye, Edit, Trash2, RotateCcw, MoreVertical, Wrench } from "lucide-react";
import { PageShell, TableShell, Pagination, StatusBadge } from "@/components/ui/PageShell";

const MOCK_TRUCKS = [
  { id: "1", unit: "ALK-001", plate: "CDO-1234",  type: "10-Wheeler",  capacity: "15 tons",  driver: "Juan Dela Cruz",  status: "In Trip",    lastTrip: "Jul 6, 2026",  odometer: "142,500 km" },
  { id: "2", unit: "ALK-002", plate: "CDO-5678",  type: "6-Wheeler",   capacity: "8 tons",   driver: "Eduardo Lim",     status: "In Trip",    lastTrip: "Jul 6, 2026",  odometer: "98,200 km"  },
  { id: "3", unit: "ALK-003", plate: "CDO-9012",  type: "10-Wheeler",  capacity: "15 tons",  driver: "Pedro Santos",    status: "Active",     lastTrip: "Jul 5, 2026",  odometer: "215,800 km" },
  { id: "4", unit: "ALK-004", plate: "CDO-3456",  type: "Trailer",     capacity: "30 tons",  driver: "Unassigned",      status: "Maintenance",lastTrip: "Jul 1, 2026",  odometer: "302,100 km" },
  { id: "5", unit: "ALK-005", plate: "CDO-7890",  type: "6-Wheeler",   capacity: "8 tons",   driver: "Miguel Torres",   status: "Active",     lastTrip: "Jul 5, 2026",  odometer: "67,400 km"  },
  { id: "6", unit: "ALK-006", plate: "CDO-2345",  type: "10-Wheeler",  capacity: "15 tons",  driver: "Carlos Reyes",    status: "Active",     lastTrip: "Jul 4, 2026",  odometer: "183,600 km" },
  { id: "7", unit: "ALK-007", plate: "CDO-6789",  type: "6-Wheeler",   capacity: "8 tons",   driver: "Ramon Reyes",     status: "Active",     lastTrip: "Jul 3, 2026",  odometer: "54,900 km"  },
  { id: "8", unit: "ALK-008", plate: "CDO-0123",  type: "Trailer",     capacity: "30 tons",  driver: "Antonio Cruz",    status: "Active",     lastTrip: "Jul 6, 2026",  odometer: "278,300 km" },
];

export default function FleetPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = MOCK_TRUCKS.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = t.unit.toLowerCase().includes(q) || t.plate.toLowerCase().includes(q) || t.driver.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  return (
    <PageShell
      title="Fleet / Trucks"
      subtitle={`${MOCK_TRUCKS.length} truck units registered`}
      addLabel="Add Truck"
      onAdd={() => alert("Add Truck modal coming soon")}
    >
      <TableShell
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search by unit, plate, or driver..."
        onExport={() => alert("Export coming soon")}
        onPrint={() => window.print()}
        filters={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-600 focus:outline-none focus:border-[#1e3a8a]"
          >
            {["All", "Active", "In Trip", "Maintenance", "Retired"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        }
        pagination={
          <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} perPage={perPage} />
        }
      >
        <table className="alk-table">
          <thead>
            <tr>
              <th>Unit</th>
              <th>Plate No.</th>
              <th>Type</th>
              <th>Capacity</th>
              <th>Assigned Driver</th>
              <th>Last Trip</th>
              <th>Odometer</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center text-slate-400 text-sm">
                  <Truck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No trucks found
                </td>
              </tr>
            ) : (
              paginated.map((t) => (
                <tr key={t.id}>
                  <td><span className="font-bold text-[#1e3a8a] font-mono">{t.unit}</span></td>
                  <td><span className="text-slate-700 font-medium">{t.plate}</span></td>
                  <td><span className="text-slate-600">{t.type}</span></td>
                  <td><span className="text-slate-600">{t.capacity}</span></td>
                  <td>
                    {t.driver === "Unassigned"
                      ? <span className="text-slate-400 italic text-xs">Unassigned</span>
                      : <span className="text-slate-700">{t.driver}</span>
                    }
                  </td>
                  <td><span className="text-slate-500 text-xs">{t.lastTrip}</span></td>
                  <td><span className="text-slate-500 text-xs font-mono">{t.odometer}</span></td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <button title="View" className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-[#1e3a8a] transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button title="Edit" className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-[#1e3a8a] transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button title="Maintenance" className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors">
                        <Wrench className="w-4 h-4" />
                      </button>
                      <button title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableShell>
    </PageShell>
  );
}
