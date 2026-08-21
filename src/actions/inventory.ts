"use server";

import { db } from "@/db";
import { inventoryItems, inventoryTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getInventoryItems() {
  return await db.query.inventoryItems.findMany({
    orderBy: (items, { asc }) => [asc(items.name)],
  });
}

export async function getInventoryTransactions(itemId: string) {
  return await db.query.inventoryTransactions.findMany({
    where: eq(inventoryTransactions.itemId, itemId),
    orderBy: (txs, { desc }) => [desc(txs.createdAt)],
    with: {
      truck: true,
    }
  });
}

export async function addInventoryItem(name: string, unit: string) {
  await db.insert(inventoryItems).values({
    name,
    unit,
  });
  revalidatePath("/admin/inventory");
}

export async function updateInventoryItem(id: string, name: string, unit: string) {
  await db.update(inventoryItems)
    .set({ name, unit, updatedAt: new Date() })
    .where(eq(inventoryItems.id, id));
  revalidatePath("/admin/inventory");
}

export async function deleteInventoryItem(id: string) {
  await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
  revalidatePath("/admin/inventory");
}

export async function toggleSupplyLock(id: string, isLocked: boolean) {
  await db.update(inventoryItems)
    .set({ isLocked })
    .where(eq(inventoryItems.id, id));
  revalidatePath("/admin/inventory");
}

export async function recordStockIn(itemId: string, quantity: number, totalCost: number, remarks: string, transactionDate?: Date) {
  // We need a transaction to calculate average cost safely, but for simplicity we will just do it sequentially.
  const item = await db.query.inventoryItems.findFirst({
    where: eq(inventoryItems.id, itemId),
  });

  if (!item) throw new Error("Item not found");

  const currentStock = Number(item.currentStock);
  const currentAvgCost = Number(item.averageUnitCost);
  
  let newAvgCost = 0;
  if (currentStock <= 0) {
    newAvgCost = quantity > 0 ? totalCost / quantity : 0;
  } else {
    const currentTotalValue = currentStock * currentAvgCost;
    const newTotalValue = currentTotalValue + totalCost;
    const newTotalStock = currentStock + quantity;
    newAvgCost = newTotalStock > 0 ? newTotalValue / newTotalStock : 0;
  }
  
  const newTotalStock = currentStock + quantity;
  const unitCost = quantity > 0 ? totalCost / quantity : 0;

  // Insert transaction
  await db.insert(inventoryTransactions).values({
    itemId,
    type: "STOCK-IN",
    quantity: quantity.toString(),
    unitCost: unitCost.toString(),
    totalCost: totalCost.toString(),
    remarks,
    ...(transactionDate && { createdAt: transactionDate }),
  });

  // Update Item stock and average cost
  await db.update(inventoryItems)
    .set({ 
      currentStock: newTotalStock.toString(),
      averageUnitCost: newAvgCost.toString(),
      updatedAt: new Date(),
    })
    .where(eq(inventoryItems.id, itemId));

  revalidatePath("/admin/inventory");
}

export async function recordStockOut(itemId: string, quantity: number, truckId: string | null, remarks: string, transactionDate?: Date) {
  const item = await db.query.inventoryItems.findFirst({
    where: eq(inventoryItems.id, itemId),
  });

  if (!item) throw new Error("Item not found");

  const currentStock = Number(item.currentStock);
  const averageCost = Number(item.averageUnitCost);
  
  if (currentStock < quantity) {
    throw new Error("Insufficient stock");
  }

  const newTotalStock = currentStock - quantity;
  const totalExpenseCost = quantity * averageCost;

  // Insert transaction
  await db.insert(inventoryTransactions).values({
    itemId,
    type: "STOCK-OUT",
    quantity: quantity.toString(),
    unitCost: averageCost.toString(),
    totalCost: totalExpenseCost.toString(),
    truckId: truckId || null,
    remarks,
    ...(transactionDate && { createdAt: transactionDate }),
  });

  // Update Item stock (average cost remains the same on stock out)
  await db.update(inventoryItems)
    .set({ 
      currentStock: newTotalStock.toString(),
      updatedAt: new Date(),
    })
    .where(eq(inventoryItems.id, itemId));

  revalidatePath("/admin/inventory");
  if (truckId) {
    revalidatePath("/admin/trucks");
  }
}

export async function getAllStockOuts() {
  return await db.query.inventoryTransactions.findMany({
    where: eq(inventoryTransactions.type, "STOCK-OUT"),
    orderBy: (txs, { desc }) => [desc(txs.createdAt)],
    with: {
      item: true,
      truck: true,
    }
  });
}

// --- Recalculation Engine & Edit/Delete Actions ---

export async function recalculateItemStats(itemId: string) {
  // 1. Fetch all transactions for this item ordered by chronological creation date
  const txs = await db.query.inventoryTransactions.findMany({
    where: eq(inventoryTransactions.itemId, itemId),
    orderBy: (txs, { asc }) => [asc(txs.createdAt)],
  });

  let currentStock = 0;
  let averageUnitCost = 0;

  // 2. Replay history
  for (const tx of txs) {
    if (tx.type === "STOCK-IN") {
      const txQty = Number(tx.quantity);
      const txTotalCost = Number(tx.totalCost);
      
      if (currentStock <= 0) {
        averageUnitCost = txQty > 0 ? txTotalCost / txQty : 0;
      } else {
        const currentTotalValue = currentStock * averageUnitCost;
        const newTotalValue = currentTotalValue + txTotalCost;
        averageUnitCost = newTotalValue / (currentStock + txQty);
      }
      
      currentStock += txQty;
      
      // Update unitCost if it was incorrect
      const updatedUnitCost = txQty > 0 ? txTotalCost / txQty : 0;
      if (Number(tx.unitCost) !== updatedUnitCost) {
        await db.update(inventoryTransactions)
          .set({ unitCost: updatedUnitCost.toString() })
          .where(eq(inventoryTransactions.id, tx.id));
      }
    } else if (tx.type === "STOCK-OUT") {
      const txQty = Number(tx.quantity);
      currentStock -= txQty;
      
      // The crucial part: Update this STOCK-OUT to reflect the *correct* moving average cost
      // as of this point in the timeline.
      const updatedTotalCost = txQty * averageUnitCost;
      
      if (Number(tx.unitCost) !== averageUnitCost || Number(tx.totalCost) !== updatedTotalCost) {
        await db.update(inventoryTransactions)
          .set({
            unitCost: averageUnitCost.toString(),
            totalCost: updatedTotalCost.toString()
          })
          .where(eq(inventoryTransactions.id, tx.id));
      }
    }
  }

  // 3. Save the final stock and average cost back to the item
  await db.update(inventoryItems)
    .set({
      currentStock: currentStock.toString(),
      averageUnitCost: averageUnitCost.toString(),
      updatedAt: new Date(),
    })
    .where(eq(inventoryItems.id, itemId));
}

export async function deleteInventoryTransaction(txId: string) {
  const tx = await db.query.inventoryTransactions.findFirst({
    where: eq(inventoryTransactions.id, txId)
  });
  if (!tx) throw new Error("Transaction not found");

  await db.delete(inventoryTransactions).where(eq(inventoryTransactions.id, txId));
  await recalculateItemStats(tx.itemId);
  
  revalidatePath("/admin/inventory");
  if (tx.truckId) {
    revalidatePath("/admin/trucks");
  }
}

export async function updateStockIn(txId: string, newQuantity: number, newTotalCost: number, newRemarks: string, newDate?: Date) {
  const tx = await db.query.inventoryTransactions.findFirst({
    where: eq(inventoryTransactions.id, txId)
  });
  if (!tx || tx.type !== "STOCK-IN") throw new Error("Stock-In not found");

  const newUnitCost = newQuantity > 0 ? newTotalCost / newQuantity : 0;

  await db.update(inventoryTransactions)
    .set({
      quantity: newQuantity.toString(),
      totalCost: newTotalCost.toString(),
      unitCost: newUnitCost.toString(),
      remarks: newRemarks,
      ...(newDate && { createdAt: newDate }),
    })
    .where(eq(inventoryTransactions.id, txId));

  await recalculateItemStats(tx.itemId);
  
  revalidatePath("/admin/inventory");
}

export async function updateStockOut(txId: string, newQuantity: number, newTruckId: string | null, newRemarks: string, newDate?: Date) {
  const tx = await db.query.inventoryTransactions.findFirst({
    where: eq(inventoryTransactions.id, txId)
  });
  if (!tx || tx.type !== "STOCK-OUT") throw new Error("Stock-Out not found");

  await db.update(inventoryTransactions)
    .set({
      quantity: newQuantity.toString(),
      truckId: newTruckId,
      remarks: newRemarks,
      ...(newDate && { createdAt: newDate }),
    })
    .where(eq(inventoryTransactions.id, txId));

  // Recalculating will automatically fix the unitCost/totalCost based on the quantity and historical average
  await recalculateItemStats(tx.itemId);
  
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/trucks");
}
