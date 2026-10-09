import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { Stage } from "../types";
import { user } from "./auth-schema";

export * from "./auth-schema";

export const application = sqliteTable("application", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  company: text("company").notNull(),
  logo: text("logo"),
  role: text("role"),
  appliedOn: text("applied_on").notNull(), // yyyy-mm-dd
  stages: text("stages", { mode: "json" }).$type<Stage[]>().notNull(),
  currentStage: integer("current_stage").notNull(),
  rejected: integer("rejected", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});
