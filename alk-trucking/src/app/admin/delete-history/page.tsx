"use client";

import React, { useState } from "react";
import { Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { PageShell, TableShell, Pagination } from "@/components/ui/PageShell";

const MOCK_DELETED = [
  { id: "1", table: "customers", name: "Pacific Cement Distributors", deletedBy: "Owner",   deletedAt: "Jul 4, 2026 03:45 PM", canRestore: true },
  { id: "2", table: "trips",     name: "TRP-008",                    deletedBy: "Staff 1", deletedAt: "Jun 30, 2026 11:20 AM", canRestore: true },
  { id: "3", table: "helpers",   name: "Joven Aquino",               deletedBy: "Manager", deletedAt: "Jun 15, 2026 09:00 AM", canRestore: true },
];

const TABLE_COLORS: Record<string, string> = {
  customers: "bg-blue-50 text-[#1e3a8a]",
  trips:     "bg-violet-50 text-violet-700",
  helpers:   "bg-emerald-50 text-emerald-700",
  fleet:     "bg-amber-50 text-amber-700",
  drivers:   "bg-rose-50 text-rose-700",
};

export default function DeleteHistoryPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = MOCK_DELETED.filter((d) => {
    const q = search.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.table.includes(q) || d.deletedBy.toLowerCase().includes(q);
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  return (
    <PageShell
      title="Delete History"
      subtitle="Soft-deleted records — restore or permanently remove"
    >
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 mb-2">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800 font-medium">
          Records here are soft-deleted and can be restored. Permanent deletion is irreversible.
        </p>
      </div>

      <TableShell
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search deleted records..."
        pagination={<Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} perPage={perPage} />}
      >
        <table className="alk-table">
          <thead>
            <tr>
              <th>Module</th>
              <th>Record Name</th>
              <th>Deleted By</th>
              <th>Deleted At</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <div className="text-slate-400">
                    <Trash2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No deleted records found</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((d) => (
                <tr key={d.id}>
                  <td>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold capitalize ${TABLE_COLORS[d.table] || "bg-slate-50 text-slate-600"}`}>
                      {d.table}
                    </span>
                  </td>
                  <td><span className="font-semibold text-slate-700">{d.name}</span></td>
                  <td><span className="text-slate-500 text-sm">{d.deletedBy}</span></td>
                  <td><span className="text-slate-500 text-xs font-mono">{d.deletedAt}</span></td>
                  <td>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        title="Restore"
                        onClick={() => alert(`Restore: ${d.name}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restore
                      </button>
                      <button
                        title="Delete permanently"
                        onClick={() => confirm("Permanently delete? This cannot be undone.") && alert("Deleted permanently")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-xs font-semibold transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Purge
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
