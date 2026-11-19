import { Router } from "express";
import { featuredItems, getMenuItem, listMenuItems } from "../controllers/menu.controller.js";
import { verifyJWT } from "../middleware/auth.js";

const router = Router();
router.get("/", listMenuItems); // public
router.get("/featured", featuredItems); // public (before "/:id")
router.get("/:id", verifyJWT, getMenuItem); // login required

export default router;