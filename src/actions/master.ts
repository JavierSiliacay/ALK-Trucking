"use server";

import { db } from "@/db";
import { drivers, helpers, trucks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getMasterData() {
  const [allDrivers, allHelpers, allTrucks] = await Promise.all([
    db.query.drivers.findMany({ where: eq(drivers.isActive, true), orderBy: (drivers, { asc }) => [asc(drivers.name)] }),
    db.query.helpers.findMany({ where: eq(helpers.isActive, true), orderBy: (helpers, { asc }) => [asc(helpers.name)] }),
    db.query.trucks.findMany({ where: eq(trucks.isActive, true), orderBy: (trucks, { asc }) => [asc(trucks.unit)] }),
  ]);

  return {
    drivers: allDrivers.map(d => d.name),
    helpers: allHelpers.map(h => h.name),
    trucks: allTrucks.map(t => ({ id: t.id, unit: t.unit, plateNo: t.plateNo, owner: t.owner })),
  };
}

export async function addDriver(name: string) {
  await db.insert(drivers).values({ name }).onConflictDoUpdate({ target: drivers.name, set: { isActive: true } });
  revalidatePath("/admin/settings");
}

export async function archiveDriver(name: string) {
  await db.update(drivers).set({ isActive: false }).where(eq(drivers.name, name));
  revalidatePath("/admin/settings");
}

export async function addHelper(name: string) {
  await db.insert(helpers).values({ name }).onConflictDoUpdate({ target: helpers.name, set: { isActive: true } });
  revalidatePath("/admin/settings");
}

export async function archiveHelper(name: string) {
  await db.update(helpers).set({ isActive: false }).where(eq(helpers.name, name));
  revalidatePath("/admin/settings");
}

export async function addTruck(unit: string, plateNo: string, owner: string) {
  await db.insert(trucks).values({ unit, plateNo, owner }).onConflictDoUpdate({ target: trucks.plateNo, set: { isActive: true, unit, owner } });
  revalidatePath("/admin/settings");
}

export async function archiveTruck(id: string) {
  await db.update(trucks).set({ isActive: false }).where(eq(trucks.id, id));
  revalidatePath("/admin/settings");
}
