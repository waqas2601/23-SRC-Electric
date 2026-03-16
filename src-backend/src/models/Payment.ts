import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    invoice_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },
    payment_date: { type: Date, required: true },
    amount: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "amount must be a whole integer",
      },
    },
    method: {
      type: String,
      enum: ["CASH", "BANK", "OTHER"],
      default: "CASH",
    },
    reference: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

paymentSchema.index({ invoice_id: 1, payment_date: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
