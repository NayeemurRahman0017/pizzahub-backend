import { Router } from "express";
import { verifyJWT, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { adminItemStatusSchema, blockSchema } from "../validators/index.js";
import * as c from "../controllers/admin.controller.js";

const router = Router();
router.use(verifyJWT, requireRole("admin"));

router.get("/overview", c.overview);
router.get("/users", c.listUsers);
router.get("/users/:id", c.getUser);
router.patch("/users/:id/block", validate(blockSchema), c.setBlocked);

router.get("/menu-items", c.listMenuItems);
router.patch("/menu-items/:id/status", validate(adminItemStatusSchema), c.setItemStatus);
router.delete("/menu-items/:id", c.deleteItem);

router.get("/transactions", c.listTransactions); // read-only on purpose

export default router;