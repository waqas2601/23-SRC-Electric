import { Router } from "express";
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  listCustomers,
  setCustomerOpeningBalance,
  updateCustomer,
} from "../controllers/customer.controller.js";
import {
  createCustomerLedgerPayment,
  listCustomerLedgerPayments,
} from "../controllers/ledgerPayment.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createCustomerBodySchema,
  customerIdParamsSchema,
  listCustomersQuerySchema,
  updateCustomerBodySchema,
} from "../validators/customer.validator.js";
import {
  createLedgerPaymentBodySchema,
  customerLedgerPaymentParamsSchema,
  setOpeningBalanceBodySchema,
} from "../validators/ledgerPayment.validator.js";

const router = Router();

router.get(
  "/",
  validateRequest(listCustomersQuerySchema, "query"),
  asyncHandler(listCustomers),
);
router.post(
  "/",
  validateRequest(createCustomerBodySchema),
  asyncHandler(createCustomer),
);
router.get(
  "/:id",
  validateRequest(customerIdParamsSchema, "params"),
  asyncHandler(getCustomerById),
);
router.patch(
  "/:id",
  validateRequest(customerIdParamsSchema, "params"),
  validateRequest(updateCustomerBodySchema),
  asyncHandler(updateCustomer),
);
router.patch(
  "/:id/opening-balance",
  validateRequest(customerIdParamsSchema, "params"),
  validateRequest(setOpeningBalanceBodySchema),
  asyncHandler(setCustomerOpeningBalance),
);
router.get(
  "/:id/ledger-payments",
  validateRequest(customerLedgerPaymentParamsSchema, "params"),
  asyncHandler(listCustomerLedgerPayments),
);
router.post(
  "/:id/ledger-payments",
  validateRequest(customerLedgerPaymentParamsSchema, "params"),
  validateRequest(createLedgerPaymentBodySchema),
  asyncHandler(createCustomerLedgerPayment),
);
router.delete(
  "/:id",
  validateRequest(customerIdParamsSchema, "params"),
  asyncHandler(deleteCustomer),
);

export default router;
