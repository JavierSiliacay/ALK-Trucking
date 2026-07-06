"use client";

import React, { useState } from "react";
import { MapPin, Navigation, Clock, Truck } from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { StatusBadge } from "@/components/ui/PageShell";

const ACTIVE_TRIPS = [
  { id: "TRP-001", truck: "ALK-001", driver: "Juan Dela Cruz",  helper: "Bryan Gomez",     origin: "CDO", dest: "Iligan City",  dep: "07:30 AM", eta: "09:00 AM", status: "In Transit", progress: 65 },
  { id: "TRP-004", truck: "ALK-002", driver: "Eduardo Lim",     helper: "Mark Villanueva", origin: "CDO", dest: "Ozamiz",       dep: "06:00 AM", eta: "09:30 AM", status: "In Transit", progress: 40 },
];

export default function ActiveTripsPage() {
  return (
    <PageShell
      title="Active Trips"
      subtitle={`${ACTIVE_TRIPS.length} trips currently in transit`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ACTIVE_TRIPS.map((t) => (
          <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-[#1e3a8a]/30 hover:shadow-md transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1e3a8a] flex items-center justify-center">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-manrope font-bold text-slate-800">{t.truck}</p>
                  <p className="text-xs font-mono text-blue-500">{t.id}</p>
                </div>
              </div>
              <StatusBadge status={t.status} />
            </div>

            {/* Route */}
            <div className="flex items-center gap-3 mb-5 p-3 bg-slate-50 rounded-xl">
              <div className="flex flex-col items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[#1e3a8a]" />
                <div className="w-0.5 h-6 bg-slate-300" />
                <div className="w-3 h-3 rounded-full bg-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">{t.origin}</p>
                <p className="text-xs text-slate-400 my-1">En route</p>
                <p className="text-sm font-bold text-slate-800">{t.dest}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">ETA</p>
                <p className="text-sm font-bold text-[#1e3a8a]">{t.eta}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span>Departure: {t.dep}</span>
                <span className="font-bold text-[#1e3a8a]">{t.progress}% Complete</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] rounded-full transition-all"
                  style={{ width: `${t.progress}%` }}
                />
              </div>
            </div>

            {/* Crew */}
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-[#1e3a8a] flex items-center justify-center text-white text-[9px] font-bold">
                  {t.driver.charAt(0)}
                </div>
                <span>{t.driver}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-[#1e3a8a] text-[9px] font-bold">
                  {t.helper.charAt(0)}
                </div>
                <span>{t.helper}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {ACTIVE_TRIPS.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <MapPin className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-lg font-semibold">No active trips</p>
          <p className="text-sm">All trucks are currently idle or at base.</p>
        </div>
      )}
    </PageShell>
  );
}
