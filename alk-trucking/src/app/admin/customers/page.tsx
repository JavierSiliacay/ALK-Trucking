"use client";

import React, { useState } from "react";
import { Building2, Eye, Edit, Trash2, Phone, Mail } from "lucide-react";
import { PageShell, TableShell, Pagination } from "@/components/ui/PageShell";

const MOCK_CUSTOMERS = [
  { id: "1", company: "Mindanao Fresh Produce Inc.",  contact: "Ana Reyes",     phone: "0882-111-2222", email: "ana@mfp.com",    address: "Iligan City",    trips: 24, totalBilled: 320000 },
  { id: "2", company: "CDO Builders Supply Corp.",    contact: "Rene Santos",   phone: "0882-333-4444", email: "rene@cdobs.com", address: "CDO City",       trips: 18, totalBilled: 245000 },
  { id: "3", company: "Northern Mindanao Trading",    contact: "Luisa Gomez",  phone: "0882-555-6666", email: "luisa@nmt.com",  address: "Bukidnon",       trips: 31, totalBilled: 412000 },
  { id: "4", company: "Cagayan Agri Ventures",        contact: "Marco Uy",     phone: "0882-777-8888", email: "marco@cav.com",  address: "CDO City",       trips: 12, totalBilled: 158000 },
  { id: "5", company: "Pacific Cement Distributors", contact: "Helen Cruz",    phone: "0882-999-0000", email: "helen@pcd.com",  address: "Ozamiz City",    trips: 9,  totalBilled: 128000 },
  { id: "6", company: "Lanao Del Norte Fisheries",   contact: "Ben Villanueva",phone: "0882-111-3333", email: "ben@lnf.com",   address: "Iligan City",    trips: 16, totalBilled: 198000 },
];

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = MOCK_CUSTOMERS.filter((c) => {
    const q = search.toLowerCase();
    return c.company.toLowerCase().includes(q) || c.contact.toLowerCase().includes(q) || c.address.toLowerCase().includes(q);
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  const totalRevenue = MOCK_CUSTOMERS.reduce((s, c) => s + c.totalBilled, 0);

  return (
    <PageShell
      title="Customers"
      subtitle={`${MOCK_CUSTOMERS.length} customers · ₱${totalRevenue.toLocaleString()} total billed`}
      addLabel="Add Customer"
      onAdd={() => alert("Add Customer modal")}
    >
      <TableShell
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search by company, contact, or address..."
        onExport={() => alert("Export coming soon")}
        pagination={<Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} perPage={perPage} />}
      >
        <table className="alk-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Contact Person</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Total Trips</th>
              <th>Total Billed</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-[#1e3a8a]" />
                    </div>
                    <span className="font-semibold text-slate-700 leading-tight">{c.company}</span>
                  </div>
                </td>
                <td><span className="text-slate-600">{c.contact}</span></td>
                <td>
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                    <Phone className="w-3 h-3" />
                    {c.phone}
                  </div>
                </td>
                <td><span className="text-slate-500 text-xs">{c.address}</span></td>
                <td><span className="font-bold text-[#1e3a8a]">{c.trips}</span></td>
                <td>
                  <span className="font-bold text-emerald-600">₱{c.totalBilled.toLocaleString()}</span>
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
