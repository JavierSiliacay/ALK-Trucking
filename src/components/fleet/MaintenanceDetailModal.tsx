"use client";

import React from "react";
import { X, Calendar, Clock, Info, Truck, Tag, Receipt, CheckCircle, FileText, ExternalLink } from "lucide-react";

interface MaintenanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any | null;
}

export function MaintenanceDetailModal({ isOpen, onClose, record }: MaintenanceDetailModalProps) {
  if (!isOpen || !record) return null;

  const formatPHP = (amount: number | string) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(Number(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit'
    });
  };

  const isAutoworx = !!record.autoworxJobId;
  
  // Safely extract parts and labor from the Autoworx costing object
  const breakdownItems = record.repairBreakdown?.items || [];
  const parts = breakdownItems.filter((item: any) => item.type === 'parts' || item.category === 'Parts');
  const labor = breakdownItems.filter((item: any) => item.type !== 'parts' && item.category !== 'Parts');

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAutoworx ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg leading-tight">Expense Details</h3>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{isAutoworx ? 'Autoworx Sync' : 'Manual Entry'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar space-y-6">
          
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Receipt className="w-3 h-3" /> Total Cost
              </span>
              <span className="text-3xl font-black text-slate-900 font-mono tracking-tight text-rose-600">
                {formatPHP(record.cost)}
              </span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Truck className="w-3 h-3" /> Assigned Vehicle
              </span>
              <span className="text-xl font-extrabold text-slate-800 tracking-tight">
                {record.truck 
                  ? record.truck.plateNo 
                  : record.autoworxVehicleDetails && record.autoworxVehicleDetails.trim() !== ""
                    ? record.autoworxVehicleDetails
                    : "General ALK Fleet"}
              </span>
            </div>
          </div>

          {/* Details List */}
          <div className="space-y-4">
            
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-1 text-slate-500">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Description</span>
                <p className="text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">{record.description}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-1 text-slate-500">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Category</span>
                <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-sm font-bold border border-slate-200">
                  {record.category || "Uncategorized"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-1 text-slate-500">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Date Incurred</span>
                  <p className="text-slate-700 font-medium text-sm">{formatDate(record.dateIncurred)}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-1 text-slate-500">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Record Created At</span>
                  <p className="text-slate-700 font-medium text-sm">{formatDate(record.createdAt)}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-1 text-slate-500">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Approval Status</span>
                <span className={`inline-flex px-2.5 py-1 rounded-md text-sm font-bold border ${
                  record.status === 'Pending' 
                    ? 'bg-amber-50 text-amber-600 border-amber-200' 
                    : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}>
                  {record.status}
                </span>
              </div>
            </div>

            {isAutoworx && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-1 text-slate-500">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Autoworx Job ID</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-700 font-mono font-bold text-sm bg-slate-100 px-2 py-1 rounded border border-slate-200">
                      {record.autoworxJobId}
                    </span>
                    <a
                      href={`https://autoworxcagayan.com/track?code=${record.autoworxJobId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open in Autoworx
                    </a>
                  </div>
                </div>
              </div>
            )}
            
            {record.repairBreakdown && (parts.length > 0 || labor.length > 0) && (
              <div className="border-t border-slate-100 pt-6 mt-6">
                <h4 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-slate-400" />
                  Detailed Repair Breakdown
                </h4>
                
                {parts.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Parts</h5>
                    <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                      {parts.map((part: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-3 border-b border-slate-100 last:border-0 text-sm">
                          <span className="font-medium text-slate-700">
                            {part.quantity ? `${part.quantity}x ` : ''}{part.name || part.item || part.description}
                          </span>
                          <span className="font-bold text-slate-900">{formatPHP(part.price || part.amount || part.total || 0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {labor.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Labor</h5>
                    <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                      {labor.map((laborItem: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-3 border-b border-slate-100 last:border-0 text-sm">
                          <span className="font-medium text-slate-700">{laborItem.name || laborItem.description || laborItem.item}</span>
                          <span className="font-bold text-slate-900">{formatPHP(laborItem.price || laborItem.amount || laborItem.total || 0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>

      </div>
    </div>
  );
}
