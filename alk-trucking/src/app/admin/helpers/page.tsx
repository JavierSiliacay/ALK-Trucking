"use client";

import React, { useState } from "react";
import { Users, Eye, Edit, Trash2 } from "lucide-react";
import { PageShell, TableShell, Pagination, StatusBadge } from "@/components/ui/PageShell";

const MOCK_HELPERS = [
  { id: "1", name: "Mark Villanueva", contact: "09171112222", address: "CDO City", status: "Available", trips: 22, lastTrip: "Jul 5, 2026" },
  { id: "2", name: "Bryan Gomez",     contact: "09282223333", address: "Opol",     status: "On Trip",   trips: 18, lastTrip: "Jul 6, 2026" },
  { id: "3", name: "Allen Soriano",   contact: "09393334444", address: "CDO City", status: "Available", trips: 15, lastTrip: "Jul 4, 2026" },
  { id: "4", name: "Kevin Castro",    contact: "09454445555", address: "Tagoloan", status: "On Trip",   trips: 20, lastTrip: "Jul 6, 2026" },
  { id: "5", name: "Dennis Ramos",    contact: "09565556666", address: "CDO City", status: "Available", trips: 9,  lastTrip: "Jul 2, 2026" },
  { id: "6", name: "Joven Aquino",    contact: "09676667777", address: "Calaanan", status: "Inactive",  trips: 4,  lastTrip: "Jun 20, 2026" },
];

export default function HelpersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = MOCK_HELPERS.filter((h) => {
    const q = search.toLowerCase();
    const match = h.name.toLowerCase().includes(q) || h.contact.includes(q);
    const matchS = statusFilter === "All" || h.status === statusFilter;
    return match && matchS;
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  return (
    <PageShell
      title="Helpers"
      subtitle={`${MOCK_HELPERS.length} helpers registered · ${MOCK_HELPERS.filter(h => h.status === "Available").length} available`}
      addLabel="Add Helper"
      onAdd={() => alert("Add Helper modal")}
    >
      <TableShell
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search by name or contact..."
        onExport={() => alert("Export coming soon")}
        filters={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-[#1e3a8a]"
          >
            {["All", "Available", "On Trip", "Inactive"].map((s) => <option key={s}>{s}</option>)}
          </select>
        }
        pagination={<Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} perPage={perPage} />}
      >
        <table className="alk-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Address</th>
              <th>Total Trips</th>
              <th>Last Trip</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((h) => (
              <tr key={h.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#1e3a8a] text-xs font-bold">
                      {h.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-slate-700">{h.name}</span>
                  </div>
                </td>
                <td><span className="text-slate-600">{h.contact}</span></td>
                <td><span className="text-slate-500 text-xs">{h.address}</span></td>
                <td><span className="font-bold text-[#1e3a8a]">{h.trips}</span></td>
                <td><span className="text-slate-500 text-xs">{h.lastTrip}</span></td>
                <td><StatusBadge status={h.status} /></td>
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
