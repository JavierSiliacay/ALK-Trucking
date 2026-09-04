"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle, Save, Loader2, Trash2 } from "lucide-react";
import { createFinancialRecord, updateFinancialRecord, deleteFinancialRecord } from "@/actions/finance";
import { toast } from "sonner";
import { format } from "date-fns";

const CATEGORIES = [
  "Payroll",
  "Cash Advance",
  "Rental Yarda",
  "Diesel",
  "Advances from Autoworx",
  "Receivables",
  "Payables",
  "Custom"
];

const BANKS = [
  "BDO",
  "PBB",
  "Custom"
];

interface FinanceFormModalProps {
  onClose: () => void;
  onSave: () => void;
  initialRecord?: any;
  isViewOnly?: boolean;
  runningBalance?: number;
  warningThreshold?: number;
}

export default function FinanceFormModal({
  onClose,
  onSave,
  initialRecord,
  isViewOnly = false,
  runningBalance = 0,
  warningThreshold = 50000
}: FinanceFormModalProps) {
  const [type, setType] = useState("Issuance");
  const [category, setCategory] = useState("Payroll");
  const [customCategory, setCustomCategory] = useState("");
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [bank, setBank] = useState("BDO");
  const [customBank, setCustomBank] = useState("");
  const [checkNo, setCheckNo] = useState("");
  const [amountDisplay, setAmountDisplay] = useState("");
  const [status, setStatus] = useState("Cleared");
  const [remarks, setRemarks] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Live validation for Pending checks against Threshold
  const parsedAmount = parseFloat(amountDisplay.replace(/,/g, '') || "0");
  const isPendingIssuance = type === "Issuance" && status === "Pending";
  
  // Calculate resulting balance after this check
  const oldAmount = (initialRecord && initialRecord.type === "Issuance" && initialRecord.status === "Pending") 
    ? parseFloat(initialRecord.amount || "0") 
    : 0;
  const projectedBalance = runningBalance + oldAmount - parsedAmount;
  const isThresholdBreached = isPendingIssuance && parsedAmount > 0 && projectedBalance <= warningThreshold;

  useEffect(() => {
    if (initialRecord) {
      setType(initialRecord.type || "Issuance");
      setStatus(initialRecord.status || "Pending");
      
      if (CATEGORIES.includes(initialRecord.category)) {
        setCategory(initialRecord.category);
      } else {
        setCategory("Custom");
        setCustomCategory(initialRecord.category || "");
      }

      if (BANKS.includes(initialRecord.bank)) {
        setBank(initialRecord.bank);
      } else if (initialRecord.bank) {
        setBank("Custom");
        setCustomBank(initialRecord.bank);
      }
      
      setDate(initialRecord.date ? new Date(initialRecord.date).toISOString().split('T')[0] : "");
      setName(initialRecord.name || "");
      setCheckNo(initialRecord.checkNo || "");
      
      const amountVal = initialRecord.amount ? parseFloat(initialRecord.amount).toString() : "";
      setAmountDisplay(amountVal ? amountVal.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : "");
      
      setRemarks(initialRecord.remarks || "");
    } else {
      // Default to Cleared for new entries; staff can select Pending when issuing unreleased/unprocessed checks
      setStatus("Cleared");
    }
  }, [initialRecord]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-numeric characters except decimal point
    let value = e.target.value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const decimalParts = value.split('.');
    if (decimalParts.length > 2) {
      value = decimalParts[0] + '.' + decimalParts.slice(1).join('');
    }

    // Format with commas for the whole number part
    if (value) {
      const parts = value.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      setAmountDisplay(parts.join('.'));
    } else {
      setAmountDisplay('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const payload = {
        type,
        status,
        category: category === "Custom" ? customCategory : category,
        date: new Date(date).toISOString(),
        name,
        bank: bank === "Custom" ? customBank : bank,
        checkNo,
        amount: parseFloat(amountDisplay.replace(/,/g, '') || "0"),
        remarks
      };

      let res;
      if (initialRecord) {
        res = await updateFinancialRecord(initialRecord.id, payload);
      } else {
        res = await createFinancialRecord(payload);
      }

      if (!res.success) {
        toast.error(res.error || "Failed to save financial record.");
        return;
      }
      
      toast.success(initialRecord ? "Financial record updated successfully!" : "Financial record saved successfully!");
      onSave();
    } catch (error) {
      console.error(error);
      toast.error(initialRecord ? "Failed to update record." : "Failed to save financial record.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialRecord) return;
    if (!confirm("Are you sure you want to delete this record? This cannot be undone.")) return;
    
    setIsDeleting(true);
    try {
      await deleteFinancialRecord(initialRecord.id);
      toast.success("Record deleted successfully!");
      onSave();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete record.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-300 w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 font-manrope">
              {isViewOnly ? "View Financial Record" : initialRecord ? "Edit Financial Record" : "Add Financial Record"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure Financial Tracker
            </p>
          </div>
          <button onClick={onClose} type="button" className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form or View Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 custom-scrollbar">
          {isViewOnly ? (
            <div className="space-y-4">
              {/* Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`p-4 rounded-xl border ${type === 'Deposit' ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'}`}>
                  <span className={`text-[10px] font-extrabold uppercase block tracking-wider ${type === 'Deposit' ? 'text-emerald-900' : 'text-rose-900'}`}>
                    {type === 'Deposit' ? 'Deposit Amount' : 'Issuance Amount'}
                  </span>
                  <span className={`text-2xl font-black font-mono mt-1 block ${type === 'Deposit' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    ₱{amountDisplay}
                  </span>
                </div>
                <div className={`p-4 rounded-xl border ${
                  status === 'Cleared' 
                    ? 'bg-emerald-50/70 border-emerald-200' 
                    : status === 'Cancelled' 
                    ? 'bg-slate-100 border-slate-300' 
                    : 'bg-amber-50/70 border-amber-200'
                }`}>
                  <span className={`text-[10px] font-extrabold uppercase block tracking-wider ${
                    status === 'Cleared' 
                      ? 'text-emerald-900' 
                      : status === 'Cancelled' 
                      ? 'text-slate-700' 
                      : 'text-amber-900'
                  }`}>
                    Check / Transaction Status
                  </span>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      status === 'Cleared'
                        ? 'bg-emerald-100 text-emerald-800'
                        : status === 'Cancelled'
                        ? 'bg-slate-200 text-slate-700 line-through'
                        : 'bg-amber-100 text-amber-800 animate-pulse'
                    }`}>
                      {status === 'Pending' ? '⏳ Pending / Uncleared' : status === 'Cleared' ? '✓ Cleared' : '✕ Cancelled'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Name / Supplier</span>
                  <span className="text-sm font-medium text-slate-900">{name}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</span>
                  <span className="text-sm font-medium text-slate-900">{category === 'Custom' ? customCategory : category}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date</span>
                  <span className="text-sm font-medium text-slate-900">{date ? format(new Date(date), 'MMMM d, yyyy') : '-'}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bank</span>
                  <span className="text-sm font-medium text-slate-900">{bank === 'Custom' ? customBank : bank}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Check #</span>
                  <span className="text-sm font-medium text-slate-900 font-mono">{checkNo || '-'}</span>
                </div>
              </div>

              {remarks && (
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Remarks / Notes</span>
                  <span className="text-sm text-slate-700">{remarks}</span>
                </div>
              )}
            </div>
          ) : (
          <form id="finance-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Type, Status & Category */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Record Type <span className="text-red-500">*</span></label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 shadow-sm"
                  required
                >
                  <option value="Issuance">Issuance (Outgoing)</option>
                  <option value="Deposit">Deposit (Incoming)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Status <span className="text-red-500">*</span></label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 shadow-sm"
                  required
                >
                  <option value="Pending">⏳ Pending / Uncleared</option>
                  <option value="Cleared">✓ Cleared</option>
                  <option value="Cancelled">✕ Cancelled / Void</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Category <span className="text-red-500">*</span></label>
                <div className="flex flex-col gap-2">
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 shadow-sm"
                    required
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  {category === "Custom" && (
                    <input 
                      type="text" 
                      placeholder="Enter custom category..."
                      value={customCategory} 
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 shadow-sm animate-in fade-in slide-in-from-top-2"
                      required
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Name & Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Name / Supplier <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  placeholder="e.g. John Doe"
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Amount (₱) <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  placeholder="0.00"
                  value={amountDisplay} 
                  onChange={handleAmountChange}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 shadow-sm font-mono"
                  required
                />
              </div>
            </div>

            {/* Date, Bank, & Check No */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Date <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      if ('showPicker' in e.target) {
                        (e.target as any).showPicker();
                      }
                    } catch (err) {}
                  }}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Bank <span className="text-red-500">*</span></label>
                <div className="flex flex-col gap-2">
                  <select 
                    value={bank} 
                    onChange={(e) => setBank(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 shadow-sm"
                    required
                  >
                    {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  {bank === "Custom" && (
                    <input 
                      type="text" 
                      placeholder="Enter custom bank..."
                      value={customBank} 
                      onChange={(e) => setCustomBank(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 shadow-sm animate-in fade-in slide-in-from-top-2"
                      required
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Check # <span className="text-slate-400 font-normal normal-case">(Optional)</span></label>
                <input 
                  type="text" 
                  placeholder="e.g. 1045938"
                  value={checkNo} 
                  onChange={(e) => setCheckNo(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 shadow-sm font-mono"
                />
              </div>
            </div>

            {/* Remarks */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Remarks / Notes</label>
                <input 
                  type="text"
                  placeholder="Any additional details..."
                  value={remarks} 
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 shadow-sm"
                />
              </div>
            </div>

            {/* Threshold Validation Warning Banner */}
            {isThresholdBreached && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-rose-600 text-xl shrink-0 mt-0.5">error</span>
                  <div>
                    <h4 className="text-xs font-black text-rose-900 uppercase tracking-wide">
                      Pending Check Restricted
                    </h4>
                    <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                      Issuing this pending check of <strong>₱{parsedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> will leave a running balance of <strong>₱{projectedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>, which reaches or drops below the configured safety threshold of <strong>₱{warningThreshold.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>.
                    </p>
                    <p className="text-[11px] text-rose-600 font-medium mt-1">
                      Current Running Balance: ₱{runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
          </form>
          )}
          </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-white flex justify-between gap-3 shrink-0">
          {!isViewOnly ? (
            <>
              <div>
                {initialRecord && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting || isSaving}
                    className="px-4 py-2.5 text-sm font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 focus:ring-4 focus:outline-none focus:ring-rose-100 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    <span className="hidden sm:inline">Delete Record</span>
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving || isDeleting}
                  className="px-5 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:ring-4 focus:outline-none focus:ring-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="finance-form"
                  disabled={isSaving || isDeleting || !date || !name || !amountDisplay || isThresholdBreached}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 shadow-md shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? "Saving..." : (initialRecord ? "Update Record" : "Save Record")}
                </button>
              </div>
            </>
          ) : (
            <div className="flex justify-end w-full">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:ring-4 focus:outline-none focus:ring-slate-100"
              >
                Close
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
