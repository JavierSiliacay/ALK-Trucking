"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Menu, X } from "lucide-react";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="relative h-full">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden absolute top-6 right-6 p-2 bg-slate-100/80 backdrop-blur-sm text-slate-700 rounded-xl shadow-sm border border-slate-200 z-[60] hover:bg-white transition-all active:scale-90"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
        {/* Sticky header */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden ml-4 p-2 text-slate-600 hover:bg-slate-50 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <Header />
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-4 md:px-10 py-6 md:py-8 pb-20 md:pb-8">
          <div className="max-w-[1440px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
