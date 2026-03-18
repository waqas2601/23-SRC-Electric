import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCustomerByIdAPI, getCustomersAPI, type Customer } from "../api/customers";
import { getInvoicesAPI } from "../api/invoices";
import { getCustomerLedgerPaymentsAPI } from "../api/ledgerPayments";
import { downloadLedgerPdf } from "../utils/ledgerPdf";
import { getLedgerSummaryAPI } from "../api/summary";
import StatCard from "../components/ui/StatCard";

function Ledger() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [ledgerSummary, setLedgerSummary] = useState<{ total_receivable: number; total_paid: number; customers_with_balance: number } | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) {
      setError("Session expired. Please login again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const summaryData = await getLedgerSummaryAPI(token);
      setLedgerSummary(summaryData);

      const allCustomers: Customer[] = [];
      let cPage = 1;
      let cTotalPages = 1;
      while (cPage <= cTotalPages) {
        const data = await getCustomersAPI(token, { page: cPage, limit: 100 });
        allCustomers.push(...(data.items ?? []));
        cTotalPages = data.pagination?.totalPages ?? 1;
        cPage += 1;
      }
      setCustomers(allCustomers);
    } catch (err: any) {
      setError(err.message || "Failed to load ledger customers");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredCustomers = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const name = c.name?.toLowerCase() ?? "";
      const shop = c.shop_name?.toLowerCase() ?? "";
      return name.includes(q) || shop.includes(q);
    });
  }, [customers, searchText]);

  async function handlePrintPdf(customer: Customer) {
    if (!token) return;
    setPrintingId(customer._id);
    try {
      const [freshCustomer, paymentData] = await Promise.all([
        getCustomerByIdAPI(token, customer._id),
        getCustomerLedgerPaymentsAPI(token, customer._id),
      ]);

      const allInvoices: Array<{ invoice_no: string; invoice_date: string; total_amount: number }> = [];
      let page = 1;
      let totalPages = 1;
      while (page <= totalPages) {
        const data = await getInvoicesAPI(token, { customerId: customer._id, page, limit: 100 });
        allInvoices.push(...((data.items ?? []) as typeof allInvoices));
        totalPages = data.pagination?.totalPages ?? 1;
        page += 1;
      }

      const opening = (freshCustomer as Customer).opening_balance ?? 0;
      const totalInvoiced = allInvoices.reduce((s, i) => s + (i.total_amount ?? 0), 0);
      const totalPaid = paymentData.reduce((s: number, p: { amount: number }) => s + (p.amount ?? 0), 0);
      const totalOutstanding = opening + totalInvoiced;
      const remaining = Math.max(0, totalOutstanding - totalPaid);

      // Build rows — same logic as CustomerLedgerDetail.tsx
      type TxnRow = { date?: string; description: string; debit: number; credit: number; type: string };
      const txns: TxnRow[] = [];

      txns.push({ description: "Opening Balance", debit: 0, credit: opening, type: "opening" });

      allInvoices.forEach((inv) => {
        txns.push({
          date: inv.invoice_date,
          description: `Inv #${inv.invoice_no}`,
          debit: 0,
          credit: inv.total_amount ?? 0,
          type: "invoice",
        });
      });

      paymentData.forEach((p: { payment_date: string; amount: number; method: string }) => {
        txns.push({
          date: p.payment_date,
          description: `Payment (${p.method})`,
          debit: p.amount ?? 0,
          credit: 0,
          type: "payment",
        });
      });

      txns.sort((a, b) => {
        if (a.type === "opening" && b.type !== "opening") return -1;
        if (b.type === "opening" && a.type !== "opening") return 1;
        const ta = new Date(a.date ?? 0).getTime();
        const tb = new Date(b.date ?? 0).getTime();
        if (ta !== tb) return ta - tb;
        return a.type === "invoice" ? -1 : 1;
      });

      let running = 0;
      const rows = txns.map((t) => {
        running += t.credit - t.debit;
        return { date: t.date, description: t.description, debit: t.debit, credit: t.credit, balance: running };
      });

      await downloadLedgerPdf({
        customerName: (freshCustomer as Customer).name,
        shopName: (freshCustomer as Customer).shop_name,
        phone: (freshCustomer as Customer).phone,
        rows,
        totals: { opening, totalInvoiced, totalPaid, totalOutstanding, remaining },
      });
    } finally {
      setPrintingId(null);
    }
  }

  return (
    <div style={{ animation: "fadeIn .2s ease" }}>
      <div className="mb-[16px]">
        <div
          className="font-inter font-extrabold text-[20px] mb-[13px]"
          style={{ color: "var(--text-primary)" }}
        >
          Customer <span style={{ color: "var(--electric)" }}>Ledger</span>
        </div>
        <div className="s-box" style={{ maxWidth: 280 }}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ color: "var(--text-muted)", flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search customer..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      {ledgerSummary && (
        <div className="grid grid-cols-3 gap-[13px] mb-[16px]">
          <StatCard
            label="Total Receivable"
            value={`PKR ${(ledgerSummary.total_receivable ?? 0).toLocaleString()}`}
            change={`${ledgerSummary.customers_with_balance ?? 0} customers with balance`}
            changeType="down"
            accentColor="#1a6eff"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a6eff" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            }
          />
          <StatCard
            label="Total Collected"
            value={`PKR ${(ledgerSummary.total_paid ?? 0).toLocaleString()}`}
            change="received via ledger payments"
            changeType="up"
            accentColor="#00c97a"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00c97a" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            }
          />
          <StatCard
            label="Total Ledger"
            value={`PKR ${((ledgerSummary.total_receivable ?? 0) + (ledgerSummary.total_paid ?? 0)).toLocaleString()}`}
            change="receivable + collected"
            changeType="neutral"
            accentColor="#a855f7"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            }
          />
        </div>
      )}

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

      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Customer Name</th>
                <th>Print PDF</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-8"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-8"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No ledger customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c, idx) => (
                  <tr key={c._id}>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {idx + 1}
                    </td>
                    <td>
                      <div className="font-medium text-[13px]">{c.name}</div>
                      <div
                        className="text-[11px]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {c.shop_name || "—"}
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost"
                        style={{ height: 30, padding: "0 12px", fontSize: 11 }}
                        onClick={() => handlePrintPdf(c)}
                        disabled={printingId === c._id}
                      >
                        {printingId === c._id ? "..." : "Print PDF"}
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost"
                        style={{ height: 30, padding: "0 12px", fontSize: 11 }}
                        onClick={() => navigate(`/ledger/view/${c._id}`)}
                      >
                        View
                      </button>
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

export default Ledger;
