import { useState } from "react";
import Badge from "../components/ui/Badge";
import Chip from "../components/ui/Chip";

const PAYMENTS = [
  {
    date: "26 Feb 2026",
    customer: "Ahmad Electronics",
    invoice: "#INV-0040",
    amount: "+ PKR 8,800",
    remaining: "PKR 0",
    status: "paid" as const,
  },
  {
    date: "24 Feb 2026",
    customer: "Zahid Traders",
    invoice: "#INV-0041",
    amount: "+ PKR 5,000",
    remaining: "PKR 6,500",
    status: "partial" as const,
  },
  {
    date: "22 Feb 2026",
    customer: "M. Khan & Sons",
    invoice: "#INV-0039",
    amount: "+ PKR 10,200",
    remaining: "PKR 5,000",
    status: "partial" as const,
  },
  {
    date: "18 Feb 2026",
    customer: "Raza Stores",
    invoice: "#INV-0037",
    amount: "+ PKR 14,000",
    remaining: "PKR 0",
    status: "paid" as const,
  },
];

const FILTERS = ["All", "This Month", "Last Month"];

const amountColor: Record<string, string> = {
  paid: "#00c97a",
  partial: "#ffb020",
  unpaid: "#ff4d6a",
};

function Payments() {
  const [activeFilter, setActiveFilter] = useState("All");

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
        <button className="btn btn-primary">
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
          <span className="hidden sm:inline">Add Payment</span>
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
                <th>Date</th>
                <th>Customer</th>
                <th>Invoice</th>
                <th>Amount Paid</th>
                <th>Remaining</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {PAYMENTS.map((p, i) => (
                <tr key={i}>
                  <td style={{ color: "var(--text-secondary)" }}>{p.date}</td>
                  <td>{p.customer}</td>
                  <td style={{ color: "var(--electric-bright)" }}>
                    {p.invoice}
                  </td>
                  <td
                    className="font-inter font-bold"
                    style={{ color: amountColor[p.status] }}
                  >
                    {p.amount}
                  </td>
                  <td style={{ color: amountColor[p.status] }}>
                    {p.remaining}
                  </td>
                  <td>
                    <Badge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Payments;
