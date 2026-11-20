import { Router } from "express";
import { featuredItems, getMenuItem, listMenuItems } from "../controllers/menu.controller.js";
import { listCategories } from "../controllers/category.controller.js";
import { verifyJWT } from "../middleware/auth.js";

const router = Router();
router.get("/", listMenuItems);
router.get("/featured", featuredItems);
router.get("/categories", listCategories);
router.get("/:id", verifyJWT, getMenuItem);

export default router;