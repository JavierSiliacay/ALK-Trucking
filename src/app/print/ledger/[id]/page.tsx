import React from "react";
import { getInventoryItems, getInventoryTransactions } from "@/actions/inventory";
import AutoPrint from "@/components/print/AutoPrint";
import { formatInPHTime } from "@/lib/utils";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function PrintLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const items = await getInventoryItems();
  const item = items.find((i) => i.id === id);
  const transactions = await getInventoryTransactions(id);

  if (!item) {
    return <div className="p-8 text-center text-red-600 font-bold">Item not found.</div>;
  }

  const sortedTransactions = transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="bg-white text-black p-4 md:p-8 max-w-5xl mx-auto print:p-0 print:max-w-none">
      <AutoPrint />
      
      {/* Print Header */}
      <div className="mb-6 flex justify-between items-end border-b-2 border-black pb-2">
        <div className="flex items-center gap-4">
          {/* ALK Logo */}
          <div className="w-16 h-16 relative">
            <img 
              src="/alk_logo.jpg" 
              alt="ALK Logo" 
              className="object-contain w-full h-full grayscale contrast-125"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">{item.name} Ledger</h1>
            <p className="text-sm font-bold text-gray-600 mt-1">
              Inventory Transaction History
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">Generated: {formatInPHTime(new Date())}</p>
          <p className="text-xs font-semibold text-gray-500">ALK Trucking Services</p>
        </div>
      </div>

      {/* Item Summary */}
      <div className="mb-4 flex gap-8 bg-gray-100 p-3 border border-gray-300">
        <div>
          <span className="text-[10px] font-bold text-gray-500 uppercase block">Item Name</span>
          <span className="text-sm font-black">{item.name}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-gray-500 uppercase block">Current Stock</span>
          <span className="text-sm font-black">{Number(item.currentStock).toLocaleString("en-US", { maximumFractionDigits: 2 })} {item.unit}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-gray-500 uppercase block">Avg Unit Cost</span>
          <span className="text-sm font-black font-mono">₱{Number(item.averageUnitCost).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-gray-500 uppercase block">Total Value (Estimate)</span>
          <span className="text-sm font-black font-mono text-emerald-700">₱{(Number(item.currentStock) * Number(item.averageUnitCost)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Condensed Print Table */}
      <table className="w-full text-left border-collapse">
        <thead className="table-header-group">
          <tr className="border-b-2 border-black">
            <th className="py-2 px-1 text-[11px] font-black uppercase">Date</th>
            <th className="py-2 px-1 text-[11px] font-black uppercase">Type</th>
            <th className="py-2 px-1 text-[11px] font-black uppercase">Truck / Remarks</th>
            <th className="py-2 px-1 text-[11px] font-black uppercase text-right">Unit Price</th>
            <th className="py-2 px-1 text-[11px] font-black uppercase text-right">In/Out Qty</th>
            <th className="py-2 px-1 text-[11px] font-black uppercase text-right">Total Value</th>
          </tr>
        </thead>
        <tbody>
          {sortedTransactions.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-4 text-center text-sm font-bold text-gray-400 italic">
                No transactions found for this item.
              </td>
            </tr>
          ) : (
            sortedTransactions.map((tx, idx) => {
              const qty = Number(tx.quantity);
              const price = Number(tx.unitCost);
              const totalValue = Number(tx.totalCost) || (qty * price);
              const isStockIn = tx.type === "STOCK-IN";

              return (
                <tr key={tx.id} className={`border-b border-gray-300 ${idx % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}`}>
                  <td className="py-1.5 px-1 text-[10px] font-semibold">
                    {formatInPHTime(tx.createdAt, "date")}
                  </td>
                  <td className={`py-1.5 px-1 text-[10px] font-black uppercase ${isStockIn ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {tx.type}
                  </td>
                  <td className="py-1.5 px-1 text-[10px]">
                    <span className="font-bold">{tx.truck ? `${tx.truck.unit} - ${tx.truck.plateNo}` : 'N/A'}</span>
                    {tx.remarks && <span className="block text-gray-500 italic mt-0.5">{tx.remarks}</span>}
                  </td>
                  <td className="py-1.5 px-1 text-[10px] text-right font-mono font-medium">
                    ₱{price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`py-1.5 px-1 text-[11px] text-right font-mono font-black ${isStockIn ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {isStockIn ? '+' : '-'}{qty.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  </td>
                  <td className={`py-1.5 px-1 text-[11px] text-right font-mono font-bold ${isStockIn ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {isStockIn ? '+' : '-'}₱{totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      
    </div>
  );
}
