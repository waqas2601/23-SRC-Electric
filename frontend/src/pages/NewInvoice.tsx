import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProductsAPI } from "../api/products";
import { getCustomersAPI } from "../api/customers";
import { addInvoiceAPI, addPaymentToInvoiceAPI } from "../api/invoices";
import Avatar from "../components/ui/Avatar";
import CustomerSearch from "../components/ui/CustomerSeacrh";
import { addCustomerAPI } from "../api/customers";
import ProductSearch from "../components/ui/ProductSearch";

interface Product {
  _id: string;
  name: string;
  price: number;
  sku: string;
}

interface Customer {
  _id: string;
  name: string;
  shop_name?: string;
  phone?: string;
}

interface LineItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceSnapshot: number;
}

const GRADIENTS = ["default", "cyan", "green", "purple", "red"];

function NewInvoice() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<
    "unpaid" | "partial" | "paid"
  >("unpaid");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK" | "OTHER">(
    "CASH",
  );
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");

  // Fetch products and customers on load
  useEffect(() => {
    const fetchData = async () => {
      setIsFetching(true);
      try {
        const prodData = await getProductsAPI(token!, {
          limit: 100,
          isActive: true,
        });
        const productList = prodData.items ?? [];
        setProducts(productList);
        if (productList.length > 0) {
          setItems([
            {
              productId: productList[0]._id,
              productName: productList[0].name,
              quantity: 1,
              unitPriceSnapshot: productList[0].price,
            },
          ]);
        }
      } catch (err: any) {
        setError("Failed to load products");
      } finally {
        setIsFetching(false);
      }
    };
    fetchData();
  }, [token]);

  const [selectedCustomer, setSelectedCustomer] = useState<{
    _id: string;
    name: string;
    shop_name?: string;
    phone?: string;
  } | null>(null);
  const gradientIndex = customers.findIndex(
    (c) => c._id === selectedCustomerId,
  );

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceSnapshot,
    0,
  );
  const grandTotal = subtotal - discount;

  const handleSubmit = async () => {
    if (!selectedCustomerId && !newCustomerName?.trim()) {
      setError("Please select or enter a customer name");
      return;
    }
    if (items.length === 0) {
      setError("Please add at least one item");
      return;
    }
    if (paymentStatus !== "unpaid" && paymentAmount <= 0) {
      setError("Please enter payment amount");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      let customerId = selectedCustomerId;

      // Create new customer if name was typed manually
      if (!customerId && newCustomerName?.trim()) {
        const newCust = await addCustomerAPI(token!, {
          name: newCustomerName.trim(),
        });
        customerId = newCust.customer?._id ?? newCust._id;
      }

      const inv = await addInvoiceAPI(token!, {
        customerId,
        invoiceDate,
        discount,
        notes,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPriceSnapshot: item.unitPriceSnapshot,
        })),
      });

      // Add payment if provided
      if (paymentStatus !== "unpaid" && paymentAmount > 0) {
        const invoiceId = inv.invoice?._id ?? inv._id;
        await addPaymentToInvoiceAPI(token!, invoiceId, {
          paymentDate: invoiceDate,
          amount: paymentAmount,
          method: paymentMethod,
          reference: paymentReference || undefined,
          notes: paymentNotes || undefined,
        });
      }

      navigate("/invoices");
    } catch (err: any) {
      setError(err.message || "Failed to create invoice");
    } finally {
      setIsLoading(false);
    }
  };
  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#e8141c", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

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
          <div className="card">
            <div className="card-hdr">
              <div className="card-title">Invoice Details</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[13px] p-[16px]">
              <div>
                <label
                  className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Invoice Date
                </label>
                <input
                  className="fi"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
              <div>
                <label
                  className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Discount (PKR)
                </label>
                <input
                  className="fi"
                  type="number"
                  value={discount}
                  min={0}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </div>
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
              <div className="sm:col-span-2">
                <label
                  className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Notes (Optional)
                </label>
                <input
                  className="fi"
                  placeholder="Any notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="card">
            <div className="card-hdr">
              <div className="card-title">Line Items</div>
              <span
                className="text-[11px]"
                style={{ color: "var(--text-muted)" }}
              >
                {items.length} item{items.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="p-[17px] flex flex-col gap-[14px]">
              {/* Product Search Row */}
              <ProductSearch
                onAdd={(product, qty) => {
                  setItems((prev) => [
                    ...prev,
                    {
                      productId: product._id,
                      productName: product.name,
                      quantity: qty,
                      unitPriceSnapshot: product.price,
                    },
                  ]);
                }}
              />

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
                <div className="flex flex-col gap-[8px]">
                  {/* Header */}
                  <div
                    className="hidden sm:grid text-[9px] uppercase tracking-[.12em] font-inter font-semibold px-[13px] pb-[6px]"
                    style={{
                      gridTemplateColumns: "1fr 60px 110px 110px 36px",
                      color: "var(--text-muted)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <span>Product</span>
                    <span>Qty</span>
                    <span>Unit Price</span>
                    <span>Total</span>
                    <span></span>
                  </div>

                  {/* Items */}
                  {items.map((item, i) => (
                    <div
                      key={i}
                      className="rounded-lg px-[13px] py-[11px]"
                      style={{
                        background: "var(--bg-input)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {/* Desktop */}
                      <div
                        className="hidden sm:grid items-center gap-[10px]"
                        style={{
                          gridTemplateColumns: "1fr 60px 110px 110px 36px",
                        }}
                      >
                        <div>
                          <div
                            className="text-[13px] font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {item.productName}
                          </div>
                        </div>
                        <div
                          className="font-inter font-bold text-[13px]"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {item.quantity}
                        </div>
                        <div
                          className="text-[13px]"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          PKR {item.unitPriceSnapshot.toLocaleString()}
                        </div>
                        <div
                          className="font-inter font-bold text-[13px]"
                          style={{ color: "var(--electric-bright)" }}
                        >
                          PKR{" "}
                          {(
                            item.quantity * item.unitPriceSnapshot
                          ).toLocaleString()}
                        </div>
                        <button
                          className="w-[36px] h-[36px] rounded-lg flex items-center justify-center"
                          style={{
                            background: "rgba(255,77,106,.1)",
                            border: "1px solid rgba(255,77,106,.2)",
                            color: "#ff4d6a",
                            cursor: "pointer",
                            fontSize: "16px",
                          }}
                          onClick={() =>
                            setItems((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            )
                          }
                        >
                          ×
                        </button>
                      </div>

                      {/* Mobile */}
                      <div className="sm:hidden flex items-start justify-between gap-2">
                        <div>
                          <div
                            className="font-semibold text-[13px] mb-[3px]"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {item.productName}
                          </div>
                          <div
                            className="text-[11px]"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            Qty: {item.quantity} · PKR{" "}
                            {item.unitPriceSnapshot.toLocaleString()} each
                          </div>
                          <div
                            className="text-[12px] font-bold mt-[3px]"
                            style={{ color: "var(--electric-bright)" }}
                          >
                            PKR{" "}
                            {(
                              item.quantity * item.unitPriceSnapshot
                            ).toLocaleString()}
                          </div>
                        </div>
                        <button
                          className="w-[34px] h-[34px] rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: "rgba(255,77,106,.1)",
                            border: "1px solid rgba(255,77,106,.2)",
                            color: "#ff4d6a",
                            cursor: "pointer",
                            fontSize: "16px",
                          }}
                          onClick={() =>
                            setItems((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            )
                          }
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
                        − PKR {discount.toLocaleString()}
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
              {discount > 0 && (
                <div className="flex justify-between text-[12px]">
                  <span style={{ color: "var(--text-secondary)" }}>
                    Discount
                  </span>
                  <span style={{ color: "#ff4d6a" }}>
                    - PKR {discount.toLocaleString()}
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
          {/* Payment Info */}
          <div className="card">
            <div className="card-hdr">
              <div className="card-title">Payment Info</div>
            </div>
            <div className="p-[15px_17px] flex flex-col gap-[13px]">
              {/* Status chips */}
              <div>
                <label
                  className="block text-[10px] uppercase tracking-[.1em] mb-[8px] font-inter font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Payment Status
                </label>
                <div className="flex gap-[7px]">
                  {(["unpaid", "partial", "paid"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setPaymentStatus(s);
                        if (s === "unpaid") setPaymentAmount(0);
                        if (s === "paid") setPaymentAmount(grandTotal);
                      }}
                      className="flex-1 py-[7px] rounded-lg text-[11px] font-inter font-semibold capitalize transition-all"
                      style={{
                        border: "1px solid",
                        cursor: "pointer",
                        background:
                          paymentStatus === s
                            ? s === "paid"
                              ? "rgba(0,201,122,.15)"
                              : s === "partial"
                                ? "rgba(255,176,32,.15)"
                                : "rgba(255,77,106,.15)"
                            : "var(--bg-input)",
                        borderColor:
                          paymentStatus === s
                            ? s === "paid"
                              ? "#00c97a"
                              : s === "partial"
                                ? "#ffb020"
                                : "#ff4d6a"
                            : "var(--border)",
                        color:
                          paymentStatus === s
                            ? s === "paid"
                              ? "#00c97a"
                              : s === "partial"
                                ? "#ffb020"
                                : "#ff4d6a"
                            : "var(--text-secondary)",
                      }}
                    >
                      {s === "paid"
                        ? "✓ Paid"
                        : s === "partial"
                          ? "◑ Partial"
                          : "○ Unpaid"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount received — only show if partial or paid */}
              {paymentStatus !== "unpaid" && (
                <>
                  <div>
                    <label
                      className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Amount Received (PKR)
                    </label>
                    <input
                      className="fi"
                      type="number"
                      placeholder="0"
                      value={paymentAmount || ""}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Payment Method
                    </label>
                    <select
                      className="fi"
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(
                          e.target.value as "CASH" | "BANK" | "OTHER",
                        )
                      }
                    >
                      <option value="CASH">Cash</option>
                      <option value="BANK">Bank Transfer</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label
                      className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Reference (Optional)
                    </label>
                    <input
                      className="fi"
                      placeholder="e.g. TRX-123"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Payment Notes
                    </label>
                    <input
                      className="fi"
                      placeholder="Optional..."
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Balance preview */}
              <div
                className="p-[11px] rounded-lg"
                style={{
                  background:
                    paymentStatus === "paid"
                      ? "rgba(0,201,122,.08)"
                      : "rgba(255,77,106,.08)",
                  border: `1px solid ${
                    paymentStatus === "paid"
                      ? "rgba(0,201,122,.2)"
                      : "rgba(255,77,106,.2)"
                  }`,
                }}
              >
                <div className="flex justify-between items-center">
                  <div
                    className="text-[10px] uppercase tracking-[.1em] font-inter"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Remaining After
                  </div>
                  <div
                    className="font-inter font-extrabold text-[16px]"
                    style={{
                      color:
                        paymentStatus === "paid"
                          ? "#00c97a"
                          : grandTotal - paymentAmount <= 0
                            ? "#00c97a"
                            : "#ff4d6a",
                    }}
                  >
                    PKR{" "}
                    {Math.max(0, grandTotal - paymentAmount).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewInvoice;
