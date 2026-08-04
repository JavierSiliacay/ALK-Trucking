"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TripFormModal from "@/components/trips/TripFormModal";
import { useTrips } from "@/lib/trips-store";

const LOGO_URL = "/alk_logo.jpg";

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: "dashboard" },
  { name: "Trips", href: "/admin/trips", icon: "local_shipping" },
  { name: "Reports", href: "/admin/reports", icon: "assessment" },
  { name: "Payroll", href: "/admin/payroll", icon: "payments" },
  { name: "Settings", href: "/admin/settings", icon: "settings" },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { addTrip } = useTrips();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isActive = (item: NavItem) => {
    if (item.href === "/admin") return pathname === "/admin";
    return pathname.startsWith(item.href);
  };

  return (
    <>
      <aside
        className={`h-screen relative bg-[#00193c] text-white flex flex-col py-5 shadow-xl transition-all duration-300 ease-in-out shrink-0 z-40 ${
          isCollapsed ? "w-16" : "w-56"
        }`}
      >
        {/* CENTER ARROW TOGGLE BUTTON */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#00193c] border-2 border-blue-400/40 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md hover:scale-110 hover:border-blue-400 hover:bg-[#002d62] transition-all z-50"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-blue-300" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-blue-300" />
          )}
        </button>

        {/* Brand Header */}
        <div className={`px-4 mb-6 flex items-center gap-2.5 ${isCollapsed ? "justify-center px-1" : ""}`}>
          <div className={`rounded-lg overflow-hidden bg-white p-0.5 shadow-sm shrink-0 ${isCollapsed ? "w-8 h-8" : "w-9 h-9"}`}>
            <img src={LOGO_URL} alt="ALK Trucking Logo" className="w-full h-full object-contain" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="font-extrabold text-white text-sm leading-tight">Fleet Manager</h1>
              <p className="text-[10px] text-blue-300/80 font-medium">ALK Trucking PH</p>
            </div>
          )}
        </div>

        {/* 4 Main Nav Items */}
        <nav className="flex-1 space-y-1 px-2">
          {navigation.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  active
                    ? "bg-[#002d62] text-white shadow-sm border border-blue-400/20"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                } ${isCollapsed ? "justify-center px-0" : ""}`}
                title={isCollapsed ? item.name : undefined}
              >
                <span className="material-symbols-outlined text-[20px] shrink-0">{item.icon}</span>
                {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
