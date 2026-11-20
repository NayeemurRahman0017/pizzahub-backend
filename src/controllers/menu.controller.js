import { collections as db } from "../config/db.js";
import { CATEGORIES } from "../constants.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { parsePaging, serialize, str, toObjectId } from "../utils/helpers.js";
import { publicPipeline } from "../services/menuQuery.js";

const SORTS = { priceAsc: { price: 1, _id: 1 }, priceDesc: { price: -1, _id: 1 } };
const DEFAULT_SORT = { isPremiumVendor: -1, createdAt: -1, _id: -1 };

export const listMenuItems = asyncHandler(async (req, res) => {
  const search = str(req.query.search);
  const category = str(req.query.category);
  const location = str(req.query.location);
  const sortKey = str(req.query.sort);

  if (category && !CATEGORIES.includes(category)) throw new ApiError(400, "Invalid category");
  if (sortKey && sortKey !== "featured" && !SORTS[sortKey]) {
    throw new ApiError(400, "Invalid sort. Use priceAsc or priceDesc");
  }

  const { page, limit, skip } = parsePaging(req.query, { defaultLimit: 12, maxLimit: 50 });
  const match = {};
  if (category) match.category = category;
  if (location) match.location = location;

  const [result] = await db
    .menuItems()
    .aggregate([
      ...publicPipeline(match, search),
      {
        $facet: {
          items: [{ $sort: SORTS[sortKey] ?? DEFAULT_SORT }, { $skip: skip }, { $limit: limit }],
          total: [{ $count: "count" }],
        },
      },
    ])
    .toArray();

  const total = result.total[0]?.count ?? 0;
  res.json({
    items: serialize(result.items),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const featuredItems = asyncHandler(async (_req, res) => {
  const items = await db
    .menuItems()
    .aggregate([...publicPipeline(), { $sort: DEFAULT_SORT }, { $limit: 6 }])
    .toArray();
  res.json({ items: serialize(items) });
});

export const getMenuItem = asyncHandler(async (req, res) => {
  const _id = toObjectId(req.params.id, "menu item id");
  const [item] = await db.menuItems().aggregate(publicPipeline({ _id })).toArray();
  if (!item) throw new ApiError(404, "Menu item not found");
  res.json({ item: serialize(item) });
});