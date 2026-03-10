import { useState, useEffect, useCallback } from "react";
import Chip from "../components/ui/Chip";
import Badge from "../components/ui/Badge";
import { useAuth } from "../context/AuthContext";
import { getPaymentsAPI, deletePaymentAPI } from "../api/payments";

interface Payment {
  _id: string;
  payment_date: string;
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
  invoice_id: {
    _id: string;
    invoice_no: string;
    total_amount: number;
    remaining_amount: number;
    status: string;
    customer_id: {
      _id: string;
      name: string;
      shop_name?: string;
      phone?: string;
    };
  };
}

const FILTERS = [
  { label: "All", value: "" },
  { label: "Cash", value: "CASH" },
  { label: "Bank", value: "BANK" },
  { label: "Other", value: "OTHER" },
];

const statusMap: Record<string, "unpaid" | "partial" | "paid"> = {
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

function Payments() {
  const { token } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getPaymentsAPI(token!, {
        method: activeFilter || undefined,
        limit: 50,
      });
      console.log("Payments:", data);
      setPayments(data.items ?? []);
    } catch (err: any) {
      setError(err.message || "Failed to load payments");
    } finally {
      setIsLoading(false);
    }
  }, [token, activeFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deletePaymentAPI(token!, deleteId);
      setDeleteId(null);
      fetchPayments();
    } catch (err: any) {
      alert(err.message || "Failed to delete payment");
    } finally {
      setDeleteLoading(false);
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
          Payment <span style={{ color: "var(--electric)" }}>History</span>
        </div>
      </div>

      {/* Chips */}
      <div className="flex gap-[7px] flex-wrap mb-[17px]">
        {FILTERS.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            active={activeFilter === f.value}
            onClick={() => setActiveFilter(f.value)}
          />
        ))}
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

      {/* Table */}
      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Invoice</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Remaining</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                        style={{
                          borderColor: "#e8141c",
                          borderTopColor: "transparent",
                        }}
                      />
                      <span style={{ color: "var(--text-muted)" }}>
                        Loading...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-8"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id}>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {formatDate(p.payment_date)}
                    </td>
                    <td>
                      <div
                        className="font-medium text-[12px]"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {p.invoice_id?.customer_id?.name ?? "—"}
                      </div>
                      <div
                        className="text-[10px]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {p.invoice_id?.customer_id?.shop_name ?? ""}
                      </div>
                    </td>
                    <td style={{ color: "var(--electric-bright)" }}>
                      {p.invoice_id?.invoice_no ?? "—"}
                    </td>
                    <td>
                      <span className="badge badge-paid">{p.method}</span>
                    </td>
                    <td
                      className="font-inter font-bold"
                      style={{ color: "#00c97a" }}
                    >
                      + PKR {p.amount?.toLocaleString()}
                    </td>
                    <td
                      className="font-inter font-semibold"
                      style={{
                        color:
                          p.invoice_id?.status === "completed"
                            ? "#00c97a"
                            : p.invoice_id?.status === "partial"
                              ? "#ffb020"
                              : "#ff4d6a",
                      }}
                    >
                      PKR{" "}
                      {p.invoice_id?.remaining_amount?.toLocaleString() ?? "—"}
                    </td>
                    <td>
                      <Badge
                        status={statusMap[p.invoice_id?.status] ?? "unpaid"}
                      />
                    </td>
                    <td>
                      <button
                        style={{
                          padding: "4px 10px",
                          fontSize: "11px",
                          background: "rgba(255,77,106,.1)",
                          border: "1px solid rgba(255,77,106,.2)",
                          color: "#ff4d6a",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontFamily: "Inter",
                          fontWeight: 600,
                        }}
                        onClick={() => setDeleteId(p._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation */}
      {deleteId && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setDeleteId(null)}
        >
          <div
            className="w-full max-w-[380px] rounded-xl overflow-hidden"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
              animation: "fadeIn .2s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center p-[28px_24px_20px]">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                style={{
                  background: "rgba(255,77,106,.1)",
                  border: "1px solid rgba(255,77,106,.2)",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ff4d6a"
                  strokeWidth="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </div>
              <div
                className="font-inter font-bold text-[16px] mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Delete Payment?
              </div>
              <div
                className="text-[13px]"
                style={{ color: "var(--text-secondary)" }}
              >
                This will delete the payment and update the invoice balance
                automatically.
              </div>
            </div>
            <div className="flex gap-[9px] p-[0_24px_24px]">
              <button
                className="btn btn-ghost flex-1 justify-center"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary flex-1 justify-center"
                onClick={handleDelete}
                disabled={deleteLoading}
                style={{
                  background: "#ff4d6a",
                  boxShadow: "0 4px 18px rgba(255,77,106,.3)",
                  opacity: deleteLoading ? 0.7 : 1,
                }}
              >
                {deleteLoading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payments;
