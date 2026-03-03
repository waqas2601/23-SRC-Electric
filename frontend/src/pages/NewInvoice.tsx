import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../components/ui/Avatar";

interface LineItem {
  product: string;
  qty: number;
  price: number;
}

const PRODUCTS = [
  { name: "3-Core Copper Wire (SRC-W-001)", price: 85 },
  { name: "MCB 32A Single Pole (SRC-B-014)", price: 420 },
  { name: "LED Bulb 18W (SRC-L-007)", price: 320 },
  { name: "Junction Box IP65 (SRC-J-022)", price: 190 },
  { name: "Modular Switch 6A (SRC-S-031)", price: 145 },
];

const CUSTOMERS = [
  {
    name: "Ahmad Electronics",
    shop: "Main Bazaar · 0300-1234567",
    balance: "PKR 18,500",
    initials: "AE",
    gradient: "default",
  },
  {
    name: "Zahid Traders",
    shop: "Saddar · 0311-9876543",
    balance: "PKR 8,200",
    initials: "ZT",
    gradient: "cyan",
  },
  {
    name: "Raza Stores",
    shop: "Civil Lines · 0333-4561234",
    balance: "PKR 0",
    initials: "RS",
    gradient: "green",
  },
  {
    name: "M. Khan & Sons",
    shop: "Kharian Road · 0345-7778899",
    balance: "PKR 5,000",
    initials: "MK",
    gradient: "purple",
  },
];

function NewInvoice() {
  const navigate = useNavigate();
  const [selectedCustomer, setSelectedCustomer] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState("Unpaid");
  const [amountReceived, setAmountReceived] = useState("");
  const [notes, setNotes] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("2026-02-28");
  const [items, setItems] = useState<LineItem[]>([
    { product: PRODUCTS[0].name, qty: 50, price: PRODUCTS[0].price },
    { product: PRODUCTS[1].name, qty: 10, price: PRODUCTS[1].price },
    { product: PRODUCTS[2].name, qty: 20, price: PRODUCTS[2].price },
  ]);

  const updateItem = (
    index: number,
    field: keyof LineItem,
    value: string | number,
  ) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (field === "product") {
          const found = PRODUCTS.find((p) => p.name === value);
          return {
            ...item,
            product: value as string,
            price: found?.price ?? item.price,
          };
        }
        return { ...item, [field]: value };
      }),
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { product: PRODUCTS[0].name, qty: 1, price: PRODUCTS[0].price },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const customer = CUSTOMERS[selectedCustomer];

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
          <button className="btn btn-ghost">Save Draft</button>
          <button className="btn btn-primary">Generate</button>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_310px] gap-[16px]">
        {/* LEFT */}
        <div className="flex flex-col gap-[14px]">
          {/* Invoice Details */}
          <div className="card">
            <div className="card-hdr">
              <div
                className="card-title"
                style={{ color: "var(--text-primary)" }}
              >
                Invoice Details
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[13px] p-[16px]">
              <div>
                <label
                  className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Invoice Number
                </label>
                <input
                  className="fi"
                  value="#INV-0043"
                  readOnly
                  style={{ color: "var(--electric-bright)" }}
                />
              </div>
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
              <div className="sm:col-span-2">
                <label
                  className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Select Customer
                </label>
                <select
                  className="fi"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(Number(e.target.value))}
                >
                  {CUSTOMERS.map((c, i) => (
                    <option key={c.name} value={i}>
                      {c.name}
                    </option>
                  ))}
                </select>
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
              <button
                className="btn btn-ghost"
                style={{ padding: "5px 11px", fontSize: "11px" }}
                onClick={addItem}
              >
                + Add Item
              </button>
            </div>
            <div className="p-[17px]">
              {/* Desktop Header */}
              <div
                className="hidden sm:grid gap-[9px] pb-[8px] mb-[9px] text-[9px] uppercase tracking-[.12em] font-inter font-semibold"
                style={{
                  gridTemplateColumns: "2fr 80px 100px 100px 38px",
                  borderBottom: "1px solid var(--border)",
                  color: "var(--text-muted)",
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
                <div key={i} className="mb-[12px]">
                  {/* Desktop Row */}
                  <div
                    className="hidden sm:grid gap-[9px] items-center"
                    style={{ gridTemplateColumns: "2fr 80px 100px 100px 38px" }}
                  >
                    <select
                      className="fi"
                      value={item.product}
                      onChange={(e) => updateItem(i, "product", e.target.value)}
                    >
                      {PRODUCTS.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <input
                      className="fi"
                      type="number"
                      value={item.qty}
                      min={1}
                      onChange={(e) =>
                        updateItem(i, "qty", Number(e.target.value))
                      }
                    />
                    <input className="fi" value={item.price} readOnly />
                    <input
                      className="fi"
                      value={(item.qty * item.price).toLocaleString()}
                      readOnly
                      style={{ color: "var(--electric-bright)" }}
                    />
                    <button
                      onClick={() => removeItem(i)}
                      className="w-[38px] h-[38px] rounded-[6px] flex items-center justify-center text-[16px] flex-shrink-0"
                      style={{
                        background: "rgba(255,77,106,.1)",
                        border: "1px solid rgba(255,77,106,.2)",
                        color: "#ff4d6a",
                        cursor: "pointer",
                      }}
                    >
                      ×
                    </button>
                  </div>

                  {/* Mobile Row */}
                  <div
                    className="sm:hidden rounded-lg p-[12px] mb-[8px]"
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {/* Product */}
                    <div className="mb-[10px]">
                      <label
                        className="block text-[9px] uppercase tracking-[.12em] mb-[5px] font-inter font-semibold"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Product
                      </label>
                      <select
                        className="fi"
                        value={item.product}
                        onChange={(e) =>
                          updateItem(i, "product", e.target.value)
                        }
                      >
                        {PRODUCTS.map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Qty + Price + Total */}
                    <div className="grid grid-cols-3 gap-[8px] mb-[10px]">
                      <div>
                        <label
                          className="block text-[9px] uppercase tracking-[.12em] mb-[5px] font-inter font-semibold"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Qty
                        </label>
                        <input
                          className="fi"
                          type="number"
                          value={item.qty}
                          min={1}
                          onChange={(e) =>
                            updateItem(i, "qty", Number(e.target.value))
                          }
                        />
                      </div>
                      <div>
                        <label
                          className="block text-[9px] uppercase tracking-[.12em] mb-[5px] font-inter font-semibold"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Price
                        </label>
                        <input className="fi" value={item.price} readOnly />
                      </div>
                      <div>
                        <label
                          className="block text-[9px] uppercase tracking-[.12em] mb-[5px] font-inter font-semibold"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Total
                        </label>
                        <input
                          className="fi"
                          value={(item.qty * item.price).toLocaleString()}
                          readOnly
                          style={{ color: "var(--electric-bright)" }}
                        />
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(i)}
                      className="w-full py-[6px] rounded-[6px] text-[12px] font-inter font-semibold flex items-center justify-center gap-[6px]"
                      style={{
                        background: "rgba(255,77,106,.1)",
                        border: "1px solid rgba(255,77,106,.2)",
                        color: "#ff4d6a",
                        cursor: "pointer",
                      }}
                    >
                      × Remove Item
                    </button>
                  </div>
                </div>
              ))}

              {/* Totals */}
              <div
                className="flex justify-end gap-[22px] pt-[13px] mt-[4px]"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <div className="text-right">
                  <div
                    className="text-[10px] uppercase tracking-[.1em] mb-[4px] font-inter"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Subtotal
                  </div>
                  <div
                    className="font-inter font-semibold text-[15px]"
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
                    PKR {subtotal.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-[14px]">
          {/* Payment Info */}
          <div className="card">
            <div className="card-hdr">
              <div
                className="card-title"
                style={{ color: "var(--text-primary)" }}
              >
                Payment Info
              </div>
            </div>
            <div className="flex flex-col gap-[13px] p-[16px]">
              <div>
                <label
                  className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Payment Status
                </label>
                <select
                  className="fi"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  <option>Unpaid</option>
                  <option>Partially Paid</option>
                  <option>Paid</option>
                </select>
              </div>
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
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                />
              </div>
              <div>
                <label
                  className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Notes
                </label>
                <input
                  className="fi"
                  placeholder="Optional note..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
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
              <div className="flex items-center gap-[11px] mb-[13px]">
                <Avatar
                  initials={customer.initials}
                  gradient={customer.gradient}
                  size="lg"
                />
                <div>
                  <div
                    className="font-semibold text-[14px]"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {customer.name}
                  </div>
                  <div
                    className="text-[11px]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {customer.shop}
                  </div>
                </div>
              </div>
              <div
                className="p-[11px] rounded-lg"
                style={{
                  background: "rgba(255,77,106,.08)",
                  border: "1px solid rgba(255,77,106,.2)",
                }}
              >
                <div
                  className="text-[10px] uppercase tracking-[.1em] mb-[4px] font-inter"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Existing Balance
                </div>
                <div
                  className="font-inter font-extrabold text-[18px]"
                  style={{ color: "#ff4d6a" }}
                >
                  {customer.balance}
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
