import { CATEGORIES } from "../constants.js";

export const listCategories = (_req, res) => {
  res.json({ categories: CATEGORIES });
};