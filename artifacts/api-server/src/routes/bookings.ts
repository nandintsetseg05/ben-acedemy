import { Router, type IRouter } from "express";
import { db, bookingsTable, teachersTable, usersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { createNotification } from "./notifications.js";

const router: IRouter = Router();
const FREE_SESSIONS_LIMIT = 3;

async function getBookingWithDetails(bookingId: number) {
  const [row] = await db
    .select()
    .from(bookingsTable)
    .leftJoin(teachersTable, eq(bookingsTable.teacherId, teachersTable.id))
    .leftJoin(usersTable, eq(bookingsTable.studentId, usersTable.id))
    .where(eq(bookingsTable.id, bookingId))
    .limit(1);

  if (!row) return null;

  const teacherUser = row.teachers
    ? await db.select().from(usersTable).where(eq(usersTable.id, row.teachers.userId)).limit(1)
    : [];

  return {
    ...row.bookings,
    teacher: row.teachers
      ? { ...row.teachers, user: teacherUser[0] ? { name: teacherUser[0].name, email: teacherUser[0].email } : null }
      : null,
    studentName: row.users?.name ?? null,
  };
}

async function countFreeSessionsUsed(studentId: number, teacherId: number): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(bookingsTable)
    .where(and(
      eq(bookingsTable.studentId, studentId),
      eq(bookingsTable.teacherId, teacherId),
      eq(bookingsTable.paymentStatus, "Free"),
    ));
  return Number(result[0]?.count ?? 0);
}

router.get("/student", requireAuth, async (req: AuthRequest, res) => {
  const rows = await db
    .select()
    .from(bookingsTable)
    .leftJoin(teachersTable, eq(bookingsTable.teacherId, teachersTable.id))
    .leftJoin(usersTable, eq(bookingsTable.studentId, usersTable.id))
    .where(eq(bookingsTable.studentId, req.userId!));

  const results = await Promise.all(rows.map(async ({ bookings, teachers }) => {
    const teacherUser = teachers
      ? await db.select().from(usersTable).where(eq(usersTable.id, teachers.userId)).limit(1)
      : [];
    return {
      ...bookings,
      teacher: teachers
        ? { ...teachers, user: teacherUser[0] ? { name: teacherUser[0].name, email: teacherUser[0].email } : null }
        : null,
      studentName: null,
    };
  }));

  res.json(results);
});

router.get("/teacher", requireAuth, async (req: AuthRequest, res) => {
  const [myTeacher] = await db
    .select()
    .from(teachersTable)
    .where(eq(teachersTable.userId, req.userId!))
    .limit(1);

  if (!myTeacher) {
    res.status(403).json({ error: "You are not a teacher" });
    return;
  }

  const rows = await db
    .select()
    .from(bookingsTable)
    .leftJoin(usersTable, eq(bookingsTable.studentId, usersTable.id))
    .where(eq(bookingsTable.teacherId, myTeacher.id));

  const results = rows.map(({ bookings, users }) => ({
    ...bookings,
    teacher: null,
    studentName: users?.name ?? null,
  }));

  res.json(results);
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const { teacherId, sessionTime, durationMinutes = 60, studentMessage } = req.body;

  if (!teacherId || !sessionTime) {
    res.status(400).json({ error: "teacherId and sessionTime are required" });
    return;
  }

  const [teacher] = await db.select().from(teachersTable).where(eq(teachersTable.id, teacherId)).limit(1);
  if (!teacher) {
    res.status(404).json({ error: "Teacher not found" });
    return;
  }

  const requestedTime = new Date(sessionTime);
  if (isNaN(requestedTime.getTime())) {
    res.status(400).json({ error: "Invalid sessionTime format" });
    return;
  }

  if (requestedTime < new Date()) {
    res.status(400).json({ error: "Cannot book a session in the past" });
    return;
  }

  const existingAtTime = await db
    .select()
    .from(bookingsTable)
    .where(and(
      eq(bookingsTable.teacherId, teacherId),
      eq(bookingsTable.sessionTime, requestedTime),
    ))
    .limit(1);

  if (existingAtTime.length > 0 && existingAtTime[0]!.status !== "Declined") {
    res.status(400).json({ error: "This time slot is already booked" });
    return;
  }

  const freeUsed = await countFreeSessionsUsed(req.userId!, teacherId);
  const paymentStatus = freeUsed < FREE_SESSIONS_LIMIT ? "Free" : "Required";

  const [booking] = await db.insert(bookingsTable).values({
    studentId: req.userId!,
    teacherId,
    sessionTime: requestedTime,
    durationMinutes,
    status: "Pending",
    paymentStatus,
    studentMessage: studentMessage ?? null,
  }).returning();

  const [student] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  await createNotification(
    teacher.userId,
    `New booking request from ${student?.name ?? "a student"} for ${requestedTime.toLocaleDateString()} at ${requestedTime.toLocaleTimeString()}`,
    "booking",
    booking.id,
    "booking",
  );

  const detail = await getBookingWithDetails(booking.id);
  res.status(201).json(detail);
});

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  const id = parseInt(req.params["id"] ?? "0");
  const detail = await getBookingWithDetails(id);

  if (!detail) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  if (detail.studentId !== req.userId!) {
    const [myTeacher] = await db.select().from(teachersTable).where(eq(teachersTable.userId, req.userId!)).limit(1);
    if (!myTeacher || myTeacher.id !== detail.teacherId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
  }

  res.json(detail);
});

router.put("/:id/respond", requireAuth, async (req: AuthRequest, res) => {
  const id = parseInt(req.params["id"] ?? "0");
  const { status, teacherNote } = req.body;

  if (!["Confirmed", "Declined"].includes(status)) {
    res.status(400).json({ error: "status must be Confirmed or Declined" });
    return;
  }

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const [myTeacher] = await db.select().from(teachersTable).where(eq(teachersTable.userId, req.userId!)).limit(1);
  if (!myTeacher || myTeacher.id !== booking.teacherId) {
    res.status(403).json({ error: "Only the teacher of this booking can respond" });
    return;
  }

  await db
    .update(bookingsTable)
    .set({ status, teacherNote: teacherNote ?? null, updatedAt: new Date() })
    .where(eq(bookingsTable.id, id));

  const statusText = status === "Confirmed" ? "confirmed" : "declined";
  const [teacher] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);

  await createNotification(
    booking.studentId,
    `Your booking on ${booking.sessionTime.toLocaleDateString()} has been ${statusText} by ${teacher?.name ?? "your teacher"}`,
    status === "Confirmed" ? "success" : "warning",
    booking.id,
    "booking",
  );

  if (status === "Confirmed" && teacherNote) {
    await createNotification(
      booking.studentId,
      `Message from your teacher: "${teacherNote}"`,
      "info",
      booking.id,
      "booking",
    );
  }

  const detail = await getBookingWithDetails(id);
  res.json(detail);
});

router.put("/:id/complete", requireAuth, async (req: AuthRequest, res) => {
  const id = parseInt(req.params["id"] ?? "0");
  const { teacherNote } = req.body;

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const [myTeacher] = await db.select().from(teachersTable).where(eq(teachersTable.userId, req.userId!)).limit(1);
  if (!myTeacher || myTeacher.id !== booking.teacherId) {
    res.status(403).json({ error: "Only the teacher of this booking can complete it" });
    return;
  }

  await db
    .update(bookingsTable)
    .set({ status: "Completed", teacherNote: teacherNote ?? booking.teacherNote, updatedAt: new Date() })
    .where(eq(bookingsTable.id, id));

  await db
    .update(teachersTable)
    .set({ totalSessions: sql`${teachersTable.totalSessions} + 1` })
    .where(eq(teachersTable.id, myTeacher.id));

  if (teacherNote) {
    await createNotification(
      booking.studentId,
      `Your session has been completed. Teacher's note: "${teacherNote}"`,
      "success",
      booking.id,
      "booking",
    );
  }

  const detail = await getBookingWithDetails(id);
  res.json(detail);
});

export default router;
