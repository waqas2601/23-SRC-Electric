import type { Request, Response } from "express";
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import LedgerPayment from "../models/LedgerPayment.js";
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

export async function listLedgerPayments(req: Request, res: Response) {
  const { customerId, method, q, page = "1", limit = "20" } = req.query;

  const filter: Record<string, unknown> = {};

  if (typeof customerId === "string" && customerId) {
    assertValidObjectId(customerId, "customerId");
    filter.customer_id = customerId;
  }

  if (typeof method === "string" && method) {
    filter.method = method;
  }

  if (typeof q === "string" && q.trim()) {
    const regex = { $regex: q.trim(), $options: "i" };
    const matchedCustomers = await Customer.find(
      {
        $or: [{ name: regex }, { shop_name: regex }, { phone: regex }],
      },
      { _id: 1 },
    );

    const matchedIds = matchedCustomers.map((c) => c._id);
    if (matchedIds.length === 0) {
      return res.json({
        items: [],
        pagination: {
          page: 1,
          limit: Math.min(Math.max(parseInt(String(limit), 10) || 20, 1), 100),
          total: 0,
          totalPages: 0,
        },
      });
    }

    filter.customer_id = { $in: matchedIds };
  }

  const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
  const limitNum = Math.min(
    Math.max(parseInt(String(limit), 10) || 20, 1),
    100,
  );

  const [items, total] = await Promise.all([
    LedgerPayment.find(filter)
      .populate({ path: "customer_id", select: "name shop_name" })
      .sort({ payment_date: -1, created_at: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    LedgerPayment.countDocuments(filter),
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

export async function createCustomerLedgerPayment(req: Request, res: Response) {
  const { id } = req.params;
  assertValidObjectId(id, "customer id");

  const customer = await Customer.findById(id);
  if (!customer) {
    throw new AppError(404, "NOT_FOUND", "Customer not found");
  }

  const {
    amount,
    method = "CASH",
    paymentDate,
    notes,
  } = req.body as {
    amount?: number;
    method?: "CASH" | "BANK" | "OTHER";
    paymentDate?: string;
    notes?: string;
  };

  const parsedAmount = assertInteger(amount, "amount");
  if (parsedAmount <= 0) {
    throw new AppError(422, "UNPROCESSABLE_ENTITY", "amount must be > 0");
  }

  const parsedDate = parseDate(paymentDate, "paymentDate");

  const payment = await LedgerPayment.create({
    customer_id: customer._id,
    amount: parsedAmount,
    method,
    payment_date: parsedDate,
    notes,
  });

  const populated = await payment.populate({
    path: "customer_id",
    select: "name shop_name",
  });

  return res.status(201).json(populated);
}

export async function listCustomerLedgerPayments(req: Request, res: Response) {
  const { id } = req.params;
  assertValidObjectId(id, "customer id");

  const customer = await Customer.findById(id);
  if (!customer) {
    throw new AppError(404, "NOT_FOUND", "Customer not found");
  }

  const items = await LedgerPayment.find({ customer_id: id })
    .populate({ path: "customer_id", select: "name shop_name" })
    .sort({ payment_date: -1, created_at: -1 });

  return res.json(items);
}

export async function deleteLedgerPayment(req: Request, res: Response) {
  const { id } = req.params;
  assertValidObjectId(id, "ledger payment id");

  const payment = await LedgerPayment.findByIdAndDelete(id);
  if (!payment) {
    throw new AppError(404, "NOT_FOUND", "Ledger payment not found");
  }

  return res.json({ message: "Ledger payment deleted successfully" });
}
