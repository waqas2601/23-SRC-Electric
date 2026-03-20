import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Badge from "../components/ui/Badge";
import {
  appendInvoiceItemsAPI,
  deleteInvoiceAPI,
  getInvoiceByIdAPI,
  updateInvoiceAPI,
} from "../api/invoices";
import { getProductsAPI, type Product } from "../api/products";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { downloadInvoicePdf } from "../utils/invoicePdf";

interface InvoiceDetailData {
  _id: string;
  invoice_no: string;
  invoice_date: string;
  status: "unpaid" | "partial" | "completed";
  subtotal: number;
  discount: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  notes?: string;
  customer_id: {
    _id: string;
    name: string;
    shop_name?: string;
    phone?: string;
    address?: string;
  };
  items: Array<{
    _id?: string;
    product_name_snapshot: string;
    sku_snapshot?: string;
    model_snapshot?: string;
    type_snapshot?: "direct" | "model";
    quantity: number;
    box_qty?: number;
    unit_price_snapshot: number;
    line_total: number;
  }>;
}

const statusMap: Record<
  InvoiceDetailData["status"],
  "unpaid" | "partial" | "paid"
> = {
  unpaid: "unpaid",
  partial: "partial",
  completed: "paid",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function mixProductsByModel(items: Product[]) {
  const order = ["A_SERIES", "K_SERIES", "R_SERIES", "UNIQUE_SERIES"];
  const buckets = new Map<string, Product[]>();

  order.forEach((key) => buckets.set(key, []));
  items.forEach((item) => {
    const key = (item.model?.label || "").toUpperCase();
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

function itemType(item: InvoiceDetailData["items"][number]): "model" | "direct" {
  return item.type_snapshot ?? (item.model_snapshot ? "model" : "direct");
}

function InvoiceDetail() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();

  const [invoice, setInvoice] = useState<InvoiceDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [itemQuery, setItemQuery] = useState("");
  const [itemResults, setItemResults] = useState<Product[]>([]);
  const [itemLoading, setItemLoading] = useState(false);
  const [showItemResults, setShowItemResults] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [draftQty, setDraftQty] = useState(1);
  const [draftBoxQty, setDraftBoxQty] = useState("");
  const [appendLoading, setAppendLoading] = useState(false);
  const [discountSaving, setDiscountSaving] = useState(false);
  const [showDiscountEditor, setShowDiscountEditor] = useState(false);
  const [discountType, setDiscountType] = useState<"PKR" | "PERCENT">("PKR");
  const [discountValue, setDiscountValue] = useState(0);
  const [discountInput, setDiscountInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const fetchInvoice = useCallback(async () => {
    if (!token || !id) {
      setIsLoading(false);
      setError("Invoice not found");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const data = await getInvoiceByIdAPI(token, id);
      setInvoice(data as InvoiceDetailData);
    } catch (err: any) {
      setError(err.message || "Failed to load invoice");
      setInvoice(null);
    } finally {
      setIsLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  // Load all products once on mount
  useEffect(() => {
    if (!token) return;
    const loadAll = async () => {
      setItemLoading(true);
      try {
        const all: Product[] = [];
        let page = 1;
        while (true) {
          const data = await getProductsAPI(token, { page, limit: 100, isActive: true });
          all.push(...(data.items ?? []));
          if (all.length >= data.total || (data.items ?? []).length === 0) break;
          page++;
        }
        setAllProducts(all);
        setItemResults(all.filter((p) => p.type === "direct").slice(0, 20));
      } catch {
        setAllProducts([]);
        setItemResults([]);
      } finally {
        setItemLoading(false);
      }
    };
    void loadAll();
  }, [token]);

  // Filter client-side when query changes — append only allows direct products
  useEffect(() => {
    const directProducts = allProducts.filter((p) => p.type === "direct");
    const q = itemQuery.trim().toLowerCase();
    if (!q) {
      setItemResults(directProducts.slice(0, 20));
    } else {
      setItemResults(directProducts.filter((p) => p.name.toLowerCase().includes(q)));
    }
  }, [itemQuery, allProducts]);

  const totals = useMemo(() => {
    if (!invoice) {
      return { subtotal: 0, discount: 0, total: 0, paid: 0, remaining: 0 };
    }

    return {
      subtotal: invoice.subtotal ?? 0,
      discount: invoice.discount ?? 0,
      total: invoice.total_amount ?? 0,
      paid: invoice.paid_amount ?? 0,
      remaining: invoice.remaining_amount ?? 0,
    };
  }, [invoice]);

  useEffect(() => {
    if (!invoice) return;
    setDiscountType("PKR");
    setDiscountValue(invoice.discount ?? 0);
    setDiscountInput("");
    setShowDiscountEditor(false);
  }, [invoice]);

  const modelSubtotal = useMemo(() => {
    if (!invoice) return 0;
    return (invoice.items ?? [])
      .filter((i) => itemType(i) === "model")
      .reduce((s, i) => s + i.line_total, 0);
  }, [invoice]);

  const computedDiscount = useMemo(() => {
    if (!invoice) return 0;
    const subtotal = invoice.subtotal ?? 0;
    const raw =
      discountType === "PKR"
        ? discountValue
        : (subtotal * Math.max(0, discountValue)) / 100;
    return Math.max(0, Math.round(raw));
  }, [invoice, discountType, discountValue]);

  const handleDeleteInvoice = async () => {
    if (!token || !invoice || deleting) return;

    const ok = window.confirm(
      `Delete invoice #${invoice.invoice_no}? This cannot be undone.`,
    );
    if (!ok) return;

    setDeleting(true);
    try {
      await deleteInvoiceAPI(token, invoice._id);
      showToast("success", "Invoice deleted successfully");
      navigate("/invoices");
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete invoice");
    } finally {
      setDeleting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!invoice) return;

    await downloadInvoicePdf({
      invoiceNo: invoice.invoice_no,
      invoiceDate: invoice.invoice_date,
      customerName: invoice.customer_id?.name ?? "—",
      subtotal: invoice.subtotal ?? 0,
      discount: invoice.discount ?? 0,
      total: invoice.total_amount ?? 0,
      paidAmount: invoice.paid_amount,
      remainingAmount: invoice.remaining_amount,
      notes: invoice.notes,
      items: (invoice.items ?? []).map((item) => ({
        productName: item.product_name_snapshot,
        sku: item.sku_snapshot,
        modelLabel: item.model_snapshot,
        quantity: item.quantity ?? 0,
        boxQty: item.box_qty ?? null,
        unitPrice: item.unit_price_snapshot ?? 0,
        lineTotal: item.line_total ?? 0,
        type: itemType(item),
      })),
    });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setItemQuery(product.name);
    setShowItemResults(false);
    setDraftQty(1);
    setDraftBoxQty("");
    // Model dropdown logic
    if (product.type === "model") {
      const models = allProducts
        .filter((p) => p.name === product.name && p.model)
        .map((p) => p.model);
      setSelectedModel(null);
      if (models.length === 1) setSelectedModel(models[0]?.label ?? null);
    } else {
      setSelectedModel(product.model?.label ?? null);
    }
  };

  const handleAppendItem = async () => {
    if (!token || !invoice || !selectedProduct || appendLoading) return;

    // Direct products have no model variants — skip model check

    const parsed = draftBoxQty.trim();
    if (parsed !== "" && Number.isNaN(Number(parsed))) {
      showToast("error", "Box quantity must be a valid number");
      return;
    }

    const qty = Math.max(1, draftQty);
    const boxQty = parsed === "" ? null : Math.max(0, Number(parsed));

    setAppendLoading(true);
    try {
      await appendInvoiceItemsAPI(token, invoice._id, {
        items: [
          {
            productId: selectedProduct._id,
            quantity: qty,
            unitPriceSnapshot: selectedProduct.price,
            ...(boxQty !== null ? { boxQty } : {}),
          },
        ],
      });

      showToast("success", "Item added to invoice");
      setSelectedProduct(null);
      setItemQuery("");
      setDraftQty(1);
      setDraftBoxQty("");
      setShowItemResults(false);
      setSelectedModel(null);
      await fetchInvoice();
    } catch (err: any) {
      showToast("error", err.message || "Failed to add item");
    } finally {
      setAppendLoading(false);
    }
  };
  const handleUpdateDiscount = async () => {
    if (!token || !invoice || discountSaving) return;

    if (!Number.isFinite(discountValue) || discountValue < 0) {
      showToast("error", "Discount must be a valid non-negative number");
      return;
    }

    if (discountType === "PERCENT" && discountValue > 100) {
      showToast("error", "Discount percentage cannot exceed 100%");
      return;
    }

    const discount = computedDiscount;
    if (discount > modelSubtotal) {
      showToast("error", "Discount cannot exceed model items total");
      return;
    }

    setDiscountSaving(true);
    try {
      await updateInvoiceAPI(token, invoice._id, {
        discount,
      });
      showToast("success", "Discount updated successfully");
      await fetchInvoice();
      setShowDiscountEditor(false); // Close editor after saving
    } catch (err: any) {
      showToast("error", err.message || "Failed to update discount");
    } finally {
      setDiscountSaving(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn .2s ease" }}>
      <div className="flex items-center justify-between mb-[14px] flex-wrap gap-[10px]">
        <div>
          <div
            className="font-inter font-extrabold text-[18px]"
            style={{ color: "var(--text-primary)" }}
          >
            Invoice{" "}
            <span style={{ color: "var(--electric)" }}>
              #{invoice?.invoice_no ?? id}
            </span>
          </div>
          {invoice?.invoice_date && (
            <div
              className="text-[12px]"
              style={{ color: "var(--text-secondary)" }}
            >
              Date: {formatDate(invoice.invoice_date)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-[8px] flex-wrap">
          <button
            className="btn btn-ghost"
            onClick={() => navigate("/invoices")}
          >
            ← Back to Invoices
          </button>
          {invoice && (
            <button
              className="btn btn-ghost"
              onClick={handleExportPdf}
              title="Export / Print"
            >
              Export PDF
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          className="p-[10px_13px] rounded-lg mb-[14px] text-[12px] font-inter"
          style={{
            background: "rgba(255,77,106,.1)",
            border: "1px solid rgba(255,77,106,.2)",
            color: "#ff4d6a",
          }}
        >
          {error}
        </div>
      )}

      {isLoading ? (
        <div
          className="card p-[20px] text-center font-medium text-[15px]"
          style={{ color: "var(--text-secondary)" }}
        >
          Loading invoice...
        </div>
      ) : !invoice ? (
        <div
          className="card p-[20px] text-center font-medium text-[15px]"
          style={{ color: "var(--text-secondary)" }}
        >
          Invoice not found.
        </div>
      ) : (
        <div className="flex flex-col gap-[10px]">
          <div className="card p-[12px]">
            <div className="flex items-start justify-between gap-3 mb-[12px]">
              <div>
                <div
                  className="text-[11px] tracking-[1px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  INVOICE
                </div>
                <div
                  className="font-inter font-extrabold text-[20px] leading-[1.12]"
                  style={{ color: "var(--text-primary)" }}
                >
                  #{invoice.invoice_no}
                </div>
              </div>
              <div className="flex items-center gap-[8px]">
                <Badge status={statusMap[invoice.status]} />
                <button
                  className="btn btn-ghost"
                  onClick={handleDeleteInvoice}
                  disabled={deleting}
                  style={{
                    color: "#ff4d6a",
                    borderColor: "rgba(255,77,106,.3)",
                  }}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>

            <div className="flex items-end justify-between gap-[10px] flex-wrap mb-[10px]">
              <div>
                <div
                  className="font-inter font-semibold text-[19px] leading-[1.12]"
                  style={{ color: "var(--text-primary)" }}
                >
                  {invoice.customer_id?.name ?? "—"}
                </div>
                <div
                  className="text-[13px] font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {invoice.customer_id?.shop_name || "No shop name"}
                </div>
              </div>
              <div
                className="text-[13px]"
                style={{ color: "var(--text-secondary)" }}
              >
                {formatDate(invoice.invoice_date)}
              </div>
            </div>

            <div
              className="h-[1px] mb-[12px]"
              style={{ background: "var(--border)" }}
            />

            <div className="flex flex-col gap-[8px] text-[14px]">
              <div className="flex items-center justify-between">
                <span
                  className="text-[14px] font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Subtotal
                </span>
                <span style={{ color: "var(--text-primary)" }}>
                  PKR {totals.subtotal.toLocaleString()}
                </span>
              </div>
              {!showDiscountEditor && (
                <div className="flex items-center justify-between">
                  <span
                    className="text-[14px] font-medium"
                    style={{ color: "#ff4d6a" }}
                  >
                    Discount
                  </span>
                  <span style={{ color: "#ff4d6a" }}>
                    - PKR {totals.discount.toLocaleString()}
                  </span>
                </div>
              )}

              {showDiscountEditor && (
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
                        height: 36,
                        padding: "0 12px",
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
                        height: 36,
                        padding: "0 12px",
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

                  {computedDiscount > 0 && (
                    <div className="flex items-center justify-between mt-[8px] text-[13px]">
                      <span style={{ color: "var(--text-secondary)" }}>
                        Applied
                      </span>
                      <span style={{ color: "#ff4d6a" }}>
                        -{" "}
                        {discountType === "PERCENT"
                          ? `${discountValue}%`
                          : "PKR"}{" "}
                        {discountType === "PERCENT"
                          ? `PKR ${computedDiscount.toLocaleString()}`
                          : computedDiscount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              className="h-[1px] my-[12px]"
              style={{ background: "var(--border)" }}
            />

            <div className="flex items-center justify-between gap-[10px] flex-wrap">
              <span
                className="font-inter font-bold text-[17px] leading-[1.15]"
                style={{ color: "var(--text-primary)" }}
              >
                Total
              </span>
              <div className="flex items-center gap-[8px]">
                <span
                  className="font-inter font-extrabold text-[22px] leading-[1.1]"
                  style={{ color: "var(--text-primary)" }}
                >
                  PKR{" "}
                  {(showDiscountEditor
                    ? totals.subtotal - computedDiscount
                    : totals.total
                  ).toLocaleString()}
                </span>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    if (!showDiscountEditor) {
                      setDiscountType("PKR");
                      setDiscountValue(invoice.discount ?? 0);
                      setDiscountInput("");
                      setShowDiscountEditor(true);
                      return;
                    }
                    void handleUpdateDiscount();
                  }}
                  disabled={
                    discountSaving ||
                    (invoice && invoice.discount > 0 && !showDiscountEditor)
                  }
                  style={{ fontSize: "12px", padding: "6px 10px" }}
                >
                  {discountSaving
                    ? "Saving..."
                    : showDiscountEditor
                      ? "Save Discount"
                      : invoice && invoice.discount > 0
                        ? "Discount Applied"
                        : "Add Discount"}
                </button>
                {showDiscountEditor && (
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setDiscountType("PKR");
                      setDiscountValue(invoice.discount ?? 0);
                      setDiscountInput("");
                      setShowDiscountEditor(false);
                    }}
                    disabled={discountSaving}
                    style={{ fontSize: "12px", padding: "6px 10px" }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <div
              className="h-[1px] my-[12px]"
              style={{ background: "var(--border)" }}
            />

            <button
              className="btn btn-ghost w-full justify-start"
              onClick={handleExportPdf}
            >
              Export PDF
            </button>
          </div>

          {(() => {
            const modelItems = (invoice.items ?? []).filter((i) => itemType(i) === "model");
            const directItems = (invoice.items ?? []).filter((i) => itemType(i) === "direct");
            const modelSubtotal = modelItems.reduce((s, i) => s + i.line_total, 0);
            const directSubtotal = directItems.reduce((s, i) => s + i.line_total, 0);
            const modelNet = modelSubtotal - (invoice.discount ?? 0);
            const hasBoth = modelItems.length > 0 && directItems.length > 0;

            const renderItems = (items: typeof invoice.items) =>
              items.map((item, idx) => (
                <div
                  key={item._id || `${item.sku_snapshot}-${idx}`}
                  className="flex items-start justify-between gap-[10px] p-[14px]"
                  style={{ borderBottom: idx < items.length - 1 ? "1px solid var(--border)" : "none" }}
                >
                  <div>
                    <div className="font-inter font-semibold text-[15px] leading-[1.25]" style={{ color: "var(--text-primary)" }}>
                      {item.product_name_snapshot}
                    </div>
                    <div className="text-[12px] mt-[4px] font-medium" style={{ color: "var(--text-secondary)" }}>
                      {item.quantity} × PKR {item.unit_price_snapshot.toLocaleString()} · {item.box_qty ?? "—"} boxes
                    </div>
                  </div>
                  <div className="font-inter font-bold text-[16px] leading-[1.2]" style={{ color: "var(--text-primary)" }}>
                    PKR {item.line_total.toLocaleString()}
                  </div>
                </div>
              ));

            return (
              <>
                {modelItems.length > 0 && (
                  <>
                    <div className="text-[11px] tracking-[1px] font-inter font-semibold mt-[2px]" style={{ color: "var(--text-secondary)" }}>
                      MODEL PRODUCTS
                    </div>
                    <div className="card p-0 overflow-hidden">
                      {renderItems(modelItems)}
                      <div className="flex items-center justify-between p-[10px_14px]" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-input)" }}>
                        <span className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>Model Subtotal</span>
                        <span className="font-inter font-semibold text-[14px]" style={{ color: "var(--text-primary)" }}>PKR {modelSubtotal.toLocaleString()}</span>
                      </div>
                      {(invoice.discount ?? 0) > 0 && (
                        <div className="flex items-center justify-between p-[6px_14px]">
                          <span className="text-[13px] font-medium" style={{ color: "#ff4d6a" }}>Discount</span>
                          <span className="font-inter font-semibold text-[13px]" style={{ color: "#ff4d6a" }}>− PKR {(invoice.discount ?? 0).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between p-[10px_14px]" style={{ borderTop: "1px solid var(--border)" }}>
                        <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>Net (Model)</span>
                        <span className="font-inter font-bold text-[15px]" style={{ color: "var(--text-primary)" }}>PKR {modelNet.toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                )}

                {directItems.length > 0 && (
                  <>
                    <div className="text-[11px] tracking-[1px] font-inter font-semibold mt-[2px]" style={{ color: "var(--text-secondary)" }}>
                      DIRECT PRODUCTS
                    </div>
                    <div className="card p-0 overflow-hidden">
                      {renderItems(directItems)}
                      <div className="flex items-center justify-between p-[10px_14px]" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-input)" }}>
                        <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>Direct Total</span>
                        <span className="font-inter font-bold text-[15px]" style={{ color: "var(--text-primary)" }}>PKR {directSubtotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                )}

                {hasBoth && (
                  <div className="card p-[14px] flex items-center justify-between">
                    <span className="font-inter font-bold text-[17px]" style={{ color: "var(--text-primary)" }}>Grand Total</span>
                    <span className="font-inter font-extrabold text-[22px]" style={{ color: "var(--text-primary)" }}>PKR {totals.total.toLocaleString()}</span>
                  </div>
                )}

                {!(invoice.items?.length) && (
                  <div className="card p-0 overflow-hidden">
                    <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>No items found</div>
                  </div>
                )}
              </>
            );
          })()}

          <div
            className="text-[11px] tracking-[1px] font-inter font-semibold mt-[2px]"
            style={{ color: "var(--text-secondary)" }}
          >
            ADD ITEMS
          </div>

          <div className="card p-[12px]" style={{ overflow: "visible" }}>
            <div
              className="rounded-xl p-[13px] relative z-[30]"
              style={{
                border: "1px solid var(--border)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div className="relative" style={{ overflow: "visible" }}>
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
                      setSelectedModel(null);
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
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
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
                        const uniqueNames = Array.from(
                          new Set(itemResults.map((p) => p.name)),
                        );
                        return uniqueNames.map((name) => {
                          const product = itemResults.find(
                            (p) => p.name === name,
                          );
                          const key = product?._id ?? name;
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
                  className="btn btn-primary w-full justify-center"
                  onClick={handleAppendItem}
                  disabled={!selectedProduct || appendLoading}
                  style={{
                    opacity: !selectedProduct || appendLoading ? 0.7 : 1,
                  }}
                >
                  {appendLoading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "+ Add Item to List"
                  )}
                </button>
              </div>
            </div>

            {showItemResults && (
              <div
                className="fixed inset-0 z-[20]"
                style={{
                  background: "rgba(0,0,0,0.35)",
                  backdropFilter: "blur(4px)",
                }}
                onClick={() => setShowItemResults(false)}
              />
            )}
          </div>

          <div
            className="text-[11px] tracking-[1px] font-inter font-semibold mt-[2px]"
            style={{ color: "var(--text-secondary)" }}
          >
            NOTES
          </div>

          <div className="card p-[14px]">
            <div style={{ color: "var(--text-secondary)" }}>
              {invoice.notes?.trim() || "No notes"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvoiceDetail;
