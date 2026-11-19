import { Router } from "express";
import { verifyJWT, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { availabilitySchema, menuItemSchema, vendorOrderStatusSchema } from "../validators/index.js";
import * as c from "../controllers/vendor.controller.js";

const router = Router();
router.use(verifyJWT, requireRole("vendor"));

router.get("/overview", c.overview);

router.route("/menu-items").get(c.listMyItems).post(validate(menuItemSchema), c.createItem);
router.route("/menu-items/:id").get(c.getMyItem).put(validate(menuItemSchema), c.updateItem).delete(c.deleteItem);
router.patch("/menu-items/:id/availability", validate(availabilitySchema), c.setAvailability);

router.get("/orders", c.listOrders);
router.patch("/orders/:id/status", validate(vendorOrderStatusSchema), c.updateOrderStatus);

export default router;