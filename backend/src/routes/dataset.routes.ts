import { Router } from "express";
import {
  listDatasets,
  createDataset,
  getDataset,
  getDatasetStats,
  validateDataset,
  exportDataset,
} from "../controllers/dataset.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody, validateParams } from "../middleware/validation.js";
import { datasetCreateSchema } from "../validators/dataset.schema.js";
import { idParamSchema } from "../validators/translation.schema.js";
import { asyncHandler } from "../middleware/error.js";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(listDatasets));
router.get("/stats", asyncHandler(getDatasetStats));
router.post("/", requireRole("admin"), validateBody(datasetCreateSchema), asyncHandler(createDataset));
router.post("/validate", requireRole("admin"), asyncHandler(validateDataset));
router.get("/:id", validateParams(idParamSchema), asyncHandler(getDataset));
router.post("/:id/export", requireRole("admin"), validateParams(idParamSchema), asyncHandler(exportDataset));

export default router;