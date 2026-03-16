import { z } from "zod";
import { INVOICE_STATUS } from "../constants/invoiceStatus.js";

const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid ObjectId");

const dateStringSchema = z
  .string()
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Invalid date");

const invoiceItemSchema = z.object({
  productId: objectIdSchema,
  quantity: z.number().int().positive(),
  unitPriceSnapshot: z.number().int().nonnegative().optional(),
});

export const invoiceIdParamsSchema = z.object({
  id: objectIdSchema,
});

export const paymentIdParamsSchema = z.object({
  paymentId: objectIdSchema,
});

export const createInvoiceBodySchema = z.object({
  customerId: objectIdSchema,
  invoiceDate: dateStringSchema,
  discount: z.number().int().nonnegative().optional(),
  notes: z.string().trim().optional(),
  items: z.array(invoiceItemSchema).min(1),
});

export const updateInvoiceBodySchema = z
  .object({
    invoiceDate: dateStringSchema.optional(),
    discount: z.number().int().nonnegative().optional(),
    notes: z.string().trim().optional(),
    items: z.array(invoiceItemSchema).min(1).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const listInvoicesQuerySchema = z.object({
  status: z.enum(INVOICE_STATUS).optional(),
  customerId: objectIdSchema.optional(),
  fromDate: dateStringSchema.optional(),
  toDate: dateStringSchema.optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

export const addInvoicePaymentBodySchema = z.object({
  paymentDate: dateStringSchema,
  amount: z.number().int().positive(),
  method: z.enum(["CASH", "BANK", "OTHER"]).optional(),
  reference: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});
