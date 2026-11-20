import { collections as db } from "../config/db.js";
import { env } from "../config/env.js";
import { stripe } from "../services/stripe.js";
import { activatePremium, downgradeToFree } from "../services/subscription.js";
import { userIdFilter } from "../utils/helpers.js";

const periodEnd = (sub) => {
  const seconds = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
  return seconds ? new Date(seconds * 1000) : new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
};

const findVendor = async (vendorId) => (vendorId ? db.users().findOne({ ...userIdFilter(vendorId), role: "vendor" }) : null);

async function onCheckoutCompleted(session) {
  if (session.mode !== "subscription" || session.payment_status !== "paid") return;
  const vendor = await findVendor(session.client_reference_id || session.metadata?.vendorId);
  if (!vendor) return console.warn("Webhook: vendor not found for session", session.id);

  const subscription = await stripe.subscriptions.retrieve(session.subscription);

  await db.transactions().updateOne(
    { stripeSessionId: session.id },
    {
      $setOnInsert: {
        vendorId: vendor._id,
        plan: "premium",
        amount: (session.amount_total ?? 0) / 100,
        currency: session.currency,
        stripeSessionId: session.id,
        stripeSubscriptionId: subscription.id,
        status: "paid",
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );
  await activatePremium(vendor._id, periodEnd(subscription));
}

async function onSubscriptionUpdated(subscription) {
  const vendor = await findVendor(subscription.metadata?.vendorId);
  if (!vendor) return;
  if (["active", "trialing"].includes(subscription.status)) {
    await activatePremium(vendor._id, periodEnd(subscription)); // renewal extends the expiry
  } else if (["canceled", "unpaid", "incomplete_expired"].includes(subscription.status)) {
    await downgradeToFree(vendor._id);
  }
}

async function onSubscriptionDeleted(subscription) {
  const vendor = await findVendor(subscription.metadata?.vendorId);
  if (vendor) await downgradeToFree(vendor._id);
}

export async function stripeWebhook(req, res) {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], env.stripeWebhookSecret);
  } catch (err) {
    console.warn("Stripe webhook signature verification failed:", err.message);
    return res.status(400).send("Invalid signature");
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await onCheckoutCompleted(event.data.object);
        break;
      case "customer.subscription.updated":
        await onSubscriptionUpdated(event.data.object);
        break;
      case "customer.subscription.deleted":
        await onSubscriptionDeleted(event.data.object);
        break;
      default:
        break;
    }
    res.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook handler failed:", err);
    res.status(500).send("Webhook handler failed"); // Stripe will retry
  }
}