import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getInvoiceByIdAPI,
  getInvoicePaymentsAPI,
  addPaymentToInvoiceAPI,
} from "../api/invoices";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import Modal from "../components/ui/Modal";

interface LineItem {
  _id: string;
  product_id: string;
  product_name_snapshot: string;
  sku_snapshot: string;
  quantity: number;
  unit_price_snapshot: number;
  line_total: number;
}

interface Payment {
  _id: string;
  payment_date: string;
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
}

interface Invoice {
  _id: string;
  invoice_no: string;
  customer_id: {
    _id: string;
    name: string;
    shop_name?: string;
    phone?: string;
    address?: string;
  };
  invoice_date: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  discount: number;
  notes?: string;
  status: "unpaid" | "partial" | "completed";
  items: LineItem[];
}

const statusMap: Record<string, "unpaid" | "partial" | "paid"> = {
  unpaid: "unpaid",
  partial: "partial",
  completed: "paid",
};

const GRADIENTS = ["default", "cyan", "green", "purple", "red"];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function InvoiceDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Payment modal
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK" | "OTHER">(
    "CASH",
  );
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    setIsLoading(true);
    setError("");
    try {
      const [invData, payData] = await Promise.all([
        getInvoiceByIdAPI(token!, id),
        getInvoicePaymentsAPI(token!, id),
      ]);
      setInvoice(invData.invoice ?? invData);
      setPayments(payData.payments ?? []);
    } catch (err: any) {
      setError(err.message || "Failed to load invoice");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddPayment = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      setPaymentError("Please enter a valid amount");
      return;
    }
    if (!id) return;
    setPaymentError("");
    setPaymentLoading(true);
    try {
      await addPaymentToInvoiceAPI(token!, id, {
        paymentDate,
        amount: Number(paymentAmount),
        method: paymentMethod,
        reference: paymentReference || undefined,
        notes: paymentNotes || undefined,
      });
      setPaymentModal(false);
      setPaymentAmount("");
      setPaymentReference("");
      setPaymentNotes("");
      fetchData();
    } catch (err: any) {
      setPaymentError(err.message || "Failed to add payment");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#e8141c", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="text-center py-20">
        <div className="text-[14px] mb-4" style={{ color: "#ff4d6a" }}>
          {error}
        </div>
        <button className="btn btn-ghost" onClick={() => navigate("/invoices")}>
          ← Back to Invoices
        </button>
      </div>
    );
  }

  const initials = invoice.customer_id?.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={{ animation: "fadeIn .2s ease" }}>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-[18px] flex-wrap gap-[10px]">
        <div>
          <button
            className="text-[11px] mb-[6px] flex items-center gap-1 transition-all"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
            onClick={() => navigate("/invoices")}
          >
            ← Back to Invoices
          </button>
          <div
            className="font-inter font-extrabold text-[20px]"
            style={{ color: "var(--text-primary)" }}
          >
            Invoice{" "}
            <span style={{ color: "var(--electric)" }}>
              #{invoice.invoice_no}
            </span>
          </div>
        </div>
        <div className="flex gap-[9px] items-center">
          <Badge status={statusMap[invoice.status]} />
          {invoice.status !== "completed" && (
            <button
              className="btn btn-primary"
              onClick={() => setPaymentModal(true)}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Payment
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-[16px]">
        {/* LEFT */}
        <div className="flex flex-col gap-[14px]">
          {/* Customer Info */}
          <div className="card">
            <div className="card-hdr">
              <div
                className="card-title"
                style={{ color: "var(--text-primary)" }}
              >
                Customer Details
              </div>
              <div
                className="text-[11px]"
                style={{ color: "var(--text-secondary)" }}
              >
                {formatDate(invoice.invoice_date)}
              </div>
            </div>
            <div className="p-[15px_17px] flex items-center gap-[13px]">
              <Avatar initials={initials} gradient={GRADIENTS[0]} size="lg" />
              <div>
                <div
                  className="font-semibold text-[15px]"
                  style={{ color: "var(--text-primary)" }}
                >
                  {invoice.customer_id?.name}
                </div>
                <div
                  className="text-[12px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {invoice.customer_id?.shop_name}
                </div>
                <div
                  className="text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {invoice.customer_id?.phone}{" "}
                  {invoice.customer_id?.address
                    ? `· ${invoice.customer_id.address}`
                    : ""}
                </div>
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
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item) => (
                    <tr key={item._id}>
                      <td style={{ color: "var(--text-primary)" }}>
                        {item.product_name_snapshot ?? "—"}
                      </td>
                      <td style={{ color: "var(--electric-bright)" }}>
                        {item.sku_snapshot ?? "—"}
                      </td>
                      <td>{item.quantity}</td>
                      <td>PKR {item.unit_price_snapshot?.toLocaleString()}</td>
                      <td
                        className="font-inter font-semibold"
                        style={{ color: "var(--electric-bright)" }}
                      >
                        PKR {item.line_total?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Totals */}
            <div
              className="flex justify-end gap-[22px] p-[13px_17px]"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              {invoice.discount > 0 && (
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
                    - PKR {invoice.discount?.toLocaleString()}
                  </div>
                </div>
              )}
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
                  PKR {invoice.total_amount?.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="card">
            <div className="card-hdr">
              <div
                className="card-title"
                style={{ color: "var(--text-primary)" }}
              >
                Payment History
              </div>
              {invoice.status !== "completed" && (
                <button
                  className="btn btn-ghost"
                  style={{ padding: "5px 11px", fontSize: "11px" }}
                  onClick={() => setPaymentModal(true)}
                >
                  + Add Payment
                </button>
              )}
            </div>
            {payments.length === 0 ? (
              <div
                className="text-center py-8 text-[12px]"
                style={{ color: "var(--text-muted)" }}
              >
                No payments recorded yet
              </div>
            ) : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Reference</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p._id}>
                        <td style={{ color: "var(--text-secondary)" }}>
                          {formatDate(p.payment_date)}
                        </td>
                        <td
                          className="font-inter font-bold"
                          style={{ color: "#00c97a" }}
                        >
                          + PKR {p.amount?.toLocaleString()}
                        </td>
                        <td>
                          <span className="badge badge-paid">{p.method}</span>
                        </td>
                        <td style={{ color: "var(--text-secondary)" }}>
                          {p.reference ?? "—"}
                        </td>
                        <td style={{ color: "var(--text-secondary)" }}>
                          {p.notes ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-[14px]">
          {/* Payment Summary */}
          <div className="card">
            <div className="card-hdr">
              <div
                className="card-title"
                style={{ color: "var(--text-primary)" }}
              >
                Payment Summary
              </div>
            </div>
            <div className="p-[15px_17px] flex flex-col gap-[12px]">
              <div className="flex justify-between items-center">
                <span
                  className="text-[12px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Total Amount
                </span>
                <span
                  className="font-inter font-bold text-[13px]"
                  style={{ color: "var(--text-primary)" }}
                >
                  PKR {invoice.total_amount?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span
                  className="text-[12px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Paid Amount
                </span>
                <span
                  className="font-inter font-bold text-[13px]"
                  style={{ color: "#00c97a" }}
                >
                  PKR {invoice.paid_amount?.toLocaleString()}
                </span>
              </div>
              <div
                className="flex justify-between items-center pt-[10px]"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <span
                  className="text-[12px] font-inter font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Remaining
                </span>
                <span
                  className="font-inter font-extrabold text-[16px]"
                  style={{
                    color:
                      invoice.status === "completed"
                        ? "#00c97a"
                        : invoice.status === "partial"
                          ? "#ffb020"
                          : "#ff4d6a",
                  }}
                >
                  PKR {invoice.remaining_amount?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="card">
              <div className="card-hdr">
                <div className="card-title">Notes</div>
              </div>
              <div
                className="p-[15px_17px] text-[13px]"
                style={{ color: "var(--text-secondary)" }}
              >
                {invoice.notes}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Payment Modal */}
      <Modal
        isOpen={paymentModal}
        onClose={() => {
          setPaymentModal(false);
          setPaymentError("");
          setPaymentAmount("");
        }}
        title="Add Payment"
      >
        <div className="p-[20px] flex flex-col gap-[13px]">
          {paymentError && (
            <div
              className="p-[10px_13px] rounded-lg text-[12px] font-inter"
              style={{
                background: "rgba(255,77,106,.1)",
                border: "1px solid rgba(255,77,106,.2)",
                color: "#ff4d6a",
              }}
            >
              {paymentError}
            </div>
          )}

          {/* Remaining balance info */}
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
              Remaining Balance
            </div>
            <div
              className="font-inter font-extrabold text-[18px]"
              style={{ color: "#ffb020" }}
            >
              PKR {invoice.remaining_amount?.toLocaleString()}
            </div>
          </div>

          {/* Date */}
          <div>
            <label
              className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              Payment Date
            </label>
            <input
              className="fi"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          {/* Amount */}
          <div>
            <label
              className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              Amount (PKR)
            </label>
            <input
              className="fi"
              type="number"
              placeholder="0"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />
          </div>

          {/* Method */}
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
                setPaymentMethod(e.target.value as "CASH" | "BANK" | "OTHER")
              }
            >
              <option value="CASH">Cash</option>
              <option value="BANK">Bank Transfer</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Reference */}
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

          {/* Notes */}
          <div>
            <label
              className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              Notes (Optional)
            </label>
            <input
              className="fi"
              placeholder="Any notes..."
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-[9px] justify-end pt-[4px]">
            <button
              className="btn btn-ghost"
              onClick={() => {
                setPaymentModal(false);
                setPaymentError("");
                setPaymentAmount("");
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAddPayment}
              disabled={paymentLoading}
              style={{ opacity: paymentLoading ? 0.7 : 1 }}
            >
              {paymentLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Saving...
                </>
              ) : (
                "Add Payment"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default InvoiceDetail;
