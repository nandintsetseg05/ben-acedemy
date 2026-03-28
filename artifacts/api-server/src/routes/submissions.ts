import { Router, type IRouter } from "express";
import { db, submissionsTable, testsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const rows = await db
    .select()
    .from(submissionsTable)
    .leftJoin(testsTable, eq(submissionsTable.testId, testsTable.id))
    .where(eq(submissionsTable.userId, req.userId!));

  const submissions = rows.map(({ submissions, tests }) => ({
    ...submissions,
    test: tests ?? null,
  }));

  res.json(submissions);
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const { testId } = req.body;
  if (!testId) {
    res.status(400).json({ error: "testId is required" });
    return;
  }

  const [test] = await db.select().from(testsTable).where(eq(testsTable.id, testId)).limit(1);
  if (!test) {
    res.status(404).json({ error: "Test not found" });
    return;
  }

  if (test.isPaid) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!user?.isPaid) {
      res.status(403).json({ error: "This test requires a paid subscription" });
      return;
    }
  }

  const [submission] = await db.insert(submissionsTable).values({
    userId: req.userId!,
    testId,
    status: "InProgress",
    flaggedForReview: false,
  }).returning();

  res.status(201).json({ ...submission, test });
});

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  const id = parseInt(req.params["id"] ?? "0");

  const rows = await db
    .select()
    .from(submissionsTable)
    .leftJoin(testsTable, eq(submissionsTable.testId, testsTable.id))
    .where(and(eq(submissionsTable.id, id), eq(submissionsTable.userId, req.userId!)))
    .limit(1);

  if (rows.length === 0) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }

  const row = rows[0]!;
  res.json({ ...row.submissions, test: row.tests ?? null });
});

router.patch("/:id/autosave", requireAuth, async (req: AuthRequest, res) => {
  const id = parseInt(req.params["id"] ?? "0");
  const { answers } = req.body;

  const [existing] = await db
    .select()
    .from(submissionsTable)
    .where(and(eq(submissionsTable.id, id), eq(submissionsTable.userId, req.userId!)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }

  if (existing.status !== "InProgress") {
    res.status(403).json({ error: "Submission is already locked" });
    return;
  }

  const [updated] = await db
    .update(submissionsTable)
    .set({ answers, lastAutoSave: new Date() })
    .where(eq(submissionsTable.id, id))
    .returning();

  res.json(updated);
});

router.post("/:id/submit", requireAuth, async (req: AuthRequest, res) => {
  const id = parseInt(req.params["id"] ?? "0");
  const { answers, expired } = req.body;

  const [existing] = await db
    .select()
    .from(submissionsTable)
    .where(and(eq(submissionsTable.id, id), eq(submissionsTable.userId, req.userId!)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }

  if (existing.status !== "InProgress") {
    res.status(403).json({ error: "Submission is already submitted" });
    return;
  }

  const status = expired ? "TimeExpired" : "Submitted";
  const [updated] = await db
    .update(submissionsTable)
    .set({ answers, status, submittedAt: new Date() })
    .where(eq(submissionsTable.id, id))
    .returning();

  res.json(updated);
});

export default router;
