import { Router } from "express";
import { getPublicStats } from "../controllers/public.controller.js";
import { asyncHandler } from "../middleware/error.js";

const router = Router();

router.get("/stats", asyncHandler(getPublicStats));

export default router;
