import { z } from "zod";
import { CATEGORIES } from "../constants.js";

const imgbbUrl = z
  .string()
  .url()
  .refine((u) => {
    try {
      const url = new URL(u);
      return url.protocol === "https:" && (url.hostname === "ibb.co" || url.hostname.endsWith(".ibb.co"));
    } catch {
      return false;
    }
  }, "Images must be uploaded to ImgBB");

export const menuItemSchema = z.object({
  itemName: z.string().trim().min(2).max(100),
  category: z.enum(CATEGORIES),
  description: z.string().trim().min(10).max(1000),
  price: z.coerce.number().positive().max(100000),
  location: z.string().trim().min(2).max(100),
  images: z.array(imgbbUrl).min(1, "An item image is required").max(5),
});

export const availabilitySchema = z.object({ available: z.boolean() });

export const orderSchema = z.object({
  itemId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid item id"),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  deliveryAddress: z.string().trim().min(5).max(300),
  message: z.string().trim().max(500).optional().default(""),
});

export const vendorOrderStatusSchema = z.object({ status: z.enum(["accepted", "rejected"]) });

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  image: z.union([z.string().url(), z.literal("")]).optional(),
  businessName: z.string().trim().min(2).max(100).optional(),
  location: z.union([z.string().trim().min(2).max(100), z.literal("")]).optional(),
});

export const blockSchema = z.object({ isBlocked: z.boolean() });

export const adminItemStatusSchema = z.object({
  status: z.enum(["approved", "rejected", "inactive"]),
});