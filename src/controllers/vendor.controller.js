import { collections as db } from "../config/db.js";
import { FREE_PLAN_LIMIT } from "../constants.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sameId, serialize, str, toObjectId } from "../utils/helpers.js";
import { countActiveItems } from "../services/subscription.js";
import { orderDetailStages } from "../services/orderQuery.js";

async function assertCanActivateMore(user) {
  if (user.subscriptionPlan === "premium") return;
  if ((await countActiveItems(user._id)) >= FREE_PLAN_LIMIT) {
    throw new ApiError(403, `Free plan allows a maximum of ${FREE_PLAN_LIMIT} active items. Upgrade to Premium.`);
  }
}

async function getOwnedItem(req) {
  const _id = toObjectId(req.params.id, "menu item id");
  const item = await db.menuItems().findOne({ _id });
  if (!item) throw new ApiError(404, "Menu item not found");
  if (!sameId(item.vendorId, req.user._id)) throw new ApiError(403, "You do not own this menu item");
  return item;
}

export const overview = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 6);
  since.setUTCHours(0, 0, 0, 0);

  const [totalItems, activeItems, pendingOrders, acceptedOrders, weekly] = await Promise.all([
    db.menuItems().countDocuments({ vendorId }),
    db.menuItems().countDocuments({ vendorId, status: "approved" }),
    db.orders().countDocuments({ vendorId, status: "pending" }),
    db.orders().countDocuments({ vendorId, status: "accepted" }),
    db
      .orders()
      .aggregate([
        { $match: { vendorId, createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      ])
      .toArray(),
  ]);

  const byDay = Object.fromEntries(weekly.map((w) => [w._id, w.count]));
  const weeklyOrders = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    return { date: key, count: byDay[key] ?? 0 };
  });

  res.json({
    totalMenuItems: totalItems,
    activeMenuItems: activeItems,
    pendingOrders,
    acceptedOrders,
    subscriptionPlan: req.user.subscriptionPlan ?? "free",
    subscriptionExpiresAt: req.user.subscriptionExpiresAt ?? null,
    weeklyOrders,
  });
});

export const listMyItems = asyncHandler(async (req, res) => {
  const items = await db.menuItems().find({ vendorId: req.user._id }).sort({ createdAt: -1 }).toArray();
  res.json({ items: serialize(items) });
});

export const createItem = asyncHandler(async (req, res) => {
  await assertCanActivateMore(req.user);
  const doc = { ...req.body, vendorId: req.user._id, status: "pending", createdAt: new Date() };
  const { insertedId } = await db.menuItems().insertOne(doc);
  res.status(201).json({ message: "Menu item submitted. It will appear after admin approval.", item: serialize({ ...doc, _id: insertedId }) });
});

export const getMyItem = asyncHandler(async (req, res) => {
  res.json({ item: serialize(await getOwnedItem(req)) });
});

export const updateItem = asyncHandler(async (req, res) => {
  const item = await getOwnedItem(req);
  const changes = { ...req.body };

  if (item.status === "approved" || item.status === "rejected") {
    if (item.status === "rejected") await assertCanActivateMore(req.user);
    changes.status = "pending";
  }
  await db.menuItems().updateOne({ _id: item._id }, { $set: changes });
  res.json({ message: "Menu item updated", item: serialize({ ...item, ...changes }) });
});

export const deleteItem = asyncHandler(async (req, res) => {
  const item = await getOwnedItem(req);
  const activeOrders = await db.orders().countDocuments({ itemId: item._id, status: { $in: ACTIVE_ORDER_STATUSES } });
  if (activeOrders > 0) throw new ApiError(409, "This item has pending or accepted orders and cannot be deleted");
  await db.menuItems().deleteOne({ _id: item._id });
  res.json({ message: "Menu item deleted" });
});

export const setAvailability = asyncHandler(async (req, res) => {
  const item = await getOwnedItem(req);
  if (req.body.available) {
    if (item.status !== "inactive") throw new ApiError(409, "Only inactive items can be made available");
    await assertCanActivateMore(req.user);
    await db.menuItems().updateOne({ _id: item._id }, { $set: { status: "pending" } }); // re-approval required
    return res.json({ message: "Item submitted again for approval", status: "pending" });
  }
  if (item.status !== "approved") throw new ApiError(409, "Only approved items can be made unavailable");
  await db.menuItems().updateOne({ _id: item._id }, { $set: { status: "inactive" } });
  res.json({ message: "Item is now unavailable", status: "inactive" });
});

export const listOrders = asyncHandler(async (req, res) => {
  const status = str(req.query.status);
  const match = { vendorId: req.user._id };
  if (status) match.status = status;
  const orders = await db
    .orders()
    .aggregate([{ $match: match }, { $sort: { createdAt: -1 } }, ...orderDetailStages({ withCustomer: true })])
    .toArray();
  res.json({ orders: serialize(orders) });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const _id = toObjectId(req.params.id, "order id");
  const updated = await db
    .orders()
    .findOneAndUpdate({ _id, vendorId: req.user._id, status: "pending" }, { $set: { status: req.body.status } }, { returnDocument: "after" });

  if (!updated) {
    const order = await db.orders().findOne({ _id }, { projection: { vendorId: 1 } });
    if (!order) throw new ApiError(404, "Order not found");
    if (!sameId(order.vendorId, req.user._id)) throw new ApiError(403, "This order belongs to another vendor");
    throw new ApiError(409, "Only pending orders can be accepted or rejected, and only once");
  }
  res.json({ message: `Order ${req.body.status}`, order: serialize(updated) });
});