import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProductCategories,
  listProducts,
  updateProduct,
} from "../controllers/product.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createProductBodySchema,
  listProductsQuerySchema,
  productIdParamsSchema,
  updateProductBodySchema,
} from "../validators/product.validator.js";

const router = Router();

router.get("/categories", asyncHandler(getProductCategories));
router.get(
  "/",
  validateRequest(listProductsQuerySchema, "query"),
  asyncHandler(listProducts),
);
router.post(
  "/",
  validateRequest(createProductBodySchema),
  asyncHandler(createProduct),
);
router.patch(
  "/:id",
  validateRequest(productIdParamsSchema, "params"),
  validateRequest(updateProductBodySchema),
  asyncHandler(updateProduct),
);
router.delete(
  "/:id",
  validateRequest(productIdParamsSchema, "params"),
  asyncHandler(deleteProduct),
);

export default router;
