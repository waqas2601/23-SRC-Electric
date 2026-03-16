import type { Request, Response } from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import { PRODUCT_CATEGORIES } from "../constants/productCategories.js";
import { AppError } from "../utils/AppError.js";

const LEGACY_PRODUCT_MODELS = [
  "A_SERIES",
  "K_SERIES",
  "R_SERIES",
  "UNIQUE_SERIES",
];

function normalizeModelLabel(value: string): string {
  return value.trim().replace(/\s+/g, "_").toUpperCase();
}

function toLegacyProductShape(product: any) {
  const model =
    typeof product.model === "string" && product.model.trim()
      ? normalizeModelLabel(product.model)
      : product.category && product.category !== "OTHER"
        ? product.category
        : null;

  return {
    ...product,
    type: model ? "model" : "direct",
    model,
  };
}

function assertValidObjectId(id: string): void {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(400, "BAD_REQUEST", "Invalid product id");
  }
}

function categoryPrefix(category: string): string {
  const words = category.split("_").filter(Boolean);
  if (words.length === 0) return "PRD";
  if (words.length === 1) return words[0].slice(0, 3);
  return words.map((w) => w[0]).join("");
}

async function generateProductSku(category: string): Promise<string> {
  const prefix = categoryPrefix(category).toUpperCase();

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const stamp = Date.now().toString().slice(-6);
    const rand = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const candidate = `${prefix}-${stamp}${rand}`;

    const exists = await Product.exists({ sku: candidate });
    if (!exists) return candidate;
  }

  throw new AppError(
    500,
    "INTERNAL_SERVER_ERROR",
    "Unable to generate product sku",
  );
}

export async function getProductCategories(req: Request, res: Response) {
  return res.json({ categories: PRODUCT_CATEGORIES });
}

export async function getProductModels(req: Request, res: Response) {
  const dbModels = await Product.distinct("model", {
    model: { $exists: true, $ne: null },
  });

  const categoryModels = PRODUCT_CATEGORIES.filter((c) => c !== "OTHER");

  const labels = Array.from(
    new Set(
      [...LEGACY_PRODUCT_MODELS, ...categoryModels, ...dbModels]
        .map((m) => normalizeModelLabel(String(m)))
        .filter(Boolean),
    ),
  );

  return res.json({
    items: labels.map((label) => ({
      _id: label,
      label,
      sku_prefix: label.slice(0, 3),
    })),
  });
}

export async function createProduct(req: Request, res: Response) {
  const payload = { ...req.body } as {
    sku?: string;
    name: string;
    category: string;
    type?: "direct" | "model";
    model?: string;
    price: number;
    is_active?: boolean;
  };

  payload.sku = payload.sku?.trim().toUpperCase();
  payload.name = payload.name.trim().toUpperCase();

  if (!payload.category) {
    payload.category = payload.type === "model" ? "OTHER" : "OTHER";
  }

  const normalizedModel =
    payload.type === "model" || payload.model
      ? normalizeModelLabel(payload.model || "")
      : null;

  if (payload.type === "model" && !normalizedModel) {
    throw new AppError(400, "BAD_REQUEST", "model is required for type=model");
  }

  if (!payload.sku) {
    payload.sku = await generateProductSku(payload.category);
  }

  const product = await Product.create({
    sku: payload.sku,
    name: payload.name,
    category: payload.category,
    model: normalizedModel,
    price: payload.price,
    is_active: payload.is_active,
  });

  return res.status(201).json(toLegacyProductShape(product.toObject()));
}

export async function listProducts(req: Request, res: Response) {
  const {
    category,
    q,
    isActive = "true",
    page = "1",
    limit = "20",
  } = req.query;

  const filter: Record<string, unknown> = {};

  if (typeof category === "string" && category) {
    if (
      !PRODUCT_CATEGORIES.includes(
        category as (typeof PRODUCT_CATEGORIES)[number],
      )
    ) {
      throw new AppError(400, "BAD_REQUEST", "Invalid category filter");
    }
    filter.category = category;
  }

  if (typeof q === "string" && q) {
    filter.name = { $regex: q, $options: "i" };
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
    Product.find(filter)
      .sort({ created_at: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  return res.json({
    items: items.map((item) => toLegacyProductShape(item.toObject())),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
}

export async function updateProduct(req: Request, res: Response) {
  const { id } = req.params;
  assertValidObjectId(id);

  const allowedFields = ["name", "category", "model", "price", "is_active"];
  const payload = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowedFields.includes(key)),
  );

  if (typeof payload.name === "string") {
    payload.name = payload.name.trim().toUpperCase();
  }

  if (typeof payload.model === "string") {
    payload.model = normalizeModelLabel(payload.model);
  }

  if (req.body?.type === "direct") {
    payload.model = null;
  }

  const product = await Product.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    throw new AppError(404, "NOT_FOUND", "Product not found");
  }

  return res.json(toLegacyProductShape(product.toObject()));
}

export async function deleteProduct(req: Request, res: Response) {
  const { id } = req.params;
  assertValidObjectId(id);

  const product = await Product.findByIdAndUpdate(
    id,
    { is_active: false },
    { new: true, runValidators: true },
  );

  if (!product) {
    throw new AppError(404, "NOT_FOUND", "Product not found");
  }

  return res.json({ message: "Product deactivated successfully", product });
}
