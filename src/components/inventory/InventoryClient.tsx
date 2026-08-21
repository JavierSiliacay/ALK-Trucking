"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { PackageOpen, ArrowUpRight, ArrowDownRight, Plus, Eye, X, Edit, Trash2, Edit2, Lock, Unlock, Printer } from "lucide-react";
import { addInventoryItem, recordStockIn, recordStockOut, deleteInventoryTransaction, updateStockIn, updateStockOut, updateInventoryItem, deleteInventoryItem, toggleSupplyLock } from "@/actions/inventory";
import { toast } from "sonner";
import { formatDateLong } from "@/lib/utils";

type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  currentStock: string;
  averageUnitCost: string;
  isLocked?: boolean;
  transactions?: InventoryTransaction[];
};

type InventoryTransaction = {
  id: string;
  type: string;
  quantity: string;
  unitCost: string;
  totalCost: string;
  truckId: string | null;
  remarks: string | null;
  createdAt: Date;
  truck?: {
    unit: string;
    plateNo: string;
  } | null;
};

type Truck = {
  id: string;
  unit: string;
  plateNo: string;
};

export default function InventoryClient({ 
  initialItems,
  trucks
}: { 
  initialItems: InventoryItem[],
  trucks: Truck[]
}) {
  const { data: session } = useSession();
  const isDeveloper = session?.user?.email === "siliacay.javier@gmail.com";
  
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [isStockOutOpen, setIsStockOutOpen] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Form states
  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("Liters");
  const [customUnit, setCustomUnit] = useState("");
  
  const [quantity, setQuantity] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [selectedTruckId, setSelectedTruckId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Edit Transaction states
  const [editingTx, setEditingTx] = useState<InventoryTransaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit Supply states
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
  const [editItemName, setEditItemName] = useState("");
  const [editItemUnit, setEditItemUnit] = useState("Liters");
  const [editCustomUnit, setEditCustomUnit] = useState("");

  // Restricted Modal states
  const [restrictedItem, setRestrictedItem] = useState<InventoryItem | null>(null);
  const [isRestrictedModalOpen, setIsRestrictedModalOpen] = useState(false);

  // Print Modal states
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printStockFilter, setPrintStockFilter] = useState("all");

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalUnit = newItemUnit === "Custom" ? customUnit : newItemUnit;
      if (!finalUnit.trim()) {
        toast.error("Unit of measurement cannot be empty");
        return;
      }
      await addInventoryItem(newItemName, finalUnit);
      toast.success("Item added successfully");
      setIsAddItemOpen(false);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to add item");
    }
  };

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      await recordStockIn(
        selectedItem.id, 
        Number(quantity.toString().replace(/,/g, "")), 
        Number(totalCost.toString().replace(/,/g, "")), 
        remarks, 
        new Date(transactionDate)
      );
      toast.success("Stock-In recorded successfully");
      setIsStockInOpen(false);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to record Stock-In");
    }
  };

  const handleStockOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      await recordStockOut(selectedItem.id, Number(quantity), selectedTruckId || null, remarks, new Date(transactionDate));
      toast.success("Stock-Out recorded successfully");
      setIsStockOutOpen(false);
      window.location.reload();
    } catch (error: any) {
      toast.error(error instanceof Error ? error.message : "Failed to record stock-out");
    }
  };

  const handleDeleteTransaction = async (txId: string) => {
    if (!window.confirm("Are you sure you want to delete this transaction? This will recalculate the item's current stock and average unit cost.")) return;
    
    try {
      await deleteInventoryTransaction(txId);
      toast.success("Transaction deleted successfully");
      setIsLedgerOpen(false); // Close ledger to force refresh
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete transaction");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    try {
      const dateObj = new Date(transactionDate);
      if (editingTx.type === "STOCK-IN") {
        await updateStockIn(editingTx.id, parseFloat(quantity), parseFloat(totalCost), remarks, dateObj);
      } else {
        await updateStockOut(editingTx.id, parseFloat(quantity), selectedTruckId || null, remarks, dateObj);
      }
      toast.success("Transaction updated successfully");
      setIsEditModalOpen(false);
      setIsLedgerOpen(false); // Close ledger to force refresh
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update transaction");
    }
  };

  const handleEditItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const finalUnit = editItemUnit === "Custom" ? editCustomUnit : editItemUnit;
      await updateInventoryItem(editingItem.id, editItemName, finalUnit);
      toast.success("Supply type updated successfully");
      setIsEditItemModalOpen(false);
      window.location.reload();
    } catch (error) {
      toast.error("Failed to update supply type");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item?.isLocked && !isDeveloper) {
      setRestrictedItem(item);
      setIsRestrictedModalOpen(true);
      return;
    }
    
    if (!window.confirm("Are you absolutely sure you want to delete this supply? This will permanently delete ALL transactions associated with it.")) return;
    
    try {
      await deleteInventoryItem(itemId);
      toast.success("Supply type deleted successfully");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to delete supply type");
    }
  };

  const handleToggleLock = async (itemId: string, currentLockState: boolean) => {
    try {
      await toggleSupplyLock(itemId, !currentLockState);
      toast.success(`Supply ${!currentLockState ? 'locked' : 'unlocked'} successfully`);
      window.location.reload();
    } catch (error) {
      toast.error("Failed to toggle supply lock");
    }
  };

  const openEditItemModal = (item: InventoryItem) => {
    setEditingItem(item);
    setEditItemName(item.name);
    
    const standardUnits = ["Liters", "pc", "pcs", "Sets", "sets", "Gallons", "Bottles", "Boxes", "kg"];
    if (standardUnits.includes(item.unit)) {
      setEditItemUnit(item.unit);
      setEditCustomUnit("");
    } else {
      setEditItemUnit("Custom");
      setEditCustomUnit(item.unit);
    }
    
    setIsEditItemModalOpen(true);
  };

  const openEditModal = (tx: InventoryTransaction) => {
    setEditingTx(tx);
    setQuantity(tx.quantity.toString());
    setTotalCost(tx.totalCost.toString());
    setSelectedTruckId(tx.truckId || "");
    setRemarks(tx.remarks || "");
    setTransactionDate(new Date(tx.createdAt).toISOString().split('T')[0]);
    setIsEditModalOpen(true);
  };

  return (
    <div className="p-6 max-w-[1440px] mx-auto w-full space-y-6">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#00193c] tracking-tight">Inventory Management</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage stock levels, log deliveries, and track dispensing.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setIsPrintModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border-2 border-[#1e3a8a] text-[#1e3a8a] px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
          {isDeveloper && (
            <button 
              onClick={() => setIsAddItemOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#1e3a8a] text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-[#1e3a8a]/90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Supply Type
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-white border border-slate-200 p-5 rounded-2xl group hover:border-[#1e3a8a]/30 transition-colors shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <PackageOpen className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isDeveloper && (
                  <button 
                    onClick={() => handleToggleLock(item.id, item.isLocked || false)}
                    className={`p-1 rounded-md transition-colors ${item.isLocked ? "text-amber-500 hover:text-amber-600 bg-amber-50" : "text-slate-400 hover:text-amber-500"}`}
                    title={item.isLocked ? "Unlock Supply" : "Lock Supply"}
                  >
                    {item.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>
                )}
                
                <button 
                  onClick={() => openEditItemModal(item)}
                  className="text-slate-400 hover:text-blue-600 transition-colors p-1 ml-1"
                  title="Edit Supply"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                
                <button 
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                  title="Delete Supply"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <button 
                  onClick={() => { setSelectedItem(item); setIsLedgerOpen(true); }}
                  className="text-slate-400 hover:text-[#1e3a8a] transition-colors p-1 ml-1"
                  title="View Ledger"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <h3 className="font-bold text-lg text-slate-800">{item.name}</h3>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-[#00193c]">
                {Number(item.currentStock).toLocaleString()}
              </span>
              <span className="text-sm font-medium text-slate-500 uppercase">
                {item.unit}
              </span>
            </div>
            
            <div className="mt-2 text-xs text-slate-500 flex justify-between">
              <span>Avg. Cost: <span className="font-semibold text-slate-700">₱{Number(item.averageUnitCost).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</span> / {item.unit}</span>
            </div>
            <div className="mt-1 text-xs text-slate-500 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md inline-block font-medium">
              Total Value: <span className="font-bold">₱{(Number(item.currentStock) * Number(item.averageUnitCost)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button 
                onClick={() => { setSelectedItem(item); setIsStockInOpen(true); }}
                className="flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 py-2 rounded-xl text-xs font-bold transition-colors"
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                STOCK IN
              </button>
              <button 
                onClick={() => { setSelectedItem(item); setIsStockOutOpen(true); }}
                className="flex items-center justify-center gap-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 py-2 rounded-xl text-xs font-bold transition-colors"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                STOCK OUT
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <PackageOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500 font-medium">No inventory items found.</p>
            <p className="text-slate-400 text-sm mt-1">Click "Add Supply Type" to start tracking (e.g. Diesel).</p>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {isAddItemOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-[#00193c]">Add Supply Type</h3>
              <button onClick={() => setIsAddItemOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Supply Name</label>
                <input required type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="e.g. Diesel, Engine Oil" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Unit of Measurement</label>
                <div className="relative">
                  <select 
                    required 
                    value={newItemUnit} 
                    onChange={e => setNewItemUnit(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none appearance-none cursor-pointer"
                  >
                    <option value="Liters">Liters</option>
                    <option value="pc">pc</option>
                    <option value="pcs">pcs</option>
                    <option value="Sets">Sets</option>
                    <option value="sets">sets</option>
                    <option value="Gallons">Gallons</option>
                    <option value="Bottles">Bottles</option>
                    <option value="Boxes">Boxes</option>
                    <option value="kg">kg</option>
                    <option value="Custom">Custom...</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
                {newItemUnit === "Custom" && (
                  <div className="mt-2">
                    <input 
                      required 
                      type="text" 
                      value={customUnit} 
                      onChange={e => setCustomUnit(e.target.value)} 
                      placeholder="Type custom unit (e.g. kg, grams)" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none" 
                    />
                  </div>
                )}
              </div>
              <button type="submit" className="w-full bg-[#1e3a8a] text-white py-3 rounded-xl font-bold shadow-md hover:bg-[#1e3a8a]/90 transition-all mt-2">
                Create Item
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Supply Item Modal */}
      {isEditItemModalOpen && editingItem && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-[#00193c]">Edit Supply Type</h3>
              <button onClick={() => setIsEditItemModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditItemSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Supply Name</label>
                <input required type="text" value={editItemName} onChange={e => setEditItemName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Unit of Measurement</label>
                <div className="relative">
                  <select 
                    required 
                    value={editItemUnit} 
                    onChange={e => setEditItemUnit(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none appearance-none cursor-pointer"
                  >
                    <option value="Liters">Liters</option>
                    <option value="pc">pc</option>
                    <option value="pcs">pcs</option>
                    <option value="Sets">Sets</option>
                    <option value="sets">sets</option>
                    <option value="Gallons">Gallons</option>
                    <option value="Bottles">Bottles</option>
                    <option value="Boxes">Boxes</option>
                    <option value="kg">kg</option>
                    <option value="Custom">Custom...</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
                {editItemUnit === "Custom" && (
                  <div className="mt-2">
                    <input 
                      required 
                      type="text" 
                      value={editCustomUnit} 
                      onChange={e => setEditCustomUnit(e.target.value)} 
                      placeholder="Type custom unit" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none" 
                    />
                  </div>
                )}
              </div>
              <button type="submit" className="w-full bg-[#1e3a8a] text-white py-3 rounded-xl font-bold shadow-md hover:bg-[#1e3a8a]/90 transition-all mt-2">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Restricted Action Modal */}
      {isRestrictedModalOpen && restrictedItem && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#00193c]">Action Restricted</h3>
              </div>
              <button onClick={() => setIsRestrictedModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full shadow-sm transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 text-sm text-slate-600 space-y-4">
              <p>
                The supply <strong>"{restrictedItem.name}"</strong> you're attempting to delete has been restricted by the developer to prevent accidental data loss.
              </p>
              <p>
                Please contact <strong>Javier</strong> if you need this unlocked.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setIsRestrictedModalOpen(false)} 
                className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock In Modal */}
      {isStockInOpen && selectedItem && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-emerald-50 text-emerald-800">
              <h3 className="font-bold">Stock In: {selectedItem.name}</h3>
              <button onClick={() => setIsStockInOpen(false)} className="text-emerald-600 hover:text-emerald-800 bg-white p-1 rounded-full shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleStockIn} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Date</label>
                  <input required type="date" value={transactionDate} onChange={e => setTransactionDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Quantity ({selectedItem.unit})</label>
                  <input required type="text" value={quantity} onChange={e => setQuantity(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Total Cost Paid (₱)</label>
                <input required type="text" value={totalCost} onChange={e => {
                  let val = e.target.value.replace(/[^\d.]/g, "");
                  const parts = val.split(".");
                  if (parts.length > 2) val = parts[0] + "." + parts.slice(1).join("");
                  if (val) {
                    const splitVal = val.split(".");
                    splitVal[0] = splitVal[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    val = splitVal.join(".");
                  }
                  setTotalCost(val);
                }} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Remarks / Supplier</label>
                <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="e.g. Petron Delivery" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-emerald-700 transition-all mt-2">
                Record Stock In
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Stock Out Modal */}
      {isStockOutOpen && selectedItem && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-rose-50 text-rose-800">
              <h3 className="font-bold">Dispense: {selectedItem.name}</h3>
              <button onClick={() => setIsStockOutOpen(false)} className="text-rose-600 hover:text-rose-800 bg-white p-1 rounded-full shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleStockOut} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 flex justify-between items-center">
                <span className="text-xs text-slate-500 font-semibold">Current Stock:</span>
                <span className="font-bold text-[#00193c]">{Number(selectedItem.currentStock).toLocaleString()} {selectedItem.unit}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Date</label>
                  <input required type="date" value={transactionDate} onChange={e => setTransactionDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Quantity to Dispense ({selectedItem.unit})</label>
                  <input required type="number" step="0.01" max={selectedItem.currentStock} value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Assign to Truck (Optional)</label>
                <select value={selectedTruckId} onChange={e => setSelectedTruckId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none appearance-none">
                  <option value="">-- No Truck (Yard/Other) --</option>
                  {trucks.map(t => (
                    <option key={t.id} value={t.id}>{t.unit} - {t.plateNo}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Remarks / Reason</label>
                <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="e.g. Pumped for Sequence #123" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none" />
              </div>
              <button type="submit" className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-rose-700 transition-all mt-2">
                Dispense Stock
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Ledger Modal */}
      {isLedgerOpen && selectedItem && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-[#00193c] text-white">
              <div>
                <h3 className="font-bold text-lg">{selectedItem.name} Ledger</h3>
                <p className="text-blue-200 text-xs mt-0.5">Complete history of Stock-In and Stock-Out transactions.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => window.open(`/print/ledger/${selectedItem.id}`, '_blank')}
                  className="flex items-center gap-1.5 bg-white text-[#00193c] px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Ledger
                </button>
                <button onClick={() => setIsLedgerOpen(false)} className="text-white/60 hover:text-white bg-white/10 p-1.5 rounded-full shadow-sm transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-0 bg-slate-50/50">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-[#43474f] text-[10px] font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Date & Time</th>
                    <th className="px-6 py-3 font-semibold">Type</th>
                    <th className="px-6 py-3 font-semibold text-right">Quantity</th>
                    <th className="px-6 py-3 font-semibold text-right">Unit Price</th>
                    <th className="px-6 py-3 font-semibold text-right">Total Value</th>
                    <th className="px-6 py-3 font-semibold">Truck / Remarks</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {!selectedItem.transactions || selectedItem.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-medium bg-white">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    selectedItem.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-blue-50/30 transition-colors bg-white">
                        <td className="px-6 py-3.5 whitespace-nowrap text-slate-500 font-medium text-xs">
                          {formatDateLong(tx.createdAt.toString())}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          {tx.type === "STOCK-IN" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                              <ArrowDownRight className="w-3 h-3" /> In
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 uppercase tracking-wide">
                              <ArrowUpRight className="w-3 h-3" /> Out
                            </span>
                          )}
                        </td>
                        <td className={`px-6 py-3.5 whitespace-nowrap font-bold text-right ${tx.type === "STOCK-IN" ? "text-emerald-600" : "text-rose-600"}`}>
                          {tx.type === "STOCK-IN" ? "+" : "-"}{Number(tx.quantity).toLocaleString()} {selectedItem.unit}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-slate-600 font-medium text-right">
                          ₱{Number(tx.unitCost).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-slate-800 font-bold text-right">
                          ₱{Number(tx.totalCost).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}
                        </td>
                        <td className="px-6 py-3.5 text-slate-600 text-xs">
                          {tx.truck ? (
                            <div className="font-semibold text-[#1e3a8a] bg-[#1e3a8a]/10 px-2 py-0.5 rounded-md inline-block">
                              {tx.truck.unit} ({tx.truck.plateNo})
                            </div>
                          ) : null}
                          {tx.remarks && (
                            <div className={`text-slate-500 ${tx.truck ? "mt-1" : ""}`}>
                              {tx.remarks}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-right">
                          <button onClick={() => openEditModal(tx)} className="text-slate-400 hover:text-blue-600 p-1 rounded-full transition-colors mx-1" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteTransaction(tx.id)} className="text-slate-400 hover:text-rose-600 p-1 rounded-full transition-colors mx-1" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {isEditModalOpen && editingTx && selectedItem && (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-[#00193c] text-white">
              <h3 className="font-bold text-lg">Edit {editingTx.type === "STOCK-IN" ? "Stock-In" : "Stock-Out"}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-white/60 hover:text-white p-1 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Date</label>
                  <input required type="date" value={transactionDate} onChange={e => setTransactionDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Quantity ({selectedItem.unit})</label>
                  <input required type="number" step="0.01" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none" />
                </div>
              </div>
              
              {editingTx.type === "STOCK-IN" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Total Cost (₱)</label>
                  <input required type="number" step="0.01" value={totalCost} onChange={e => setTotalCost(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none" />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Assign to Truck (Optional)</label>
                  <select value={selectedTruckId} onChange={e => setSelectedTruckId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none appearance-none">
                    <option value="">-- No Truck (Yard/Other) --</option>
                    {trucks.map(t => (
                      <option key={t.id} value={t.id}>{t.unit} - {t.plateNo}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Remarks / Reason</label>
                <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none" />
              </div>
              
              <button type="submit" className="w-full bg-[#1e3a8a] text-white py-3 rounded-xl font-bold shadow-md hover:bg-blue-900 transition-all mt-2">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Print Settings Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-[#00193c] flex items-center gap-2">
                <Printer className="w-4 h-4" /> Print Settings
              </h3>
              <button onClick={() => setIsPrintModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Stock Filter</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="radio" name="stockFilter" value="all" checked={printStockFilter === "all"} onChange={() => setPrintStockFilter("all")} className="w-4 h-4 text-[#1e3a8a]" />
                    <span className="text-sm font-bold text-slate-700">All Items</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="radio" name="stockFilter" value="in_stock" checked={printStockFilter === "in_stock"} onChange={() => setPrintStockFilter("in_stock")} className="w-4 h-4 text-[#1e3a8a]" />
                    <span className="text-sm font-bold text-slate-700">In-Stock Only</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="radio" name="stockFilter" value="out_of_stock" checked={printStockFilter === "out_of_stock"} onChange={() => setPrintStockFilter("out_of_stock")} className="w-4 h-4 text-[#1e3a8a]" />
                    <span className="text-sm font-bold text-slate-700">Out of Stock Only</span>
                  </label>
                </div>
              </div>
              <button 
                onClick={() => {
                  window.open(`/print/inventory?stock_level=${printStockFilter}`, '_blank');
                  setIsPrintModalOpen(false);
                }}
                className="w-full bg-[#1e3a8a] text-white py-3 rounded-xl font-bold shadow-md hover:bg-[#1e3a8a]/90 transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Generate Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
