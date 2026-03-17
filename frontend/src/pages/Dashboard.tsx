import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import { useAuth } from "../context/AuthContext";
import { getSummaryAPI, getLedgerSummaryAPI, getOutstandingCustomersAPI } from "../api/summary";

type SummaryResponse = {
  period: { from: string; to: string };
  overdue_days: number;
  kpis: {
    receivable: number;
    collected: number;
    partial_count: number;
    overdue_amount: number;
    overdue_customers: number;
  };
  recent_invoices: InvoiceRow[];
};

type InvoiceRow = {
  _id: string;
  invoice_no: string;
  invoice_date: string;
  total_amount: number;
  remaining_amount: number;
  status: "unpaid" | "partial" | "completed";
  customer_id: {
    _id: string;
    name: string;
    shop_name?: string;
  };
};

type OutstandingCustomer = {
  customerId: string;
  name: string;
  shop: string;
  amount: number;
  hasOverdue: boolean;
  initials: string;
  gradient: "default" | "cyan" | "green" | "purple" | "red";
};

const GRADIENTS: Array<"default" | "cyan" | "green" | "purple" | "red"> = [
  "default",
  "cyan",
  "green",
  "purple",
  "red",
];

function pkr(value: number) {
  return `PKR ${Math.max(0, value || 0).toLocaleString()}`;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "--";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getGradient(name: string) {
  const hash = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return GRADIENTS[hash % GRADIENTS.length];
}

function mapInvoiceStatusToBadge(status: "unpaid" | "partial" | "completed") {
  if (status === "completed") return "paid" as const;
  if (status === "partial") return "partial" as const;
  return "unpaid" as const;
}

function formatMonthRange(fromIso?: string, toIso?: string) {
  if (!fromIso || !toIso) return "selected period";
  const from = new Date(fromIso);
  const to = new Date(toIso);
  const sameMonth =
    from.getMonth() === to.getMonth() &&
    from.getFullYear() === to.getFullYear();
  if (sameMonth) {
    return from.toLocaleDateString("en-GB", {
      month: "short",
      year: "numeric",
    });
  }
  return `${from.toLocaleDateString("en-GB", { month: "short" })} - ${to.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`;
}

function Dashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [ledgerSummary, setLedgerSummary] = useState<{ total_receivable: number; total_paid: number; customers_with_balance: number } | null>(null);
  const [outstanding, setOutstanding] = useState<OutstandingCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchDashboard = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      setSummary(null);
      setOutstanding([]);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const [dashboardSummary, ledgerData, outstandingData] = await Promise.all([
        getSummaryAPI(token, { overdueDays: 7 }) as Promise<SummaryResponse>,
        getLedgerSummaryAPI(token),
        getOutstandingCustomersAPI(token),
      ]);
      setSummary(dashboardSummary);
      setLedgerSummary(ledgerData);
      setOutstanding(
        outstandingData.customers.slice(0, 6).map((c, i) => ({
          customerId: c._id,
          name: c.name || "Unknown",
          shop: c.shop_name || "No shop name",
          amount: c.remaining,
          hasOverdue: false,
          initials: getInitials(c.name || "U"),
          gradient: getGradient(c.name || "Unknown"),
        })),
      );
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const maxOutstanding = useMemo(
    () => Math.max(1, ...outstanding.map((o) => o.amount)),
    [outstanding],
  );

  const greetingText = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, [currentTime]);

  const todayLabel = useMemo(
    () =>
      currentTime.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [currentTime],
  );

  return (
    <div style={{ animation: "fadeIn .2s ease" }}>
      {/* Page Header */}
      <div className="card p-[14px] mb-[18px]">
        <div className="flex items-start justify-between gap-[10px] flex-wrap">
          <div>
            <div
              className="font-inter font-extrabold text-[18px]"
              style={{ color: "var(--text-primary)" }}
            >
              {greetingText},
            </div>
            <div
              className="font-inter font-bold text-[15px] mt-[2px]"
              style={{ color: "var(--electric-bright)" }}
            >
              Shafiq Traders
            </div>
          </div>
          <div
            className="text-[12px] font-inter font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            {todayLabel}
          </div>
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

      <div
        className="text-[12px] tracking-[1px] font-inter font-semibold mb-[10px]"
        style={{ color: "var(--text-secondary)" }}
      >
        OVERVIEW
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-[13px] mb-[22px]">
        <StatCard
          label="Total Receivable"
          value={pkr(ledgerSummary?.total_receivable ?? 0)}
          change={`${ledgerSummary?.customers_with_balance ?? 0} customers with balance`}
          changeType="down"
          accentColor="#1a6eff"
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1a6eff"
              strokeWidth="2"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <StatCard
          label={`Collected (${formatMonthRange(summary?.period?.from, summary?.period?.to)})`}
          value={pkr(summary?.kpis.collected ?? 0)}
          change="received from ledger"
          changeType="up"
          accentColor="#00c97a"
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00c97a"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
        />
        <StatCard
          label="Customers Owing"
          value={String(ledgerSummary?.customers_with_balance ?? 0)}
          change="have outstanding balance"
          changeType="neutral"
          accentColor="#ffb020"
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffb020"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <StatCard
          label="Total Collected"
          value={pkr(ledgerSummary?.total_paid ?? 0)}
          change="all-time ledger payments"
          changeType="up"
          accentColor="#00c97a"
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00c97a"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
        />
      </div>

      {/* Two Col */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-[16px]">
        {/* Outstanding Balances */}
        <div className="card">
          <div className="card-hdr">
            <div
              className="card-title"
              style={{ color: "var(--text-primary)" }}
            >
              Outstanding Balances
            </div>
            <button
              className="btn btn-ghost"
              style={{ padding: "5px 11px", fontSize: "11px" }}
              onClick={() => navigate("/ledger")}
            >
              View All
            </button>
          </div>

          {isLoading ? (
            <div
              className="px-[17px] py-[18px]"
              style={{ color: "var(--text-secondary)" }}
            >
              Loading outstanding balances...
            </div>
          ) : outstanding.length === 0 ? (
            <div
              className="px-[17px] py-[18px]"
              style={{ color: "var(--text-secondary)" }}
            >
              No outstanding balances.
            </div>
          ) : (
            outstanding.map((item) => {
              const bar = Math.max(
                8,
                Math.round((item.amount / maxOutstanding) * 100),
              );
              return (
                <div
                  key={item.customerId}
                  className="flex items-center gap-[11px] px-[17px] py-[12px] cursor-pointer"
                  style={{ borderBottom: "1px solid rgba(26,110,255,.07)" }}
                  onClick={() => navigate(`/ledger/view/${item.customerId}`)}
                >
                  <Avatar initials={item.initials} gradient={item.gradient} />
                  <div>
                    <div
                      className="text-[13px] font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.name}
                    </div>
                    <div
                      className="text-[10px]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {item.shop}
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <div
                      className="font-inter font-bold text-[14px]"
                      style={{ color: item.hasOverdue ? "#ff4d6a" : "#ffb020" }}
                    >
                      {pkr(item.amount)}
                    </div>
                    <div
                      className="w-[65px] h-[3px] rounded-sm mt-[3px]"
                      style={{ background: "rgba(128,128,128,.15)" }}
                    >
                      <div
                        className="h-[3px] rounded-sm"
                        style={{
                          width: `${bar}%`,
                          background: item.hasOverdue ? "#ff4d6a" : "#ffb020",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {/* Recent Invoices */}
        <div className="card">
          <div className="card-hdr">
            <div
              className="card-title"
              style={{ color: "var(--text-primary)" }}
            >
              Recent Invoices
            </div>
            <button
              className="btn btn-ghost"
              style={{ padding: "5px 11px", fontSize: "11px" }}
              onClick={() => navigate("/invoices")}
            >
              View All
            </button>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-8"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Loading recent invoices...
                    </td>
                  </tr>
                ) : (summary?.recent_invoices?.length ?? 0) === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-8"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      No invoices yet
                    </td>
                  </tr>
                ) : (
                  (summary?.recent_invoices ?? []).map((row) => (
                    <tr
                      key={row._id}
                      onClick={() => navigate(`/invoices/${row._id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={{ color: "var(--electric-bright)" }}>
                        #{row.invoice_no}
                      </td>
                      <td>{row.customer_id?.name ?? "—"}</td>
                      <td>{pkr(row.total_amount ?? 0)}</td>
                      <td>
                        <Badge status={mapInvoiceStatusToBadge(row.status)} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
