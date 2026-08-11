"use client";

import React, { useState, useEffect } from "react";
import { getMasterData } from "@/actions/master";
import { X, Wrench, CheckCircle, Save, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface LogExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editRecord?: any | null;
}

export function LogExpenseModal({ isOpen, onClose, onSuccess, editRecord }: LogExpenseModalProps) {
  const [trucks, setTrucks] = useState<{ id: string; unit: string; plateNo: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [truckId, setTruckId] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [dateIncurred, setDateIncurred] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadTrucks();
      if (editRecord) {
        setTruckId(editRecord.truckId || "");
        setCategory(editRecord.category || "");
        setDescription(editRecord.description || "");
        setCost(editRecord.cost ? Number(editRecord.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");
        setDateIncurred(editRecord.dateIncurred ? new Date(editRecord.dateIncurred).toISOString().split('T')[0] : "");
      } else {
        // Reset form
        setTruckId("");
        setCategory("");
        setDescription("");
        setCost("");
        setDateIncurred("");
      }
    }
  }, [isOpen, editRecord]);

  const loadTrucks = async () => {
    setIsLoading(true);
    try {
      const data = await getMasterData();
      setTrucks(data.trucks);
    } catch (error) {
      toast.error("Failed to load trucks");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateIncurred || !description || !cost) {
      toast.error("Date, Description, and Cost are required");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Saving expense...");

    try {
      const isEditing = !!editRecord;
      const response = await fetch("/api/maintenance", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editRecord?.id,
          truckId: truckId || null,
          category,
          description,
          cost: parseFloat(cost.replace(/,/g, "")),
          dateIncurred,
        }),
      });

      if (!response.ok) throw new Error("Failed to save");
      
      toast.success(isEditing ? "Expense updated successfully" : "Expense logged successfully", { id: loadingToast });
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Error saving expense", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 leading-tight">{editRecord ? "Edit Maintenance Expense" : "Log Maintenance Expense"}</h2>
              <p className="text-xs text-slate-500 font-medium">{editRecord ? "Update the details of this expense." : "Record a new repair or maintenance cost."}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form id="expenseForm" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Date Incurred <span className="text-rose-500">*</span></label>
                <input 
                  type="date" 
                  required
                  value={dateIncurred}
                  onChange={(e) => setDateIncurred(e.target.value)}
                  onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Truck (Optional)</label>
                <select 
                  value={truckId}
                  onChange={(e) => setTruckId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-800"
                >
                  <option value="">-- General / Company --</option>
                  {trucks.map(t => (
                    <option key={t.id} value={t.id}>{t.plateNo} - {t.unit}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Category</label>
              <input 
                type="text" 
                placeholder="e.g. Tire Replacement, Oil Change, Labor"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-400"
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                <option value="Tire Replacement" />
                <option value="Oil Change" />
                <option value="Preventive Maintenance" />
                <option value="Parts Purchase" />
                <option value="Electrical Repair" />
              </datalist>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Description <span className="text-rose-500">*</span></label>
              <textarea 
                required
                placeholder="Specific details about the expense..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-400 min-h-[80px] resize-y"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Total Cost (PHP) <span className="text-rose-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₱</span>
                <input 
                  type="text" 
                  required
                  placeholder="0.00"
                  value={cost}
                  onChange={(e) => {
                    let val = e.target.value.replace(/[^\d.]/g, "");
                    const parts = val.split(".");
                    if (parts.length > 2) val = parts[0] + "." + parts.slice(1).join("");
                    if (val) {
                      const splitVal = val.split(".");
                      splitVal[0] = splitVal[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                      val = splitVal.join(".");
                    }
                    setCost(val);
                  }}
                  className="w-full pl-8 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button 
            form="expenseForm"
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Expense
          </button>
        </div>

      </div>
    </div>
  );
}
