import { ObjectId } from "mongodb";
import { ApiError } from "./ApiError.js";

const HEX24 = /^[a-f\d]{24}$/i;

export function toObjectId(id, label = "id") {
  if (typeof id !== "string" || !HEX24.test(id)) throw new ApiError(400, `Invalid ${label}`);
  return new ObjectId(id);
}

export function userIdFilter(id) {
  const s = String(id);
  return HEX24.test(s) ? { $or: [{ _id: new ObjectId(s) }, { _id: s }] } : { _id: s };
}

export const sameId = (a, b) => String(a) === String(b);

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const str = (v) => (typeof v === "string" ? v.trim() : "");

export function parsePaging(query, { defaultLimit = 10, maxLimit = 50 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export function serialize(value) {
  if (value instanceof ObjectId) return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k === "_id" ? "id" : k] = serialize(v);
    return out;
  }
  return value;
}

export const publicUser = (u) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  image: u.image ?? null,
  role: u.role,
  isBlocked: !!u.isBlocked,
  businessName: u.businessName ?? null,
  location: u.location ?? null,
  subscriptionPlan: u.subscriptionPlan ?? "free",
  subscriptionExpiresAt: u.subscriptionExpiresAt ?? null,
  createdAt: u.createdAt,
});