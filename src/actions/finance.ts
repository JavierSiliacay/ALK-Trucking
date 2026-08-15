"use server";

import { db } from "@/db";
import { financialRecords } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getFinancialRecords() {
  try {
    const records = await db.select().from(financialRecords).orderBy(desc(financialRecords.date));
    return records;
  } catch (error) {
    console.error("Error fetching financial records:", error);
    return [];
  }
}

export async function createFinancialRecord(data: any) {
  try {
    await db.insert(financialRecords).values({
      ...data,
      date: new Date(data.date),
      amount: data.amount.toString(),
    });
    revalidatePath("/admin/financial");
    return { success: true };
  } catch (error) {
    console.error("Error creating financial record:", error);
    return { success: false, error: "Failed to create record" };
  }
}

export async function updateFinancialStatus(id: string, status: string) {
  try {
    await db.update(financialRecords)
      .set({ status, updatedAt: new Date() })
      .where(eq(financialRecords.id, id));
    revalidatePath("/admin/financial");
    return { success: true };
  } catch (error) {
    console.error("Error updating status:", error);
    return { success: false, error: "Failed to update status" };
  }
}

export async function updateFinancialRecord(id: string, data: any) {
  try {
    await db.update(financialRecords)
      .set({
        ...data,
        date: new Date(data.date),
        amount: data.amount.toString(),
        updatedAt: new Date()
      })
      .where(eq(financialRecords.id, id));
    revalidatePath("/admin/financial");
    return { success: true };
  } catch (error) {
    console.error("Error updating record:", error);
    return { success: false, error: "Failed to update record" };
  }
}

export async function deleteFinancialRecord(id: string) {
  try {
    await db.delete(financialRecords).where(eq(financialRecords.id, id));
    revalidatePath("/admin/financial");
    return { success: true };
  } catch (error) {
    console.error("Error deleting record:", error);
    return { success: false, error: "Failed to delete record" };
  }
}
