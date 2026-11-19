import { Router } from "express";
import { verifyJWT, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { profileSchema } from "../validators/index.js";
import { getProfile, updateProfile } from "../controllers/profile.controller.js";

const router = Router();
router.use(verifyJWT, requireRole("vendor", "customer"));

router.get("/me", getProfile);
router.patch("/me", validate(profileSchema), updateProfile);

export default router;