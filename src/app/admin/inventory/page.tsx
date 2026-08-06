import React from "react";
import InventoryClient from "@/components/inventory/InventoryClient";
import { getInventoryItems, getInventoryTransactions } from "@/actions/inventory";
import { getMasterData } from "@/actions/master";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const items = await getInventoryItems();
  
  // Fetch transactions for each item to hydrate the ledger
  const itemsWithTxs = await Promise.all(
    items.map(async (item) => {
      const txs = await getInventoryTransactions(item.id);
      return {
        ...item,
        transactions: txs,
      };
    })
  );

  const masterData = await getMasterData();
  const activeTrucks = masterData.trucks;

  return (
    <InventoryClient 
      initialItems={itemsWithTxs} 
      trucks={activeTrucks} 
    />
  );
}
