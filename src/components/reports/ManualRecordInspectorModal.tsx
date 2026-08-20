"use client";

import React from "react";
import { X, Calendar, DollarSign, Tag, Building2, ReceiptText, WalletCards, Truck, Receipt, FileSignature } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";

interface ManualRecordInspectorModalProps {
  record: any | null;
  onClose: () => void;
}

export default function ManualRecordInspectorModal({ record, onClose }: ManualRecordInspectorModalProps) {
  if (!record) return null;

  const isSale = record.type === "Sale";
  const formattedDate = record.date ? format(new Date(record.date), "MMMM dd, yyyy") : "-";

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden cursor-default animate-in fade-in zoom-in-95 duration-300 border border-slate-200/60"
      >
        {/* Header Section */}
        <div className={`relative px-8 py-8 overflow-hidden ${isSale ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' : 'bg-gradient-to-br from-rose-500 to-rose-700'}`}>
          <div className="absolute top-0 right-0 p-4 -mr-8 -mt-8 select-none pointer-events-none">
            <div className="relative w-64 h-64 opacity-15 mix-blend-screen">
              <Image
                src="/alk_logo.jpg"
                alt="ALK Corporate Logo"
                fill
                className="object-contain grayscale contrast-125"
                priority
              />
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-white/20 text-white text-xs font-black uppercase tracking-wider rounded-lg backdrop-blur-md">
                  {isSale ? "Incoming Revenue" : "Corporate Expense"}
                </span>
                <span className="px-3 py-1 bg-black/20 text-white text-xs font-bold uppercase tracking-wider rounded-lg backdrop-blur-md flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formattedDate}
                </span>
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">
                {record.category}
              </h2>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-white/80 text-sm font-bold uppercase tracking-wider mb-1">Total Amount</p>
              <p className="text-4xl font-black text-white drop-shadow-sm">
                ₱{Number(record.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50">

          {/* Main Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Tag className="w-4 h-4" /> Description
              </h3>
              <p className="text-slate-800 font-medium text-sm leading-relaxed bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                {record.expenseDescription || <span className="text-slate-400 italic">No description provided</span>}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <FileSignature className="w-4 h-4" /> Remarks / Additional Notes
              </h3>
              <p className="text-slate-700 font-medium text-sm bg-white p-4 rounded-xl border border-slate-100 shadow-sm min-h-[4rem]">
                {record.remarks || <span className="text-slate-400 italic">None</span>}
              </p>
            </div>
          </div>

          {/* Metadata Cards */}
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3">
              <div className={`p-2 rounded-lg ${isSale ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Charge To / Client</p>
                <p className="text-slate-900 font-bold text-sm">{record.chargeTo || "-"}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <ReceiptText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Invoice / Supplier</p>
                <p className="text-slate-900 font-bold text-sm">
                  {record.invoiceNo ? `Inv: ${record.invoiceNo}` : "No Invoice"}
                </p>
                {record.suppliersName && (
                  <p className="text-slate-500 font-medium text-xs mt-0.5">{record.suppliersName}</p>
                )}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <WalletCards className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Payment Method</p>
                <p className="text-slate-900 font-bold text-sm">{record.paymentType || "-"}</p>
              </div>
            </div>

            {(record.unitVehicle || record.plateNo) && (
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Vehicle Details</p>
                  <p className="text-slate-900 font-bold text-sm">
                    {record.unitVehicle || "-"} <span className="text-slate-400 font-normal">({record.plateNo || "-"})</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Corporate Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-300 shadow-sm">
              <Image src="/alk_logo.jpg" alt="ALK Logo" fill className="object-cover" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              ALK Trucking - Official Corporate Record
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            RECORD ID: {record.id ? record.id.split('-')[0].toUpperCase() : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
}
