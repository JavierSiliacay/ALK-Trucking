import { NextResponse } from "next/server";
import { db } from "@/db";
import { maintenanceRecords } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { truckId, category, description, cost, dateIncurred } = body;

    if (!description || cost === undefined) {
      return NextResponse.json({ error: "Description and cost are required" }, { status: 400 });
    }

    const result = await db.insert(maintenanceRecords).values({
      truckId: truckId || null,
      category: category || "Uncategorized",
      description,
      cost: cost.toString(),
      status: "Completed",
      dateIncurred: dateIncurred ? new Date(dateIncurred) : new Date(),
    }).returning();

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error("Failed to add maintenance record:", error);
    return NextResponse.json({ error: "Failed to add maintenance record" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, truckId, category, description, cost, dateIncurred } = body;

    if (!id || !description || cost === undefined) {
      return NextResponse.json({ error: "ID, description and cost are required" }, { status: 400 });
    }

    const { eq } = require('drizzle-orm');
    
    const result = await db.update(maintenanceRecords).set({
      truckId: truckId || null,
      category: category || "Uncategorized",
      description,
      cost: cost.toString(),
      dateIncurred: dateIncurred ? new Date(dateIncurred) : new Date(),
    }).where(eq(maintenanceRecords.id, id)).returning();

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error("Failed to update maintenance record:", error);
    return NextResponse.json({ error: "Failed to update maintenance record" }, { status: 500 });
  }
}
