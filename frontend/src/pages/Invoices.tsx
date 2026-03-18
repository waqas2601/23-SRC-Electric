import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Badge from "../components/ui/Badge";
import Chip from "../components/ui/Chip";
import { useAuth } from "../context/AuthContext";
import { getInvoicesAPI, deleteInvoiceAPI } from "../api/invoices";
import { useToast } from "../context/ToastContext";

interface Invoice {
  _id: string;
  invoice_no: string;
  customer_id: {
    _id: string;
    name: string;
    shop_name?: string;
    phone?: string;
  };
  invoice_date: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: "unpaid" | "partial" | "completed";
}

const FILTERS = [
  { label: "All", value: "" },
  { label: "Unpaid", value: "unpaid" },
  { label: "Partial", value: "partial" },
  { label: "Paid", value: "completed" },
];

const statusMap: Record<string, "unpaid" | "partial" | "paid"> = {
  unpaid: "unpaid",
  partial: "partial",
  completed: "paid",
};

const remainingColor: Record<string, string> = {
  unpaid: "#ff4d6a",
  partial: "#ffb020",
  completed: "#00c97a",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Invoices() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  // Remove filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchInvoices = useCallback(async () => {
    if (!token) {
      setInvoices([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const data = await getInvoicesAPI(token, {
        q: searchQuery || undefined,
        limit: 50,
      });
      setInvoices(data.items ?? []);
    } catch (err: any) {
      const message = err.message || "Failed to load invoices";
      setError(message);
      showToast("error", message);
    } finally {
      setIsLoading(false);
    }
  }, [token, searchQuery, showToast]);

  const filteredInvoices = invoices.filter((inv) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      inv.invoice_no.toLowerCase().includes(q) ||
      inv.customer_id?.name?.toLowerCase().includes(q) ||
      inv.customer_id?.shop_name?.toLowerCase().includes(q) ||
      inv.customer_id?.phone?.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleDelete = async () => {
    if (!deleteId || !token) return;
    setDeleteLoading(true);
    try {
      await deleteInvoiceAPI(token, deleteId);
      setDeleteId(null);
      await fetchInvoices();
      showToast("success", "Invoice deleted successfully");
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete invoice");
    } finally {
      setDeleteLoading(false);
    }
  };

  const stats = invoices.reduce(
    (acc, inv) => {
      acc.total += 1;
      acc.amount += inv.total_amount;
      if (inv.status === "completed") acc.paid += 1;
      else if (inv.status === "partial") acc.partial += 1;
      else acc.unpaid += 1;
      return acc;
    },
    { total: 0, paid: 0, partial: 0, unpaid: 0, amount: 0 },
  );

  return (
    <div style={{ animation: "fadeIn .2s ease" }}>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-[18px] flex-wrap gap-[10px]">
        <div
          className="font-inter font-extrabold text-[20px]"
          style={{ color: "var(--text-primary)" }}
        >
          Invoices <span style={{ color: "var(--electric)" }}>List</span>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/new-invoice")}
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
          <span className="hidden sm:inline">Create Invoice</span>
        </button>
      </div>

      {/* Search Field */}
      <div className="mb-[17px]">
        <input
          className="fi w-full max-w-[320px]"
          type="text"
          placeholder="Search invoices by customer, invoice #, etc."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            border: "1px solid var(--border)",
            padding: "8px 12px",
            fontSize: "14px",
          }}
        />
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

      {/* Snapshot - Only Total and Amount */}
      {!isLoading && invoices.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-[10px] mb-[14px]">
          <div className="card p-[10px_12px]">
            <div
              className="text-[10px]"
              style={{ color: "var(--text-secondary)" }}
            >
              Total
            </div>
            <div
              className="font-inter font-bold text-[16px]"
              style={{ color: "var(--text-primary)" }}
            >
              {stats.total}
            </div>
          </div>
          <div className="card p-[10px_12px]">
            <div
              className="text-[10px]"
              style={{ color: "var(--text-secondary)" }}
            >
              Amount
            </div>
            <div
              className="font-inter font-bold text-[16px]"
              style={{ color: "var(--text-primary)" }}
            >
              PKR {stats.amount.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Cards */}
      <div className="md:hidden flex flex-col gap-[10px]">
        {isLoading ? (
          <div
            className="card p-6 text-center"
            style={{ color: "var(--text-muted)" }}
          >
            Loading...
          </div>
        ) : invoices.length === 0 ? (
          <div
            className="card p-6 text-center"
            style={{ color: "var(--text-muted)" }}
          >
            No invoices found
          </div>
        ) : (
          filteredInvoices.map((inv) => (
            <div key={inv._id} className="card p-[14px]">
              <div className="flex items-start justify-between gap-3 mb-[10px]">
                <div>
                  <div
                    className="font-inter font-extrabold text-[17px]"
                    style={{ color: "var(--electric-bright)" }}
                  >
                    #{inv.invoice_no}
                  </div>
                  <div
                    className="text-[12px] font-semibold truncate max-w-[180px]"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {inv.customer_id?.name ?? "—"}
                  </div>
                  <div
                    className="text-[10px]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {formatDate(inv.invoice_date)}
                  </div>
                </div>
              </div>

              <div
                className="grid grid-cols-3 gap-2 text-[11px] p-[10px] rounded-lg"
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--bg-input)",
                }}
              >
                <div>
                  <div style={{ color: "var(--text-secondary)" }}>Total</div>
                  <div className="font-semibold">
                    PKR {inv.total_amount.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ color: "var(--text-secondary)" }}>Paid</div>
                  <div className="font-semibold" style={{ color: "#00c97a" }}>
                    PKR {inv.paid_amount.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ color: "var(--text-secondary)" }}>Remain</div>
                  <div
                    className="font-semibold"
                    style={{ color: remainingColor[inv.status] }}
                  >
                    PKR {inv.remaining_amount.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-[8px] mt-[10px]">
                <button
                  className="btn btn-ghost flex-1 justify-center"
                  onClick={() => navigate(`/invoices/${inv._id}`)}
                >
                  View
                </button>
                <button
                  className="flex-1"
                  style={{
                    padding: "9px 12px",
                    fontSize: "12px",
                    background: "rgba(255,77,106,.1)",
                    border: "1px solid rgba(255,77,106,.2)",
                    color: "#ff4d6a",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontFamily: "Inter",
                    fontWeight: 600,
                  }}
                  onClick={() => setDeleteId(inv._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="card hidden md:block">
        <div className="tbl-wrap">
          <table className="tbl tbl-invoices">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Actions</th>
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
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-8"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No invoices found
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv._id}>
                    <td style={{ color: "var(--electric-bright)" }}>
                      #{inv.invoice_no}
                    </td>
                    <td>
                      <div className="font-medium truncate max-w-[220px]">
                        {inv.customer_id?.name ?? "—"}
                      </div>
                      <div
                        className="text-[10px] truncate max-w-[220px]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {inv.customer_id?.shop_name ?? ""}
                      </div>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {formatDate(inv.invoice_date)}
                    </td>
                    <td className="font-inter font-semibold">
                      PKR {inv.total_amount.toLocaleString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-[6px] whitespace-nowrap">
                        <button
                          className="btn btn-ghost"
                          style={{ padding: "4px 10px", fontSize: "11px" }}
                          onClick={() => navigate(`/invoices/${inv._id}`)}
                        >
                          View
                        </button>
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
                          onClick={() => setDeleteId(inv._id)}
                        >
                          Delete
                        </button>
                      </div>
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
                Delete Invoice?
              </div>
              <div
                className="text-[13px]"
                style={{ color: "var(--text-secondary)" }}
              >
                This will permanently delete the invoice and all its payments.
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

export default Invoices;
