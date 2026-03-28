import { pgTable, text, serial, boolean, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { testsTable } from "./tests";

export const submissionsTable = pgTable("submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  testId: integer("test_id").notNull().references(() => testsTable.id),
  answers: text("answers"),
  score: real("score"),
  aiFeedback: text("ai_feedback"),
  status: text("status").notNull().default("InProgress"),
  flaggedForReview: boolean("flagged_for_review").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastAutoSave: timestamp("last_auto_save"),
  submittedAt: timestamp("submitted_at"),
});

export const insertSubmissionSchema = createInsertSchema(submissionsTable).omit({ id: true, createdAt: true });
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissionsTable.$inferSelect;
