import { useState, useEffect, useCallback } from "react";
import Chip from "../components/ui/Chip";
import { useAuth } from "../context/AuthContext";
import {
  getLedgerPaymentsAPI,
  type LedgerPayment,
} from "../api/ledgerPayments";

const FILTERS = [
  { label: "All", value: "" },
  { label: "Cash", value: "CASH" },
  { label: "Bank", value: "BANK" },
  { label: "Other", value: "OTHER" },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Payments() {
  const { token } = useAuth();
  const [payments, setPayments] = useState<LedgerPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [search, setSearch] = useState("");

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const allItems: LedgerPayment[] = [];
      let page = 1;
      let totalPages = 1;

      while (page <= totalPages) {
        const data = await getLedgerPaymentsAPI(token!, {
          method: activeFilter || undefined,
          q: search.trim() || undefined,
          page,
          limit: 100,
        });

        allItems.push(...(data.items ?? []));
        totalPages = data.pagination?.totalPages ?? 1;
        page += 1;
      }

      setPayments(allItems);
    } catch (err: any) {
      setError(err.message || "Failed to load payments");
    } finally {
      setIsLoading(false);
    }
  }, [token, activeFilter, search]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

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
      <div className="card p-[12px] mb-[12px]">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name or shop"
          className="w-full h-[40px] rounded-lg px-[12px] text-[13px] outline-none"
          style={{
            border: "1px solid var(--border)",
            background: "var(--bg-card-soft)",
            color: "var(--text-primary)",
          }}
        />
      </div>

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
                <th>Method</th>
                <th>Amount</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
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
                    colSpan={5}
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
                        {p.customer_id?.name ?? "—"}
                      </div>
                      <div
                        className="text-[10px]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {p.customer_id?.shop_name ?? ""}
                      </div>
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
                      className="text-[12px]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {p.notes?.trim() || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Payments;
