import { useState } from "react";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";

const CUSTOMERS = [
  {
    initials: "AE",
    gradient: "default",
    name: "Ahmad Electronics",
    address: "Main Bazaar, Gujrat",
    phone: "0300-1234567",
    invoices: 14,
    balance: "PKR 18,500",
    status: "overdue" as const,
  },
  {
    initials: "ZT",
    gradient: "cyan",
    name: "Zahid Traders",
    address: "Saddar, Gujrat",
    phone: "0311-9876543",
    invoices: 8,
    balance: "PKR 8,200",
    status: "partial" as const,
  },
  {
    initials: "RS",
    gradient: "green",
    name: "Raza Stores",
    address: "Civil Lines, Gujrat",
    phone: "0333-4561234",
    invoices: 21,
    balance: "PKR 0",
    status: "clear" as const,
  },
  {
    initials: "MK",
    gradient: "purple",
    name: "M. Khan & Sons",
    address: "Kharian Road",
    phone: "0345-7778899",
    invoices: 6,
    balance: "PKR 5,000",
    status: "partial" as const,
  },
];

const balanceColor: Record<string, string> = {
  overdue: "#ff4d6a",
  partial: "#ffb020",
  clear: "#00c97a",
};

function Customers() {
  const [search, setSearch] = useState("");

  const filtered = CUSTOMERS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  );

  return (
    <div style={{ animation: "fadeIn .2s ease" }}>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-[18px] flex-wrap gap-[10px]">
        <div
          className="font-inter font-extrabold text-[20px]"
          style={{ color: "var(--text-primary)" }}
        >
          Customers <span style={{ color: "var(--electric)" }}>Directory</span>
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
          <span className="hidden sm:inline">Add Customer</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-[16px]">
        <div className="s-box" style={{ maxWidth: "320px" }}>
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
            placeholder="Search by name, address or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Invoices</th>
                <th>Balance Due</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-8"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No customers found
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.name}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar initials={c.initials} gradient={c.gradient} />
                        <div>
                          <div
                            className="font-medium text-[13px]"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {c.name}
                          </div>
                          <div
                            className="text-[10px]"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {c.address}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {c.phone}
                    </td>
                    <td>{c.invoices}</td>
                    <td
                      className="font-inter font-bold"
                      style={{ color: balanceColor[c.status] }}
                    >
                      {c.balance}
                    </td>
                    <td>
                      <Badge status={c.status} />
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

export default Customers;
