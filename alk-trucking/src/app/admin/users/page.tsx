"use client";

import React, { useState } from "react";
import { Users, Eye, Edit, Trash2, Shield } from "lucide-react";
import { PageShell, TableShell, Pagination, StatusBadge } from "@/components/ui/PageShell";

const MOCK_USERS = [
  { id: "1", name: "System Developer",      email: "javiersiliacay12@gmail.com", role: "developer", status: "Active", lastLogin: "Jul 6, 2026", createdAt: "Jan 1, 2026" },
  { id: "2", name: "ALK Owner",             email: "alkowner@gmail.com",         role: "owner",     status: "Active", lastLogin: "Jul 5, 2026", createdAt: "Jan 5, 2026" },
  { id: "3", name: "Fleet Manager",         email: "manager@alktrucking.com",    role: "manager",   status: "Active", lastLogin: "Jul 6, 2026", createdAt: "Feb 1, 2026" },
  { id: "4", name: "Operations Staff 1",    email: "staff1@alktrucking.com",     role: "staff",     status: "Active", lastLogin: "Jul 6, 2026", createdAt: "Mar 1, 2026" },
  { id: "5", name: "Operations Staff 2",    email: "staff2@alktrucking.com",     role: "staff",     status: "Active", lastLogin: "Jul 4, 2026", createdAt: "Mar 15, 2026" },
  { id: "6", name: "Finance Staff",         email: "finance@alktrucking.com",    role: "staff",     status: "Inactive", lastLogin: "Jun 20, 2026", createdAt: "Apr 1, 2026" },
];

const ROLE_COLORS: Record<string, string> = {
  developer: "bg-violet-50 text-violet-700 border border-violet-200",
  owner:     "bg-amber-50 text-amber-700 border border-amber-200",
  manager:   "bg-blue-50 text-[#1e3a8a] border border-blue-200",
  staff:     "bg-slate-50 text-slate-600 border border-slate-200",
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = MOCK_USERS.filter((u) => {
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.includes(q);
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  return (
    <PageShell
      title="User Management"
      subtitle="Manage system access and roles"
      addLabel="Invite User"
      onAdd={() => alert("Invite user by email")}
    >
      <TableShell
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search by name, email, or role..."
        pagination={<Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} perPage={perPage} />}
      >
        <table className="alk-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Last Login</th>
              <th>Member Since</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#1e3a8a] flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-slate-700">{u.name}</span>
                  </div>
                </td>
                <td><span className="text-slate-500 text-sm">{u.email}</span></td>
                <td>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${ROLE_COLORS[u.role] || "bg-slate-50 text-slate-600"}`}>
                    <Shield className="w-3 h-3" />
                    {u.role}
                  </span>
                </td>
                <td><span className="text-slate-500 text-xs">{u.lastLogin}</span></td>
                <td><span className="text-slate-500 text-xs">{u.createdAt}</span></td>
                <td><StatusBadge status={u.status} /></td>
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
