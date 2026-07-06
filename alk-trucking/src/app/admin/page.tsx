"use client";

import React, { useState } from "react";
import {
  Truck, Users, MapPin, DollarSign, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, Clock, Fuel, Wrench, BarChart3,
  ArrowUpRight, ArrowDownRight, Activity, Package
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { useSession } from "next-auth/react";

// ── Mock data ──────────────────────────────────────────────────────────────

const revenueData = [
  { month: "Jan", revenue: 185000, cost: 120000 },
  { month: "Feb", revenue: 210000, cost: 138000 },
  { month: "Mar", revenue: 195000, cost: 125000 },
  { month: "Apr", revenue: 240000, cost: 155000 },
  { month: "May", revenue: 228000, cost: 148000 },
  { month: "Jun", revenue: 275000, cost: 170000 },
  { month: "Jul", revenue: 262000, cost: 162000 },
];

const tripStatusData = [
  { name: "Delivered", value: 48, color: "#10b981" },
  { name: "In Transit", value: 12, color: "#3b82f6" },
  { name: "Scheduled", value: 8,  color: "#8b5cf6" },
  { name: "Cancelled", value: 3,  color: "#ef4444" },
];

const recentTrips = [
  { id: "TRP-001", truck: "ALK-001", driver: "Juan Dela Cruz", origin: "CDO", destination: "Iligan City", status: "In Transit", amount: 8500, date: "Jul 6" },
  { id: "TRP-002", truck: "ALK-003", driver: "Pedro Santos", origin: "CDO", destination: "Bukidnon", status: "Delivered", amount: 12000, date: "Jul 6" },
  { id: "TRP-003", truck: "ALK-007", driver: "Ramon Reyes", origin: "CDO", destination: "Valencia City", status: "Scheduled", amount: 9800, date: "Jul 7" },
  { id: "TRP-004", truck: "ALK-002", driver: "Eduardo Lim", origin: "CDO", destination: "Ozamiz", status: "In Transit", amount: 15000, date: "Jul 6" },
  { id: "TRP-005", truck: "ALK-005", driver: "Miguel Torres", origin: "CDO", destination: "Gingoog", status: "Delivered", amount: 7200, date: "Jul 5" },
];

const fleetStatus = [
  { label: "Active",          count: 8,  color: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
  { label: "In Trip",         count: 5,  color: "bg-blue-500",    bg: "bg-blue-50",    text: "text-blue-700" },
  { label: "Maintenance",     count: 2,  color: "bg-amber-500",   bg: "bg-amber-50",   text: "text-amber-700" },
  { label: "Idle",            count: 3,  color: "bg-slate-400",   bg: "bg-slate-50",   text: "text-slate-600" },
];

const maintenanceAlerts = [
  { truck: "ALK-004", issue: "Oil change due", urgency: "High",   daysLeft: 2  },
  { truck: "ALK-008", issue: "Tire rotation",  urgency: "Medium", daysLeft: 7  },
  { truck: "ALK-006", issue: "PMS Schedule",   urgency: "Low",    daysLeft: 14 },
];

const topDrivers = [
  { name: "Juan Dela Cruz", trips: 18, revenue: 142500, rating: 4.9 },
  { name: "Pedro Santos",   trips: 15, revenue: 118000, rating: 4.8 },
  { name: "Ramon Reyes",    trips: 14, revenue: 108000, rating: 4.7 },
  { name: "Eduardo Lim",    trips: 12, revenue: 97000,  rating: 4.6 },
];

// ── Sub-components ──────────────────────────────────────────────────────────

function KPICard({
  title, value, subtitle, icon: Icon, trend, trendValue, color,
}: {
  title: string; value: string; subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral"; trendValue?: string; color: string;
}) {
  const trendColors = { up: "text-emerald-600 bg-emerald-50", down: "text-red-500 bg-red-50", neutral: "text-slate-500 bg-slate-50" };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-[#1e3a8a]/20 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${trendColors[trend]}`}>
            {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : trend === "down" ? <ArrowDownRight className="w-3 h-3" /> : null}
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-2xl font-manrope font-bold text-slate-800 mb-1">{value}</p>
      <p className="text-xs font-semibold text-slate-500 mb-0.5">{title}</p>
      <p className="text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}

const statusStyles: Record<string, string> = {
  "In Transit": "status-in-transit",
  "Delivered":  "status-delivered",
  "Scheduled":  "status-scheduled",
  "Cancelled":  "status-cancelled",
};

// ── Main Dashboard ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"revenue" | "trips">("revenue");

  const name = (session?.user?.name || "").split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const formatPeso = (v: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(v);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-manrope font-bold text-slate-800">
            {greeting}, {name} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here&apos;s what&apos;s happening with ALK Trucking operations today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-white border border-slate-200 rounded-xl px-4 py-2.5">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          <span>Live · Updated just now</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Total Trucks"
          value="18"
          subtitle="5 currently on trip"
          icon={Truck}
          trend="up"
          trendValue="+2 this month"
          color="bg-[#1e3a8a]"
        />
        <KPICard
          title="Active Drivers"
          value="24"
          subtitle="8 available now"
          icon={Users}
          trend="neutral"
          trendValue="Stable"
          color="bg-blue-500"
        />
        <KPICard
          title="Trips This Month"
          value="71"
          subtitle="12 in transit right now"
          icon={MapPin}
          trend="up"
          trendValue="+18%"
          color="bg-violet-500"
        />
        <KPICard
          title="Revenue (Jul)"
          value="₱262,000"
          subtitle="vs ₱228,000 last month"
          icon={DollarSign}
          trend="up"
          trendValue="+14.9%"
          color="bg-emerald-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-manrope font-bold text-slate-800">Revenue vs Cost</h2>
              <p className="text-xs text-slate-400 mt-0.5">Monthly comparison — 2026</p>
            </div>
            <div className="flex gap-1 bg-slate-50 rounded-lg p-1">
              {(["revenue", "trips"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                    activeTab === tab
                      ? "bg-[#1e3a8a] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1e3a8a" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: any, name: any) => [formatPeso(v as number), name === "revenue" ? "Revenue" : "Cost"]}
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#1e3a8a" strokeWidth={2.5} fill="url(#revGrad)" name="revenue" />
              <Area type="monotone" dataKey="cost"    stroke="#3b82f6" strokeWidth={2}   fill="url(#costGrad)" name="cost" strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#1e3a8a]" />
              <span className="text-xs text-slate-500">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
              <span className="text-xs text-slate-500">Operating Cost</span>
            </div>
          </div>
        </div>

        {/* Trip Status Pie */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-manrope font-bold text-slate-800 mb-1">Trip Status</h2>
          <p className="text-xs text-slate-400 mb-6">July 2026 breakdown</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={tripStatusData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {tripStatusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => [`${v} trips`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2.5 mt-2">
            {tripStatusData.map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-xs text-slate-600">{s.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-700">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fleet Status + Maintenance Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Fleet status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-manrope font-bold text-slate-800 mb-4">Fleet Status</h2>
          <div className="space-y-3">
            {fleetStatus.map((fs) => (
              <div key={fs.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${fs.bg} flex items-center justify-center`}>
                    <Truck className={`w-4 h-4 ${fs.text}`} />
                  </div>
                  <span className="text-sm text-slate-600 font-medium">{fs.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${fs.color}`}
                      style={{ width: `${(fs.count / 18) * 100}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold ${fs.text}`}>{fs.count}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Fleet</span>
            <span className="text-sm font-bold text-slate-700">18 Trucks</span>
          </div>
        </div>

        {/* Maintenance alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-manrope font-bold text-slate-800">Maintenance Alerts</h2>
            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            </div>
          </div>
          <div className="space-y-3">
            {maintenanceAlerts.map((m) => (
              <div key={m.truck} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-700">{m.truck}</p>
                  <p className="text-xs text-slate-400">{m.issue}</p>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  m.urgency === "High" ? "bg-red-50 text-red-600" :
                  m.urgency === "Medium" ? "bg-amber-50 text-amber-600" :
                  "bg-slate-100 text-slate-500"
                }`}>
                  {m.daysLeft}d left
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Drivers */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-manrope font-bold text-slate-800 mb-4">Top Drivers</h2>
          <div className="space-y-3">
            {topDrivers.map((d, i) => (
              <div key={d.name} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  i === 0 ? "bg-yellow-400" : i === 1 ? "bg-slate-400" : i === 2 ? "bg-amber-600" : "bg-slate-300"
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-slate-700 truncate">{d.name}</p>
                  <p className="text-xs text-slate-400">{d.trips} trips · ⭐ {d.rating}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-[#1e3a8a]">₱{(d.revenue/1000).toFixed(0)}k</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Trips Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-manrope font-bold text-slate-800">Recent Trips</h2>
            <p className="text-xs text-slate-400 mt-0.5">Latest 5 trip records</p>
          </div>
          <a href="/admin/trips" className="text-xs font-semibold text-[#1e3a8a] hover:underline flex items-center gap-1">
            View all <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="alk-table">
            <thead>
              <tr>
                <th>Trip ID</th>
                <th>Truck</th>
                <th>Driver</th>
                <th>Route</th>
                <th>Date</th>
                <th>Status</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentTrips.map((t) => (
                <tr key={t.id} className="cursor-pointer">
                  <td><span className="font-mono text-xs font-bold text-[#1e3a8a]">{t.id}</span></td>
                  <td><span className="font-semibold text-slate-700">{t.truck}</span></td>
                  <td><span className="text-slate-600">{t.driver}</span></td>
                  <td>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{t.origin}</span>
                      <span>→</span>
                      <span className="font-medium text-slate-700">{t.destination}</span>
                    </div>
                  </td>
                  <td><span className="text-slate-500 text-xs">{t.date}</span></td>
                  <td>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[t.status] || "bg-slate-100 text-slate-600"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <span className="font-bold text-slate-800">₱{t.amount.toLocaleString()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
