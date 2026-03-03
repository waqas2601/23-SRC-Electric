import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Badge from "../components/ui/Badge";
import Chip from "../components/ui/Chip";

const INVOICES = [
  {
    id: "#INV-0042",
    customer: "Ahmad Electronics",
    date: "25 Feb 2026",
    total: "PKR 22,000",
    paid: "PKR 0",
    remaining: "PKR 22,000",
    status: "unpaid" as const,
  },
  {
    id: "#INV-0041",
    customer: "Zahid Traders",
    date: "23 Feb 2026",
    total: "PKR 11,500",
    paid: "PKR 5,000",
    remaining: "PKR 6,500",
    status: "partial" as const,
  },
  {
    id: "#INV-0040",
    customer: "Raza Stores",
    date: "20 Feb 2026",
    total: "PKR 8,800",
    paid: "PKR 8,800",
    remaining: "PKR 0",
    status: "paid" as const,
  },
  {
    id: "#INV-0039",
    customer: "M. Khan & Sons",
    date: "18 Feb 2026",
    total: "PKR 15,200",
    paid: "PKR 10,200",
    remaining: "PKR 5,000",
    status: "partial" as const,
  },
];

const FILTERS = ["All (42)", "Unpaid (12)", "Partial (8)", "Paid (22)"];

const remainingColor: Record<string, string> = {
  unpaid: "#ff4d6a",
  partial: "#ffb020",
  paid: "#00c97a",
};

function Invoices() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All (42)");

  const filtered = INVOICES.filter((inv) => {
    if (activeFilter === "All (42)") return true;
    if (activeFilter === "Unpaid (12)") return inv.status === "unpaid";
    if (activeFilter === "Partial (8)") return inv.status === "partial";
    if (activeFilter === "Paid (22)") return inv.status === "paid";
    return true;
  });

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

      {/* Chips */}
      <div className="flex gap-[7px] flex-wrap mb-[17px]">
        {FILTERS.map((f) => (
          <Chip
            key={f}
            label={f}
            active={activeFilter === f}
            onClick={() => setActiveFilter(f)}
          />
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Remaining</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
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
                filtered.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ color: "var(--electric-bright)" }}>
                      {inv.id}
                    </td>
                    <td>{inv.customer}</td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {inv.date}
                    </td>
                    <td>{inv.total}</td>
                    <td style={{ color: "#00c97a" }}>{inv.paid}</td>
                    <td
                      className="font-inter font-semibold"
                      style={{ color: remainingColor[inv.status] }}
                    >
                      {inv.remaining}
                    </td>
                    <td>
                      <Badge status={inv.status} />
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "4px 10px", fontSize: "11px" }}
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

export default Invoices;
