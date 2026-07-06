"use client";

import React, { useState } from "react";
import { BarChart3, Download, FileText, TrendingUp, Truck, Users, DollarSign } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from "recharts";
import { PageShell } from "@/components/ui/PageShell";

const MONTHLY_REVENUE = [
  { month: "Jan", revenue: 185000, cost: 120000, trips: 52 },
  { month: "Feb", revenue: 210000, cost: 138000, trips: 61 },
  { month: "Mar", revenue: 195000, cost: 125000, trips: 57 },
  { month: "Apr", revenue: 240000, cost: 155000, trips: 68 },
  { month: "May", revenue: 228000, cost: 148000, trips: 65 },
  { month: "Jun", revenue: 275000, cost: 170000, trips: 74 },
  { month: "Jul", revenue: 262000, cost: 162000, trips: 71 },
];

const REPORTS = [
  { id: "1", title: "Trip Summary Report",      subtitle: "All trips with route, cost, and status",  icon: FileText,   color: "bg-blue-50 text-[#1e3a8a]" },
  { id: "2", title: "Revenue vs. Cost Report",  subtitle: "Monthly financial breakdown",             icon: TrendingUp, color: "bg-emerald-50 text-emerald-700" },
  { id: "3", title: "Fleet Utilization Report", subtitle: "Truck usage and idle time analysis",      icon: Truck,      color: "bg-violet-50 text-violet-700" },
  { id: "4", title: "Driver Performance Report",subtitle: "Trips, earnings, and ratings per driver", icon: Users,      color: "bg-amber-50 text-amber-700" },
  { id: "5", title: "Fuel Consumption Report",  subtitle: "Liters consumed and cost per truck",     icon: DollarSign, color: "bg-rose-50 text-rose-600" },
  { id: "6", title: "Maintenance Cost Report",  subtitle: "Service history and expenses per truck",  icon: BarChart3,  color: "bg-slate-50 text-slate-700" },
];

export default function ReportsPage() {
  const [activeChart, setActiveChart] = useState<"revenue" | "trips">("revenue");

  return (
    <PageShell
      title="Reports & Analytics"
      subtitle="Generate, view, and export operational reports"
    >
      {/* Quick report cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-[#1e3a8a]/30 hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${r.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <r.icon className="w-5 h-5" />
              </div>
              <button
                onClick={() => alert(`Export ${r.title}`)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#1e3a8a] font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </div>
            <h3 className="font-manrope font-bold text-slate-800 text-sm mb-1">{r.title}</h3>
            <p className="text-xs text-slate-500">{r.subtitle}</p>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">Click to view full report</span>
              <span className="text-xs text-[#1e3a8a] font-semibold group-hover:underline">View →</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-manrope font-bold text-slate-800">Monthly Overview</h2>
            <p className="text-xs text-slate-400 mt-0.5">January – July 2026</p>
          </div>
          <div className="flex gap-1 bg-slate-50 rounded-lg p-1">
            {(["revenue", "trips"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveChart(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                  activeChart === tab ? "bg-[#1e3a8a] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab === "revenue" ? "Revenue vs. Cost" : "Trip Volume"}
              </button>
            ))}
          </div>
        </div>

        {activeChart === "revenue" ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={MONTHLY_REVENUE} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any, name: any) => [`₱${v.toLocaleString()}`, name === "revenue" ? "Revenue" : "Cost"]} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#1e3a8a" radius={[6, 6, 0, 0]} />
              <Bar dataKey="cost"    name="Cost"    fill="#93c5fd" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={MONTHLY_REVENUE} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: any) => [`${v} trips`, "Trips"]} />
              <Line type="monotone" dataKey="trips" stroke="#1e3a8a" strokeWidth={2.5} dot={{ fill: "#1e3a8a", r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </PageShell>
  );
}
