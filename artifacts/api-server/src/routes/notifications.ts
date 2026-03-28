import { Router, type IRouter } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, req.userId!))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);

  res.json(notifications);
});

router.put("/read-all", requireAuth, async (req: AuthRequest, res) => {
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.userId, req.userId!));

  res.json({ received: true });
});

router.put("/:id/read", requireAuth, async (req: AuthRequest, res) => {
  const id = parseInt(req.params["id"] ?? "0");

  const [updated] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json(updated);
});

export async function createNotification(
  userId: number,
  message: string,
  type: string = "info",
  relatedId?: number,
  relatedType?: string,
) {
  await db.insert(notificationsTable).values({
    userId,
    message,
    type,
    relatedId: relatedId ?? null,
    relatedType: relatedType ?? null,
    isRead: false,
  });
}

export default router;
