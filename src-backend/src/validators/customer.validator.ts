import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid ObjectId");

export const customerIdParamsSchema = z.object({
  id: objectIdSchema,
});

export const createCustomerBodySchema = z.object({
  name: z.string().trim().min(2),
  shop_name: z.string().trim().optional(),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  is_active: z.boolean().optional(),
});

export const updateCustomerBodySchema = z
  .object({
    name: z.string().trim().min(2).optional(),
    shop_name: z.string().trim().optional(),
    address: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    notes: z.string().trim().optional(),
    is_active: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const listCustomersQuerySchema = z.object({
  q: z.string().trim().optional(),
  isActive: z.enum(["true", "false"]).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});
