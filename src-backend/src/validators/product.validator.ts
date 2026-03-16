import { z } from "zod";
import { PRODUCT_CATEGORIES } from "../constants/productCategories.js";

const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid ObjectId");

export const productIdParamsSchema = z.object({
  id: objectIdSchema,
});

export const createProductBodySchema = z
  .object({
    sku: z.string().trim().min(1).optional(),
    name: z.string().trim().min(2),
    category: z.enum(PRODUCT_CATEGORIES).optional(),
    type: z.enum(["direct", "model"]).optional(),
    model: z.string().trim().min(1).optional(),
    price: z.number().int().nonnegative(),
    is_active: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.category && !value.type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either category or type is required",
        path: ["category"],
      });
    }

    if (value.type === "model" && !value.model) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "model is required when type is model",
        path: ["model"],
      });
    }
  });

export const updateProductBodySchema = z
  .object({
    name: z.string().trim().min(2).optional(),
    category: z.enum(PRODUCT_CATEGORIES).optional(),
    type: z.enum(["direct", "model"]).optional(),
    model: z.string().trim().min(1).optional(),
    price: z.number().int().nonnegative().optional(),
    is_active: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const listProductsQuerySchema = z.object({
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  q: z.string().trim().optional(),
  isActive: z.enum(["true", "false"]).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});
