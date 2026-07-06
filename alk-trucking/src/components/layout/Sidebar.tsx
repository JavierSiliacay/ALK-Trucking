"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  Users,
  UserCheck,
  Building2,
  MapPin,
  Route,
  DollarSign,
  Fuel,
  Wrench,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  Shield,
  History,
  ClipboardList,
} from "lucide-react";
import { useSession } from "next-auth/react";

const LOGO_URL = "/alk_logo.jpg";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
  adminOnly?: boolean;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Fleet / Trucks", href: "/admin/fleet", icon: Truck },
  { name: "Drivers", href: "/admin/drivers", icon: UserCheck },
  { name: "Helpers", href: "/admin/helpers", icon: Users },
  { name: "Customers", href: "/admin/customers", icon: Building2 },
  {
    name: "Trips",
    href: "/admin/trips",
    icon: MapPin,
    children: [
      { name: "All Trips", href: "/admin/trips", icon: ClipboardList },
      { name: "Active Trips", href: "/admin/trips/active", icon: MapPin },
    ],
  },
  { name: "Routes", href: "/admin/routes", icon: Route },
  { name: "Costing", href: "/admin/costing", icon: DollarSign },
  { name: "Fuel Expenses", href: "/admin/fuel", icon: Fuel },
  { name: "Maintenance", href: "/admin/maintenance", icon: Wrench },
  {
    name: "Payroll",
    href: "/admin/payroll",
    icon: Wallet,
    children: [
      { name: "Driver Payroll", href: "/admin/payroll/drivers", icon: UserCheck },
      { name: "Helper Payroll", href: "/admin/payroll/helpers", icon: Users },
    ],
  },
  { name: "Reports", href: "/admin/reports", icon: BarChart3 },
];

const adminNavigation: NavItem[] = [
  { name: "Users", href: "/admin/users", icon: Users, adminOnly: true },
  { name: "Audit Logs", href: "/admin/audit-logs", icon: History, adminOnly: true },
  { name: "Delete History", href: "/admin/delete-history", icon: History, adminOnly: true },
  { name: "Settings", href: "/admin/settings", icon: Settings, adminOnly: true },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(["Trips", "Payroll"]);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const role = (session?.user as any)?.role || "staff";
  const isStaff = role === "staff";

  const handleMouseEnter = () => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    setIsCollapsed(false);
  };

  const handleMouseLeave = () => {
    collapseTimeoutRef.current = setTimeout(() => setIsCollapsed(true), 200);
  };

  const toggleExpand = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName) ? prev.filter((i) => i !== itemName) : [...prev, itemName]
    );
  };

  const isActive = (item: NavItem) => {
    if (item.href === "/admin") return pathname === "/admin";
    if (item.children) return pathname.startsWith(item.href);
    return pathname.startsWith(item.href);
  };

  const renderNavItem = (item: NavItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const active = isActive(item);
    const expanded = expandedItems.includes(item.name);

    const baseClass = `relative flex items-center gap-4 px-4 py-3 rounded-xl font-manrope text-sm tracking-wide transition-all duration-300 ease-in-out group`;
    const activeClass = "text-white bg-[#1e3a8a] font-semibold shadow-lg shadow-[#1e3a8a]/30";
    const inactiveClass = "text-slate-500 font-medium hover:bg-slate-50 hover:text-[#1e3a8a]";

    return (
      <div key={item.name} className="flex flex-col">
        {hasChildren ? (
          <button
            onClick={() => toggleExpand(item.name)}
            className={`${baseClass} ${active ? activeClass : inactiveClass} w-full text-left`}
            title={isCollapsed ? item.name : undefined}
          >
            <item.icon className={`w-5 h-5 shrink-0 transition-transform ${active ? "scale-110" : "group-hover:scale-105"}`} />
            {!isCollapsed && (
              <>
                <span className="whitespace-nowrap flex-1">{item.name}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
              </>
            )}
          </button>
        ) : (
          <Link
            href={item.href}
            className={`${baseClass} ${active ? activeClass : inactiveClass}`}
            title={isCollapsed ? item.name : undefined}
          >
            <item.icon className={`w-5 h-5 shrink-0 transition-transform ${active ? "scale-110" : "group-hover:scale-105"}`} />
            {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
            {active && !isCollapsed && (
              <div className="absolute right-0 top-2 bottom-2 w-1 bg-white/40 rounded-l-full" />
            )}
          </Link>
        )}

        {/* Sub-items */}
        {hasChildren && expanded && !isCollapsed && (
          <div className="ml-9 flex flex-col gap-0.5 mt-1 border-l-2 border-slate-100 pl-3">
            {item.children!.map((child) => {
              const childActive = pathname === child.href;
              return (
                <Link
                  key={child.name}
                  href={child.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    childActive
                      ? "text-[#1e3a8a] font-semibold bg-blue-50"
                      : "text-slate-500 hover:text-[#1e3a8a] hover:bg-slate-50"
                  }`}
                >
                  <child.icon className={`w-3.5 h-3.5 shrink-0 ${childActive ? "opacity-100" : "opacity-50"}`} />
                  <span>{child.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`h-screen relative flex flex-col bg-white border-r border-slate-100 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-40 ${
        isCollapsed ? "w-[72px]" : "w-72"
      } ${mounted ? "flex" : "hidden lg:flex"}`}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-24 w-6 h-6 bg-white border border-slate-200 rounded-full hidden lg:flex items-center justify-center text-slate-400 hover:text-[#1e3a8a] hover:border-[#1e3a8a] transition-all z-50 shadow-sm"
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Logo */}
      <div className={`px-4 pt-6 pb-6 flex items-center gap-3 border-b border-slate-100 ${isCollapsed ? "justify-center" : ""}`}>
        <div className={`rounded-xl overflow-hidden border-2 border-[#1e3a8a]/10 shadow-sm shrink-0 ${isCollapsed ? "w-10 h-10" : "w-12 h-12"}`}>
          <img src={LOGO_URL} alt="ALK Trucking" className="w-full h-full object-contain" />
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden">
            <p className="font-manrope font-bold text-[#1e3a8a] text-sm leading-tight tracking-tight">ALK Trucking</p>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Management System</p>
          </div>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
        {/* Section label */}
        <div className={`mb-3 px-3 flex items-center ${isCollapsed ? "justify-center" : ""}`}>
          {!isCollapsed && <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Operations</span>}
          {isCollapsed && <div className="h-px w-8 bg-slate-100" />}
        </div>

        {navigation.map(renderNavItem)}

        {/* Admin section */}
        {mounted && !isStaff && (
          <>
            <div className={`mt-6 mb-3 px-3 flex items-center ${isCollapsed ? "justify-center" : ""}`}>
              {!isCollapsed && <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Administration</span>}
              {isCollapsed && <div className="h-px w-8 bg-slate-100" />}
            </div>
            {adminNavigation.map(renderNavItem)}
          </>
        )}

        {/* System section */}
        <div className={`mt-6 mb-3 px-3 flex items-center ${isCollapsed ? "justify-center" : ""}`}>
          {!isCollapsed && <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">System</span>}
          {isCollapsed && <div className="h-px w-8 bg-slate-100" />}
        </div>

        <Link
          href="/api/auth/signout"
          className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-500 font-medium font-manrope text-sm tracking-wide transition-all duration-200 hover:text-red-500 hover:bg-red-50 group"
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
          {!isCollapsed && <span className="whitespace-nowrap">Logout</span>}
        </Link>
      </nav>

      {/* Profile card */}
      <div className={`p-3 border-t border-slate-100 ${isCollapsed ? "flex justify-center" : ""}`}>
        <div
          className={`flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 ${
            isCollapsed ? "w-10 h-10 justify-center p-1 border-none bg-transparent" : ""
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-[#1e3a8a] flex items-center justify-center text-white ring-4 ring-[#1e3a8a]/10 shadow-md shrink-0 overflow-hidden">
            {mounted && session?.user?.image ? (
              <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold text-slate-700 whitespace-nowrap truncate">
                {mounted && session?.user?.name ? session.user.name : "Loading..."}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Shield className="w-3 h-3 text-[#1e3a8a]" />
                <p className="text-[10px] text-slate-400 font-medium capitalize">
                  {mounted ? (role || "staff") : "..."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
