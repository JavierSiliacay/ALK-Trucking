"use server";

import { db } from "@/db";
import { maintenanceRecords, trucks } from "@/db/schema";
import { eq, desc, ilike, or, and, isNull, isNotNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getPaginatedMaintenanceRecords(params: {
  page: number;
  limit: number;
  status: "pending" | "completed";
  source: "all" | "manual" | "autoworx";
  searchQuery: string;
}) {
  const { page, limit, status, source, searchQuery } = params;
  const offset = (page - 1) * limit;

  // Build the WHERE clause dynamically
  const conditions = [];

  // 1. Status Filter
  if (status === "pending") {
    conditions.push(ilike(maintenanceRecords.status, "Pending"));
  } else {
    // Treat everything else as completed for the "completed" tab
    conditions.push(
      sql`${maintenanceRecords.status} NOT ILIKE 'Pending'`
    );
  }

  // 2. Source Filter
  if (source === "manual") {
    conditions.push(isNull(maintenanceRecords.autoworxJobId));
  } else if (source === "autoworx") {
    conditions.push(isNotNull(maintenanceRecords.autoworxJobId));
  }

  // 3. Search Query
  if (searchQuery && searchQuery.trim() !== "") {
    const tokens = searchQuery.trim().split(/\s+/);
    
    // For each token, it must match at least one of the fields
    const tokenConditions = tokens.map(token => {
      const q = `%${token}%`;
      return or(
        ilike(maintenanceRecords.description, q),
        ilike(maintenanceRecords.autoworxJobId, q),
        sql`REPLACE(${trucks.plateNo}, ' ', '') ILIKE ${q}`
      );
    });
    
    // Ensure all tokens match (AND logic)
    conditions.push(and(...tokenConditions));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Execute the main query with leftJoin
  const results = await db
    .select({
      maintenanceRecord: maintenanceRecords,
      truck: trucks,
    })
    .from(maintenanceRecords)
    .leftJoin(trucks, eq(maintenanceRecords.truckId, trucks.id))
    .where(whereClause)
    .orderBy(desc(maintenanceRecords.dateIncurred), desc(maintenanceRecords.createdAt))
    .limit(limit)
    .offset(offset);

  // Re-map the results to match the previous nested structure expected by the frontend
  const formattedRecords = results.map(row => ({
    ...row.maintenanceRecord,
    truck: row.truck || null
  }));

  // Execute the count query
  const countResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(maintenanceRecords)
    .leftJoin(trucks, eq(maintenanceRecords.truckId, trucks.id))
    .where(whereClause);

  const totalCount = countResult[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  // Get total pending count globally (ignoring current status/page filters but respecting search/source filters if needed, or just globally)
  // For UI notification dots, it's usually best to show global pending count.
  const pendingCountResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(maintenanceRecords)
    .where(ilike(maintenanceRecords.status, "Pending"));

  const pendingCount = pendingCountResult[0]?.count || 0;

  return {
    records: formattedRecords,
    pagination: {
      totalCount,
      totalPages,
      currentPage: page,
      limit,
      pendingCount,
    }
  };
}

export async function getMaintenanceRecords() {
  const records = await db.query.maintenanceRecords.findMany({
    with: {
      truck: true
    },
    orderBy: [desc(maintenanceRecords.createdAt)]
  });
  return records;
}

export async function approveMaintenanceRecord(id: string) {
  await db.update(maintenanceRecords)
    .set({ status: "Approved", updatedAt: new Date() })
    .where(eq(maintenanceRecords.id, id));
    
  // Normally you would also ping the Autoworx API here to let them know ALK approved it:
  // await fetch('https://autoworxcagayan.com/api/webhooks/alk', { ... })

  revalidatePath("/admin/maintenance");
  return { success: true };
}

export async function deleteMaintenanceRecord(id: string) {
  await db.delete(maintenanceRecords)
    .where(eq(maintenanceRecords.id, id));
    
  revalidatePath("/admin/maintenance");
  return { success: true };
}

export async function addManualMaintenanceRecord(data: { truckId?: string | null, description: string, cost: number, status: string }) {
  await db.insert(maintenanceRecords).values({
    truckId: data.truckId || null,
    description: data.description,
    cost: data.cost.toString(),
    status: data.status
  });
  
  revalidatePath("/admin/maintenance");
  return { success: true };
}
