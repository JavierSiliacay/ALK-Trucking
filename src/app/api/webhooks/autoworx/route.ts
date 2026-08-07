import { NextResponse } from "next/server";
import { db } from "@/db";
import { maintenanceRecords, trucks } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    // 1. Authenticate Request
    const authHeader = request.headers.get("Authorization");
    const secret = process.env.AUTOWORX_SYNC_SECRET;
    
    if (!secret) {
      console.warn("AUTOWORX_SYNC_SECRET is not configured on ALK Server.");
    }
    
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse Payload
    const data = await request.json();
    let { plateNo, autoworxJobId, description, cost, status, repairBreakdown, dateIncurred, vehicleDetails } = data;
    
    // Normalize status for ALK Dashboard
    if (status) {
      if (status.toLowerCase() !== "pending") {
        status = "Completed";
      } else {
        status = "Pending";
      }
    }

    if (!description || cost === undefined || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let truckId = null;

    // 3. Optional: Find Truck if plateNo is provided
    if (plateNo && plateNo.trim() !== "UNKNOWN" && plateNo.trim() !== "") {
      const allTrucks = await db.query.trucks.findMany();
      const normalize = (s: string) => s.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      const normalizedIncoming = normalize(plateNo);
      
      const truckMatch = allTrucks.find(t => normalize(t.plateNo) === normalizedIncoming);
      
      if (truckMatch) {
        truckId = truckMatch.id;
      }
    }

    // 4. Upsert Maintenance Record
    // Since autoworxJobId is unique, we can check if it already exists
    if (autoworxJobId) {
      const existingRecord = await db.query.maintenanceRecords.findFirst({
        where: eq(maintenanceRecords.autoworxJobId, autoworxJobId)
      });

      if (existingRecord) {
        const updatePayload: any = {
          description,
          cost: cost.toString(),
          status,
          truckId,
          updatedAt: new Date()
        };

        if (repairBreakdown !== undefined) {
          updatePayload.repairBreakdown = repairBreakdown;
        }
        
        if (dateIncurred !== undefined) {
          updatePayload.dateIncurred = dateIncurred ? new Date(dateIncurred) : new Date();
        }

        if (vehicleDetails !== undefined) {
          updatePayload.autoworxVehicleDetails = vehicleDetails;
        }

        await db.update(maintenanceRecords)
          .set(updatePayload)
          .where(eq(maintenanceRecords.autoworxJobId, autoworxJobId));
          
        return NextResponse.json({ success: true, message: "Maintenance record updated successfully." });
      }
    }

    // Insert New Record
    await db.insert(maintenanceRecords).values({
      truckId,
      autoworxJobId,
      description,
      repairBreakdown: repairBreakdown || null,
      autoworxVehicleDetails: vehicleDetails || null,
      cost: cost.toString(),
      status,
      dateIncurred: dateIncurred ? new Date(dateIncurred) : new Date()
    });

    return NextResponse.json({ success: true, message: "Maintenance record created successfully." });

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // 1. Authenticate Request
    const authHeader = request.headers.get("Authorization");
    const secret = process.env.AUTOWORX_SYNC_SECRET;
    
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const autoworxJobId = searchParams.get("autoworxJobId");

    if (!autoworxJobId) {
      return NextResponse.json({ error: "Missing autoworxJobId" }, { status: 400 });
    }

    await db.delete(maintenanceRecords).where(eq(maintenanceRecords.autoworxJobId, autoworxJobId));
    
    return NextResponse.json({ success: true, message: "Maintenance record deleted successfully." });
  } catch (error) {
    console.error("Webhook DELETE Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
