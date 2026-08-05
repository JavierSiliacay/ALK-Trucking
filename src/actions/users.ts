"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getAuthorizedUsers() {
  try {
    const data = await db.select().from(users).orderBy(users.createdAt);
    return data;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function addAuthorizedUser(email: string, name: string) {
  try {
    const session = await auth();
    if (!session || session.user?.email !== "siliacay.javier@gmail.com") {
      return { success: false, message: "Unauthorized: Only the developer can grant access." };
    }

    const existing = await db.select().from(users).where(eq(users.email, email));
    
    if (existing.length > 0) {
      return { success: false, message: "This email is already authorized." };
    }

    await db.insert(users).values({
      email,
      name,
      role: "ADMIN",
    });

    revalidatePath("/admin/settings");
    return { success: true, message: "User access granted successfully." };
  } catch (error) {
    console.error("Error adding user:", error);
    return { success: false, message: "Failed to add user." };
  }
}

export async function revokeUserAccess(id: string) {
  try {
    const session = await auth();
    if (!session || session.user?.email !== "siliacay.javier@gmail.com") {
      return { success: false, message: "Unauthorized: Only the developer can revoke access." };
    }

    await db.delete(users).where(eq(users.id, id));
    revalidatePath("/admin/settings");
    return { success: true, message: "User access revoked." };
  } catch (error) {
    console.error("Error revoking user:", error);
    return { success: false, message: "Failed to revoke user access." };
  }
}
