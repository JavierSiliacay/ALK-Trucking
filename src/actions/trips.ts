"use server";

import { db } from "@/db";
import { trips, expenses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getTrips() {
  try {
    const allTrips = await db.query.trips.findMany({
      with: {
        expenses: true,
      },
      orderBy: (trips, { desc }) => [desc(trips.createdAt)],
    });

    // Parse decimals back to numbers and serialize Dates to strings
    return allTrips.map(trip => ({
      ...trip,
      status: trip.status as "Active" | "Completed",
      rate: Number(trip.rate),
      helper1: trip.helper1 || "",
      helper2: trip.helper2 || "",
      distance: trip.distance || undefined,
      gatePassNo: trip.gatePassNo || "",
      notes: trip.notes || undefined,
      dateOfTravel: trip.dateOfTravel ? trip.dateOfTravel.toISOString().split("T")[0] : "",
      createdAt: trip.createdAt ? trip.createdAt.toISOString() : "",
      completedAt: trip.completedAt ? trip.completedAt.toISOString() : undefined,
      gatePassDate: trip.gatePassDate ? trip.gatePassDate.toISOString().split("T")[0] : "",
      expenses: trip.expenses.map(exp => ({
        ...exp,
        amount: Number(exp.amount),
        rsNo: exp.rsNo || "",
        description: exp.description || "",
        remarks: exp.remarks || "",
        dateRequest: exp.dateRequest ? exp.dateRequest.toISOString().split("T")[0] : "",
      }))
    }));
  } catch (error) {
    console.error("Failed to fetch trips:", error);
    throw new Error("Failed to fetch trips");
  }
}

export async function createTrip(data: any) {
  try {
    const { expenses: expensesData, ...tripData } = data;

    // Use a transaction to ensure both trip and expenses are created together
    await db.transaction(async (tx) => {
      // 1. Insert Trip
      const [newTrip] = await tx.insert(trips).values({
        ...tripData,
        rate: tripData.rate.toString(), // Convert to string for decimal column
      }).returning();

      // 2. Insert Expenses if any
      if (expensesData && expensesData.length > 0) {
        const expensesToInsert = expensesData.map((exp: any) => ({
          tripId: newTrip.id,
          category: exp.category,
          dateRequest: exp.dateRequest ? new Date(exp.dateRequest) : null,
          rsNo: exp.rsNo || "",
          description: exp.description || "",
          amount: exp.amount.toString(),
          remarks: exp.remarks || "",
        }));

        await tx.insert(expenses).values(expensesToInsert);
      }
    });

    revalidatePath("/admin/trips");
    revalidatePath("/admin/reports");
    revalidatePath("/admin/payroll");
    return { success: true };
  } catch (error) {
    console.error("Failed to create trip:", error);
    return { success: false, error: "Failed to create trip" };
  }
}

export async function updateTrip(id: string, data: any) {
  try {
    const { expenses: expensesData, ...tripData } = data;

    await db.transaction(async (tx) => {
      // 1. Update Trip
      await tx.update(trips).set({
        ...tripData,
        rate: tripData.rate.toString(),
      }).where(eq(trips.id, id));

      // 2. Sync Expenses (Delete old ones and insert new ones to keep it simple)
      await tx.delete(expenses).where(eq(expenses.tripId, id));

      if (expensesData && expensesData.length > 0) {
        const expensesToInsert = expensesData.map((exp: any) => ({
          tripId: id,
          category: exp.category,
          dateRequest: exp.dateRequest ? new Date(exp.dateRequest) : null,
          rsNo: exp.rsNo || "",
          description: exp.description || "",
          amount: exp.amount.toString(),
          remarks: exp.remarks || "",
        }));

        await tx.insert(expenses).values(expensesToInsert);
      }
    });

    revalidatePath("/admin/trips");
    revalidatePath("/admin/reports");
    revalidatePath("/admin/payroll");
    return { success: true };
  } catch (error) {
    console.error("Failed to update trip:", error);
    return { success: false, error: "Failed to update trip" };
  }
}

export async function deleteTrip(id: string) {
  try {
    // Cascading delete is configured in the schema, so deleting the trip deletes its expenses
    await db.delete(trips).where(eq(trips.id, id));

    revalidatePath("/admin/trips");
    revalidatePath("/admin/reports");
    revalidatePath("/admin/payroll");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete trip:", error);
    return { success: false, error: "Failed to delete trip" };
  }
}

export async function completeTrip(id: string) {
  try {
    await db.update(trips)
      .set({
        status: "Completed",
        completedAt: new Date()
      })
      .where(eq(trips.id, id));

    revalidatePath("/admin/trips");
    revalidatePath("/admin/reports");
    revalidatePath("/admin/payroll");
    return { success: true };
  } catch (error) {
    console.error("Failed to complete trip:", error);
    return { success: false, error: "Failed to complete trip" };
  }
}
