import { Router, type IRouter } from "express";
import { db, teachersTable, usersTable, bookingsTable } from "@workspace/db";
import { eq, gte, lte, and, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const { minScore, maxRate } = req.query;

  const rows = await db
    .select()
    .from(teachersTable)
    .leftJoin(usersTable, eq(teachersTable.userId, usersTable.id));

  let filtered = rows;
  if (minScore) filtered = filtered.filter(r => r.teachers.ieltScore >= parseFloat(minScore as string));
  if (maxRate) filtered = filtered.filter(r => r.teachers.hourlyRate <= parseFloat(maxRate as string));

  const result = filtered.map(({ teachers, users }) => ({
    ...teachers,
    user: users ? { name: users.name, email: users.email } : null,
  }));

  res.json(result);
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const [row] = await db
    .select()
    .from(teachersTable)
    .leftJoin(usersTable, eq(teachersTable.userId, usersTable.id))
    .where(eq(teachersTable.userId, req.userId!))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Teacher profile not found" });
    return;
  }

  res.json({
    ...row.teachers,
    user: row.users ? { name: row.users.name, email: row.users.email } : null,
  });
});

router.put("/me", requireAuth, async (req: AuthRequest, res) => {
  const { ieltScore, bio, hourlyRate, availableTimes, specializations } = req.body;

  const existing = await db
    .select()
    .from(teachersTable)
    .where(eq(teachersTable.userId, req.userId!))
    .limit(1);

  let teacher;
  if (existing.length > 0) {
    [teacher] = await db
      .update(teachersTable)
      .set({
        ...(ieltScore !== undefined && { ieltScore }),
        ...(bio !== undefined && { bio }),
        ...(hourlyRate !== undefined && { hourlyRate }),
        ...(availableTimes !== undefined && { availableTimes }),
        ...(specializations !== undefined && { specializations }),
      })
      .where(eq(teachersTable.userId, req.userId!))
      .returning();

    await db
      .update(usersTable)
      .set({ role: "teacher" })
      .where(eq(usersTable.id, req.userId!));
  } else {
    [teacher] = await db.insert(teachersTable).values({
      userId: req.userId!,
      ieltScore: ieltScore ?? 7.0,
      bio: bio ?? "",
      hourlyRate: hourlyRate ?? 30.0,
      availableTimes: availableTimes ?? "[]",
      specializations: specializations ?? "[]",
    }).returning();

    await db
      .update(usersTable)
      .set({ role: "teacher" })
      .where(eq(usersTable.id, req.userId!));
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);

  res.json({
    ...teacher,
    user: user ? { name: user.name, email: user.email } : null,
  });
});

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  const id = parseInt(req.params["id"] ?? "0");

  const [row] = await db
    .select()
    .from(teachersTable)
    .leftJoin(usersTable, eq(teachersTable.userId, usersTable.id))
    .where(eq(teachersTable.id, id))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Teacher not found" });
    return;
  }

  const completedBookings = await db
    .select({ count: sql<number>`count(*)` })
    .from(bookingsTable)
    .where(and(
      eq(bookingsTable.teacherId, id),
      eq(bookingsTable.paymentStatus, "Free"),
      eq(bookingsTable.studentId, req.userId!)
    ));

  const freeUsed = Number(completedBookings[0]?.count ?? 0);
  const freeSessionsLeft = Math.max(0, 3 - freeUsed);

  res.json({
    ...row.teachers,
    user: row.users ? { name: row.users.name, email: row.users.email } : null,
    freeSessionsLeft,
  });
});

export default router;
