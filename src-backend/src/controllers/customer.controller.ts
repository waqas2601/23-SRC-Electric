import type { Request, Response } from "express";
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Invoice from "../models/Invoice.js";
import { AppError } from "../utils/AppError.js";

function assertValidObjectId(id: string): void {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(400, "BAD_REQUEST", "Invalid customer id");
  }
}

export async function createCustomer(req: Request, res: Response) {
  const payload = req.body;
  const customer = await Customer.create(payload);
  return res.status(201).json(customer);
}

export async function listCustomers(req: Request, res: Response) {
  const { q, isActive = "true", page = "1", limit = "20" } = req.query;

  const filter: Record<string, unknown> = {};

  if (typeof q === "string" && q.trim()) {
    const regex = { $regex: q.trim(), $options: "i" };
    filter.$or = [
      { name: regex },
      { shop_name: regex },
      { phone: regex },
      { address: regex },
    ];
  }

  if (isActive === "true" || isActive === "false") {
    filter.is_active = isActive === "true";
  }

  const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
  const limitNum = Math.min(
    Math.max(parseInt(String(limit), 10) || 20, 1),
    100,
  );

  const [items, total] = await Promise.all([
    Customer.find(filter)
      .sort({ created_at: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Customer.countDocuments(filter),
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

export async function getCustomerById(req: Request, res: Response) {
  const { id } = req.params;
  assertValidObjectId(id);

  const customer = await Customer.findById(id);
  if (!customer) {
    throw new AppError(404, "NOT_FOUND", "Customer not found");
  }

  return res.json(customer);
}

export async function updateCustomer(req: Request, res: Response) {
  const { id } = req.params;
  assertValidObjectId(id);

  const allowedFields = [
    "name",
    "shop_name",
    "address",
    "phone",
    "notes",
    "is_active",
  ];
  const payload = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowedFields.includes(key)),
  );

  if (payload.is_active === false) {
    const invoiceCount = await Invoice.countDocuments({ customer_id: id });
    if (invoiceCount > 0) {
      throw new AppError(
        422,
        "UNPROCESSABLE_ENTITY",
        "Customer cannot be deactivated while related invoices exist",
      );
    }
  }

  const customer = await Customer.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!customer) {
    throw new AppError(404, "NOT_FOUND", "Customer not found");
  }

  return res.json(customer);
}

export async function deleteCustomer(req: Request, res: Response) {
  const { id } = req.params;
  assertValidObjectId(id);

  const invoiceCount = await Invoice.countDocuments({ customer_id: id });
  if (invoiceCount > 0) {
    throw new AppError(
      422,
      "UNPROCESSABLE_ENTITY",
      "Customer cannot be deleted while related invoices exist",
    );
  }

  const customer = await Customer.findByIdAndUpdate(
    id,
    { is_active: false },
    { new: true, runValidators: true },
  );

  if (!customer) {
    throw new AppError(404, "NOT_FOUND", "Customer not found");
  }

  return res.json({ message: "Customer deactivated successfully", customer });
}
