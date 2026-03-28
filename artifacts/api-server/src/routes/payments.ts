import { Router, type IRouter } from "express";
import Stripe from "stripe";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

function getStripe() {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

const PRICE_ID = process.env["STRIPE_PRICE_ID"] ?? "";
const WEBHOOK_SECRET = process.env["STRIPE_WEBHOOK_SECRET"] ?? "";
const BASE_URL = process.env["REPLIT_DOMAINS"]?.split(",")[0]
  ? `https://${process.env["REPLIT_DOMAINS"]!.split(",")[0]}`
  : "http://localhost:3000";

router.get("/status", requireAuth, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json({
    isPaid: user.isPaid,
    subscriptionStatus: user.subscriptionStatus ?? null,
    currentPeriodEnd: user.currentPeriodEnd?.toISOString() ?? null,
  });
});

router.post("/create-checkout", requireAuth, async (req: AuthRequest, res) => {
  const stripe = getStripe();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: String(user.id) },
    });
    customerId = customer.id;
    await db.update(usersTable)
      .set({ stripeCustomerId: customerId })
      .where(eq(usersTable.id, user.id));
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: PRICE_ID ? [{ price: PRICE_ID, quantity: 1 }] : [],
    success_url: `${BASE_URL}/?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${BASE_URL}/upgrade`,
    metadata: { userId: String(user.id) },
  });

  res.json({ url: session.url });
});

router.post("/portal", requireAuth, async (req: AuthRequest, res) => {
  const stripe = getStripe();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user?.stripeCustomerId) {
    res.status(400).json({ error: "No billing account found" });
    return;
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${BASE_URL}/dashboard`,
  });

  res.json({ url: session.url });
});

router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  if (!sig || !WEBHOOK_SECRET) {
    res.status(400).json({ error: "Missing signature" });
    return;
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
  } catch {
    res.status(400).json({ error: "Webhook signature verification failed" });
    return;
  }

  const stripe = getStripe();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    if (userId && session.subscription) {
      const sub = await stripe.subscriptions.retrieve(session.subscription as string);
      await db.update(usersTable)
        .set({
          isPaid: true,
          subscriptionId: sub.id,
          subscriptionStatus: sub.status,
          currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
        })
        .where(eq(usersTable.id, parseInt(userId)));
    }
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const customer = await stripe.customers.retrieve(sub.customer as string);
    if (!customer.deleted) {
      const userId = (customer as Stripe.Customer).metadata?.userId;
      if (userId) {
        const isPaid = sub.status === "active" || sub.status === "trialing";
        await db.update(usersTable)
          .set({
            isPaid,
            subscriptionStatus: sub.status,
            currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
          })
          .where(eq(usersTable.id, parseInt(userId)));
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customer = await stripe.customers.retrieve(sub.customer as string);
    if (!customer.deleted) {
      const userId = (customer as Stripe.Customer).metadata?.userId;
      if (userId) {
        await db.update(usersTable)
          .set({ isPaid: false, subscriptionStatus: "canceled" })
          .where(eq(usersTable.id, parseInt(userId)));
      }
    }
  }

  res.json({ received: true });
});

export default router;
