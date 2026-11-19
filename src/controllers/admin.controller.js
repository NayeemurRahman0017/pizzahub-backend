import { collections as db } from "../config/db.js";
import { ACTIVE_ITEM_STATUSES, FREE_PLAN_LIMIT, MENU_STATUSES } from "../constants.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { escapeRegex, parsePaging, publicUser, sameId, serialize, str, toObjectId, userIdFilter } from "../utils/helpers.js";
import { vendorLookup } from "../services/menuQuery.js";

const ROLES = ["admin", "vendor", "customer"];

const paged = (stages, skip, limit, sort) => [
  ...stages,
  { $facet: { items: [{ $sort: sort }, { $skip: skip }, { $limit: limit }], total: [{ $count: "count" }] } },
];
const pagination = (result, page, limit) => {
  const total = result.total[0]?.count ?? 0;
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
};

// GET /api/admin/overview
export const overview = asyncHandler(async (_req, res) => {
  const [totalUsers, totalVendors, totalCustomers, totalMenuItems, pendingMenuItems, totalTransactions] = await Promise.all([
    db.users().countDocuments({}),
    db.users().countDocuments({ role: "vendor" }),
    db.users().countDocuments({ role: "customer" }),
    db.menuItems().countDocuments({}),
    db.menuItems().countDocuments({ status: "pending" }),
    db.transactions().countDocuments({}),
  ]);
  res.json({ totalUsers, totalVendors, totalCustomers, totalMenuItems, pendingMenuItems, totalTransactions });
});

// GET /api/admin/users?search=&role=&page=&limit=
export const listUsers = asyncHandler(async (req, res) => {
  const search = str(req.query.search);
  const role = str(req.query.role);
  if (role && !ROLES.includes(role)) throw new ApiError(400, "Invalid role");
  const { page, limit, skip } = parsePaging(req.query, { defaultLimit: 10, maxLimit: 100 });

  const filter = {};
  if (role) filter.role = role;
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const [items, total] = await Promise.all([
    db.users().find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    db.users().countDocuments(filter),
  ]);
  res.json({ users: items.map(publicUser), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

// GET /api/admin/users/:id
export const getUser = asyncHandler(async (req, res) => {
  const user = await db.users().findOne(userIdFilter(req.params.id));
  if (!user) throw new ApiError(404, "User not found");
  const [menuItems, orders] = await Promise.all([
    db.menuItems().countDocuments({ vendorId: user._id }),
    db.orders().countDocuments({ $or: [{ customerId: user._id }, { vendorId: user._id }] }),
  ]);
  res.json({ user: publicUser(user), stats: { menuItems, orders } });
});

// PATCH /api/admin/users/:id/block  { isBlocked: boolean }
export const setBlocked = asyncHandler(async (req, res) => {
  const user = await db.users().findOne(userIdFilter(req.params.id));
  if (!user) throw new ApiError(404, "User not found");
  if (sameId(user._id, req.user._id)) throw new ApiError(400, "You cannot block yourself");
  if (user.role === "admin") throw new ApiError(403, "Admin accounts cannot be blocked");

  await db.users().updateOne({ _id: user._id }, { $set: { isBlocked: req.body.isBlocked } });
  res.json({ message: req.body.isBlocked ? "User blocked" : "User unblocked", user: publicUser({ ...user, isBlocked: req.body.isBlocked }) });
});

// GET /api/admin/menu-items?search=&status=&page=&limit=
export const listMenuItems = asyncHandler(async (req, res) => {
  const search = str(req.query.search);
  const status = str(req.query.status);
  if (status && !MENU_STATUSES.includes(status)) throw new ApiError(400, "Invalid status");
  const { page, limit, skip } = parsePaging(req.query, { defaultLimit: 10, maxLimit: 100 });

  const stages = [];
  if (status) stages.push({ $match: { status } });
  stages.push(...vendorLookup);
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    stages.push({ $match: { $or: [{ itemName: rx }, { "vendor.businessName": rx }, { "vendor.name": rx }] } });
  }
  const [result] = await db.menuItems().aggregate(paged(stages, skip, limit, { createdAt: -1 })).toArray();
  res.json({ items: serialize(result.items), pagination: pagination(result, page, limit) });
});

// Allowed status transitions
const TRANSITIONS = {
  pending: ["approved", "rejected"],
  approved: ["inactive", "rejected"],
  inactive: ["approved"],
  rejected: ["approved"],
};

// PATCH /api/admin/menu-items/:id/status  { status: approved | rejected | inactive }
export const setItemStatus = asyncHandler(async (req, res) => {
  const _id = toObjectId(req.params.id, "menu item id");
  const item = await db.menuItems().findOne({ _id });
  if (!item) throw new ApiError(404, "Menu item not found");

  const next = req.body.status;
  if (!TRANSITIONS[item.status]?.includes(next)) {
    throw new ApiError(409, `Cannot change status from ${item.status} to ${next}`);
  }

  // Reviving a rejected/inactive item makes it "active" again: respect the vendor's Free plan limit.
  if (!ACTIVE_ITEM_STATUSES.includes(item.status) && next === "approved") {
    const vendor = await db.users().findOne({ _id: item.vendorId });
    if (vendor?.subscriptionPlan !== "premium") {
      const active = await db.menuItems().countDocuments({ vendorId: item.vendorId, status: { $in: ACTIVE_ITEM_STATUSES } });
      if (active >= FREE_PLAN_LIMIT) throw new ApiError(409, "Vendor has reached the Free plan limit of active items");
    }
  }
  await db.menuItems().updateOne({ _id }, { $set: { status: next } });
  res.json({ message: `Item ${next}`, status: next });
});

// DELETE /api/admin/menu-items/:id
export const deleteItem = asyncHandler(async (req, res) => {
  const _id = toObjectId(req.params.id, "menu item id");
  const { deletedCount } = await db.menuItems().deleteOne({ _id });
  if (!deletedCount) throw new ApiError(404, "Menu item not found");
  res.json({ message: "Menu item deleted" });
});

// GET /api/admin/transactions?status=&page=&limit=   (READ-ONLY: no write endpoints exist)
export const listTransactions = asyncHandler(async (req, res) => {
  const status = str(req.query.status);
  const { page, limit, skip } = parsePaging(req.query, { defaultLimit: 10, maxLimit: 100 });
  const stages = [];
  if (status) stages.push({ $match: { status } });
  stages.push(
    { $lookup: { from: "users", localField: "vendorId", foreignField: "_id", as: "vendor", pipeline: [{ $project: { name: 1, email: 1, businessName: 1 } }] } },
    { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } }
  );
  const [result] = await db.transactions().aggregate(paged(stages, skip, limit, { createdAt: -1 })).toArray();
  res.json({ transactions: serialize(result.items), pagination: pagination(result, page, limit) });
});