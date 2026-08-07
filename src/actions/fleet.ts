"use server";

import { db } from "@/db";
import { trucks, trips, expenses, inventoryTransactions, maintenanceRecords } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export async function getFleetPerformance(startDate?: Date, endDate?: Date, status: string = "active") {
  // Fetch trucks based on status filter
  const allTrucks = await db.query.trucks.findMany({
    where: status === "active" ? eq(trucks.isActive, true) : status === "archived" ? eq(trucks.isActive, false) : undefined,
  });

  // Build where clauses for dates if provided
  // Note: Date filtering will be applied in JS for simplicity in this implementation
  // since we need to aggregate from multiple sources
  
  const allTrips = await db.query.trips.findMany({
    with: {
      expenses: true,
    }
  });

  const allInventoryTxs = await db.query.inventoryTransactions.findMany({
    where: eq(inventoryTransactions.type, "STOCK-OUT"),
  });

  const allMaintenance = await db.query.maintenanceRecords.findMany({
    where: eq(maintenanceRecords.status, "Completed"),
  });

  // Filter trips and inventory by date if provided
  const filteredTrips = allTrips.filter(t => {
    if (startDate && new Date(t.dateOfTravel) < startDate) return false;
    if (endDate && new Date(t.dateOfTravel) > endDate) return false;
    return true;
  });

  const filteredInvTxs = allInventoryTxs.filter(tx => {
    if (startDate && new Date(tx.createdAt) < startDate) return false;
    if (endDate && new Date(tx.createdAt) > endDate) return false;
    return true;
  });

  const filteredMaintenance = allMaintenance.filter(m => {
    const d = new Date(m.dateIncurred || m.createdAt);
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  });

  const performanceByTruck = allTrucks.map(truck => {
    // 1. Revenue: sum of trip rates where truck plate matches
    const truckTrips = filteredTrips.filter(t => t.plateNo === truck.plateNo);
    const revenue = truckTrips.reduce((sum, t) => sum + Number(t.rate), 0);

    // 2. Trip Expenses
    const tripExpenses = truckTrips.reduce((sum, t) => {
      const tripExpTotal = t.expenses.reduce((eSum, e) => eSum + Number(e.amount), 0);
      return sum + tripExpTotal;
    }, 0);

    // 3. Inventory Expenses
    const truckInvTxs = filteredInvTxs.filter(tx => tx.truckId === truck.id);
    const inventoryExpenses = truckInvTxs.reduce((sum, tx) => sum + Number(tx.totalCost), 0);

    // 4. Maintenance Expenses
    const truckMaintenance = filteredMaintenance.filter(m => m.truckId === truck.id);
    const maintenanceExpenses = truckMaintenance.reduce((sum, m) => sum + Number(m.cost), 0);

    const totalExpenses = tripExpenses + inventoryExpenses + maintenanceExpenses;
    const netProfit = revenue - totalExpenses;

    return {
      ...truck,
      stats: {
        tripsCount: truckTrips.length,
        revenue,
        tripExpenses,
        inventoryExpenses,
        maintenanceExpenses,
        totalExpenses,
        netProfit,
      },
      trips: truckTrips,
      inventoryTransactions: truckInvTxs,
      maintenanceRecords: truckMaintenance
    };
  });

  return performanceByTruck.sort((a, b) => b.stats.netProfit - a.stats.netProfit);
}
