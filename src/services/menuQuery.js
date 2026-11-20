import { escapeRegex } from "../utils/helpers.js";

export const vendorLookup = [
  {
    $lookup: {
      from: "users",
      localField: "vendorId",
      foreignField: "_id",
      as: "vendor",
      pipeline: [
        { $project: { name: 1, email: 1, businessName: 1, image: 1, subscriptionPlan: 1, subscriptionExpiresAt: 1, isBlocked: 1 } },
      ],
    },
  },
  { $unwind: "$vendor" },
];

export function publicPipeline(match = {}, search = "") {
  const stages = [
    { $match: { ...match, status: "approved" } },
    ...vendorLookup,
    { $match: { "vendor.isBlocked": { $ne: true } } },
  ];
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    stages.push({ $match: { $or: [{ itemName: rx }, { "vendor.businessName": rx }, { "vendor.name": rx }] } });
  }
  stages.push(
    {
      $addFields: {
        isPremiumVendor: {
          $and: [
            { $eq: ["$vendor.subscriptionPlan", "premium"] },
            { $gt: [{ $ifNull: ["$vendor.subscriptionExpiresAt", new Date("9999-12-31")] }, "$$NOW"] },
          ],
        },
      },
    },
    { $project: { "vendor.email": 0, "vendor.isBlocked": 0, "vendor.subscriptionExpiresAt": 0 } }
  );
  return stages;
}