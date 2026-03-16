import { useState, useEffect } from "react";
import Modal from "./Modal";
import { useAuth } from "../../context/AuthContext";
import {
  DEFAULT_PRODUCT_MODELS,
  addProductAPI,
  deleteProductAPI,
  updateProductAPI,
  getProductModelsAPI,
  normalizeModelLabel,
  type Product,
} from "../../api/products";
import { useToast } from "../../context/ToastContext";

interface ModelEntry {
  id?: string;
  model: string;
  price: string;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  product?: Product | null;
  allVariants?: Product[];
}

function ProductModal({
  isOpen,
  onClose,
  onSaved,
  product,
  allVariants,
}: ProductModalProps) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [type, setType] = useState<"direct" | "model">("direct");
  const [directPrice, setDirectPrice] = useState("");
  const [entries, setEntries] = useState<ModelEntry[]>([
    { model: "", price: "" },
  ]);
  const [models, setModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const toModelKey = (value?: string | null) =>
    value ? normalizeModelLabel(value) : "";

  // Fetch model enum list
  useEffect(() => {
    if (!isOpen) return;
    if (!token) return;
    getProductModelsAPI(token)
      .then((data) => {
        setModels(data.models ?? []);
      })
      .catch(() => {
        setModels(DEFAULT_PRODUCT_MODELS);
      });
  }, [isOpen, token]);

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    if (allVariants && allVariants.length > 0) {
      setType("model");
      setName(allVariants[0].name);
      setEntries(
        allVariants.map((v) => ({
          id: v._id,
          model: toModelKey(v.model),
          price: String(v.price),
        })),
      );
      setDirectPrice("");
    } else if (product) {
      setName(product.name);
      setType(product.type ?? (product.model ? "model" : "direct"));
      setDirectPrice(String(product.price));
      setEntries([
        {
          id: product._id,
          model: toModelKey(product.model),
          price: String(product.price),
        },
      ]);
    } else {
      setName("");
      setType("direct");
      setDirectPrice("");
      setEntries([{ model: "", price: "" }]);
    }
  }, [isOpen, product, allVariants]);

  const isGroupEdit = !!(allVariants && allVariants.length > 0);
  const isEditing = isGroupEdit || !!product;

  const addEntry = () => {
    setEntries((prev) => [...prev, { model: "", price: "" }]);
  };

  const removeEntry = (i: number) => {
    setEntries((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateEntry = (i: number, field: "model" | "price", value: string) => {
    setEntries((prev) =>
      prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)),
    );
  };

  const usedModels = (currentIndex: number) =>
    entries.filter((_, i) => i !== currentIndex).map((e) => e.model);

  const handleSubmit = async () => {
    if (!token) {
      setError("You are not authenticated. Please login again.");
      return;
    }

    if (!name.trim()) {
      setError("Product name is required");
      return;
    }

    if (type === "direct") {
      if (!directPrice || Number(directPrice) < 0) {
        setError("Enter a valid price");
        return;
      }
    } else {
      if (entries.length === 0) {
        setError("Add at least one model");
        return;
      }
      for (let i = 0; i < entries.length; i += 1) {
        if (!entries[i].model) {
          setError(`Select a model for entry ${i + 1}`);
          return;
        }
        if (!entries[i].price || Number(entries[i].price) < 0) {
          setError(`Enter a valid price for entry ${i + 1}`);
          return;
        }
      }

      const modelList = entries.map((e) => e.model);
      if (new Set(modelList).size !== modelList.length) {
        setError("Duplicate models — each model must be unique");
        return;
      }
    }

    setError("");
    setIsLoading(true);

    try {
      if (type === "direct") {
        if (isEditing && product) {
          await updateProductAPI(token, product._id, {
            name: name.trim(),
            price: Math.round(Number(directPrice)),
          });
        } else {
          await addProductAPI(token, {
            type: "direct",
            name: name.trim(),
            price: Math.round(Number(directPrice)),
          });
        }
      } else {
        if (isGroupEdit) {
          const existingEntries = entries.filter((e) => e.id);
          const existingIds = new Set(existingEntries.map((e) => e.id!));

          const removedVariants = (allVariants ?? []).filter(
            (v) => !existingIds.has(v._id),
          );
          for (const variant of removedVariants) {
            await deleteProductAPI(token, variant._id);
          }

          for (const entry of existingEntries) {
            await updateProductAPI(token, entry.id!, {
              name: name.trim(),
              model: entry.model,
              price: Math.round(Number(entry.price)),
            });
          }

          const newEntries = entries.filter((e) => !e.id);
          for (const entry of newEntries) {
            await addProductAPI(token, {
              type: "model",
              name: name.trim(),
              model: entry.model,
              price: Math.round(Number(entry.price)),
            });
          }
        } else {
          await Promise.all(
            entries.map((entry) =>
              addProductAPI(token, {
                type: "model",
                name: name.trim(),
                model: entry.model,
                price: Math.round(Number(entry.price)),
              }),
            ),
          );
        }
      }

      await Promise.resolve(onSaved());
      showToast(
        "success",
        isEditing
          ? "Product updated successfully"
          : "Product added successfully",
      );
      onClose();
    } catch (err: any) {
      const message = err.message || "Something went wrong";
      setError(message);
      showToast("error", message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatModel = (m: string) => m.replace(/_/g, " ");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Product" : "Add Product"}
    >
      <div className="p-[20px] flex flex-col gap-[14px]">
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

        {/* Product Name */}
        <div>
          <label
            className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            Product Name <span style={{ color: "#ff4d6a" }}>*</span>
          </label>
          <input
            className="fi"
            placeholder="e.g. A Series 01"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Product Type */}
        <div>
          <label
            className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            Product Type <span style={{ color: "#ff4d6a" }}>*</span>
          </label>
          <div className="flex gap-[8px]">
            <button
              className="btn btn-ghost"
              disabled={isEditing}
              style={{
                borderColor:
                  type === "direct" ? "rgba(26,110,255,.4)" : undefined,
                color: type === "direct" ? "var(--electric-bright)" : undefined,
                opacity: isEditing ? 0.7 : 1,
              }}
              onClick={() => {
                setType("direct");
                setEntries([{ model: "", price: "" }]);
              }}
            >
              Single Product
            </button>
            <button
              className="btn btn-ghost"
              disabled={isEditing}
              style={{
                borderColor:
                  type === "model" ? "rgba(26,110,255,.4)" : undefined,
                color: type === "model" ? "var(--electric-bright)" : undefined,
                opacity: isEditing ? 0.7 : 1,
              }}
              onClick={() => setType("model")}
            >
              Product With Model
            </button>
          </div>
          {isEditing && (
            <div
              className="text-[11px] mt-[6px]"
              style={{ color: "var(--text-muted)" }}
            >
              Product type cannot be changed while editing.
            </div>
          )}
        </div>

        {type === "model" && (
          <div>
            <div className="flex items-center justify-between mb-[8px]">
              <label
                className="text-[10px] uppercase tracking-[.1em] font-inter font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                Models & Prices <span style={{ color: "#ff4d6a" }}>*</span>
              </label>
              {entries.length < models.length && (
                <button
                  className="text-[11px] font-inter font-semibold flex items-center gap-1"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--electric-bright)",
                    cursor: "pointer",
                  }}
                  onClick={addEntry}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Model
                </button>
              )}
            </div>

            <div className="flex flex-col gap-[8px]">
              {entries.map((entry, i) => (
                <div
                  key={`${entry.id ?? "new"}-${i}`}
                  className="flex items-center gap-[8px]"
                >
                  <div className="flex-1">
                    <select
                      className="fi"
                      value={entry.model}
                      disabled={Boolean(entry.id) && isGroupEdit}
                      onChange={(e) => updateEntry(i, "model", e.target.value)}
                    >
                      <option value="">Select model...</option>
                      {entry.model && !models.includes(entry.model) && (
                        <option value={entry.model}>
                          {formatModel(entry.model)}
                        </option>
                      )}
                      {models.map((m) => (
                        <option
                          key={m}
                          value={m}
                          disabled={usedModels(i).includes(m)}
                        >
                          {formatModel(m)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ width: "110px" }}>
                    <input
                      className="fi"
                      type="number"
                      placeholder="Price"
                      min={0}
                      value={entry.price}
                      onChange={(e) => updateEntry(i, "price", e.target.value)}
                    />
                  </div>

                  {entries.length > 1 && (
                    <button
                      className="w-[36px] h-[38px] rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "rgba(255,77,106,.1)",
                        border: "1px solid rgba(255,77,106,.2)",
                        color: "#ff4d6a",
                        cursor: "pointer",
                        fontSize: "16px",
                      }}
                      onClick={() => removeEntry(i)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {entries.some((e) => e.model && e.price) && (
              <div
                className="mt-[10px] p-[10px_12px] rounded-lg flex flex-wrap gap-[8px]"
                style={{
                  background: "var(--electric-glow)",
                  border: "1px solid var(--border)",
                }}
              >
                {entries
                  .filter((e) => e.model && e.price)
                  .map((e, i) => (
                    <div key={i} className="flex items-center gap-[6px]">
                      <span className="chip">{formatModel(e.model)}</span>
                      <span
                        className="text-[12px] font-inter font-bold"
                        style={{ color: "var(--electric-bright)" }}
                      >
                        PKR {Number(e.price).toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Price */}
        {type === "direct" && (
          <div>
            <label
              className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              Price <span style={{ color: "#ff4d6a" }}>*</span>
            </label>
            <input
              className="fi"
              type="number"
              min={0}
              placeholder="e.g. 4200"
              value={directPrice}
              onChange={(e) => setDirectPrice(e.target.value)}
            />
          </div>
        )}

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
              "Save Changes"
            ) : (
              "Create Product"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ProductModal;
