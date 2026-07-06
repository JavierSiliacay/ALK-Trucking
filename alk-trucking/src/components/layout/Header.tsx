"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bell, ChevronRight, Home } from "lucide-react";
import { CHANGELOG } from "@/data/changelog";

// Page title map
const PAGE_TITLES: Record<string, { label: string; parent?: string }> = {
  "/admin":              { label: "Dashboard" },
  "/admin/fleet":        { label: "Fleet / Trucks", parent: "Operations" },
  "/admin/drivers":      { label: "Drivers", parent: "Operations" },
  "/admin/helpers":      { label: "Helpers", parent: "Operations" },
  "/admin/customers":    { label: "Customers", parent: "Operations" },
  "/admin/trips":        { label: "Trips", parent: "Operations" },
  "/admin/trips/active": { label: "Active Trips", parent: "Trips" },
  "/admin/routes":       { label: "Routes", parent: "Operations" },
  "/admin/costing":      { label: "Costing", parent: "Finance" },
  "/admin/fuel":         { label: "Fuel Expenses", parent: "Finance" },
  "/admin/maintenance":  { label: "Maintenance", parent: "Fleet" },
  "/admin/payroll/drivers":{ label: "Driver Payroll", parent: "Payroll" },
  "/admin/payroll/helpers":{ label: "Helper Payroll", parent: "Payroll" },
  "/admin/payroll":      { label: "Payroll", parent: "Finance" },
  "/admin/reports":      { label: "Reports", parent: "Analytics" },
  "/admin/users":        { label: "Users", parent: "Admin" },
  "/admin/audit-logs":   { label: "Audit Logs", parent: "Admin" },
  "/admin/delete-history":{ label: "Delete History", parent: "Admin" },
  "/admin/settings":     { label: "Settings", parent: "Admin" },
};

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const page = PAGE_TITLES[pathname] || { label: "Dashboard" };
  const role = (session?.user as any)?.role || "staff";

  // Latest 3 changelog entries as notifications
  const notifications = CHANGELOG.slice(0, 3);

  return (
    <header className="h-16 flex items-center justify-between px-6 md:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Home className="w-4 h-4 text-slate-400" />
        {page.parent && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-400 font-medium">{page.parent}</span>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-[#1e3a8a] font-semibold font-manrope">{page.label}</span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-[#1e3a8a]/30 text-slate-500 hover:text-[#1e3a8a] transition-all"
            id="btn-notifications"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#1e3a8a] rounded-full flex items-center justify-center">
                <span className="text-white text-[9px] font-bold">{notifications.length}</span>
              </div>
            )}
          </button>

          {/* Notification dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800 font-manrope">System Updates</p>
                <span className="text-xs text-slate-400">{notifications.length} new</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((n, i) => (
                  <div key={i} className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#1e3a8a] mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{n.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{n.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User badge */}
        <div className="hidden md:flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-[#1e3a8a] flex items-center justify-center text-white text-xs font-bold shadow-sm overflow-hidden">
            {mounted && session?.user?.image ? (
              <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
            ) : (
              <span>{mounted && session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "A"}</span>
            )}
          </div>
          <div className="hidden lg:block">
            <p className="text-xs font-semibold text-slate-700 leading-tight">
              {mounted && session?.user?.name ? session.user.name.split(" ")[0] : "User"}
            </p>
            <p className="text-[10px] text-slate-400 capitalize leading-tight">{mounted ? role : "..."}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
