"use client";

import React, { useState } from "react";
import { X, CheckCircle, Save, Loader2 } from "lucide-react";
import { createReportManualEntry, updateReportManualEntry } from "@/actions/reportsManual";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const EXPENSE_CATEGORIES = [
  "FUEL COSTS",
  "DRIVER & HELPER WAGES",
  "MAINTENANCE & REPAIR",
  "INVENTORY SUPPLY",
  "OTHER / MISC",
  "PAYROLL",
  "EMPLOYEES BENEFITS",
  "RENTALS",
  "TAXES",
  "UTILITIES",
  "TELEPHONE/INTERNET",
  "REPAIR AND MAINTENANCE",
  "SHOP PARTS AND GOODS",
  "OFFICE EXPENSES",
  "UNIFORMS",
  "INSURANCE",
  "REPRESENTATIONS",
  "PROFESSIONAL FEES",
  "MEALS AND ENTERTAINMENTS",
  "FOODS",
  "BUILDING MAINTENANCE",
  "IT",
  "ADVERTISING/MARKETING",
  "OTHER/MISCELLANEOUS",
  "ASSET SALES",
  "CUSTOM"
];

interface AddReportRecordModalProps {
  onClose: () => void;
  onSave: () => void;
  editData?: any;
}

export default function AddReportRecordModal({ onClose, onSave, editData }: AddReportRecordModalProps) {
  const [view, setView] = useState<"selection" | "form">(editData ? "form" : "selection");
  const [type, setType] = useState<"Sale" | "Expense" | null>(editData ? editData.type : null);

  // Form states
  const [category, setCategory] = useState(editData ? (EXPENSE_CATEGORIES.includes(editData.category) || editData.category === "Car Sale" ? editData.category : "CUSTOM") : "");
  const [customCategory, setCustomCategory] = useState(editData && !EXPENSE_CATEGORIES.includes(editData.category) && editData.category !== "Car Sale" ? editData.category : "");
  const [chargeTo, setChargeTo] = useState(editData?.chargeTo || "");
  const [invoiceNo, setInvoiceNo] = useState(editData?.invoiceNo || "");
  const [suppliersName, setSuppliersName] = useState(editData?.suppliersName || "");
  const [unitVehicle, setUnitVehicle] = useState(editData?.unitVehicle || "");
  const [plateNo, setPlateNo] = useState(editData?.plateNo || "");
  const [paymentType, setPaymentType] = useState(editData ? (["Cash", "Check", "Bank Transfer", "GCash", "Credit Card"].includes(editData.paymentType) ? editData.paymentType : "CUSTOM") : "");
  const [customPaymentType, setCustomPaymentType] = useState(editData && !["Cash", "Check", "Bank Transfer", "GCash", "Credit Card"].includes(editData.paymentType) ? editData.paymentType : "");
  const [expenseDescription, setExpenseDescription] = useState(editData?.expenseDescription || "");
  const [amountDisplay, setAmountDisplay] = useState(editData ? Number(editData.amount).toLocaleString('en-US') : "");
  const [date, setDate] = useState(editData ? format(new Date(editData.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
  const [remarks, setRemarks] = useState(editData?.remarks || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9.]/g, '');
    const decimalParts = value.split('.');
    if (decimalParts.length > 2) {
      value = decimalParts[0] + '.' + decimalParts.slice(1).join('');
    }
    if (value) {
      const parts = value.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      setAmountDisplay(parts.join('.'));
    } else {
      setAmountDisplay('');
    }
  };

  const handleSelection = (selectedType: "Sale" | "Expense") => {
    setType(selectedType);
    setCategory(selectedType === "Sale" ? "ASSET SALES" : EXPENSE_CATEGORIES[0]);
    setView("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) return;

    setIsSaving(true);
    try {
      const finalCategory = type === "Sale" ? "ASSET SALES" : (category === "CUSTOM" ? customCategory : category);
      const finalPaymentType = paymentType === "CUSTOM" ? customPaymentType : paymentType;
      const parsedAmount = parseFloat(amountDisplay.replace(/,/g, '') || "0");

      const dataPayload = {
        type,
        category: finalCategory,
        chargeTo,
        invoiceNo,
        suppliersName,
        unitVehicle,
        plateNo,
        paymentType: finalPaymentType,
        expenseDescription,
        amount: parsedAmount,
        date: new Date(date).toISOString(),
        remarks
      };

      if (editData && editData.id) {
        await updateReportManualEntry(editData.id, dataPayload);
        toast.success(`${type} updated successfully!`);
      } else {
        await createReportManualEntry(dataPayload);
        toast.success(`${type} recorded successfully!`);
      }
      
      onSave();
    } catch (error) {
      console.error(error);
      toast.error(`Failed to record ${type}.`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-[800px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-slate-900 flex-1">
              {editData ? "Edit Record" : "Add Corporate Record"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          {!editData && (
            <p className="text-sm text-slate-500 font-medium mt-1">Select the type of record to add.</p>
          )}
        </div>

        {view === "selection" ? (
          <div className="p-6 grid grid-cols-2 gap-4">
            <button
              onClick={() => handleSelection("Sale")}
              className="flex flex-col items-center justify-center p-6 border-2 border-emerald-100 bg-emerald-50 hover:bg-emerald-100 rounded-2xl transition-colors group"
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-emerald-600 mb-3 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              </div>
              <span className="font-black text-emerald-900 text-lg uppercase">Add Sales</span>
              <span className="text-xs text-emerald-700 mt-1 font-medium">Record incoming revenue</span>
            </button>

            <button
              onClick={() => handleSelection("Expense")}
              className="flex flex-col items-center justify-center p-6 border-2 border-rose-100 bg-rose-50 hover:bg-rose-100 rounded-2xl transition-colors group"
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-rose-600 mb-3 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="m19 9-5 5-4-4-3 3"></path></svg>
              </div>
              <span className="font-black text-rose-900 text-lg uppercase">Add Expense</span>
              <span className="text-xs text-rose-700 mt-1 font-medium">Record overhead costs</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Category <span className="text-rose-500">*</span></label>
                  {type === "Sale" ? (
                    <input
                      type="text"
                      value="ASSET SALES"
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl p-3"
                    />
                  ) : (
                    <div className="flex flex-col gap-2">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 text-sm font-medium rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 shadow-sm"
                        required
                      >
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      {category === "CUSTOM" && (
                        <input
                          type="text"
                          placeholder="Enter custom category..."
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          className="w-full bg-white border border-slate-300 text-slate-900 text-sm font-medium rounded-xl p-3 shadow-sm"
                          required
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Charge To / Client Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    {type === "Sale" ? "Customer Name" : "Charge To (Client Name)"} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={chargeTo}
                    onChange={(e) => setChargeTo(e.target.value)}
                    placeholder="Client Name"
                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm font-medium rounded-xl p-3 shadow-sm"
                    required
                  />
                </div>

                {/* Date Issued */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Date Issued <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm font-medium rounded-xl p-3 shadow-sm"
                    required
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Total Amount (₱) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={amountDisplay}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm font-bold font-mono rounded-xl p-3 shadow-sm"
                    required
                  />
                </div>

                {/* Invoice No & Supplier */}
                {type === "Expense" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Invoice No.</label>
                      <input
                        type="text"
                        value={invoiceNo}
                        onChange={(e) => setInvoiceNo(e.target.value)}
                        placeholder="Invoice #"
                        className="w-full bg-white border border-slate-300 text-slate-900 text-sm font-medium rounded-xl p-3 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Suppliers Name</label>
                      <input
                        type="text"
                        value={suppliersName}
                        onChange={(e) => setSuppliersName(e.target.value)}
                        placeholder="Supplier Name"
                        className="w-full bg-white border border-slate-300 text-slate-900 text-sm font-medium rounded-xl p-3 shadow-sm"
                      />
                    </div>
                  </>
                )}

                {/* Unit & Plate */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Unit / Vehicle <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={unitVehicle}
                    onChange={(e) => setUnitVehicle(e.target.value)}
                    placeholder="Vehicle details"
                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm font-medium rounded-xl p-3 shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Plate # <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={plateNo}
                    onChange={(e) => setPlateNo(e.target.value)}
                    placeholder="Plate number"
                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm font-medium rounded-xl p-3 shadow-sm"
                    required
                  />
                </div>

                {/* Type of Payment */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Type of Payment <span className="text-rose-500">*</span></label>
                  <div className="space-y-2">
                    <select
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 text-sm font-medium rounded-xl p-3 shadow-sm"
                      required
                    >
                      <option value="" disabled>Select type</option>
                      <option value="Cash">Cash</option>
                      <option value="Check">Check</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="GCash">GCash</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="CUSTOM">Custom</option>
                    </select>
                    {paymentType === "CUSTOM" && (
                      <input
                        type="text"
                        autoFocus
                        placeholder="Type custom payment method..."
                        value={customPaymentType}
                        onChange={(e) => setCustomPaymentType(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 text-sm font-medium rounded-xl p-3 shadow-sm animate-in fade-in slide-in-from-top-2"
                        required
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Expense Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  {type === "Sale" ? "Sale Description" : "Expenses Description"} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder={`Detailed description of the ${type?.toLowerCase() || ""}...`}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm font-medium rounded-xl p-3 shadow-sm min-h-[80px]"
                  required
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Remarks
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Any additional notes (Optional)"
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm font-medium rounded-xl p-3 shadow-sm min-h-[60px]"
                />
              </div>

            </div>

            {/* Footer Actions */}
            <div className="px-8 py-5 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => {
                  if (editData) {
                    onClose();
                  } else {
                    setView("selection");
                  }
                }}
                className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors text-sm"
              >
                {editData ? "Cancel" : "Back"}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors text-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  editData ? "Save Changes" : "Save Record"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
