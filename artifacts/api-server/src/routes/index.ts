import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import testsRouter from "./tests.js";
import submissionsRouter from "./submissions.js";
import benRouter from "./ben.js";
import dashboardRouter from "./dashboard.js";
import paymentsRouter from "./payments.js";
import teachersRouter from "./teachers.js";
import bookingsRouter from "./bookings.js";
import notificationsRouter from "./notifications.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/tests", testsRouter);
router.use("/submissions", submissionsRouter);
router.use("/ben", benRouter);
router.use("/dashboard", dashboardRouter);
router.use("/payments", paymentsRouter);
router.use("/teachers", teachersRouter);
router.use("/bookings", bookingsRouter);
router.use("/notifications", notificationsRouter);

export default router;
