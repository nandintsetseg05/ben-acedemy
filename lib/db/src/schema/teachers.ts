import { pgTable, text, serial, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const teachersTable = pgTable("teachers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id).unique(),
  ieltScore: real("ielt_score").notNull().default(7.0),
  bio: text("bio").notNull().default(""),
  hourlyRate: real("hourly_rate").notNull().default(30.0),
  availableTimes: text("available_times").notNull().default("[]"),
  specializations: text("specializations").notNull().default("[]"),
  totalSessions: integer("total_sessions").notNull().default(0),
  rating: real("rating"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTeacherSchema = createInsertSchema(teachersTable).omit({ id: true, createdAt: true });
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Teacher = typeof teachersTable.$inferSelect;
