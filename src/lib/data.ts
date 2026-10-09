import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "./db";
import { application } from "./db/schema";
import type { Application } from "./types";

export async function getApplications(userId: string): Promise<Application[]> {
  const rows = await db
    .select()
    .from(application)
    .where(eq(application.userId, userId))
    .orderBy(desc(application.createdAt));

  return rows.map((r) => ({
    id: r.id,
    company: r.company,
    logo: r.logo ?? undefined,
    role: r.role ?? undefined,
    appliedOn: r.appliedOn,
    stages: r.stages,
    currentStage: r.currentStage,
    rejected: r.rejected,
  }));
}
