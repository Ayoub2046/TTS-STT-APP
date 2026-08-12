import { Router } from "express";
import { getPendingQueue, submitReview, getReviewHistory } from "../controllers/review.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody, validateParams } from "../middleware/validation.js";
import { reviewCreateSchema } from "../validators/review.schema.js";
import { idParamSchema } from "../validators/translation.schema.js";
import { asyncHandler } from "../middleware/error.js";

const router = Router();

router.use(requireAuth, requireRole("reviewer", "admin"));

router.get("/pending", asyncHandler(getPendingQueue));
router.get("/:id/history", validateParams(idParamSchema), asyncHandler(getReviewHistory));
router.post("/:id", validateParams(idParamSchema), validateBody(reviewCreateSchema), asyncHandler(submitReview));

export default router;