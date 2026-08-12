import { Router } from "express";
import {
  createTranslation,
  listTranslations,
  getTranslation,
  updateTranslation,
  deleteTranslation,
  getMyStats,
} from "../controllers/translation.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, validateParams } from "../middleware/validation.js";
import { translationSchema, translationUpdateSchema, idParamSchema } from "../validators/translation.schema.js";
import { asyncHandler } from "../middleware/error.js";

const router = Router();

router.use(requireAuth);

router.get("/stats/mine", asyncHandler(getMyStats));
router.post("/", validateBody(translationSchema), asyncHandler(createTranslation));
router.get("/", asyncHandler(listTranslations));
router.get("/:id", validateParams(idParamSchema), asyncHandler(getTranslation));
router.patch("/:id", validateParams(idParamSchema), validateBody(translationUpdateSchema), asyncHandler(updateTranslation));
router.delete("/:id", validateParams(idParamSchema), asyncHandler(deleteTranslation));

export default router;