import { Router } from "express";
import {
  deleteLedgerPayment,
  listLedgerPayments,
} from "../controllers/ledgerPayment.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  ledgerPaymentIdParamsSchema,
  listLedgerPaymentsQuerySchema,
} from "../validators/ledgerPayment.validator.js";

const router = Router();

router.get(
  "/",
  validateRequest(listLedgerPaymentsQuerySchema, "query"),
  asyncHandler(listLedgerPayments),
);
router.delete(
  "/:id",
  validateRequest(ledgerPaymentIdParamsSchema, "params"),
  asyncHandler(deleteLedgerPayment),
);

export default router;
