"use client";

import React, { useState } from "react";
import { History, RotateCcw, Trash2 } from "lucide-react";
import { PageShell, TableShell, Pagination } from "@/components/ui/PageShell";

const MOCK_AUDIT = [
  { id: "1", table: "trips",    action: "INSERT", record: "TRP-008", user: "Staff 1", ip: "192.168.1.10", at: "Jul 6, 2026 09:15 AM" },
  { id: "2", table: "fleet",    action: "UPDATE", record: "ALK-004", user: "Manager",  ip: "192.168.1.5",  at: "Jul 6, 2026 08:50 AM" },
  { id: "3", table: "drivers",  action: "INSERT", record: "Jose Fernandez", user: "Manager", ip: "192.168.1.5", at: "Jul 5, 2026 04:30 PM" },
  { id: "4", table: "costing",  action: "UPDATE", record: "CST-002", user: "Staff 1", ip: "192.168.1.10", at: "Jul 5, 2026 02:15 PM" },
  { id: "5", table: "payroll",  action: "INSERT", record: "Payroll Jul 1-15", user: "Manager", ip: "192.168.1.5", at: "Jul 5, 2026 10:00 AM" },
  { id: "6", table: "customers",action: "DELETE", record: "Pacific Cement", user: "Owner", ip: "192.168.1.2", at: "Jul 4, 2026 03:45 PM" },
];

const ACTION_COLORS: Record<string, string> = {
  INSERT: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  UPDATE: "bg-blue-50 text-[#1e3a8a] border border-blue-200",
  DELETE: "bg-red-50 text-red-600 border border-red-200",
  RESTORE: "bg-amber-50 text-amber-700 border border-amber-200",
};

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = MOCK_AUDIT.filter((a) => {
    const q = search.toLowerCase();
    return a.table.includes(q) || a.record.toLowerCase().includes(q) || a.user.toLowerCase().includes(q) || a.action.toLowerCase().includes(q);
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  return (
    <PageShell
      title="Audit Logs"
      subtitle="Full trail of all system changes"
    >
      <TableShell
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search by table, record, user, or action..."
        onExport={() => alert("Export logs")}
        pagination={<Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} perPage={perPage} />}
      >
        <table className="alk-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Table</th>
              <th>Action</th>
              <th>Record</th>
              <th>Performed By</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((a) => (
              <tr key={a.id}>
                <td><span className="font-mono text-xs text-slate-500">{a.at}</span></td>
                <td>
                  <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-lg font-semibold">{a.table}</span>
                </td>
                <td>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${ACTION_COLORS[a.action] || "bg-slate-50 text-slate-600"}`}>
                    {a.action}
                  </span>
                </td>
                <td><span className="text-slate-700 font-medium text-sm">{a.record}</span></td>
                <td><span className="text-slate-600 text-sm">{a.user}</span></td>
                <td><span className="font-mono text-xs text-slate-400">{a.ip}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </PageShell>
  );
}
