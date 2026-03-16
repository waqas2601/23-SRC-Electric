import { Router } from "express";
import { getMe, login } from "../controllers/auth.controller.js";
import { requireAdmin } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { loginBodySchema } from "../validators/auth.validator.js";

const router = Router();

router.post("/login", validateRequest(loginBodySchema), asyncHandler(login));
router.get("/me", requireAdmin, asyncHandler(getMe));

export default router;
