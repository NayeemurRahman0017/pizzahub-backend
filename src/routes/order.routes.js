import { Router } from "express";
import { verifyJWT, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { orderSchema } from "../validators/index.js";
import * as c from "../controllers/order.controller.js";

const router = Router();
router.use(verifyJWT);

router.post("/", requireRole("customer", "vendor"), validate(orderSchema), c.createOrder);
router.get("/my", requireRole("customer", "vendor"), c.myOrders);
router.get("/overview", requireRole("customer", "vendor"), c.myOverview);
router.get("/:id", requireRole("customer", "vendor"), c.getOrder);
router.patch("/:id/cancel", requireRole("customer", "vendor"), c.cancelOrder);

export default router;