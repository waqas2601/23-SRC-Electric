import mongoose from "mongoose";
import { INVOICE_STATUS } from "../constants/invoiceStatus.js";

const invoiceItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    product_name_snapshot: {
      type: String,
      required: true,
      trim: true,
    },
    sku_snapshot: {
      type: String,
      trim: true,
      uppercase: true,
    },
    unit_price_snapshot: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "unit_price_snapshot must be a whole integer",
      },
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "quantity must be a whole integer",
      },
    },
    line_total: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "line_total must be a whole integer",
      },
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

const invoiceSchema = new mongoose.Schema(
  {
    invoice_no: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    invoice_date: { type: Date, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total_amount: { type: Number, required: true, min: 0 },
    paid_amount: { type: Number, default: 0, min: 0 },
    remaining_amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: INVOICE_STATUS,
      default: "unpaid",
    },
    notes: { type: String, trim: true },
    items: [invoiceItemSchema],
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

invoiceSchema.index({ customer_id: 1, status: 1 });
invoiceSchema.index({ invoice_date: -1 });

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
