"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTrips } from "@/lib/trips-store";
import TripFormModal from "@/components/trips/TripFormModal";

export default function DashboardPage() {
  const { trips, activeTrips, completedTrips, addTrip, masterData } = useTrips();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const totalMonthlyRevenue = completedTrips.reduce((sum, t) => sum + (Number(t.rate) || 0), 0);

  return (
    <div className="p-4 sm:p-6 max-w-[1440px] mx-auto w-full space-y-6">
      
      {/* Summary Stats Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Active Trips */}
        <div className="bg-white p-4.5 rounded-xl border border-[#c4c6d1] card-shadow flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-[#002d62] text-[20px]">route</span>
            <span className="text-[#43474f] font-semibold text-[11px] bg-[#dfe0e0] px-2 py-0.5 rounded-full">+12%</span>
          </div>
          <div className="mt-3">
            <span className="font-semibold text-xs text-[#43474f]">Active Trips</span>
            <span className="font-extrabold text-2xl text-[#00193c] font-mono mt-0.5 block">{activeTrips.length}</span>
          </div>
        </div>

        {/* Completed Trips */}
        <div className="bg-white p-4.5 rounded-xl border border-[#c4c6d1] card-shadow flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-emerald-600 text-[20px]">task_alt</span>
            <span className="text-[#43474f] font-semibold text-[11px] bg-[#dfe0e0] px-2 py-0.5 rounded-full">Today</span>
          </div>
          <div className="mt-3">
            <span className="font-semibold text-xs text-[#43474f]">Completed Trips</span>
            <span className="font-extrabold text-2xl text-[#00193c] font-mono mt-0.5 block">{completedTrips.length}</span>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white p-4.5 rounded-xl border border-[#c4c6d1] card-shadow flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-blue-600 text-[20px]">payments</span>
          </div>
          <div className="mt-3">
            <span className="font-semibold text-xs text-[#43474f]">Monthly Revenue</span>
            <span className="font-extrabold text-2xl text-emerald-700 font-mono mt-0.5 block">
              ₱{(totalMonthlyRevenue / 1000).toFixed(0)}k
            </span>
          </div>
        </div>

        {/* Total Trucks */}
        <div className="bg-white p-4.5 rounded-xl border border-[#c4c6d1] card-shadow flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-[#43474f] text-[20px]">local_shipping</span>
          </div>
          <div className="mt-3">
            <span className="font-semibold text-xs text-[#43474f]">Total Trucks</span>
            <span className="font-extrabold text-2xl text-[#00193c] font-mono mt-0.5 block">{masterData.trucks.length}</span>
          </div>
        </div>

        {/* Total Drivers */}
        <div className="bg-white p-4.5 rounded-xl border border-[#c4c6d1] card-shadow flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-[#43474f] text-[20px]">badge</span>
          </div>
          <div className="mt-3">
            <span className="font-semibold text-xs text-[#43474f]">Total Drivers</span>
            <span className="font-extrabold text-2xl text-[#00193c] font-mono mt-0.5 block">{masterData.drivers.length}</span>
          </div>
        </div>
      </section>

      {/* Bento Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Quick Actions: Compact Buttons (Col-Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <h2 className="font-extrabold text-base text-[#00193c] font-manrope">Quick Actions</h2>
          
          <button
            onClick={() => setIsFormOpen(true)}
            className="group w-full p-4 sm:p-4.5 bg-[#00193c] text-white rounded-xl flex items-center justify-between hover:brightness-110 transition-all shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[24px]">add_circle</span>
              <span className="font-bold text-base">Add Trip</span>
            </div>
            <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>

          <Link
            href="/admin/trips"
            className="group w-full p-4 sm:p-4.5 bg-white border border-[#00193c] text-[#00193c] rounded-xl flex items-center justify-between hover:bg-blue-50 transition-all card-shadow cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[24px]">list_alt</span>
              <span className="font-bold text-base">Track Trips</span>
            </div>
            <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>

          <Link
            href="/admin/reports"
            className="group w-full p-4 sm:p-4.5 bg-white border border-[#c4c6d1] text-[#43474f] rounded-xl flex items-center justify-between hover:bg-[#f1f4f7] transition-all card-shadow cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[24px]">assessment</span>
              <span className="font-bold text-base">Reports</span>
            </div>
            <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
        </div>

        {/* Recent Active Trips (Col-Span 8) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-[#c4c6d1] card-shadow p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-[#c4c6d1] pb-3">
            <div>
              <h2 className="font-extrabold text-base text-[#00193c] font-manrope">Recent Active Trips</h2>
              <p className="text-[11px] text-[#43474f]">Live shipments currently en route</p>
            </div>
            <Link href="/admin/trips" className="text-xs font-bold text-[#00193c] hover:underline flex items-center gap-1">
              View All Trips →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f1f4f7] border-b border-[#c4c6d1] text-[#00193c] font-bold">
                  <th className="px-3.5 py-2.5">Trip #</th>
                  <th className="px-3.5 py-2.5">Date</th>
                  <th className="px-3.5 py-2.5">Truck Unit</th>
                  <th className="px-3.5 py-2.5">Driver</th>
                  <th className="px-3.5 py-2.5">Route</th>
                  <th className="px-3.5 py-2.5">Customer</th>
                  <th className="px-3.5 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c4c6d1]">
                {activeTrips.slice(0, 5).map((t) => (
                  <tr key={t.id} className="hover:bg-[#f1f4f7] transition-colors">
                    <td className="px-3.5 py-2.5 font-mono font-extrabold text-[#00193c]">{t.seqNo || t.id}</td>
                    <td className="px-3.5 py-2.5 text-[#43474f]">{t.dateOfTravel}</td>
                    <td className="px-3.5 py-2.5 font-bold text-[#181c1e]">{t.unit} ({t.plateNo})</td>
                    <td className="px-3.5 py-2.5 font-semibold text-[#181c1e]">{t.driver}</td>
                    <td className="px-3.5 py-2.5 font-bold text-[#181c1e]">{t.origin || "CDO"} → {t.destination}</td>
                    <td className="px-3.5 py-2.5 text-[#181c1e]">{t.customerName}</td>
                    <td className="px-3.5 py-2.5">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-extrabold text-[10px] rounded-full uppercase">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
                {activeTrips.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                      No active trips. Click <strong>&quot;Add Trip&quot;</strong> to start a new record.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <TripFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={async (data) => { await addTrip(data as any); }}
      />
    </div>
  );
}
