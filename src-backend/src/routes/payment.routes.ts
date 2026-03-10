import { Router } from "express";
import {
  createPayment,
  deletePayment,
  listPayments,
} from "../controllers/payment.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createPaymentBodySchema,
  listPaymentsQuerySchema,
  paymentIdParamsSchema,
} from "../validators/payment.validator.js";

const router = Router();

router.get(
  "/",
  validateRequest(listPaymentsQuerySchema, "query"),
  asyncHandler(listPayments),
);
router.post(
  "/",
  validateRequest(createPaymentBodySchema),
  asyncHandler(createPayment),
);
router.delete(
  "/:id",
  validateRequest(paymentIdParamsSchema, "params"),
  asyncHandler(deletePayment),
);

export default router;
