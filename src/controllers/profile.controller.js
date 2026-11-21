import { collections as db } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { publicUser } from "../utils/helpers.js";

export const getProfile = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const changes = {};
  if (req.body.name !== undefined) changes.name = req.body.name;
  if (req.body.image !== undefined) changes.image = req.body.image || null;
  if (req.body.businessName !== undefined && req.user.role === "vendor") changes.businessName = req.body.businessName;
  if (req.body.location !== undefined && req.user.role === "vendor") changes.location = req.body.location || null;

  if (Object.keys(changes).length) await db.users().updateOne({ _id: req.user._id }, { $set: changes });
  res.json({ message: "Profile updated successfully", user: publicUser({ ...req.user, ...changes }) });
});