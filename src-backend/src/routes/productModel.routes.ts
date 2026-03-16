import { Router } from "express";
import { getProductModels } from "../controllers/product.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(getProductModels));

export default router;
