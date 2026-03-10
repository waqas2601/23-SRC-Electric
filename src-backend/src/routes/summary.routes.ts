import { Router } from "express";
import { getDashboardSummary } from "../controllers/summary.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/dashboard", asyncHandler(getDashboardSummary));

export default router;
