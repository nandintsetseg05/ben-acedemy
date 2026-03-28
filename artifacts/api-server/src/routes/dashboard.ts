import { Router, type IRouter } from "express";
import { db, submissionsTable, testsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const { passwordHash: _, ...safeUser } = user;

  const rows = await db
    .select()
    .from(submissionsTable)
    .leftJoin(testsTable, eq(submissionsTable.testId, testsTable.id))
    .where(eq(submissionsTable.userId, req.userId!));

  const submissions = rows.map(({ submissions, tests }) => ({
    ...submissions,
    test: tests ?? null,
  }));

  const scoredSubmissions = submissions.filter(s => s.score !== null && s.score !== undefined);
  const averageScore = scoredSubmissions.length > 0
    ? scoredSubmissions.reduce((sum, s) => sum + (s.score ?? 0), 0) / scoredSubmissions.length
    : null;

  const progressData = submissions
    .filter(s => s.score !== null && s.submittedAt !== null)
    .sort((a, b) => new Date(a.submittedAt!).getTime() - new Date(b.submittedAt!).getTime())
    .map(s => ({
      date: s.submittedAt!.toISOString().split("T")[0] ?? "",
      score: s.score ?? 0,
    }));

  const weaknesses: string[] = [];
  const suggestedTasks: Array<{ title: string; description: string }> = [];

  for (const sub of submissions) {
    if (sub.aiFeedback) {
      try {
        const feedback = JSON.parse(sub.aiFeedback);
        if (feedback.suggestedTasks) {
          suggestedTasks.push(...feedback.suggestedTasks.slice(0, 2));
        }
        if (sub.score && sub.score < 6.0) {
          const areas = ["Task Achievement", "Coherence & Cohesion", "Lexical Resource", "Grammatical Range"];
          const weakArea = areas[Math.floor(Math.random() * areas.length)];
          if (!weaknesses.includes(weakArea!)) {
            weaknesses.push(weakArea!);
          }
        }
      } catch {
      }
    }
  }

  res.json({
    user: safeUser,
    submissions,
    totalTests: submissions.length,
    averageScore,
    progressData,
    weaknesses: weaknesses.slice(0, 4),
    suggestedTasks: suggestedTasks.slice(0, 5),
  });
});

export default router;
