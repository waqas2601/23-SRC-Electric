import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { addInvoiceAPI } from "../api/invoices";
import { getProductsAPI } from "../api/products";
import Avatar from "../components/ui/Avatar";
import CustomerSearch from "../components/ui/CustomerSearch";
import { addCustomerAPI } from "../api/customers";
import { useToast } from "../context/ToastContext";
import type { Product } from "../api/products";

interface LineItem {
  productId: string;
  productName: string;
  productModel: string | null;
  quantity: number;
  unitPriceSnapshot: number;
  boxQty: number | null;
}

const GRADIENTS = ["default", "cyan", "green", "purple", "red"];

function mixProductsByModel(items: Product[]) {
  const order = ["A_SERIES", "K_SERIES", "R_SERIES", "UNIQUE_SERIES"];
  const buckets = new Map<string, Product[]>();

  order.forEach((key) => buckets.set(key, []));
  items.forEach((item) => {
    const key = String(item.model || "").toUpperCase();
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(item);
  });

  const mixed: Product[] = [];
  let hasMore = true;
  while (hasMore) {
    hasMore = false;
    for (const key of [...order, ...Array.from(buckets.keys())]) {
      const bucket = buckets.get(key) ?? [];
      if (bucket.length > 0) {
        mixed.push(bucket.shift()!);
        hasMore = true;
      }
    }
  }

  return mixed;
}

function NewInvoice() {
  // Model selection state
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const { token } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  // Invoice date removed, backend will handle
  const [discountType, setDiscountType] = useState<"PKR" | "PERCENT">("PKR");
  const [discountValue, setDiscountValue] = useState(0);
  const [discountInput, setDiscountInput] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [itemQuery, setItemQuery] = useState("");
  const [itemResults, setItemResults] = useState<Product[]>([]);
  const [itemLoading, setItemLoading] = useState(false);
  const [showItemResults, setShowItemResults] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [draftQty, setDraftQty] = useState(1);
  const [draftBoxQty, setDraftBoxQty] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");

  const [selectedCustomer, setSelectedCustomer] = useState<{
    _id: string;
    name: string;
    shop_name?: string;
    phone?: string;
  } | null>(null);
  const gradientIndex = useMemo(() => {
    const name = selectedCustomer?.name ?? "";
    if (!name) return 0;
    return (
      name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) %
      GRADIENTS.length
    );
  }, [selectedCustomer]);

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceSnapshot,
    0,
  );
  const discount = Math.max(
    0,
    Math.round(
      discountType === "PKR"
        ? discountValue
        : (subtotal * Math.max(0, discountValue)) / 100,
    ),
  );
  const grandTotal = Math.max(0, subtotal - discount);

  const composerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        composerRef.current &&
        !composerRef.current.contains(e.target as Node)
      ) {
        setShowItemResults(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!token) {
      setItemResults([]);
      return;
    }

    const q = itemQuery.trim();
    const timeout = setTimeout(async () => {
      setItemLoading(true);
      try {
        const data = await getProductsAPI(token, {
          q: q || undefined,
          isActive: true,
          limit: q ? 8 : 50,
        });
        const items = (data.items ?? []) as Product[];
        setItemResults(q ? items : mixProductsByModel(items).slice(0, 20));
      } catch {
        setItemResults([]);
      } finally {
        setItemLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [itemQuery, token]);

  const upsertProductItem = (
    product: Product,
    qty: number,
    boxQty: number | null,
  ) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.productId === product._id);
      if (existingIndex >= 0) {
        return prev.map((item, idx) =>
          idx === existingIndex
            ? {
                ...item,
                quantity: item.quantity + qty,
                boxQty:
                  boxQty === null
                    ? (item.boxQty ?? null)
                    : (item.boxQty ?? 0) + boxQty,
              }
            : item,
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          productName: product.name,
          productModel: product.model ?? null,
          quantity: qty,
          unitPriceSnapshot: product.price,
          boxQty,
        },
      ];
    });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setItemQuery(product.name);
    setShowItemResults(false);
    setDraftQty(1);
    setDraftBoxQty("");
    // Reset model selection
    if (product.type === "model") {
      setSelectedModel(null);
      // Fetch available models
      if (token) {
        import("../api/products").then(({ getProductModelsAPI }) => {
          getProductModelsAPI(token)
            .then((res) => {
              setAvailableModels(res.models);
            })
            .catch(() => setAvailableModels([]));
        });
      }
    } else {
      setSelectedModel(product.model ?? null);
      setAvailableModels([]);
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct) {
      setError("Please select an item first");
      return;
    }
    // If product is model type, require model selection
    if (selectedProduct.type === "model" && !selectedModel) {
      setError("Please select a model for this product");
      return;
    }

    const parsed = draftBoxQty.trim();
    if (parsed !== "" && Number.isNaN(Number(parsed))) {
      setError("Box quantity must be a valid number");
      return;
    }

    const boxQty = parsed === "" ? null : Math.max(0, Number(parsed));
    // Use selectedModel if present
    const productToAdd = {
      ...selectedProduct,
      model:
        selectedProduct.type === "model"
          ? selectedModel
          : (selectedProduct.model ?? null),
    };
    upsertProductItem(productToAdd, draftQty, boxQty);

    setError("");
    setSelectedProduct(null);
    setItemQuery("");
    setDraftQty(1);
    setDraftBoxQty("");
    setShowItemResults(false);
    setSelectedModel(null);
    setAvailableModels([]);
  };

  const handleSubmit = async () => {
    if (!token) {
      setError("Session expired. Please login again.");
      return;
    }

    if (!selectedCustomerId && !newCustomerName?.trim()) {
      setError("Please select or enter a customer name");
      return;
    }
    if (items.length === 0) {
      setError("Please add at least one item");
      return;
    }

    if (discountValue < 0) {
      setError("Discount cannot be negative");
      return;
    }

    if (discountType === "PERCENT" && discountValue > 100) {
      setError("Discount percentage cannot exceed 100%");
      return;
    }

    if (discount > subtotal) {
      setError("Discount cannot be greater than subtotal");
      return;
    }

    const invalidItem = items.find(
      (item) => item.quantity < 1 || item.unitPriceSnapshot < 0,
    );
    if (invalidItem) {
      setError("Please provide valid quantity and price for all items");
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      let customerId = selectedCustomerId;

      // Create new customer if name was typed manually
      if (!customerId && newCustomerName?.trim()) {
        const newCust = await addCustomerAPI(token, {
          name: newCustomerName.trim(),
        });
        customerId = newCust.customer?._id ?? newCust._id;
      }

      await addInvoiceAPI(token, {
        customerId,
        invoiceDate: new Date().toISOString(),
        discount,
        notes,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPriceSnapshot: item.unitPriceSnapshot,
          ...(item.boxQty !== null ? { boxQty: item.boxQty } : {}),
        })),
      });
      showToast("success", "Invoice created successfully");
      navigate("/invoices");
    } catch (err: any) {
      const message = err.message || "Failed to create invoice";
      setError(message);
      showToast("error", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn .2s ease" }}>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-[18px] flex-wrap gap-[10px]">
        <div
          className="font-inter font-extrabold text-[20px]"
          style={{ color: "var(--text-primary)" }}
        >
          Create <span style={{ color: "var(--electric)" }}>New Invoice</span>
        </div>
        <div className="flex gap-[9px]">
          <button
            className="btn btn-ghost"
            onClick={() => navigate("/invoices")}
          >
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
            ) : (
              "Generate Invoice"
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="p-[10px_13px] rounded-lg mb-[16px] text-[12px] font-inter"
          style={{
            background: "rgba(255,77,106,.1)",
            border: "1px solid rgba(255,77,106,.2)",
            color: "#ff4d6a",
          }}
        >
          {error}
        </div>
      )}

      {/* Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_310px] gap-[16px]">
        {/* LEFT */}
        <div className="flex flex-col gap-[14px]">
          {/* Invoice Details */}
          <div className="card overflow-visible">
            <div className="card-hdr">
              <div
                className="card-title"
                style={{ color: "var(--text-primary)" }}
              >
                Invoice Details
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[13px] p-[16px]">
              {/* Invoice Date field removed */}
              <div className="sm:col-span-2">
                <label
                  className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Customer <span style={{ color: "#ff4d6a" }}>*</span>
                </label>
                <CustomerSearch
                  selectedCustomer={selectedCustomer ?? null}
                  newCustomerName={newCustomerName}
                  onSelect={(customer, newName) => {
                    if (customer) {
                      setSelectedCustomerId(customer._id);
                      setSelectedCustomer(customer);
                      setNewCustomerName("");
                    } else {
                      setSelectedCustomerId("");
                      setSelectedCustomer(null);
                      setNewCustomerName(newName ?? "");
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="card">
            <div className="card-hdr">
              <div
                className="card-title"
                style={{ color: "var(--text-primary)" }}
              >
                Line Items
              </div>
              <span
                className="text-[11px]"
                style={{ color: "var(--text-muted)" }}
              >
                {items.length} item{items.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="p-[17px] flex flex-col gap-[14px]">
              {/* Item Composer */}
              <div
                ref={composerRef}
                className="rounded-xl p-[13px] relative z-[30]"
                style={{ border: "1px solid var(--border)" }}
              >
                <div className="relative">
                  <input
                    className="fi pr-10"
                    placeholder="Search item"
                    value={itemQuery}
                    onFocus={() => setShowItemResults(true)}
                    onChange={(e) => {
                      setItemQuery(e.target.value);
                      setSelectedProduct(null);
                      setShowItemResults(true);
                      setSelectedModel(null);
                    }}
                    style={{
                      borderColor: selectedProduct
                        ? "rgba(0,201,122,.45)"
                        : "var(--border-input)",
                    }}
                  />
                  {/* Model selection dropdown if product is model type */}
                  {selectedProduct &&
                    selectedProduct.type === "model" &&
                    itemResults.length > 0 &&
                    (() => {
                      // Build modelPrices map for selected product
                      const modelPrices: { [model: string]: number } = {};
                      itemResults.forEach((item) => {
                        if (
                          item.name === selectedProduct.name &&
                          item.model &&
                          typeof item.price === "number"
                        ) {
                          modelPrices[item.model] = item.price;
                        }
                      });
                      const models = Object.keys(modelPrices);
                      if (models.length === 0) return null;
                      return (
                        <div className="mt-3" style={{ maxWidth: "220px" }}>
                          <label
                            className="block text-[11px] uppercase tracking-[.08em] mb-2"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            Select Model
                          </label>
                          <select
                            className="fi"
                            value={selectedModel ?? ""}
                            onChange={(e) => setSelectedModel(e.target.value)}
                          >
                            <option value="">Select model...</option>
                            {models.map((m) => (
                              <option
                                key={selectedProduct?.name + "-" + m}
                                value={m}
                              >
                                {m.replace(/_/g, " ")} — PKR{" "}
                                {modelPrices[m]?.toLocaleString()}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })()}
                  {(itemQuery || selectedProduct) && (
                    <button
                      className="absolute right-3 top-[11px] w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                      style={{
                        background: "rgba(255,77,106,.18)",
                        border: "none",
                        color: "#ff4d6a",
                        cursor: "pointer",
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setItemQuery("");
                        setSelectedProduct(null);
                        setShowItemResults(false);
                      }}
                      aria-label="Clear selected item"
                    >
                      ✕
                    </button>
                  )}

                  {showItemResults && (
                    <div
                      className="absolute left-0 right-0 mt-1 rounded-lg overflow-hidden"
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        zIndex: 40,
                        maxHeight: 380,
                        overflowY: "auto",
                        paddingBottom: 6,
                      }}
                    >
                      {itemLoading ? (
                        <div
                          className="px-3 py-3 text-[12px]"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Searching...
                        </div>
                      ) : itemResults.length === 0 ? (
                        <div
                          className="px-3 py-3 text-[12px]"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          No items found
                        </div>
                      ) : (
                        (() => {
                          // Only show unique product names
                          const uniqueNames = Array.from(
                            new Set(itemResults.map((p) => p.name)),
                          );
                          return uniqueNames.map((name) => {
                            const product = itemResults.find(
                              (p) => p.name === name,
                            );
                            // Use product._id if available, else fallback to name
                            const key =
                              product && product._id ? product._id : name;
                            return (
                              <button
                                key={key}
                                className="w-full text-left px-3 py-3 transition-colors"
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  borderBottom: "1px solid var(--border)",
                                  cursor: "pointer",
                                  color: "var(--text-primary)",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background =
                                    "var(--electric-glow)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background =
                                    "transparent";
                                }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  if (product) handleSelectProduct(product);
                                }}
                              >
                                <div className="text-[13px] font-semibold">
                                  {name}
                                </div>
                              </button>
                            );
                          });
                        })()
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <div
                      className="text-[11px] uppercase tracking-[.08em] mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Qty
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-ghost"
                        onClick={() => setDraftQty((q) => Math.max(1, q - 1))}
                      >
                        −
                      </button>
                      <div
                        className="fi flex-1 flex items-center justify-center font-inter font-semibold"
                        style={{ minHeight: 40 }}
                      >
                        {draftQty}
                      </div>
                      <button
                        className="btn btn-ghost"
                        onClick={() => setDraftQty((q) => q + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-[11px] uppercase tracking-[.08em] mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Box Qty
                    </label>
                    <input
                      className="fi"
                      type="number"
                      min={0}
                      placeholder="Optional"
                      value={draftBoxQty}
                      onChange={(e) => setDraftBoxQty(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <div
                      className="text-[11px] uppercase tracking-[.08em] mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Price
                    </div>
                    <div className="fi font-inter font-semibold">
                      PKR {selectedProduct?.price?.toLocaleString() ?? 0}
                    </div>
                  </div>
                  <div>
                    <div
                      className="text-[11px] uppercase tracking-[.08em] mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Total
                    </div>
                    <div className="fi font-inter font-semibold">
                      PKR{" "}
                      {(
                        (selectedProduct?.price ?? 0) * draftQty
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <button
                    className="btn btn-primary"
                    onClick={handleAddItem}
                    disabled={!selectedProduct}
                  >
                    + Add Item
                  </button>
                </div>
              </div>

              {/* Static Items List */}
              {items.length === 0 ? (
                <div
                  className="text-center py-8 rounded-lg text-[12px]"
                  style={{
                    color: "var(--text-muted)",
                    border: "1px dashed var(--border)",
                  }}
                >
                  No items added yet — search and add products above
                </div>
              ) : (
                <>
                  {/* Mobile */}
                  <div className="md:hidden flex flex-col gap-[8px]">
                    {items.map((item, i) => (
                      <div
                        key={item.productId + "-" + (item.productModel || "")}
                        className="rounded-lg px-[13px] py-[12px] flex items-center justify-between gap-3"
                        style={{
                          background: "var(--bg-input)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div className="min-w-0">
                          <div
                            className="font-semibold text-[14px] truncate"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {item.productName}
                          </div>
                          <div
                            className="text-[11px] mt-[1px]"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {item.productModel?.replace(/_/g, " ")}
                          </div>
                          <div
                            className="text-[11px] mt-[3px]"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {item.quantity} × PKR{" "}
                            {item.unitPriceSnapshot.toLocaleString()} · Boxes:{" "}
                            {item.boxQty ?? "—"}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div
                            className="font-inter font-bold text-[18px]"
                            style={{ color: "var(--text-primary)" }}
                          >
                            PKR{" "}
                            {(
                              item.quantity * item.unitPriceSnapshot
                            ).toLocaleString()}
                          </div>
                          <button
                            className="w-[34px] h-[34px] rounded-lg flex items-center justify-center"
                            style={{
                              background: "rgba(255,77,106,.1)",
                              border: "1px solid rgba(255,77,106,.2)",
                              color: "#ff4d6a",
                              cursor: "pointer",
                              fontSize: "15px",
                            }}
                            onClick={() =>
                              setItems((prev) =>
                                prev.filter((_, idx) => idx !== i),
                              )
                            }
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop */}
                  <div
                    className="hidden md:block rounded-lg overflow-hidden"
                    style={{ border: "1px solid var(--border)" }}
                  >
                    <div
                      className="grid px-[14px] py-[10px] text-[10px] uppercase tracking-[.12em] font-inter font-semibold"
                      style={{
                        gridTemplateColumns: "2fr 1fr 0.9fr 1.1fr 1.2fr 70px",
                        color: "var(--text-secondary)",
                        background: "rgba(255,255,255,0.02)",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <div>Product</div>
                      <div>Qty</div>
                      <div>Boxes</div>
                      <div>Unit Price</div>
                      <div>Line Total</div>
                      <div>Action</div>
                    </div>

                    {items.map((item, i) => (
                      <div
                        key={item.productId + "-" + (item.productModel || "")}
                        className="grid px-[14px] py-[12px] items-center"
                        style={{
                          gridTemplateColumns: "2fr 1fr 0.9fr 1.1fr 1.2fr 70px",
                          borderBottom:
                            i === items.length - 1
                              ? "none"
                              : "1px solid var(--border)",
                        }}
                      >
                        <div className="min-w-0 pr-3">
                          <div
                            className="font-semibold text-[14px] truncate"
                            style={{ color: "var(--text-primary)" }}
                            title={item.productName}
                          >
                            {item.productName}
                          </div>
                          <div
                            className="text-[12px] mt-[2px]"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {(item.productModel || "NO MODEL").replace(
                              /_/g,
                              " ",
                            )}
                          </div>
                        </div>

                        <div
                          className="text-[14px] font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {item.quantity}
                        </div>

                        <div
                          className="text-[14px]"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {item.boxQty ?? "—"}
                        </div>

                        <div
                          className="text-[14px]"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          PKR {item.unitPriceSnapshot.toLocaleString()}
                        </div>

                        <div
                          className="text-[15px] font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          PKR{" "}
                          {(
                            item.quantity * item.unitPriceSnapshot
                          ).toLocaleString()}
                        </div>

                        <div>
                          <button
                            className="w-[36px] h-[36px] rounded-lg flex items-center justify-center"
                            style={{
                              background: "rgba(255,77,106,.1)",
                              border: "1px solid rgba(255,77,106,.2)",
                              color: "#ff4d6a",
                              cursor: "pointer",
                              fontSize: "15px",
                            }}
                            onClick={() =>
                              setItems((prev) =>
                                prev.filter((_, idx) => idx !== i),
                              )
                            }
                            title="Remove item"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Totals */}
              {items.length > 0 && (
                <div
                  className="flex justify-end gap-[22px] pt-[13px]"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  {discount > 0 && (
                    <div className="text-right">
                      <div
                        className="text-[10px] uppercase tracking-[.1em] mb-[4px] font-inter"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Discount
                      </div>
                      <div
                        className="font-inter font-semibold text-[14px]"
                        style={{ color: "#ff4d6a" }}
                      >
                        −{" "}
                        {discountType === "PERCENT"
                          ? `${discountValue}%`
                          : "PKR"}{" "}
                        {discountType === "PERCENT"
                          ? `(PKR ${discount.toLocaleString()})`
                          : discount.toLocaleString()}
                      </div>
                    </div>
                  )}
                  <div className="text-right">
                    <div
                      className="text-[10px] uppercase tracking-[.1em] mb-[4px] font-inter"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Subtotal
                    </div>
                    <div
                      className="font-inter font-semibold text-[14px]"
                      style={{ color: "var(--text-primary)" }}
                    >
                      PKR {subtotal.toLocaleString()}
                    </div>
                  </div>
                  <div
                    className="text-right pl-[22px]"
                    style={{ borderLeft: "1px solid var(--border)" }}
                  >
                    <div
                      className="text-[10px] uppercase tracking-[.1em] mb-[4px] font-inter"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Grand Total
                    </div>
                    <div
                      className="font-inter font-extrabold text-[19px]"
                      style={{ color: "var(--electric-bright)" }}
                    >
                      PKR {grandTotal.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-[14px]">
          {/* Notes */}
          <div className="card">
            <div className="card-hdr">
              <div
                className="card-title"
                style={{ color: "var(--text-primary)" }}
              >
                Notes (Optional)
              </div>
            </div>
            <div className="p-[15px_17px]">
              <input
                className="fi"
                placeholder="Add a note..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Customer Preview */}
          <div className="card">
            <div className="card-hdr">
              <div
                className="card-title"
                style={{ color: "var(--text-primary)" }}
              >
                Customer Preview
              </div>
            </div>
            <div className="p-[15px_17px]">
              {selectedCustomer ? (
                <>
                  <div className="flex items-center gap-[11px] mb-[13px]">
                    <Avatar
                      initials={selectedCustomer.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                      gradient={GRADIENTS[gradientIndex % GRADIENTS.length]}
                      size="lg"
                    />
                    <div>
                      <div
                        className="font-semibold text-[14px]"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {selectedCustomer.name}
                      </div>
                      <div
                        className="text-[11px]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {selectedCustomer.shop_name ?? ""}{" "}
                        {selectedCustomer.phone
                          ? `· ${selectedCustomer.phone}`
                          : ""}
                      </div>
                    </div>
                  </div>
                  <div
                    className="p-[11px] rounded-lg"
                    style={{
                      background: "var(--electric-glow)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      className="text-[10px] uppercase tracking-[.1em] mb-[4px] font-inter"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Invoice Total
                    </div>
                    <div
                      className="font-inter font-extrabold text-[18px]"
                      style={{ color: "var(--electric-bright)" }}
                    >
                      PKR {grandTotal.toLocaleString()}
                    </div>
                  </div>
                </>
              ) : (
                <div
                  className="text-[12px] text-center py-4"
                  style={{ color: "var(--text-muted)" }}
                >
                  Select a customer
                </div>
              )}
            </div>
          </div>

          {/* Summary Card */}
          <div className="card">
            <div className="card-hdr">
              <div
                className="card-title"
                style={{ color: "var(--text-primary)" }}
              >
                Summary
              </div>
            </div>
            <div className="p-[15px_17px] flex flex-col gap-[10px]">
              <div className="flex justify-between text-[12px]">
                <span style={{ color: "var(--text-secondary)" }}>Items</span>
                <span style={{ color: "var(--text-primary)" }}>
                  {items.length}
                </span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span style={{ color: "var(--text-secondary)" }}>Subtotal</span>
                <span style={{ color: "var(--text-primary)" }}>
                  PKR {subtotal.toLocaleString()}
                </span>
              </div>

              <div className="pt-1">
                <div
                  className="text-[10px] uppercase tracking-[.1em] mb-[8px] font-inter"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Discount
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="btn"
                    style={{
                      background:
                        discountType === "PKR"
                          ? "var(--electric)"
                          : "var(--bg-input)",
                      color:
                        discountType === "PKR"
                          ? "#fff"
                          : "var(--text-secondary)",
                      border: "1px solid var(--border)",
                      minWidth: 62,
                    }}
                    onClick={() => setDiscountType("PKR")}
                  >
                    PKR
                  </button>
                  <button
                    className="btn"
                    style={{
                      background:
                        discountType === "PERCENT"
                          ? "var(--electric)"
                          : "var(--bg-input)",
                      color:
                        discountType === "PERCENT"
                          ? "#fff"
                          : "var(--text-secondary)",
                      border: "1px solid var(--border)",
                      minWidth: 46,
                    }}
                    onClick={() => setDiscountType("PERCENT")}
                  >
                    %
                  </button>
                  <input
                    className="fi"
                    type="text"
                    inputMode="decimal"
                    value={discountInput}
                    placeholder={
                      discountType === "PERCENT"
                        ? "Enter discount %"
                        : "Enter discount amount"
                    }
                    onChange={(e) => {
                      const next = e.target.value;
                      if (
                        next === "" ||
                        /^(\d+\.?\d{0,2}|\d*\.\d{1,2})$/.test(next)
                      ) {
                        setDiscountInput(next);
                        setDiscountValue(next === "" ? 0 : Number(next));
                      }
                    }}
                  />
                </div>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-[12px]">
                  <span style={{ color: "var(--text-secondary)" }}>
                    Discount
                  </span>
                  <span style={{ color: "#ff4d6a" }}>
                    - {discountType === "PERCENT" ? `${discountValue}%` : "PKR"}{" "}
                    {discountType === "PERCENT"
                      ? `(PKR ${discount.toLocaleString()})`
                      : discount.toLocaleString()}
                  </span>
                </div>
              )}
              <div
                className="flex justify-between text-[13px] font-inter font-bold pt-[8px]"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <span style={{ color: "var(--text-primary)" }}>
                  Grand Total
                </span>
                <span style={{ color: "var(--electric-bright)" }}>
                  PKR {grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewInvoice;
