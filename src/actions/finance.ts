"use server";

import { db } from "@/db";
import { financialRecords, systemSettings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getFinancialRecords() {
  try {
    const records = await db.select().from(financialRecords).orderBy(desc(financialRecords.date));
    return records.map(r => ({
      ...r,
      status: r.status || "Cleared"
    }));
  } catch (error) {
    console.error("Error fetching financial records:", error);
    return [];
  }
}

async function validatePendingCheckThreshold(newRecord: { id?: string; type: string; status: string; amount: number | string }) {
  // Only validate for outgoing Issuance checks with Pending status
  if (newRecord.type !== "Issuance" || newRecord.status !== "Pending") {
    return { valid: true };
  }

  const checkAmount = parseFloat(newRecord.amount?.toString() || "0");
  if (isNaN(checkAmount) || checkAmount <= 0) {
    return { valid: true };
  }

  // 1. Fetch latest threshold from system_settings
  const thresholdRecord = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, "FINANCIAL_LOW_BALANCE_THRESHOLD"),
  });
  const threshold = parseFloat(thresholdRecord?.value || "50000");

  // 2. Fetch all current non-cancelled records
  const allRecords = await db.select().from(financialRecords);
  const activeRecords = allRecords.filter(r => r.status !== "Cancelled");

  // 3. Current Running Balance = Total Cleared Deposits - Total Cleared Issuances
  const totalClearedDeposits = activeRecords
    .filter(r => r.type === "Deposit" && r.status === "Cleared")
    .reduce((acc, curr) => acc + parseFloat(curr.amount || "0"), 0);

  const totalClearedIssuances = activeRecords
    .filter(r => r.type === "Issuance" && r.status === "Cleared")
    .reduce((acc, curr) => acc + parseFloat(curr.amount || "0"), 0);

  const currentRunningBalance = totalClearedDeposits - totalClearedIssuances;

  // 4. Calculate resulting balance after deducting this pending check
  const resultingRunningBalance = currentRunningBalance - checkAmount;

  if (resultingRunningBalance <= threshold) {
    return {
      valid: false,
      error: `Cannot issue pending check of ₱${checkAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}. The resulting running balance (₱${resultingRunningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}) reaches or drops below the configured safety threshold of ₱${threshold.toLocaleString(undefined, { minimumFractionDigits: 2 })}. Current Running Balance: ₱${currentRunningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}.`
    };
  }

  return { valid: true };
}

export async function createFinancialRecord(data: any) {
  try {
    const validation = await validatePendingCheckThreshold({
      type: data.type,
      status: data.status,
      amount: data.amount
    });

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

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

export async function updateFinancialStatus(id: string, status: string, clearedDate?: string) {
  try {
    if (status === "Pending") {
      const existing = await db.query.financialRecords.findFirst({
        where: eq(financialRecords.id, id)
      });
      if (existing) {
        const validation = await validatePendingCheckThreshold({
          id,
          type: existing.type,
          status: "Pending",
          amount: existing.amount
        });
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }
      }
    }

    const updateData: any = { status, updatedAt: new Date() };
    if (clearedDate) {
      updateData.date = new Date(clearedDate);
    }
    await db.update(financialRecords)
      .set(updateData)
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
    const validation = await validatePendingCheckThreshold({
      id,
      type: data.type,
      status: data.status,
      amount: data.amount
    });

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

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
