"use client";

import React from "react";
import { Plus, Search, Filter, Download, Printer } from "lucide-react";

interface PageShellProps {
  title: string;
  subtitle?: string;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageShell({ title, subtitle, onAdd, addLabel = "Add New", children, actions }: PageShellProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-manrope font-bold text-slate-800">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {onAdd && (
            <button
              onClick={onAdd}
              id={`btn-add-${title.toLowerCase().replace(/\s+/g, "-")}`}
              className="flex items-center gap-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              {addLabel}
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

interface TableShellProps {
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  children: React.ReactNode;
  pagination?: React.ReactNode;
  onExport?: () => void;
  onPrint?: () => void;
}

export function TableShell({
  search, onSearch, searchPlaceholder = "Search...",
  filters, children, pagination, onExport, onPrint
}: TableShellProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-4 border-b border-slate-100">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-[#1e3a8a] focus:bg-white transition-all"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {filters}
          {onExport && (
            <button onClick={onExport} className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          )}
          {onPrint && (
            <button onClick={onPrint} className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {children}
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="px-5 py-3.5 border-t border-slate-100">
          {pagination}
        </div>
      )}
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
  totalItems: number;
  perPage: number;
}

export function Pagination({ page, totalPages, onPage, totalItems, perPage }: PaginationProps) {
  const from = Math.min((page - 1) * perPage + 1, totalItems);
  const to   = Math.min(page * perPage, totalItems);
  return (
    <div className="flex items-center justify-between text-xs text-slate-500">
      <span>Showing {from}–{to} of {totalItems} results</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
        >
          Prev
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
              page === p ? "bg-[#1e3a8a] text-white" : "border border-slate-200 hover:bg-slate-50 text-slate-600"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
        >
          Next
        </button>
      </div>
    </div>
  );
}

interface StatusBadgeProps { status: string; }
const STATUS_MAP: Record<string, string> = {
  Active:       "status-active",
  "In Trip":    "status-in-trip",
  Maintenance:  "status-maintenance",
  Retired:      "status-retired",
  Delivered:    "status-delivered",
  Scheduled:    "status-scheduled",
  "In Transit": "status-in-transit",
  Cancelled:    "status-cancelled",
  Available:    "status-active",
  "On Trip":    "status-in-trip",
  Inactive:     "status-retired",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_MAP[status] || "bg-slate-100 text-slate-600 border border-slate-200"}`}>
      {status}
    </span>
  );
}
