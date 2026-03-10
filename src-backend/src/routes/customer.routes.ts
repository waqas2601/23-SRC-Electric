import { Router } from "express";
import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
} from "../controllers/customer.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createCustomerBodySchema,
  customerIdParamsSchema,
  listCustomersQuerySchema,
  updateCustomerBodySchema,
} from "../validators/customer.validator.js";

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
router.patch(
  "/:id",
  validateRequest(customerIdParamsSchema, "params"),
  validateRequest(updateCustomerBodySchema),
  asyncHandler(updateCustomer),
);
router.delete(
  "/:id",
  validateRequest(customerIdParamsSchema, "params"),
  asyncHandler(deleteCustomer),
);

export default router;
