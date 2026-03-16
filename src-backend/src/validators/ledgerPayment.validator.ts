import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid ObjectId");

const dateStringSchema = z
  .string()
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Invalid date");

export const ledgerPaymentIdParamsSchema = z.object({
  id: objectIdSchema,
});

export const customerLedgerPaymentParamsSchema = z.object({
  id: objectIdSchema,
});

export const createLedgerPaymentBodySchema = z.object({
  amount: z.number().int().positive(),
  method: z.enum(["CASH", "BANK", "OTHER"]).optional(),
  paymentDate: dateStringSchema,
  notes: z.string().trim().optional(),
});

export const listLedgerPaymentsQuerySchema = z.object({
  customerId: objectIdSchema.optional(),
  method: z.enum(["CASH", "BANK", "OTHER"]).optional(),
  q: z.string().trim().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

export const setOpeningBalanceBodySchema = z.object({
  amount: z.number().int().nonnegative(),
});
