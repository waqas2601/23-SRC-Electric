import type { Request, Response } from "express";
import mongoose from "mongoose";
import Invoice from "../models/Invoice.js";
import Payment from "../models/Payment.js";
import { type InvoiceStatus } from "../constants/invoiceStatus.js";
import { AppError } from "../utils/AppError.js";

function assertValidObjectId(id: string, fieldName: string): void {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(400, "BAD_REQUEST", `Invalid ${fieldName}`);
  }
}

function parseDate(value: unknown, fieldName: string): Date {
  if (typeof value !== "string" || !value) {
    throw new AppError(400, "BAD_REQUEST", `${fieldName} is required`);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(400, "BAD_REQUEST", `${fieldName} must be a valid date`);
  }

  return parsed;
}

function assertInteger(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new AppError(
      400,
      "BAD_REQUEST",
      `${fieldName} must be a whole integer`,
    );
  }
  return value;
}

function deriveStatus(totalAmount: number, paidAmount: number): InvoiceStatus {
  if (paidAmount <= 0) return "unpaid";
  if (paidAmount < totalAmount) return "partial";
  return "completed";
}

async function getInvoicePaidAmount(
  invoiceId: string,
  excludePaymentId?: string,
): Promise<number> {
  const matchStage: Record<string, unknown> = {
    invoice_id: new mongoose.Types.ObjectId(invoiceId),
  };

  if (excludePaymentId) {
    matchStage._id = { $ne: new mongoose.Types.ObjectId(excludePaymentId) };
  }

  const result = await Payment.aggregate([
    { $match: matchStage },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  return result[0]?.total ?? 0;
}

async function recalculateInvoicePaymentState(invoiceId: string) {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    throw new AppError(404, "NOT_FOUND", "Invoice not found");
  }

  const paidAmount = await getInvoicePaidAmount(invoiceId);
  const remainingAmount = Math.max(invoice.total_amount - paidAmount, 0);
  const status = deriveStatus(invoice.total_amount, paidAmount);

  const updatedInvoice = await Invoice.findByIdAndUpdate(
    invoiceId,
    {
      paid_amount: paidAmount,
      remaining_amount: remainingAmount,
      status,
    },
    { new: true },
  );

  if (!updatedInvoice) {
    throw new AppError(404, "NOT_FOUND", "Invoice not found");
  }

  return updatedInvoice;
}

export async function listPayments(req: Request, res: Response) {
  const {
    invoiceId,
    method,
    fromDate,
    toDate,
    page = "1",
    limit = "20",
  } = req.query;

  const filter: Record<string, unknown> = {};

  if (typeof invoiceId === "string" && invoiceId) {
    assertValidObjectId(invoiceId, "invoiceId");
    filter.invoice_id = invoiceId;
  }

  if (typeof method === "string" && method) {
    filter.method = method;
  }

  if (typeof fromDate === "string" || typeof toDate === "string") {
    const dateFilter: Record<string, Date> = {};

    if (typeof fromDate === "string" && fromDate) {
      dateFilter.$gte = parseDate(fromDate, "fromDate");
    }
    if (typeof toDate === "string" && toDate) {
      dateFilter.$lte = parseDate(toDate, "toDate");
    }

    filter.payment_date = dateFilter;
  }

  const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
  const limitNum = Math.min(
    Math.max(parseInt(String(limit), 10) || 20, 1),
    100,
  );

  const [items, total] = await Promise.all([
    Payment.find(filter)
      .populate({
        path: "invoice_id",
        select: "invoice_no customer_id total_amount remaining_amount status",
        populate: {
          path: "customer_id",
          select: "name shop_name phone address",
        },
      })
      .sort({ payment_date: -1, created_at: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Payment.countDocuments(filter),
  ]);

  return res.json({
    items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
}

export async function createPayment(req: Request, res: Response) {
  const {
    invoiceId,
    paymentDate,
    amount,
    method = "CASH",
    reference,
    notes,
  } = req.body as {
    invoiceId?: string;
    paymentDate?: string;
    amount?: number;
    method?: "CASH" | "BANK" | "OTHER";
    reference?: string;
    notes?: string;
  };

  if (!invoiceId) {
    throw new AppError(400, "BAD_REQUEST", "invoiceId is required");
  }
  assertValidObjectId(invoiceId, "invoiceId");

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    throw new AppError(404, "NOT_FOUND", "Invoice not found");
  }

  const parsedDate = parseDate(paymentDate, "paymentDate");
  const parsedAmount = assertInteger(amount, "amount");

  if (parsedAmount <= 0) {
    throw new AppError(422, "UNPROCESSABLE_ENTITY", "amount must be > 0");
  }

  const currentPaidAmount = await getInvoicePaidAmount(invoiceId);
  const currentRemainingAmount = Math.max(
    invoice.total_amount - currentPaidAmount,
    0,
  );

  if (currentRemainingAmount <= 0) {
    throw new AppError(
      422,
      "UNPROCESSABLE_ENTITY",
      "Invoice is already fully paid",
    );
  }

  if (parsedAmount > currentRemainingAmount) {
    throw new AppError(
      422,
      "UNPROCESSABLE_ENTITY",
      `amount cannot be greater than remaining amount (${currentRemainingAmount})`,
    );
  }

  const payment = await Payment.create({
    invoice_id: invoice._id,
    payment_date: parsedDate,
    amount: parsedAmount,
    method,
    reference,
    notes,
  });

  const updatedInvoice = await recalculateInvoicePaymentState(invoiceId);

  return res.status(201).json({ payment, invoice: updatedInvoice });
}

export async function updatePayment(req: Request, res: Response) {
  const { id } = req.params;
  assertValidObjectId(id, "payment id");

  const payment = await Payment.findById(id);
  if (!payment) {
    throw new AppError(404, "NOT_FOUND", "Payment not found");
  }

  const { paymentDate, amount, method, reference, notes } = req.body as {
    paymentDate?: string;
    amount?: number;
    method?: "CASH" | "BANK" | "OTHER";
    reference?: string;
    notes?: string;
  };

  const invoiceId = payment.invoice_id.toString();
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    throw new AppError(404, "NOT_FOUND", "Invoice not found");
  }

  const updatePayload: Record<string, unknown> = {};

  if (paymentDate !== undefined) {
    updatePayload.payment_date = parseDate(paymentDate, "paymentDate");
  }

  if (amount !== undefined) {
    const parsedAmount = assertInteger(amount, "amount");
    if (parsedAmount <= 0) {
      throw new AppError(422, "UNPROCESSABLE_ENTITY", "amount must be > 0");
    }

    const otherPaidAmount = await getInvoicePaidAmount(invoiceId, id);
    const maxAllowed = Math.max(invoice.total_amount - otherPaidAmount, 0);

    if (maxAllowed <= 0) {
      throw new AppError(
        422,
        "UNPROCESSABLE_ENTITY",
        "Invoice is already fully paid",
      );
    }

    if (parsedAmount > maxAllowed) {
      throw new AppError(
        422,
        "UNPROCESSABLE_ENTITY",
        `amount cannot be greater than remaining amount (${maxAllowed})`,
      );
    }

    updatePayload.amount = parsedAmount;
  }

  if (method !== undefined) {
    updatePayload.method = method;
  }

  if (reference !== undefined) {
    updatePayload.reference = reference;
  }

  if (notes !== undefined) {
    updatePayload.notes = notes;
  }

  const updatedPayment = await Payment.findByIdAndUpdate(id, updatePayload, {
    new: true,
    runValidators: true,
  });

  if (!updatedPayment) {
    throw new AppError(404, "NOT_FOUND", "Payment not found");
  }

  const updatedInvoice = await recalculateInvoicePaymentState(invoiceId);

  return res.json({ payment: updatedPayment, invoice: updatedInvoice });
}

export async function deletePayment(req: Request, res: Response) {
  const { id } = req.params;
  assertValidObjectId(id, "payment id");

  const payment = await Payment.findById(id);
  if (!payment) {
    throw new AppError(404, "NOT_FOUND", "Payment not found");
  }

  const invoiceId = payment.invoice_id.toString();
  await Payment.findByIdAndDelete(id);
  const updatedInvoice = await recalculateInvoicePaymentState(invoiceId);

  return res.json({
    message: "Payment deleted successfully",
    invoice: updatedInvoice,
  });
}
