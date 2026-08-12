import { Router } from "express";
import { listUsers, updateUser, getAuditLogs, getAdminStats } from "../controllers/admin.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateParams } from "../middleware/validation.js";
import { idParamSchema } from "../validators/translation.schema.js";
import { asyncHandler } from "../middleware/error.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/stats", asyncHandler(getAdminStats));
router.get("/users", asyncHandler(listUsers));
router.get("/audit-logs", asyncHandler(getAuditLogs));
router.patch("/users/:id", validateParams(idParamSchema), asyncHandler(updateUser));

export default router;