"use client";

import React, { useState } from "react";
import { Route, Eye, Edit, Trash2, ArrowRight } from "lucide-react";
import { PageShell, TableShell, Pagination } from "@/components/ui/PageShell";

const MOCK_ROUTES = [
  { id: "1", origin: "Cagayan de Oro", destination: "Iligan City",   distance: "38 km",  baseRate: 7500,  travelTime: "1.5 hrs", trips: 24 },
  { id: "2", origin: "Cagayan de Oro", destination: "Bukidnon",      distance: "62 km",  baseRate: 9500,  travelTime: "2 hrs",   trips: 31 },
  { id: "3", origin: "Cagayan de Oro", destination: "Valencia City",  distance: "78 km",  baseRate: 11000, travelTime: "2.5 hrs", trips: 18 },
  { id: "4", origin: "Cagayan de Oro", destination: "Ozamiz City",   distance: "142 km", baseRate: 16000, travelTime: "3.5 hrs", trips: 9  },
  { id: "5", origin: "Cagayan de Oro", destination: "Gingoog City",  distance: "89 km",  baseRate: 12500, travelTime: "2.5 hrs", trips: 14 },
  { id: "6", origin: "Cagayan de Oro", destination: "Camiguin",      distance: "120 km", baseRate: 20000, travelTime: "5 hrs",   trips: 6  },
  { id: "7", origin: "Cagayan de Oro", destination: "Malaybalay",    distance: "95 km",  baseRate: 13000, travelTime: "3 hrs",   trips: 19 },
  { id: "8", origin: "Cagayan de Oro", destination: "Tagoloan",      distance: "12 km",  baseRate: 3500,  travelTime: "30 min",  trips: 42 },
];

export default function RoutesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = MOCK_ROUTES.filter((r) => {
    const q = search.toLowerCase();
    return r.origin.toLowerCase().includes(q) || r.destination.toLowerCase().includes(q);
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  return (
    <PageShell
      title="Route Management"
      subtitle={`${MOCK_ROUTES.length} routes defined · Point A → Point B`}
      addLabel="Add Route"
      onAdd={() => alert("Add Route modal")}
    >
      <TableShell
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search by origin or destination..."
        onExport={() => alert("Export coming soon")}
        pagination={<Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} perPage={perPage} />}
      >
        <table className="alk-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Route</th>
              <th>Distance</th>
              <th>Est. Travel Time</th>
              <th>Base Rate</th>
              <th>Total Trips</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((r, i) => (
              <tr key={r.id}>
                <td><span className="text-slate-400 text-xs font-mono">{String(i + 1).padStart(2, "0")}</span></td>
                <td>
                  <div className="flex items-center gap-2 font-medium text-slate-700">
                    <div className="w-2 h-2 rounded-full bg-[#1e3a8a]" />
                    <span>{r.origin}</span>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>{r.destination}</span>
                  </div>
                </td>
                <td><span className="font-mono text-sm font-semibold text-[#1e3a8a]">{r.distance}</span></td>
                <td><span className="text-slate-500 text-sm">{r.travelTime}</span></td>
                <td><span className="font-bold text-emerald-600">₱{r.baseRate.toLocaleString()}</span></td>
                <td><span className="font-bold text-[#1e3a8a]">{r.trips}</span></td>
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
