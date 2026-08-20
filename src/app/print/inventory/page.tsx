import React from "react";
import { getInventoryItems } from "@/actions/inventory";
import AutoPrint from "@/components/print/AutoPrint";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function PrintInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ stock_level?: string }>;
}) {
  const { stock_level } = await searchParams;
  const stockFilter = stock_level || "all";
  
  let items = await getInventoryItems();

  // Apply filtering
  if (stockFilter === "in_stock") {
    items = items.filter(item => Number(item.currentStock) > 0);
  } else if (stockFilter === "out_of_stock") {
    items = items.filter(item => Number(item.currentStock) <= 0);
  }

  // Sort alphabetically by name
  items.sort((a, b) => a.name.localeCompare(b.name));

  const totalValue = items.reduce((sum, item) => sum + (Number(item.currentStock) * Number(item.averageUnitCost)), 0);

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
            <h1 className="text-2xl font-black uppercase tracking-tight">Inventory Supply Report</h1>
            <p className="text-sm font-bold text-gray-600 mt-1">
              Filter: {stockFilter === "all" ? "All Items" : stockFilter === "in_stock" ? "In-Stock Only" : "Out of Stock Only"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">Generated: {format(new Date(), "MMM dd, yyyy - hh:mm a")}</p>
          <p className="text-xs font-semibold text-gray-500">ALK Trucking Services</p>
        </div>
      </div>

      {/* Condensed Print Table */}
      <table className="w-full text-left border-collapse">
        <thead className="table-header-group">
          <tr className="border-b-2 border-black">
            <th className="py-2 px-1 text-[11px] font-black uppercase">Item Name</th>
            <th className="py-2 px-1 text-[11px] font-black uppercase text-right">Current Stock</th>
            <th className="py-2 px-1 text-[11px] font-black uppercase text-center">Unit</th>
            <th className="py-2 px-1 text-[11px] font-black uppercase text-right">Avg Unit Cost</th>
            <th className="py-2 px-1 text-[11px] font-black uppercase text-right">Total Est. Value</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const stockValue = Number(item.currentStock) * Number(item.averageUnitCost);
            const isOutOfStock = Number(item.currentStock) <= 0;
            
            return (
              <tr key={item.id} className={`border-b border-gray-300 ${idx % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'} ${isOutOfStock ? 'text-red-700 font-bold' : ''}`}>
                <td className="py-1.5 px-1 text-[11px] font-semibold">
                  {item.name} {isOutOfStock && "(OUT OF STOCK)"}
                </td>
                <td className="py-1.5 px-1 text-[11px] text-right font-mono font-bold">
                  {Number(item.currentStock).toLocaleString("en-US", { maximumFractionDigits: 2 })}
                </td>
                <td className="py-1.5 px-1 text-[11px] text-center font-medium">
                  {item.unit}
                </td>
                <td className="py-1.5 px-1 text-[11px] text-right font-mono">
                  ₱{Number(item.averageUnitCost).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-1.5 px-1 text-[11px] text-right font-mono font-bold">
                  ₱{stockValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            );
          })}
          
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-center text-sm font-bold text-gray-400 italic">
                No items found for the selected filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Print Footer Summary */}
      <div className="mt-6 flex justify-end">
        <div className="bg-gray-100 px-6 py-3 border-2 border-black flex items-center gap-4">
          <span className="text-xs font-black uppercase">Total Inventory Value:</span>
          <span className="text-lg font-black font-mono">
            ₱{totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
      
    </div>
  );
}
