"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { application } from "@/lib/db/schema";
import { parseFields, parseId } from "@/lib/application-input";
import { getUser } from "@/lib/session";
import type { Application } from "@/lib/types";

// Every action re-checks the session itself; never trust the client.
async function requireUserId() {
  const user = await getUser();
  if (!user) throw new Error("Not signed in");
  return user.id;
}

function toRow(userId: string, app: Application, createdAt: number) {
  const fields = parseFields({
    company: app.company,
    logo: app.logo,
    role: app.role,
    appliedOn: app.appliedOn,
    stages: app.stages,
    currentStage: app.currentStage,
    rejected: app.rejected,
  });
  // Every required key was present in the input above, so parseFields validated it.
  return {
    ...fields,
    id: parseId(app.id),
    userId,
    rejected: fields.rejected ?? false,
    createdAt,
  } as typeof application.$inferInsert;
}

export async function addApplication(app: Application) {
  const userId = await requireUserId();
  await db.insert(application).values(toRow(userId, app, Date.now()));
}

export async function updateApplication(
  id: string,
  patch: Partial<Omit<Application, "id">>,
) {
  const userId = await requireUserId();
  await db
    .update(application)
    .set(parseFields(patch))
    .where(and(eq(application.id, parseId(id)), eq(application.userId, userId)));
}

export async function removeApplication(id: string) {
  const userId = await requireUserId();
  await db
    .delete(application)
    .where(and(eq(application.id, parseId(id)), eq(application.userId, userId)));
}
