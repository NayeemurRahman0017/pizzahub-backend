import { collections as db } from "../config/db.js";
import { ACTIVE_ORDER_STATUSES } from "../constants.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sameId, serialize, toObjectId } from "../utils/helpers.js";
import { publicPipeline } from "../services/menuQuery.js";
import { orderDetailStages } from "../services/orderQuery.js";

// POST /api/orders  (customer or vendor; admins are blocked at the route)
export const createOrder = asyncHandler(async (req, res) => {
  const { itemId: rawItemId, deliveryDate, deliveryAddress, message } = req.body;
  const itemId = toObjectId(rawItemId, "item id");

  // only approved & active items from non-blocked vendors can be ordered
  const [item] = await db.menuItems().aggregate(publicPipeline({ _id: itemId })).toArray();
  if (!item) throw new ApiError(404, "Menu item not found or not available for ordering");
  if (sameId(item.vendorId, req.user._id)) throw new ApiError(403, "You cannot order your own item");

  const date = new Date(`${deliveryDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== deliveryDate) {
    throw new ApiError(400, "Invalid delivery date");
  }
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (date < today) throw new ApiError(400, "Delivery date cannot be in the past");

  const duplicate = await db
    .orders()
    .findOne({ customerId: req.user._id, itemId, deliveryDate: date, status: { $in: ACTIVE_ORDER_STATUSES } });
  if (duplicate) throw new ApiError(409, "You already have an active order for this item on that date");

  const doc = {
    itemId,
    vendorId: item.vendorId, // detected automatically from the item
    customerId: req.user._id, // detected automatically from the token
    deliveryDate: date,
    deliveryAddress,
    message,
    status: "pending",
    createdAt: new Date(),
  };
  const { insertedId } = await db.orders().insertOne(doc);
  res.status(201).json({ message: "Order placed successfully", order: serialize({ ...doc, _id: insertedId }) });
});

// GET /api/orders/my
export const myOrders = asyncHandler(async (req, res) => {
  const orders = await db
    .orders()
    .aggregate([{ $match: { customerId: req.user._id } }, { $sort: { createdAt: -1 } }, ...orderDetailStages()])
    .toArray();
  res.json({ orders: serialize(orders) });
});

// GET /api/orders/overview
export const myOverview = asyncHandler(async (req, res) => {
  const rows = await db
    .orders()
    .aggregate([{ $match: { customerId: req.user._id } }, { $group: { _id: "$status", count: { $sum: 1 } } }])
    .toArray();
  const counts = Object.fromEntries(rows.map((r) => [r._id, r.count]));
  res.json({
    total: rows.reduce((sum, r) => sum + r.count, 0),
    pending: counts.pending ?? 0,
    accepted: counts.accepted ?? 0,
    rejected: counts.rejected ?? 0,
    cancelled: counts.cancelled ?? 0,
  });
});

// GET /api/orders/:id  (the customer who placed it, or the vendor it belongs to)
export const getOrder = asyncHandler(async (req, res) => {
  const _id = toObjectId(req.params.id, "order id");
  const [order] = await db
    .orders()
    .aggregate([{ $match: { _id } }, ...orderDetailStages({ withCustomer: true })])
    .toArray();
  if (!order) throw new ApiError(404, "Order not found");
  if (!sameId(order.customerId, req.user._id) && !sameId(order.vendorId, req.user._id)) {
    throw new ApiError(403, "You cannot view this order");
  }
  res.json({ order: serialize(order) });
});

// PATCH /api/orders/:id/cancel  (own order, pending only)
export const cancelOrder = asyncHandler(async (req, res) => {
  const _id = toObjectId(req.params.id, "order id");
  const updated = await db
    .orders()
    .findOneAndUpdate({ _id, customerId: req.user._id, status: "pending" }, { $set: { status: "cancelled" } }, { returnDocument: "after" });

  if (!updated) {
    const order = await db.orders().findOne({ _id }, { projection: { customerId: 1 } });
    if (!order) throw new ApiError(404, "Order not found");
    if (!sameId(order.customerId, req.user._id)) throw new ApiError(403, "You cannot cancel another customer's order");
    throw new ApiError(409, "Only pending orders can be cancelled");
  }
  res.json({ message: "Order cancelled", order: serialize(updated) });
});