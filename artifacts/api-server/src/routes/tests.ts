import { Router, type IRouter } from "express";
import { db, testsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const tests = await db.select().from(testsTable);
  res.json(tests);
});

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  const id = parseInt(req.params["id"] ?? "0");
  const [test] = await db.select().from(testsTable).where(eq(testsTable.id, id)).limit(1);

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

  res.json(test);
});

export default router;
