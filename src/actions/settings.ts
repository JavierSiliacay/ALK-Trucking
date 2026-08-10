"use server";

import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { unstable_noStore as noStore } from "next/cache";

export async function getSystemSetting(key: string, defaultValue: string = "false") {
  noStore();
  try {
    const record = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, key),
    });
    return record ? record.value : defaultValue;
  } catch (error) {
    console.error(`Error fetching system setting ${key}:`, error);
    return defaultValue;
  }
}

export async function updateSystemSetting(key: string, value: string) {
  const session = await auth();
  
  if (session?.user?.email !== "siliacay.javier@gmail.com") {
    throw new Error("ONLY THE DEVELOPER CAN ENABLE IT");
  }

  try {
    // Upsert equivalent since neon doesn't support easy upsert in drizzle perfectly without onConflictDoUpdate sometimes
    // Wait, let's just delete and insert to be safe and simple, or update if exists
    const existing = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, key)
    });

    if (existing) {
      await db.update(systemSettings)
        .set({ value })
        .where(eq(systemSettings.key, key));
    } else {
      await db.insert(systemSettings)
        .values({ key, value });
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error updating system setting ${key}:`, error);
    return { error: "Failed to update setting" };
  }
}
