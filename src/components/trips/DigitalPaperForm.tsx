"use client";

import React from "react";
import { Trip, calculateTripTotals } from "@/lib/trips-store";
import { Printer, X } from "lucide-react";
import { formatDateLong } from "@/lib/utils";

interface DigitalPaperFormProps {
  trip: Trip;
  onClose?: () => void;
}

export default function DigitalPaperForm({ trip, onClose }: DigitalPaperFormProps) {
  const { totalExpense, remainder } = calculateTripTotals(trip);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white p-4 sm:p-8 rounded-2xl max-w-4xl mx-auto shadow-2xl my-4 text-slate-900 border border-slate-300 print:bg-white print:p-0 print:shadow-none print:my-0 print:border-none print:max-w-none">
      
      {/* Print PDF Media Rules for Paper Form (Zero Light Blue Background & No Scrollbars) */}
      <style jsx global>{`
        @media print {
          @page {
            size: 8.5in 13in portrait;
            margin: 8mm 10mm 8mm 10mm;
          }
          html, body, div, main, section, article {
            background-color: #ffffff !important;
            color: #000000 !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            box-shadow: none !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          ::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header action bar (Hidden on print) */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h3 className="font-manrope font-bold text-lg text-[#00193c]">Monitoring Form Inspector</h3>
          <p className="text-xs text-slate-500">Digital replica of physical MONITORING FORM (TRAVEL & EXPENSE)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-[#00193c] hover:bg-blue-900 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Monitoring Form</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Physical Form Printable Container (Pure White Bond Paper & Crisp Borders) */}
      <div className="bg-white p-6 sm:p-10 border-2 border-slate-900 rounded-sm font-sans tracking-tight text-xs shadow-lg print:shadow-none print:p-0 print:border-none">
        
        {/* Form Header Title with ALK Logo centered together */}
        <div className="flex items-center justify-center gap-4 mb-6 pb-3 border-b-2 border-slate-900">
          <img src="/alk_logo.jpg" alt="ALK Trucking Logo" className="h-14 w-auto object-contain rounded-md shrink-0 border border-slate-300 p-0.5" />
          <div className="text-left">
            <h2 className="text-lg sm:text-xl font-extrabold tracking-wider uppercase text-slate-900 leading-tight">
              MONITORING FORM ( TRAVEL & EXPENSE )
            </h2>
            <p className="text-[10px] text-slate-600 font-mono font-bold mt-0.5">ALK TRUCKING OPERATIONAL TRIP RECORD</p>
          </div>
        </div>

        {/* Top Header Fields Grid (Two Columns) */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 text-xs border-b-2 border-slate-900 pb-6">
          {/* Left Column */}
          <div className="space-y-2">
            <div className="flex items-baseline">
              <span className="font-bold w-32 uppercase text-slate-800">UNIT:</span>
              <span className="font-bold font-mono text-sm text-slate-900 border-b border-dashed border-slate-400 flex-1 px-1">{trip.unit || "—"}</span>
            </div>
            <div className="flex items-baseline">
              <span className="font-bold w-32 uppercase text-slate-800">PLATE #:</span>
              <span className="font-bold font-mono text-sm text-slate-900 border-b border-dashed border-slate-400 flex-1 px-1">{trip.plateNo || "—"}</span>
            </div>
            <div className="flex items-baseline">
              <span className="font-bold w-32 uppercase text-slate-800">DRIVER:</span>
              <span className="font-semibold text-slate-900 border-b border-dashed border-slate-400 flex-1 px-1">{trip.driver || "—"}</span>
            </div>
            <div className="flex items-baseline">
              <span className="font-bold w-32 uppercase text-slate-800">HELPER 1:</span>
              <span className="text-slate-800 border-b border-dashed border-slate-400 flex-1 px-1">{trip.helper1 || "—"}</span>
            </div>
            <div className="flex items-baseline">
              <span className="font-bold w-32 uppercase text-slate-800">HELPER 2:</span>
              <span className="text-slate-800 border-b border-dashed border-slate-400 flex-1 px-1">{trip.helper2 || "—"}</span>
            </div>
            <div className="flex items-baseline">
              <span className="font-bold w-32 uppercase text-slate-800">DATE REQUEST:</span>
              <span className="font-semibold text-slate-900 border-b border-dashed border-slate-400 flex-1 px-1">{formatDateLong(trip.dateOfTravel)}</span>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-2">
            <div className="flex items-baseline">
              <span className="font-bold w-40 uppercase text-slate-800">CUSTOMER/CLIENT NAME:</span>
              <span className="font-bold text-slate-900 border-b border-dashed border-slate-400 flex-1 px-1">{trip.customerName || "—"}</span>
            </div>
            <div className="flex items-baseline">
              <span className="font-bold w-40 uppercase text-slate-800">GATE PASS #:</span>
              <span className="font-mono font-bold text-slate-900 border-b border-dashed border-slate-400 flex-1 px-1">{trip.gatePassNo || "—"}</span>
            </div>
            <div className="flex items-baseline">
              <span className="font-bold w-40 uppercase text-slate-800">GATE PASS DATE:</span>
              <span className="text-slate-800 border-b border-dashed border-slate-400 flex-1 px-1">{formatDateLong(trip.gatePassDate)}</span>
            </div>
            <div className="flex items-baseline">
              <span className="font-bold w-40 uppercase text-slate-800">SEQ. NO.:</span>
              <span className="font-mono font-bold text-[#00193c] border-b border-dashed border-slate-400 flex-1 px-1">{trip.seqNo || trip.id}</span>
            </div>
            <div className="flex items-baseline">
              <span className="font-bold w-40 uppercase text-slate-800">ROUTE (ORIGIN-DEST):</span>
              <span className="font-bold text-slate-900 border-b border-dashed border-slate-400 flex-1 px-1">
                {trip.origin ? `${trip.origin} - ${trip.destination}` : trip.destination || "—"} {trip.distance && `(${trip.distance})`}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="font-bold w-40 uppercase text-slate-800">RATE (REVENUE):</span>
              <span className="font-mono font-extrabold text-base text-emerald-800 border-b border-dashed border-slate-400 flex-1 px-1">
                ₱{Number(trip.rate || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="border-2 border-slate-900 mb-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-900 uppercase text-[11px] font-extrabold text-slate-900">
                <th className="p-2 border-r border-slate-900 w-36">CATEGORY</th>
                <th className="p-2 border-r border-slate-900 w-28">DATE REQUEST</th>
                <th className="p-2 border-r border-slate-900 w-24">RS #</th>
                <th className="p-2 border-r border-slate-900">DESCRIPTION</th>
                <th className="p-2 border-r border-slate-900 w-28 text-right">AMOUNT (₱)</th>
                <th className="p-2">REMARKS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 font-mono text-[11px]">
              {trip.expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50">
                  <td className="p-2 border-r border-slate-900 font-bold uppercase text-slate-900">{exp.category}</td>
                  <td className="p-2 border-r border-slate-900 text-slate-800">{exp.dateRequest ? formatDateLong(exp.dateRequest) : "—"}</td>
                  <td className="p-2 border-r border-slate-900 text-slate-800">{exp.rsNo || "—"}</td>
                  <td className="p-2 border-r border-slate-900 text-slate-900 font-sans">{exp.description || "—"}</td>
                  <td className="p-2 border-r border-slate-900 font-bold text-slate-900 text-right">
                    {exp.amount ? `₱${exp.amount.toLocaleString()}` : "—"}
                  </td>
                  <td className="p-2 text-slate-700 font-sans">{exp.remarks || "—"}</td>
                </tr>
              ))}
              {trip.expenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-400 font-sans italic">
                    No expense line items recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Signatures */}
        <div className="flex justify-between items-start gap-8">
          {/* Signatures */}
          <div className="flex-1 mt-6">
            <div className="flex items-center gap-2 mb-10">
              <span className="font-bold text-slate-800 text-xs">STATUS:</span>
              <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded border ${trip.status === "Active" ? "bg-white text-amber-600 border-amber-600" : "bg-white text-emerald-600 border-emerald-600"}`}>
                {trip.status}
              </span>
            </div>
            <div className="flex items-end gap-6">
              <div className="flex-1">
                {trip.completedAt && (
                  <span className="text-[10px] text-slate-500">
                    Completed on {new Date(trip.completedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* Financial Summary Box */}
          <div className="w-full sm:w-72 bg-white border-2 border-slate-900 p-4 rounded-sm font-mono space-y-2">
            <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-1">
              <span className="font-bold text-slate-700">TOTAL RATE:</span>
              <span className="font-bold text-slate-900">₱{Number(trip.rate || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-1">
              <span className="font-bold text-slate-700">TOTAL EXPENSES:</span>
              <span className="font-bold text-rose-800">₱{totalExpense.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-extrabold pt-1 text-emerald-900">
              <span>REMAINDER:</span>
              <span>₱{remainder.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
