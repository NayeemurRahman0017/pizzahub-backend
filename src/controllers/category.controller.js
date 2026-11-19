import { CATEGORIES } from "../constants.js";

// GET /api/menu/categories
// Lets the client render category filters from one source of truth.
export const listCategories = (_req, res) => {
  res.json({ categories: CATEGORIES });
};