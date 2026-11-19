import { Router } from "express";
import { verifyJWT, requireRole } from "../middleware/auth.js";
import { createCheckoutSession, mySubscription } from "../controllers/subscription.controller.js";

const router = Router();
router.use(verifyJWT, requireRole("vendor"));

router.post("/checkout", createCheckoutSession);
router.get("/me", mySubscription);

export default router;