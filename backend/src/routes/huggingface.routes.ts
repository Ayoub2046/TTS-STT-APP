import { Router } from "express";
import { getStatus, getPreview, pushDataset, getHistory, deleteDataset } from "../controllers/huggingface.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validation.js";
import { pushSchema } from "../validators/dataset.schema.js";
import { asyncHandler } from "../middleware/error.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/status", asyncHandler(getStatus));
router.get("/preview", asyncHandler(getPreview));
router.post("/preview", asyncHandler(getPreview));
router.post("/push", validateBody(pushSchema), asyncHandler(pushDataset));
router.delete("/delete", asyncHandler(deleteDataset));
router.post("/delete", asyncHandler(deleteDataset));
router.get("/history", asyncHandler(getHistory));

export default router;