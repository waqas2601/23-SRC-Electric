import mongoose from "mongoose";
import { PRODUCT_CATEGORIES } from "../constants/productCategories.js";

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: PRODUCT_CATEGORIES,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "price must be a whole integer",
      },
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

productSchema.index({ category: 1 });
productSchema.index({ category: 1, name: 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;
