import { collections as db } from "../config/db.js";
import { ACTIVE_ITEM_STATUSES, FREE_PLAN_LIMIT } from "../constants.js";

const GRACE_MS = 24 * 60 * 60 * 1000; // allow renewal webhooks to arrive

export async function enforceFreeLimit(vendorId) {
  const keep = await db
    .menuItems()
    .find({ vendorId, status: { $in: ACTIVE_ITEM_STATUSES } })
    .sort({ createdAt: 1 })
    .limit(FREE_PLAN_LIMIT)
    .project({ _id: 1 })
    .toArray();
  await db.menuItems().updateMany(
    { vendorId, status: { $in: ACTIVE_ITEM_STATUSES }, _id: { $nin: keep.map((k) => k._id) } },
    { $set: { status: "inactive" } }
  );
}

export async function downgradeToFree(userId) {
  await db.users().updateOne({ _id: userId }, { $set: { subscriptionPlan: "free", subscriptionExpiresAt: null } });
  await enforceFreeLimit(userId);
}

export async function activatePremium(userId, expiresAt) {
  await db
    .users()
    .updateOne({ _id: userId }, { $set: { subscriptionPlan: "premium", subscriptionExpiresAt: expiresAt } });
}

export async function expireSubscriptionIfNeeded(user) {
  if (
    user.subscriptionPlan === "premium" &&
    user.subscriptionExpiresAt &&
    new Date(user.subscriptionExpiresAt).getTime() + GRACE_MS < Date.now()
  ) {
    await downgradeToFree(user._id);
    user.subscriptionPlan = "free";
    user.subscriptionExpiresAt = null;
  }
}

export const countActiveItems = (vendorId) =>
  db.menuItems().countDocuments({ vendorId, status: { $in: ACTIVE_ITEM_STATUSES } });