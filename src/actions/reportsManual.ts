"use server";

import { db } from "@/db";
import { reportManualRecords } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getReportManualEntries() {
  try {
    const records = await db.select().from(reportManualRecords).orderBy(desc(reportManualRecords.date));
    return records;
  } catch (error) {
    console.error("Error fetching report manual entries:", error);
    throw new Error("Failed to fetch records");
  }
}

export async function createReportManualEntry(data: {
  type: string;
  category: string;
  chargeTo?: string;
  invoiceNo?: string;
  suppliersName?: string;
  unitVehicle?: string;
  plateNo?: string;
  paymentType?: string;
  expenseDescription?: string;
  amount: number;
  date: string;
  remarks?: string;
}) {
  try {
    const newRecord = await db.insert(reportManualRecords).values({
      type: data.type,
      category: data.category,
      chargeTo: data.chargeTo,
      invoiceNo: data.invoiceNo,
      suppliersName: data.suppliersName,
      unitVehicle: data.unitVehicle,
      plateNo: data.plateNo,
      paymentType: data.paymentType,
      expenseDescription: data.expenseDescription,
      amount: data.amount.toString(),
      date: new Date(data.date),
      remarks: data.remarks || "",
    }).returning();
    
    revalidatePath("/admin/reports");
    return newRecord[0];
  } catch (error) {
    console.error("Error creating manual entry:", error);
    throw new Error("Failed to create record");
  }
}

export async function updateReportManualEntry(id: string, data: {
  type?: string;
  category?: string;
  chargeTo?: string;
  invoiceNo?: string;
  suppliersName?: string;
  unitVehicle?: string;
  plateNo?: string;
  paymentType?: string;
  expenseDescription?: string;
  amount?: number;
  date?: string;
  remarks?: string;
}) {
  try {
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.amount !== undefined) updateData.amount = data.amount.toString();
    if (data.date !== undefined) updateData.date = new Date(data.date);

    const updated = await db.update(reportManualRecords).set(updateData).where(eq(reportManualRecords.id, id)).returning();
    
    revalidatePath("/admin/reports");
    return updated[0];
  } catch (error) {
    console.error("Error updating manual entry:", error);
    throw new Error("Failed to update record");
  }
}

export async function deleteReportManualEntry(id: string) {
  try {
    await db.delete(reportManualRecords).where(eq(reportManualRecords.id, id));
    revalidatePath("/admin/reports");
    return { success: true };
  } catch (error) {
    console.error("Error deleting manual entry:", error);
    throw new Error("Failed to delete record");
  }
}
