import { Router } from "express";
import { register, login, logout, me } from "../controllers/auth.controller.js";
import { validateBody } from "../middleware/validation.js";
import { registerSchema, loginSchema } from "../validators/auth.schema.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";

const router = Router();

router.post("/register", validateBody(registerSchema), asyncHandler(register));
router.post("/login", validateBody(loginSchema), asyncHandler(login));
router.post("/logout", requireAuth, asyncHandler(logout));
router.get("/me", requireAuth, asyncHandler(me));

export default router;