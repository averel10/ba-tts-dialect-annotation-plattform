"use server";

import db from "@/lib/db";
import { user } from "@/lib/model/auth-schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function deleteUser(userId: string) {
  const result = await requireAdmin();
  
  if (!result.authenticated || !result.admin) {
    throw new Error("Unauthorized");
  }

  await db.delete(user).where(eq(user.id, userId));
}

export async function setUserAdmin(userId: string, isAdmin: boolean) {
  const result = await requireAdmin();
  
  if (!result.authenticated || !result.admin) {
    throw new Error("Unauthorized");
  }

  await db.update(user).set({ admin: isAdmin }).where(eq(user.id, userId));
}

export async function getAllUsers() {
  const result = await requireAdmin();
  
  if (!result.authenticated || !result.admin) {
    throw new Error("Unauthorized");
  }

  return db.select().from(user);
}
