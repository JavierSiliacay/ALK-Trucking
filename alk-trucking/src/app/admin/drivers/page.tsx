"use client";

import React, { useState } from "react";
import { UserCheck, Eye, Edit, Trash2, AlertTriangle } from "lucide-react";
import { PageShell, TableShell, Pagination, StatusBadge } from "@/components/ui/PageShell";

const MOCK_DRIVERS = [
  { id: "1", name: "Juan Dela Cruz",   license: "A1-23-456789", licenseType: "Professional", expiry: "2026-12-15", contact: "09171234567", status: "On Trip",   trips: 18, assigned: "ALK-001" },
  { id: "2", name: "Pedro Santos",     license: "B2-34-567890", licenseType: "Professional", expiry: "2025-08-20", contact: "09281234567", status: "Available", trips: 15, assigned: "" },
  { id: "3", name: "Ramon Reyes",      license: "C3-45-678901", licenseType: "Professional", expiry: "2027-03-10", contact: "09391234567", status: "Available", trips: 14, assigned: "" },
  { id: "4", name: "Eduardo Lim",      license: "D4-56-789012", licenseType: "Professional", expiry: "2026-06-30", contact: "09451234567", status: "On Trip",   trips: 12, assigned: "ALK-002" },
  { id: "5", name: "Miguel Torres",    license: "E5-67-890123", licenseType: "Ordinary",     expiry: "2025-11-05", contact: "09561234567", status: "Available", trips: 10, assigned: "" },
  { id: "6", name: "Carlos Reyes",     license: "F6-78-901234", licenseType: "Professional", expiry: "2027-01-22", contact: "09671234567", status: "Available", trips: 9,  assigned: "" },
  { id: "7", name: "Antonio Cruz",     license: "G7-89-012345", licenseType: "Professional", expiry: "2026-09-18", contact: "09781234567", status: "On Trip",   trips: 11, assigned: "ALK-008" },
  { id: "8", name: "Jose Fernandez",   license: "H8-90-123456", licenseType: "Ordinary",     expiry: "2025-07-25", contact: "09891234567", status: "Inactive",  trips: 3,  assigned: "" },
];

function isExpiringSoon(expiry: string) {
  const diff = new Date(expiry).getTime() - Date.now();
  return diff < 90 * 24 * 60 * 60 * 1000; // 90 days
}

export default function DriversPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = MOCK_DRIVERS.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch = d.name.toLowerCase().includes(q) || d.license.toLowerCase().includes(q) || d.contact.includes(q);
    const matchStatus = statusFilter === "All" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  return (
    <PageShell
      title="Drivers"
      subtitle={`${MOCK_DRIVERS.length} drivers registered · ${MOCK_DRIVERS.filter(d => d.status === "Available").length} available`}
      addLabel="Add Driver"
      onAdd={() => alert("Add Driver modal coming soon")}
    >
      <TableShell
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search by name, license, or contact..."
        onExport={() => alert("Export coming soon")}
        filters={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-600 focus:outline-none focus:border-[#1e3a8a]"
          >
            {["All", "Available", "On Trip", "Inactive"].map((s) => (
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
              <th>Name</th>
              <th>License No.</th>
              <th>Type</th>
              <th>Expiry</th>
              <th>Contact</th>
              <th>Total Trips</th>
              <th>Assigned Truck</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={9} className="py-16 text-center text-slate-400 text-sm">No drivers found</td></tr>
            ) : (
              paginated.map((d) => {
                const expiring = isExpiringSoon(d.expiry);
                return (
                  <tr key={d.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1e3a8a] flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {d.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-700">{d.name}</span>
                      </div>
                    </td>
                    <td><span className="font-mono text-sm text-slate-600">{d.license}</span></td>
                    <td><span className="text-slate-600 text-xs">{d.licenseType}</span></td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {expiring && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                        <span className={`text-xs font-medium ${expiring ? "text-amber-600" : "text-slate-500"}`}>{d.expiry}</span>
                      </div>
                    </td>
                    <td><span className="text-slate-600 text-sm">{d.contact}</span></td>
                    <td><span className="font-bold text-[#1e3a8a]">{d.trips}</span></td>
                    <td>
                      {d.assigned
                        ? <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{d.assigned}</span>
                        : <span className="text-slate-300 text-xs">—</span>
                      }
                    </td>
                    <td><StatusBadge status={d.status} /></td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-[#1e3a8a] transition-colors"><Eye className="w-4 h-4" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-[#1e3a8a] transition-colors"><Edit className="w-4 h-4" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </TableShell>
    </PageShell>
  );
}
