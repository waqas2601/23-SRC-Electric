import { Router } from "express";
import {
  addInvoicePayment,
  createInvoice,
  deleteInvoice,
  getInvoiceById,
  listInvoices,
  listInvoicePayments,
} from "../controllers/invoice.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  addInvoicePaymentBodySchema,
  createInvoiceBodySchema,
  invoiceIdParamsSchema,
  listInvoicesQuerySchema,
} from "../validators/invoice.validator.js";

const router = Router();

router.get(
  "/",
  validateRequest(listInvoicesQuerySchema, "query"),
  asyncHandler(listInvoices),
);
router.post(
  "/",
  validateRequest(createInvoiceBodySchema),
  asyncHandler(createInvoice),
);
router.get(
  "/:id",
  validateRequest(invoiceIdParamsSchema, "params"),
  asyncHandler(getInvoiceById),
);
router.delete(
  "/:id",
  validateRequest(invoiceIdParamsSchema, "params"),
  asyncHandler(deleteInvoice),
);
router.post(
  "/:id/payments",
  validateRequest(invoiceIdParamsSchema, "params"),
  validateRequest(addInvoicePaymentBodySchema),
  asyncHandler(addInvoicePayment),
);
router.get(
  "/:id/payments",
  validateRequest(invoiceIdParamsSchema, "params"),
  asyncHandler(listInvoicePayments),
);

export default router;
