"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ChevronLeft, ChevronRight, LogOut, User } from "lucide-react";
import TripFormModal from "@/components/trips/TripFormModal";
import { useTrips } from "@/lib/trips-store";
import { handleSignOut } from "@/actions/auth";
import { FINANCIAL_AUTHORIZED_EMAILS } from "@/config/permissions";

const LOGO_URL = "/alk_logo.jpg";

interface NavItem {
  name: string;
  href: string;
  icon: string;
  children?: Omit<NavItem, 'children'>[];
}

const baseNavigation: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: "dashboard" },
  { name: "Trips", href: "/admin/trips", icon: "local_shipping" },
  { 
    name: "Trucks", 
    href: "/admin/trucks-folder", 
    icon: "directions_car",
    children: [
      { name: "Fleet Performance", href: "/admin/trucks", icon: "monitoring" },
      { name: "Maintenance", href: "/admin/maintenance", icon: "build" },
    ]
  },
  { name: "Inventory", href: "/admin/inventory", icon: "inventory_2" },
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
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  const navigation = React.useMemo(() => {
    const nav = [...baseNavigation];
    if (session?.user?.email && FINANCIAL_AUTHORIZED_EMAILS.includes(session.user.email)) {
      nav.splice(nav.length - 1, 0, {
        name: "Financial", href: "/admin/financial", icon: "account_balance"
      });
    }
    return nav;
  }, [session?.user?.email]);
  
  // Track which folders are open (by item name)
  // By default, open the folder if we are currently inside it
  const [openFolders, setOpenFolders] = useState<string[]>(() => {
    const initialOpen: string[] = [];
    baseNavigation.forEach(item => {
      if (item.children?.some(child => pathname.startsWith(child.href))) {
        initialOpen.push(item.name);
      }
    });
    return initialOpen;
  });

  useEffect(() => { setMounted(true); }, []);

  const isActive = (item: NavItem) => {
    if (item.href === "/admin") return pathname === "/admin";
    if (item.children) {
      return item.children.some(child => pathname.startsWith(child.href));
    }
    return pathname.startsWith(item.href);
  };

  const toggleFolder = (name: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setOpenFolders(prev => prev.includes(name) ? prev : [...prev, name]);
    } else {
      setOpenFolders(prev => prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]);
    }
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
              <h1 className="font-extrabold text-white text-sm leading-tight">Fleet Management</h1>
              <p className="text-[10px] text-blue-300/80 font-medium">ALK Trucking Services</p>
            </div>
          )}
        </div>

        {/* 4 Main Nav Items */}
        <nav className="flex-1 space-y-1 px-2 overflow-y-auto custom-scrollbar">
          {navigation.map((item) => {
            const active = isActive(item);
            const isOpen = openFolders.includes(item.name);
            
            if (item.children) {
              return (
                <div key={item.name} className="flex flex-col">
                  <button
                    onClick={() => toggleFolder(item.name)}
                    className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 w-full ${
                      active
                        ? "bg-[#002d62]/50 text-white border border-blue-400/10"
                        : "text-slate-300 hover:text-white hover:bg-white/10"
                    } ${isCollapsed ? "justify-center px-0" : ""}`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] shrink-0">{item.icon}</span>
                      {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                    </div>
                    {!isCollapsed && (
                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                    )}
                  </button>
                  
                  {/* Children Items */}
                  {!isCollapsed && isOpen && (
                    <div className="mt-1 ml-4 pl-3 border-l border-white/10 space-y-1 flex flex-col">
                      {item.children.map(child => {
                        const childActive = pathname.startsWith(child.href);
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                              childActive
                                ? "bg-[#002d62] text-white shadow-sm border border-blue-400/20"
                                : "text-slate-400 hover:text-white hover:bg-white/10"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px] shrink-0">{child.icon}</span>
                            <span className="whitespace-nowrap">{child.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

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

        {/* User Profile & Sign Out Footer */}
        {mounted && (
          <div className="p-3 border-t border-white/10 mt-auto">
            {!isCollapsed ? (
              <div className="flex flex-col gap-3">
                {session?.user && (
                  <div className="flex items-center gap-2.5 bg-white/5 rounded-xl p-2.5">
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-blue-900 flex items-center justify-center">
                      {session.user.image ? (
                        <img src={session.user.image} alt={session.user.name || "User"} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-blue-300" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-white text-xs font-bold truncate">{session.user.name}</p>
                      <p className="text-blue-300 text-[10px] truncate">{session.user.email}</p>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setIsSignOutModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 rounded-lg text-xs font-bold transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSignOutModalOpen(true)}
                className="w-full flex justify-center py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition-all"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </aside>

      {/* Sign Out Modal Overlay - Portaled to document.body */}
      {mounted && isSignOutModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 sm:p-8 text-center relative border border-slate-200">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-5 relative">
              <div className="absolute inset-0 rounded-full animate-ping bg-rose-100/50" style={{ animationDuration: '3s' }}></div>
              <LogOut className="w-8 h-8 text-rose-500 relative z-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Ready to wrap up?</h2>
            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
              Great work today, <span className="font-bold text-slate-700">{session?.user?.name?.split(' ')[0] || 'team'}</span>! Please confirm if you're ready to securely end your session.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsSignOutModalOpen(false)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-extrabold text-sm rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <form action={handleSignOut} className="flex-1">
                <button
                  type="submit"
                  className="w-full px-4 py-3 bg-rose-600 text-white font-extrabold text-sm rounded-xl hover:bg-rose-700 transition-colors shadow-md shadow-rose-600/20 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
