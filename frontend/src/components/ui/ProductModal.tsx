import { useState, useEffect } from "react";
import Modal from "./Modal";
import { useAuth } from "../../context/AuthContext";
import { addProductAPI, updateProductAPI } from "../../api/products";

const CATEGORIES = [
  "BULB",
  "TUBE_LIGHT",
  "SWITCH",
  "SOCKET",
  "PLUG",
  "WIRE",
  "CABLE",
  "MCB",
  "BREAKER",
  "DB_BOX",
  "FAN",
  "HOLDER",
  "ADAPTER",
  "EXTENSION_BOARD",
  "DIMMER",
  "SENSOR",
  "CHARGER",
  "INVERTER",
  "BATTERY",
  "OTHER",
];

interface Product {
  _id?: string;
  name: string;
  category: string;
  price: number;
  sku?: string;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: Product | null;
}

function ProductModal({
  isOpen,
  onClose,
  onSuccess,
  product,
}: ProductModalProps) {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("SWITCH");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!product;

  // Fill form when editing
  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategory(product.category);
      setPrice(String(product.price));
    } else {
      setName("");
      setCategory("SWITCH");
      setPrice("");
    }
    setError("");
  }, [product, isOpen]);

  const handleSubmit = async () => {
    if (!name || !category || !price) {
      setError("All fields are required");
      return;
    }
    if (isNaN(Number(price)) || Number(price) <= 0) {
      setError("Price must be a valid number");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      if (isEditing && product?._id) {
        await updateProductAPI(token!, product._id, {
          name,
          category,
          price: Number(price),
        });
      } else {
        await addProductAPI(token!, {
          name,
          category,
          price: Number(price),
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Product" : "Add Product"}
    >
      <div className="p-[20px] flex flex-col gap-[13px]">
        {/* Error */}
        {error && (
          <div
            className="p-[10px_13px] rounded-lg text-[12px] font-inter"
            style={{
              background: "rgba(255,77,106,.1)",
              border: "1px solid rgba(255,77,106,.2)",
              color: "#ff4d6a",
            }}
          >
            {error}
          </div>
        )}

        {/* SKU (readonly when editing) */}
        {isEditing && product?.sku && (
          <div>
            <label
              className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              SKU
            </label>
            <input
              className="fi"
              value={product.sku}
              readOnly
              style={{ color: "var(--electric-bright)", opacity: 0.7 }}
            />
          </div>
        )}

        {/* Name */}
        <div>
          <label
            className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            Product Name
          </label>
          <input
            className="fi"
            placeholder="e.g. 6A Modular Switch"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Category */}
        <div>
          <label
            className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            Category
          </label>
          <select
            className="fi"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label
            className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            Price (PKR)
          </label>
          <input
            className="fi"
            type="number"
            placeholder="e.g. 250"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-[9px] justify-end pt-[4px]">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              "Update Product"
            ) : (
              "Add Product"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ProductModal;
